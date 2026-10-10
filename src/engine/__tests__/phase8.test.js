import { describe, it, expect } from 'vitest';
import { allocate } from '../allocator.js';
import { getEffectiveProfile } from '../ruleEngine.js';
import { validatePacking } from '../validatePacking.js';
import catalog from '../../data/items_catalog.json';

describe('Phase 8: Catalog Expansion and Rolled T-Shirt Packing', () => {
  const makeItem = (type, id, overrides = {}) => {
    const entry = catalog.find((c) => c.type === type);
    if (!entry) throw new Error(`Catalog item ${type} not found`);
    return {
      id,
      type,
      profile: getEffectiveProfile(entry, overrides),
    };
  };

  describe('Task 1: Rolled T-Shirt Packing Behavior', () => {
    it('packs a single rolled T-shirt at min [0, 0, 0] with dimensions [18, 18, 10]', () => {
      const items = [makeItem('rolled_tshirt', 'tshirt-1')];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(1);
      expect(placements[0].id).toBe('tshirt-1');
      expect(placements[0].min).toEqual([0, 0, 0]);
      expect(placements[0].dims).toEqual([18, 18, 10]);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });

    it('packs multiple rolled T-shirts cleanly side-by-side without overlap', () => {
      const items = [
        makeItem('rolled_tshirt', 'tshirt-1'),
        makeItem('rolled_tshirt', 'tshirt-2'),
        makeItem('rolled_tshirt', 'tshirt-3'),
      ];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(3);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });

    it('packs rolled T-shirt alongside sneakers, book, denim, laptop, and liquids without collision', () => {
      const items = [
        makeItem('sneakers', 'sneakers-1'),
        makeItem('hardcover_book', 'book-1'),
        makeItem('folded_denim', 'denim-1'),
        makeItem('rolled_tshirt', 'tshirt-1'),
        makeItem('laptop_15', 'laptop-1'),
        makeItem('tsa_liquid_pouch', 'tsa-1'),
      ];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(6);

      const tshirt = placements.find((p) => p.id === 'tshirt-1');
      expect(tshirt).toBeDefined();

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });
  });

  describe('Task 2: Five New Catalog Items Integration', () => {
    it('packs Smartphone (slab, tier 3, gentle_glide) successfully', () => {
      const items = [makeItem('smartphone', 'phone-1')];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(1);
      expect(placements[0].id).toBe('phone-1');
      expect(placements[0].type).toBe('smartphone');
      expect(placements[0].dims).toEqual([16, 8, 1]);
      expect(placements[0].profile.tier).toBe(3);
      expect(placements[0].profile.animation).toBe('gentle_glide');

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });

    it('packs Small Diary (box, tier 1, heavy_thud) successfully', () => {
      const items = [makeItem('small_diary', 'diary-1')];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(1);
      expect(placements[0].dims).toEqual([15, 11, 2]);
      expect(placements[0].profile.tier).toBe(1);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });

    it('packs Small Towel (rounded box, tier 2, soft_settle) successfully', () => {
      const items = [makeItem('small_towel', 'towel-1')];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(1);
      expect(placements[0].dims).toEqual([20, 15, 6]);
      expect(placements[0].profile.tier).toBe(2);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });

    it('packs Snack Bar (box, 12x4x2, tier 2) successfully', () => {
      const items = [makeItem('snack_bar', 'snack-1')];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(1);
      expect(placements[0].dims).toEqual([12, 4, 2]);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });

    it('packs Wallet (rounded box, 12x9x2, tier 2) successfully', () => {
      const items = [makeItem('wallet', 'wallet-1')];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(1);
      expect(placements[0].dims).toEqual([12, 9, 2]);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });

    it('packs all five new items simultaneously with zero overlaps', () => {
      const items = [
        makeItem('smartphone', 'phone-1'),
        makeItem('small_diary', 'diary-1'),
        makeItem('small_towel', 'towel-1'),
        makeItem('snack_bar', 'snack-1'),
        makeItem('wallet', 'wallet-1'),
      ];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(5);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });
  });

  describe('Task 3: Packing Efficiency with Mixed Small Items', () => {
    it('efficiently places small items into tight spaces using swapped orientations where needed', () => {
      // Sneakers (20x28x12) and Book (16x24x6) occupy width 36 at front floor
      // Remaining width at X=36 is 4cm (40 - 36).
      // Snack bar is 12x4x2. Swapped orientation [4, 12, 2] fits into X=36!
      const items = [
        makeItem('sneakers', 'sneakers-1'),
        makeItem('hardcover_book', 'book-1'),
        makeItem('snack_bar', 'snack-1'),
      ];
      const { placements, unplaced } = allocate(items);

      expect(unplaced).toHaveLength(0);
      expect(placements).toHaveLength(3);

      const snack = placements.find((p) => p.id === 'snack-1');
      expect(snack).toBeDefined();
      expect(snack.min[0]).toBe(36);
      expect(snack.dims[0]).toBe(4); // swapped to 4cm width to fit the 4cm gap
      expect(snack.swapped).toBe(true);

      const validation = validatePacking(placements);
      expect(validation.withinBounds).toBe(true);
      expect(validation.noOverlaps).toBe(true);
    });
  });
});
