import { describe, it, expect } from 'vitest';
import {
  easeInOutCubic,
  convertEngineToThree,
  getStagingPosition,
  calculateItemTransform,
  getTotalSequenceDuration,
  isSequenceFinished,
  DEFAULT_ANIMATION_CONFIG,
  STAGING_SLOT_COORDINATES,
} from '../animationSequence.js';

describe('Phase 6: Animation Sequence Math & Trajectory', () => {
  describe('DEFAULT_ANIMATION_CONFIG', () => {
    it('defines realistic defaults for packing duration, stagger, and arc clearance', () => {
      expect(DEFAULT_ANIMATION_CONFIG.itemDuration).toBeGreaterThan(0.4);
      expect(DEFAULT_ANIMATION_CONFIG.staggerDelay).toBeGreaterThan(0.2);
      expect(DEFAULT_ANIMATION_CONFIG.arcHeight).toBeGreaterThanOrEqual(0.08);
    });
  });

  describe('easeInOutCubic', () => {
    it('clamps values below 0 to 0 and above 1 to 1', () => {
      expect(easeInOutCubic(-0.5)).toBe(0);
      expect(easeInOutCubic(1.5)).toBe(1);
    });

    it('returns exact boundary values at 0, 0.5, and 1', () => {
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(0.5)).toBe(0.5);
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('is strictly monotonic increasing', () => {
      let prev = -1;
      for (let t = 0; t <= 1.0; t += 0.05) {
        const val = easeInOutCubic(t);
        expect(val).toBeGreaterThanOrEqual(prev);
        prev = val;
      }
    });
  });

  describe('convertEngineToThree', () => {
    it('converts center of suitcase (20, 27.5, 10 cm) to Three.js origin-centered coords', () => {
      const [x, y, z] = convertEngineToThree([20, 27.5, 10]);
      expect(x).toBeCloseTo(0, 4);
      expect(y).toBeCloseTo(0.10, 4); // Y is height (pz / 100)
      expect(z).toBeCloseTo(0, 4);
    });

    it('converts sneaker placement (10, 14, 6 cm) accurately', () => {
      const [x, y, z] = convertEngineToThree([10, 14, 6]);
      expect(x).toBeCloseTo(-0.10, 4);
      expect(y).toBeCloseTo(0.06, 4);
      expect(z).toBeCloseTo(-0.135, 4);
    });

    it('converts cavity boundaries [0, 0, 0] and [40, 55, 20]', () => {
      const min = convertEngineToThree([0, 0, 0]);
      expect(min).toEqual([-0.20, 0.00, -0.275]);

      const max = convertEngineToThree([40, 55, 20]);
      expect(max).toEqual([0.20, 0.20, 0.275]);
    });
  });

  describe('getStagingPosition', () => {
    it('always places items strictly above the suitcase rim (Y >= 0.24m)', () => {
      for (let i = 0; i < STAGING_SLOT_COORDINATES.length; i++) {
        const [, y] = getStagingPosition(i, [20, 28, 12]);
        expect(y).toBeGreaterThan(0.24);
      }
    });

    it('provides distinct, non-overlapping coordinates for slots 0 to 5', () => {
      const positions = [];
      for (let i = 0; i < 6; i++) {
        const [x, , z] = getStagingPosition(i, [10, 10, 10]);
        const key = `${x.toFixed(2)},${z.toFixed(2)}`;
        expect(positions).not.toContain(key);
        positions.push(key);
      }
      expect(positions).toHaveLength(6);
    });
  });

  describe('calculateItemTransform & sequencing', () => {
    const startPos = [-0.10, 0.28, -0.16];
    const targetPos = [-0.10, 0.06, -0.135];
    const targetRot = [0, Math.PI / 2, 0];

    it('keeps item at start position before its individual start time', () => {
      const result = calculateItemTransform(0.1, 1, {
        staggerDelay: 0.35,
        startPosition: startPos,
        targetPosition: targetPos,
      });

      expect(result.isStarted).toBe(false);
      expect(result.isFinished).toBe(false);
      expect(result.position).toEqual(startPos);
      expect(result.progress).toBe(0);
    });

    it('sequentially starts item 0 at 0s, item 1 at 0.35s, item 2 at 0.70s', () => {
      const opts = {
        staggerDelay: 0.35,
        itemDuration: 0.65,
        startPosition: startPos,
        targetPosition: targetPos,
      };

      // At t = 0.2s: item 0 started, item 1 and 2 not started
      const t02_item0 = calculateItemTransform(0.2, 0, opts);
      const t02_item1 = calculateItemTransform(0.2, 1, opts);
      expect(t02_item0.isStarted).toBe(true);
      expect(t02_item1.isStarted).toBe(false);

      // At t = 0.4s: item 0 in flight, item 1 started, item 2 not started
      const t04_item1 = calculateItemTransform(0.4, 1, opts);
      const t04_item2 = calculateItemTransform(0.4, 2, opts);
      expect(t04_item1.isStarted).toBe(true);
      expect(t04_item2.isStarted).toBe(false);

      // At t = 0.75s: item 0 finished, item 1 in flight, item 2 started
      const t075_item0 = calculateItemTransform(0.75, 0, opts);
      const t075_item2 = calculateItemTransform(0.75, 2, opts);
      expect(t075_item0.isFinished).toBe(true);
      expect(t075_item2.isStarted).toBe(true);
    });

    it('lifts item into an arc during flight to clear suitcase rim', () => {
      const midFlight = calculateItemTransform(0.325, 0, {
        staggerDelay: 0.35,
        itemDuration: 0.65,
        arcHeight: 0.09,
        startPosition: startPos,
        targetPosition: targetPos,
      });

      const linearY = startPos[1] + (targetPos[1] - startPos[1]) * 0.5;
      expect(midFlight.position[1]).toBeGreaterThan(linearY);
      // The arc height ensures clearance above the suitcase rim (0.20m)
      expect(midFlight.position[1]).toBeGreaterThan(0.20);
    });

    it('guarantees exact final engine destination and rotation when finished', () => {
      const finished = calculateItemTransform(1.5, 0, {
        staggerDelay: 0.35,
        itemDuration: 0.65,
        startPosition: startPos,
        targetPosition: targetPos,
        targetRotation: targetRot,
      });

      expect(finished.isFinished).toBe(true);
      expect(finished.progress).toBe(1);
      expect(finished.position[0]).toBeCloseTo(targetPos[0], 5);
      expect(finished.position[1]).toBeCloseTo(targetPos[1], 5);
      expect(finished.position[2]).toBeCloseTo(targetPos[2], 5);
      expect(finished.rotation[1]).toBeCloseTo(targetRot[1], 5);
    });
  });

  describe('getTotalSequenceDuration & isSequenceFinished', () => {
    it('returns 0 for empty item count', () => {
      expect(getTotalSequenceDuration(0)).toBe(0);
      expect(isSequenceFinished(0, 0)).toBe(true);
    });

    it('calculates duration for 1 item', () => {
      const duration = getTotalSequenceDuration(1, { itemDuration: 0.65, staggerDelay: 0.35 });
      expect(duration).toBe(0.65);
      expect(isSequenceFinished(0.64, 1, { itemDuration: 0.65, staggerDelay: 0.35 })).toBe(false);
      expect(isSequenceFinished(0.65, 1, { itemDuration: 0.65, staggerDelay: 0.35 })).toBe(true);
    });

    it('calculates duration for 4 items: (3 * 0.35) + 0.65 = 1.70s', () => {
      const duration = getTotalSequenceDuration(4, { itemDuration: 0.65, staggerDelay: 0.35 });
      expect(duration).toBeCloseTo(1.70, 4);
      expect(isSequenceFinished(1.69, 4, { itemDuration: 0.65, staggerDelay: 0.35 })).toBe(false);
      expect(isSequenceFinished(1.71, 4, { itemDuration: 0.65, staggerDelay: 0.35 })).toBe(true);
    });

    it('calculates duration for all 6 items: (5 * 0.35) + 0.65 = 2.40s', () => {
      const duration = getTotalSequenceDuration(6, { itemDuration: 0.65, staggerDelay: 0.35 });
      expect(duration).toBeCloseTo(2.40, 4);
    });
  });
});
