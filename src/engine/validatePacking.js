/**
 * validatePacking.js — Independent validation for 3D item placements.
 *
 * Contract (A4, A7, A8):
 * - Validates placements independently from the allocator.
 * - Computes withinBounds: true if every item is within suitcase boundaries (touching allowed).
 * - Computes noOverlaps: true if no two placed items have positive-volume 3D intersection.
 * - Empty placements array returns { withinBounds: true, noOverlaps: true }.
 */

import { SUITCASE, inBounds, overlaps } from './geometry.js';

/**
 * Independently validates an array of placements against suitcase bounds and mutual collision.
 *
 * @param {Array<{ min: [number, number, number], dims: [number, number, number] }>} placements
 * @param {{ width: number, depth: number, height: number }} [suitcase=SUITCASE]
 * @returns {{ withinBounds: boolean, noOverlaps: boolean }}
 */
export function validatePacking(placements = [], suitcase = SUITCASE) {
  if (!Array.isArray(placements) || placements.length === 0) {
    return {
      withinBounds: true,
      noOverlaps: true,
    };
  }

  // 1. Boundary check: every item must be within bounds
  let withinBounds = true;
  for (const item of placements) {
    if (!item || !item.min || !item.dims || !inBounds(item.min, item.dims, suitcase)) {
      withinBounds = false;
      break;
    }
  }

  // 2. Overlap check: pairwise positive-volume collision detection
  let noOverlaps = true;
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      if (overlaps(a.min, a.dims, b.min, b.dims)) {
        noOverlaps = false;
        break;
      }
    }
    if (!noOverlaps) {
      break;
    }
  }

  return {
    withinBounds,
    noOverlaps,
  };
}
