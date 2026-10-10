import { describe, it, expect } from 'vitest';
import { allocate } from '../allocator.js';
import { getEffectiveProfile } from '../ruleEngine.js';
import { validatePacking } from '../validatePacking.js';
import catalog from '../../data/items_catalog.json';

describe('allocator (Contract A4, A5, A7)', () => {
  const makeItem = (type, id, overrides = {}) => {
    const entry = catalog.find((c) => c.type === type);
    if (!entry) throw new Error(`Catalog item ${type} not found`);
    return {
      id,
      type,
      profile: getEffectiveProfile(entry, overrides),
    };
  };

  it('places one sneaker at min [0, 0, 0] with original orientation', () => {
    const items = [makeItem('sneakers', 'sneakers-1')];
    const { placements, unplaced } = allocate(items);

    expect(unplaced).toHaveLength(0);
    expect(placements).toHaveLength(1);
    expect(placements[0].id).toBe('sneakers-1');
    expect(placements[0].min).toEqual([0, 0, 0]);
    expect(placements[0].dims).toEqual([20, 28, 12]);
    expect(placements[0].swapped).toBe(false);
  });

  it('sorts by tier asc, then footprint desc, then id asc', () => {
    // Construct items with distinct tiers, footprints, and IDs
    const itemTier2Small = {
      id: 'tier2-b',
      type: 'rolled_tshirt',
      profile: { dimensions: [10, 10, 5], tier: 2, weight: 0.2, elasticity: 0.6, animation: 'soft_settle' },
    };
    const itemTier1Small = {
      id: 'tier1-z',
      type: 'hardcover_book',
      profile: { dimensions: [10, 10, 5], tier: 1, weight: 0.6, elasticity: 0, animation: 'heavy_thud' },
    };
    const itemTier1BigA = {
      id: 'tier1-a',
      type: 'sneakers',
      profile: { dimensions: [20, 20, 5], tier: 1, weight: 0.85, elasticity: 0, animation: 'heavy_thud' },
    };
    const itemTier1BigB = {
      id: 'tier1-b',
      type: 'sneakers',
      profile: { dimensions: [20, 20, 5], tier: 1, weight: 0.85, elasticity: 0, animation: 'heavy_thud' },
    };
    const itemTier3 = {
      id: 'tier3-a',
      type: 'laptop_15',
      profile: { dimensions: [30, 30, 2], tier: 3, weight: 1.8, elasticity: 0, animation: 'gentle_glide' },
    };

    // Pass in random order
    const items = [itemTier2Small, itemTier3, itemTier1Small, itemTier1BigB, itemTier1BigA];
    const { placements } = allocate(items);

    // Expected order:
    // Tier 1: footprint 400 (id tier1-a before tier1-b), then footprint 100 (tier1-z)
    // Tier 2: footprint 100 (tier2-b)
    // Tier 3: tier3-a
    expect(placements.map((p) => p.id)).toEqual([
      'tier1-a',
      'tier1-b',
      'tier1-z',
      'tier2-b',
      'tier3-a',
    ]);
  });

  it('uses swapped orientation [D, W, H] when only swapped fits', () => {
    // Fill suitcase along width so that only a narrow width is available:
    // Suitcase width is 40. Put an item of width 25 at [0,0,0].
    // Remaining width is 15.
    // Next item has dimensions [20, 12, 5].
    // Original [20, 12, 5] requires width 20 > 15 -> does not fit.
    // Swapped [12, 20, 5] requires width 12 <= 15 -> fits!
    const blocker = {
      id: 'blocker',
      type: 'blocker',
      profile: { dimensions: [25, 55, 20], tier: 1, weight: 1, elasticity: 0, animation: 'heavy_thud' },
    };
    const orientItem = {
      id: 'orient-item',
      type: 'orient-item',
      profile: { dimensions: [20, 12, 5], tier: 2, weight: 0.5, elasticity: 0, animation: 'soft_settle' },
    };

    const { placements } = allocate([blocker, orientItem]);
    expect(placements).toHaveLength(2);

    const placedOrient = placements.find((p) => p.id === 'orient-item');
    expect(placedOrient).toBeDefined();
    expect(placedOrient.swapped).toBe(true);
    expect(placedOrient.dims).toEqual([12, 20, 5]);
    expect(placedOrient.min[0]).toBe(25);
  });

  it('keeps all placements in bounds and with no pairwise overlap for a mixed set', () => {
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('hardcover_book', 'book-1'),
      makeItem('rolled_tshirt', 'tshirt-1'),
      makeItem('folded_denim', 'denim-1'),
      makeItem('laptop_15', 'laptop-1'),
      makeItem('tsa_liquid_pouch', 'tsa-1'),
    ];

    const { placements } = allocate(items);
    expect(placements.length).toBeGreaterThan(0);

    const validation = validatePacking(placements);
    expect(validation.withinBounds).toBe(true);
    expect(validation.noOverlaps).toBe(true);
  });

  it('moves impossible items to unplaced while keeping valid items placed', () => {
    // Suitcase dimensions: 40 W × 55 D × 20 H
    // Sneakers: 20 × 28 × 12.
    // In width 40, at most 2 fit side by side (20+20=40).
    // In depth 55, 28 + 28 = 56 > 55, so only 1 row fits.
    // In height 20, 12 + 12 = 24 > 20, so only 1 layer fits.
    // Thus only 2 sneakers can physically fit.
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('sneakers', 'sneakers-2'),
      makeItem('sneakers', 'sneakers-3'),
      makeItem('sneakers', 'sneakers-4'),
      makeItem('sneakers', 'sneakers-5'),
    ];

    const { placements, unplaced } = allocate(items);

    expect(placements).toHaveLength(3);
    expect(unplaced).toHaveLength(2);

    expect(unplaced[0].id).toBe('sneakers-4');
    expect(unplaced[0].reason).toBe('No valid candidate placement found');
    expect(unplaced[1].id).toBe('sneakers-5');
    expect(unplaced[1].reason).toBe('No valid candidate placement found');
  });

  describe('top layer enforcement', () => {
    it('with enforceTopLayer true, laptop min Z >= top of shoes and book', () => {
      const items = [
        makeItem('sneakers', 'sneakers-1'), // height 12, tier 1
        makeItem('hardcover_book', 'book-1'), // height 6, tier 1
        makeItem('laptop_15', 'laptop-1'), // tier 3
      ];

      const { placements, unplaced } = allocate(items, { enforceTopLayer: true, enforceSupport: false });

      expect(unplaced).toHaveLength(0);
      const sneakerPlaced = placements.find((p) => p.id === 'sneakers-1');
      const bookPlaced = placements.find((p) => p.id === 'book-1');
      const laptopPlaced = placements.find((p) => p.id === 'laptop-1');

      const maxLowerZ = Math.max(
        sneakerPlaced.min[2] + sneakerPlaced.dims[2],
        bookPlaced.min[2] + bookPlaced.dims[2]
      );

      // Laptop must sit at or above the highest lower tier item
      expect(laptopPlaced.min[2]).toBeGreaterThanOrEqual(maxLowerZ);
      expect(laptopPlaced.min[2]).toBeGreaterThanOrEqual(12);
    });

    it('with enforceTopLayer false, the laptop may land on the floor (Z = 0)', () => {
      // Sneakers takes [0,0,0] to [20,28,12]
      // Depth 55 - 28 = 27 available behind sneakers on the floor (Z=0).
      // Laptop dims [35, 24, 2] fits in [0..35, 28..52, 0..2].
      const items = [
        makeItem('sneakers', 'sneakers-1'),
        makeItem('laptop_15', 'laptop-1'),
      ];

      const { placements } = allocate(items, { enforceTopLayer: false });
      const laptopPlaced = placements.find((p) => p.id === 'laptop-1');

      expect(laptopPlaced).toBeDefined();
      expect(laptopPlaced.min[2]).toBe(0); // Lands on floor
    });

    it('places TSA liquid pouch at or above layerTop', () => {
      const items = [
        makeItem('sneakers', 'sneakers-1'),
        makeItem('tsa_liquid_pouch', 'tsa-1'),
      ];

      const { placements } = allocate(items, { enforceTopLayer: true });
      const tsaPlaced = placements.find((p) => p.id === 'tsa-1');

      expect(tsaPlaced).toBeDefined();
      expect(tsaPlaced.min[2]).toBeGreaterThanOrEqual(12);
    });

    it('reports "No supported space in top layer" if lower items reach Z = 20 and laptop cannot fit', () => {
      // Create a lower tier item that reaches the full suitcase height Z = 20
      const tallItem = {
        id: 'tall-box',
        type: 'hardcover_book',
        profile: { dimensions: [30, 40, 20], tier: 1, weight: 1, elasticity: 0, animation: 'heavy_thud' },
      };
      const laptop = makeItem('laptop_15', 'laptop-1');

      const { placements, unplaced } = allocate([tallItem, laptop], { enforceTopLayer: true });

      expect(placements).toHaveLength(1);
      expect(unplaced).toHaveLength(1);
      expect(unplaced[0].id).toBe('laptop-1');
      expect(unplaced[0].reason).toBe('No supported space in top layer');
    });
  });

  it('produces identical output over 20 repeated runs and leaves inputs unmutated', () => {
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('hardcover_book', 'book-1'),
      makeItem('laptop_15', 'laptop-1'),
    ];

    const itemsClone = JSON.parse(JSON.stringify(items));
    const baselineResult = allocate(items);

    for (let run = 0; run < 20; run++) {
      const runResult = allocate(items);
      expect(runResult).toEqual(baselineResult);
    }

    // Assert input array & item objects were not mutated
    expect(items).toEqual(itemsClone);
  });
});
