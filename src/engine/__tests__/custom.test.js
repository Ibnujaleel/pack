import { describe, it, expect } from 'vitest';
import { packItems } from '../index.js';
import { SUITCASE, inBounds, overlaps } from '../geometry.js';

describe('Custom items support', () => {
  it('custom soft item gets tier 2', () => {
    const request = {
      items: [
        {
          id: 'soft-pillow-1',
          type: 'custom',
          custom: {
            name: 'Travel Pillow',
            category: 'soft',
            dimensions: [25, 25, 8],
            weight: 0.5,
          },
        },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(1);
    expect(response.items[0].tier).toBe(2);
    expect(response.items[0].animation).toBe('soft_settle');
    expect(response.items[0].label).toBe('Travel Pillow');
    expect(response.items[0].color).toBe('#22c55e');
  });

  it('custom fragile gets tier 3 and sits at or above the top layer', () => {
    const request = {
      items: [
        {
          id: 'sneakers-1',
          type: 'sneakers',
        },
        {
          id: 'fragile-mug-1',
          type: 'custom',
          custom: {
            name: 'Ceramic Mug',
            category: 'fragile',
            dimensions: [10, 10, 5],
            weight: 0.3,
          },
        },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(2);

    const sneakers = response.items.find((i) => i.id === 'sneakers-1');
    const mug = response.items.find((i) => i.id === 'fragile-mug-1');

    expect(mug).toBeDefined();
    expect(mug.tier).toBe(3);
    expect(mug.animation).toBe('gentle_glide');
    expect(mug.color).toBe('#ec4899');
    expect(mug.label).toBe('Ceramic Mug');

    // Sneakers height is 12 cm, min Z is 0, so top face is at Z = 12.
    // Mug (tier 3) must sit at or above the top layer (min Z >= 12).
    const mugMinZ = mug.position[2] - mug.dimensions[2] / 2;
    const sneakersMaxZ = sneakers.position[2] + sneakers.dimensions[2] / 2;
    expect(mugMinZ).toBeGreaterThanOrEqual(sneakersMaxZ);
  });

  it('custom hard item 16 cm tall gets tier 1', () => {
    const request = {
      items: [
        {
          id: 'tall-box-1',
          type: 'custom',
          custom: {
            name: 'Tall Hard Box',
            category: 'hard',
            dimensions: [15, 15, 16],
            weight: 1.0,
          },
        },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(1);
    expect(response.items[0].tier).toBe(1);
    expect(response.items[0].animation).toBe('heavy_thud');
    expect(response.items[0].dimensions[2]).toBe(16);
  });

  it('invalid category rejected', () => {
    const request = {
      items: [
        {
          id: 'bad-item-1',
          type: 'custom',
          custom: {
            name: 'Invalid Item',
            category: 'explosive',
          },
        },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('error');
    expect(response.code).toBe('INVALID_INPUT');
    expect(response.message).toContain('invalid category');
  });

  it('missing size uses the category defaults', () => {
    const request = {
      items: [
        {
          id: 'default-hard-1',
          type: 'custom',
          custom: {
            name: 'Default Hard Box',
            category: 'hard',
          },
        },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(1);
    // Hard category defaults: [20, 20, 10], weight 1.0, tier 1, color "#64748b"
    expect(response.items[0].dimensions).toEqual([20, 20, 10]);
    expect(response.items[0].color).toBe('#64748b');
    expect(response.items[0].tier).toBe(1);
  });

  it('catalog items have no label field', () => {
    const request = {
      items: [
        {
          id: 'sneakers-1',
          type: 'sneakers',
        },
        {
          id: 'custom-soft-1',
          type: 'custom',
          custom: {
            name: 'Scarf',
            category: 'soft',
          },
        },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(2);

    const sneakers = response.items.find((i) => i.id === 'sneakers-1');
    const customItem = response.items.find((i) => i.id === 'custom-soft-1');

    expect(sneakers).toBeDefined();
    expect('label' in sneakers).toBe(false);
    expect('color' in sneakers).toBe(false);

    expect(customItem).toBeDefined();
    expect(customItem.label).toBe('Scarf');
    expect(customItem.color).toBe('#22c55e');
  });

  it('all placements in bounds without overlap', () => {
    const request = {
      items: [
        { id: 'sneakers-1', type: 'sneakers' },
        {
          id: 'book-custom-1',
          type: 'custom',
          custom: { name: 'Gift Book', category: 'hard', dimensions: [15, 20, 5], weight: 0.5 },
        },
        {
          id: 'blanket-1',
          type: 'custom',
          custom: { name: 'Fleece Blanket', category: 'soft', dimensions: [20, 20, 6], weight: 0.4 },
        },
        {
          id: 'perfume-1',
          type: 'custom',
          custom: { name: 'Perfume Bottle', category: 'fragile', dimensions: [10, 10, 4], weight: 0.2 },
        },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('success');
    expect(response.validation.withinBounds).toBe(true);
    expect(response.validation.noOverlaps).toBe(true);
    expect(response.items).toHaveLength(4);

    for (let i = 0; i < response.items.length; i++) {
      const a = response.items[i];
      const minA = [
        a.position[0] - a.dimensions[0] / 2,
        a.position[1] - a.dimensions[1] / 2,
        a.position[2] - a.dimensions[2] / 2,
      ];
      expect(inBounds(minA, a.dimensions, SUITCASE)).toBe(true);

      for (let j = i + 1; j < response.items.length; j++) {
        const b = response.items[j];
        const minB = [
          b.position[0] - b.dimensions[0] / 2,
          b.position[1] - b.dimensions[1] / 2,
          b.position[2] - b.dimensions[2] / 2,
        ];
        expect(overlaps(minA, a.dimensions, minB, b.dimensions)).toBe(false);
      }
    }
  });

  it('input not mutated', () => {
    const request = {
      items: [
        {
          id: 'custom-item-1',
          type: 'custom',
          custom: {
            name: 'Original Name',
            category: 'hard',
            dimensions: [18, 18, 8],
            weight: 0.9,
          },
          overrides: {
            height: 9,
            weight: 1.1,
          },
        },
      ],
    };

    const cloned = JSON.parse(JSON.stringify(request));
    packItems(request);
    expect(request).toEqual(cloned);
  });
});
