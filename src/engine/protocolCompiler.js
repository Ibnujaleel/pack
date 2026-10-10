/**
 * protocolCompiler.js — Compiles raw allocator placements and validation into Contract A8 JSON.
 *
 * Contract (A8):
 * - Items in placement order, each with ONLY:
 *   id, type, dimensions (oriented), position (center = min + dims/2, cm, rounded to 2 decimals),
 *   rotation [0,0,0], tier, animation.
 * - unplacedItems entries have ONLY { id, reason }.
 * - suitcase: { width: 40, depth: 55, height: 20 }.
 * - validation: { withinBounds, noOverlaps }.
 */

import { SUITCASE } from './geometry.js';

/**
 * Rounds a numeric coordinate to at most 2 decimal places.
 *
 * @param {number} val
 * @returns {number}
 */
function round2(val) {
  return Math.round(val * 100) / 100;
}

/**
 * Compile placements, unplaced items, and validation flags into the canonical protocol JSON.
 *
 * @param {Array<{ id: string, type: string, dims: [number, number, number], min: [number, number, number], profile: { tier: number, animation: string } }>} placements
 * @param {Array<{ id: string, reason: string }>} unplaced
 * @param {{ withinBounds?: boolean, noOverlaps?: boolean }} validation
 * @returns {object} Canonical A8 protocol success response
 */
export function compileProtocol(placements = [], unplaced = [], validation = {}) {
  const safePlacements = Array.isArray(placements) ? placements : [];
  const safeUnplaced = Array.isArray(unplaced) ? unplaced : [];

  const items = safePlacements.map((p) => ({
    id: p.id,
    type: p.type,
    dimensions: [p.dims[0], p.dims[1], p.dims[2]],
    position: [
      round2(p.min[0] + p.dims[0] / 2),
      round2(p.min[1] + p.dims[1] / 2),
      round2(p.min[2] + p.dims[2] / 2),
    ],
    rotation: [0, 0, 0],
    tier: p.profile.tier,
    animation: p.profile.animation,
  }));

  const unplacedItems = safeUnplaced.map((u) => ({
    id: u.id,
    reason: u.reason,
  }));

  return {
    status: 'success',
    suitcase: {
      width: SUITCASE.width,
      depth: SUITCASE.depth,
      height: SUITCASE.height,
    },
    items,
    unplacedItems,
    validation: {
      withinBounds: Boolean(validation?.withinBounds),
      noOverlaps: Boolean(validation?.noOverlaps),
    },
  };
}
