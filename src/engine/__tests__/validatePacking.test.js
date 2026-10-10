import { describe, it, expect } from 'vitest';
import { validatePacking } from '../validatePacking.js';

describe('validatePacking', () => {
  it('returns withinBounds: true and noOverlaps: true for empty placements', () => {
    expect(validatePacking([])).toEqual({
      withinBounds: true,
      noOverlaps: true,
    });
  });

  it('returns true for touching boxes with zero-volume intersection', () => {
    const touchingPlacements = [
      { id: 'box-1', min: [0, 0, 0], dims: [20, 20, 10] },
      { id: 'box-2', min: [20, 0, 0], dims: [20, 20, 10] }, // Touching at X = 20
      { id: 'box-3', min: [0, 20, 0], dims: [20, 20, 10] }, // Touching at Y = 20
      { id: 'box-4', min: [0, 0, 10], dims: [20, 20, 10] }, // Touching at Z = 10
    ];

    const result = validatePacking(touchingPlacements);
    expect(result.withinBounds).toBe(true);
    expect(result.noOverlaps).toBe(true);
  });

  it('returns noOverlaps: false for a deliberately overlapping pair', () => {
    const overlappingPlacements = [
      { id: 'box-1', min: [0, 0, 0], dims: [20, 20, 10] },
      { id: 'box-2', min: [10, 10, 5], dims: [20, 20, 10] }, // Overlaps [10-20, 10-20, 5-10]
    ];

    const result = validatePacking(overlappingPlacements);
    expect(result.withinBounds).toBe(true);
    expect(result.noOverlaps).toBe(false);
  });

  it('returns withinBounds: false for an out-of-bounds placement', () => {
    const outOfBoundsPlacements = [
      { id: 'box-1', min: [35, 0, 0], dims: [10, 20, 10] }, // Width 35 + 10 = 45 > 40
    ];

    const result = validatePacking(outOfBoundsPlacements);
    expect(result.withinBounds).toBe(false);
    expect(result.noOverlaps).toBe(true);
  });

  it('detects negative coordinates as out of bounds', () => {
    const negativePlacements = [
      { id: 'box-1', min: [-2, 0, 0], dims: [10, 10, 10] },
    ];

    const result = validatePacking(negativePlacements);
    expect(result.withinBounds).toBe(false);
  });

  it('returns both withinBounds: false and noOverlaps: false when both violations occur', () => {
    const badPlacements = [
      { id: 'box-1', min: [30, 0, 0], dims: [20, 10, 10] }, // 30+20=50 > 40
      { id: 'box-2', min: [35, 0, 0], dims: [10, 10, 10] }, // Overlaps box-1 and out of bounds
    ];

    const result = validatePacking(badPlacements);
    expect(result.withinBounds).toBe(false);
    expect(result.noOverlaps).toBe(false);
  });
});
