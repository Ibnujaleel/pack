import { describe, it, expect } from 'vitest';
import { allocate, MIN_SUPPORT_RATIO, computeSupportRatio } from '../allocator.js';
import { getEffectiveProfile } from '../ruleEngine.js';
import { SUITCASE, inBounds, overlaps } from '../geometry.js';
import catalog from '../../data/items_catalog.json' with { type: 'json' };

describe('allocator support check and top layer positioning', () => {
  const makeItem = (type, id, overrides = {}) => {
    const entry = catalog.find((c) => c.type === type);
    if (!entry) throw new Error(`Catalog item ${type} not found`);
    return {
      id,
      type,
      profile: getEffectiveProfile(entry, overrides),
    };
  };

  it('rejects an item with under 70% support and accepts at exactly 70%', () => {
    expect(MIN_SUPPORT_RATIO).toBe(0.7);

    // Supporting base at min Z = 0 with top face at Z = 5
    const base70 = [{ min: [0, 0, 0], dims: [7, 10, 5] }];
    const base69 = [{ min: [0, 0, 0], dims: [6.9, 10, 5] }];

    // Placement candidate at min Z = 5 with footprint 10 x 10 (area 100)
    const candidatePoint = [0, 0, 5];
    const candidateDims = [10, 10, 2];

    const ratio70 = computeSupportRatio(candidatePoint, candidateDims, base70);
    const ratio69 = computeSupportRatio(candidatePoint, candidateDims, base69);

    // Exactly 70% is accepted
    expect(ratio70).toBeCloseTo(0.7, 5);
    expect(ratio70 >= MIN_SUPPORT_RATIO - 1e-9).toBe(true);

    // 69% (< 70%) is rejected
    expect(ratio69).toBeCloseTo(0.69, 5);
    expect(ratio69 < MIN_SUPPORT_RATIO).toBe(true);
  });

  it('places laptop with sneakers + book with at least 70% support', () => {
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('hardcover_book', 'hardcover-book-1'),
      makeItem('laptop_15', 'laptop-1'),
    ];

    const { placements, unplaced } = allocate(items);

    expect(unplaced).toHaveLength(0);
    expect(placements).toHaveLength(3);

    const laptop = placements.find((p) => p.id === 'laptop-1');
    expect(laptop).toBeDefined();
    expect(laptop.supportRatio).toBeGreaterThanOrEqual(0.7);
  });

  it('unplaces laptop with reason "No supported space in top layer" when no supported spot exists', () => {
    // Floor is covered by a tier 1 item that leaves only 1 cm height at the top,
    // so laptop (height 2 cm) cannot fit anywhere in bounds
    const tallBlocker = {
      id: 'tall-blocker',
      type: 'hardcover_book',
      profile: {
        dimensions: [40, 55, 19],
        tier: 1,
        weight: 1,
        elasticity: 0,
        animation: 'heavy_thud',
      },
    };
    const laptop = makeItem('laptop_15', 'laptop-1');

    const { placements, unplaced } = allocate([tallBlocker, laptop]);

    expect(placements).toHaveLength(1);
    expect(unplaced).toHaveLength(1);
    expect(unplaced[0].id).toBe('laptop-1');
    expect(unplaced[0].reason).toBe('No supported space in top layer');
  });

  it('ensures all placements are within bounds and have no pairwise overlap', () => {
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('hardcover_book', 'hardcover-book-1'),
      makeItem('laptop_15', 'laptop-1'),
    ];

    const { placements } = allocate(items);
    expect(placements).toHaveLength(3);

    for (let i = 0; i < placements.length; i++) {
      const a = placements[i];
      expect(inBounds(a.min, a.dims, SUITCASE)).toBe(true);

      for (let j = i + 1; j < placements.length; j++) {
        const b = placements[j];
        expect(overlaps(a.min, a.dims, b.min, b.dims)).toBe(false);
      }
    }
  });

  it('produces deep-equal results across 3 repeated runs', () => {
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('hardcover_book', 'hardcover-book-1'),
      makeItem('laptop_15', 'laptop-1'),
    ];

    const run1 = allocate(items);
    const run2 = allocate(items);
    const run3 = allocate(items);

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });

  it('reproduces the previous placement when enforceSupport is false', () => {
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('hardcover_book', 'hardcover-book-1'),
      makeItem('laptop_15', 'laptop-1'),
    ];

    const { placements } = allocate(items, { enforceSupport: false, enforceTopLayer: true });

    const laptop = placements.find((p) => p.id === 'laptop-1');
    expect(laptop).toBeDefined();
    // Previous placement: sits at min [0, 0, 12] with unswapped dims [35, 24, 2]
    expect(laptop.min).toEqual([0, 0, 12]);
    expect(laptop.dims).toEqual([35, 24, 2]);
    expect(laptop.swapped).toBe(false);
  });

  it('prints each item min, dims and support ratio for sneakers + book + laptop', () => {
    const items = [
      makeItem('sneakers', 'sneakers-1'),
      makeItem('hardcover_book', 'hardcover-book-1'),
      makeItem('laptop_15', 'laptop-1'),
    ];

    const { placements } = allocate(items);
    expect(placements).toHaveLength(3);

    for (const p of placements) {
      console.log(
        `Placement [${p.id}]: min=[${p.min.join(',')}], dims=[${p.dims.join(',')}], supportRatio=${p.supportRatio}`
      );
      expect(p.supportRatio).toBeGreaterThanOrEqual(0.7);
    }
  });
});
