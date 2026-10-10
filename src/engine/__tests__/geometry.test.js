import { describe, it, expect } from 'vitest';
import {
  SUITCASE,
  toBounds,
  inBounds,
  overlaps,
  minToCenter,
  centerToMin,
} from '../geometry.js';

describe('geometry (Contract A4)', () => {
  describe('SUITCASE constants', () => {
    it('defines internal dimensions 40 W × 55 D × 20 H cm', () => {
      expect(SUITCASE).toEqual({
        width: 40,
        depth: 55,
        height: 20,
      });
    });
  });

  describe('toBounds', () => {
    it('computes correct min and max boundaries', () => {
      const bounds = toBounds([5, 10, 2], [20, 28, 12]);
      expect(bounds.min).toEqual([5, 10, 2]);
      expect(bounds.max).toEqual([25, 38, 14]);
    });
  });

  describe('inBounds', () => {
    it('returns true when item is fully inside the suitcase', () => {
      expect(inBounds([5, 5, 2], [10, 10, 5])).toBe(true);
    });

    it('returns true when item touches the boundaries (touching allowed per A4)', () => {
      // Touching min boundaries [0, 0, 0]
      expect(inBounds([0, 0, 0], [20, 20, 10])).toBe(true);

      // Touching max boundaries [40, 55, 20]
      expect(inBounds([20, 25, 10], [20, 30, 10])).toBe(true);

      // Spanning the entire suitcase exactly
      expect(inBounds([0, 0, 0], [40, 55, 20])).toBe(true);
    });

    it('returns false when item exceeds any boundary', () => {
      // Exceeds width (40)
      expect(inBounds([0, 0, 0], [41, 20, 10])).toBe(false);
      expect(inBounds([35, 0, 0], [10, 20, 10])).toBe(false);

      // Exceeds depth (55)
      expect(inBounds([0, 50, 0], [10, 10, 10])).toBe(false);

      // Exceeds height (20)
      expect(inBounds([0, 0, 15], [10, 10, 6])).toBe(false);

      // Negative min coordinate
      expect(inBounds([-1, 0, 0], [10, 10, 10])).toBe(false);
      expect(inBounds([0, -0.5, 0], [10, 10, 10])).toBe(false);
      expect(inBounds([0, 0, -2], [10, 10, 10])).toBe(false);
    });
  });

  describe('overlaps', () => {
    it('returns false when boxes touch at faces (zero intersection volume)', () => {
      // Touching on X face at X = 20
      const boxA = toBounds([0, 0, 0], [20, 20, 10]);
      const boxB = toBounds([20, 0, 0], [20, 20, 10]);
      expect(overlaps(boxA, boxB)).toBe(false);

      // Touching on Y face at Y = 15
      const boxC = toBounds([0, 0, 0], [15, 15, 10]);
      const boxD = toBounds([0, 15, 0], [15, 15, 10]);
      expect(overlaps(boxC, boxD)).toBe(false);

      // Touching on Z face at Z = 10
      const boxE = toBounds([0, 0, 0], [15, 15, 10]);
      const boxF = toBounds([0, 0, 10], [15, 15, 10]);
      expect(overlaps(boxE, boxF)).toBe(false);
    });

    it('returns false when boxes touch only at edges or corners', () => {
      // Touching at an edge
      const boxA = toBounds([0, 0, 0], [10, 10, 10]);
      const boxB = toBounds([10, 10, 0], [10, 10, 10]);
      expect(overlaps(boxA, boxB)).toBe(false);

      // Touching at a single vertex corner
      const boxC = toBounds([0, 0, 0], [10, 10, 10]);
      const boxD = toBounds([10, 10, 10], [10, 10, 10]);
      expect(overlaps(boxC, boxD)).toBe(false);
    });

    it('returns false when boxes are completely separated', () => {
      const boxA = toBounds([0, 0, 0], [10, 10, 10]);
      const boxB = toBounds([25, 25, 0], [10, 10, 10]);
      expect(overlaps(boxA, boxB)).toBe(false);
    });

    it('returns true when boxes have positive-volume intersection', () => {
      const boxA = toBounds([0, 0, 0], [20, 20, 10]);
      const boxB = toBounds([10, 10, 5], [20, 20, 10]); // intersects [10-20, 10-20, 5-10]
      expect(overlaps(boxA, boxB)).toBe(true);

      // One box completely contained inside another
      const outer = toBounds([0, 0, 0], [30, 30, 20]);
      const inner = toBounds([5, 5, 5], [10, 10, 5]);
      expect(overlaps(outer, inner)).toBe(true);
    });

    it('supports 4-argument call signature: overlaps(minA, dimsA, minB, dimsB)', () => {
      // Touching faces -> false
      expect(overlaps([0, 0, 0], [20, 20, 10], [20, 0, 0], [20, 20, 10])).toBe(false);

      // Positive volume overlap -> true
      expect(overlaps([0, 0, 0], [20, 20, 10], [10, 10, 5], [20, 20, 10])).toBe(true);
    });

    it('supports position + dimensions objects (center format per A8)', () => {
      const item1 = { position: [10, 10, 5], dimensions: [20, 20, 10] }; // min [0,0,0], max [20,20,10]
      const item2 = { position: [30, 10, 5], dimensions: [20, 20, 10] }; // min [20,0,0], max [40,20,10] (touching)
      expect(overlaps(item1, item2)).toBe(false);

      const item3 = { position: [15, 15, 5], dimensions: [20, 20, 10] }; // overlapping with item1
      expect(overlaps(item1, item3)).toBe(true);
    });
  });

  describe('minToCenter & centerToMin conversions', () => {
    it('computes center position correctly from min corner and dimensions', () => {
      // Sneakers placed at origin [0, 0, 0] with dimensions [20, 28, 12]
      const center = minToCenter([0, 0, 0], [20, 28, 12]);
      expect(center).toEqual([10, 14, 6]);
    });

    it('converts center position back to minimum corner', () => {
      const min = centerToMin([10, 14, 6], [20, 28, 12]);
      expect(min).toEqual([0, 0, 0]);
    });
  });
});
