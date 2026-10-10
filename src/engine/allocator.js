/**
 * allocator.js — Deterministic packing allocator with support checking for StowAway 3D.
 *
 * Contract (A4, A5, A7):
 * - Deterministic greedy heuristic (no Math.random, no Date, no localeCompare).
 * - Sort order: tier ascending, then footprint (width * depth) descending,
 *   then instance ID ascending using (a < b ? -1 : a > b ? 1 : 0).
 * - Candidate points are item minimum corners.
 * - Minimum support ratio MIN_SUPPORT_RATIO = 0.7.
 * - Placements with min Z = 0 are always supported.
 * - Placements with min Z > 0 are valid only if at least 70% of footprint area is supported
 *   by top faces of items whose max Z equals the placement's min Z.
 * - Top-layer rule (enforceTopLayer = true): tier 3 items check candidate points atop placed
 *   items and at layerTop. If enforceSupport is true and no supported top-layer spot exists,
 *   supported floor spots (min Z = 0) are evaluated.
 * - On failure for tier 3 with top-layer rule:
 *   reason is "No supported space in top layer" (if enforceSupport) or "No space in top layer".
 * - On other failures: reason is "No valid candidate placement found".
 */

import { SUITCASE, inBounds, overlaps } from './geometry.js';

/** Minimum support ratio required for items placed above the floor (Contract rule) */
export const MIN_SUPPORT_RATIO = 0.7;

/**
 * Computes the fraction of an item's footprint area supported from below by placed items.
 *
 * @param {[number, number, number]} point - Minimum corner [x, y, z]
 * @param {[number, number, number]} dims - Oriented dimensions [width, depth, height]
 * @param {Array<{ min: [number, number, number], dims: [number, number, number] }>} placed - Placed items
 * @returns {number} Support ratio between 0.0 and 1.0
 */
export function computeSupportRatio(point, dims, placed) {
  const [px, py, pz] = point;
  const [pw, pd] = dims;

  // Rule 2: A placement with min Z = 0 is always fully supported.
  if (pz === 0) {
    return 1.0;
  }

  const footprintArea = pw * pd;
  if (footprintArea <= 0) {
    return 0.0;
  }

  let supportedArea = 0;

  for (const existing of placed) {
    const existingMaxZ = existing.min[2] + existing.dims[2];

    // Top face of supporting item must equal placement min Z
    if (Math.abs(existingMaxZ - pz) < 1e-6) {
      const ex0 = existing.min[0];
      const ex1 = existing.min[0] + existing.dims[0];
      const ey0 = existing.min[1];
      const ey1 = existing.min[1] + existing.dims[1];

      const ix0 = Math.max(px, ex0);
      const ix1 = Math.min(px + pw, ex1);
      const iy0 = Math.max(py, ey0);
      const iy1 = Math.min(py + pd, ey1);

      if (ix1 > ix0 && iy1 > iy0) {
        supportedArea += (ix1 - ix0) * (iy1 - iy0);
      }
    }
  }

  return supportedArea / footprintArea;
}

/**
 * Deduplicate candidate points and sort them deterministically:
 * Z ascending, then Y ascending, then X ascending.
 *
 * @param {Array<[number, number, number]>} points
 * @returns {Array<[number, number, number]>}
 */
function deduplicateAndSortPoints(points) {
  const seen = new Set();
  const deduped = [];

  for (const pt of points) {
    const key = `${pt[0]},${pt[1]},${pt[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(pt);
    }
  }

  deduped.sort((a, b) => {
    if (a[2] !== b[2]) return a[2] - b[2]; // Z asc
    if (a[1] !== b[1]) return a[1] - b[1]; // Y asc
    return a[0] - b[0];                   // X asc
  });

  return deduped;
}

/**
 * Generate normal candidate points from origin and placed items.
 *
 * @param {Array<{ min: [number, number, number], dims: [number, number, number] }>} placed
 * @returns {Array<[number, number, number]>}
 */
function getNormalCandidatePoints(placed) {
  const points = [[0, 0, 0]];

  for (const p of placed) {
    const [x, y, z] = p.min;
    const [w, d, h] = p.dims;
    points.push([x + w, y, z]);
    points.push([x, y + d, z]);
    points.push([x, y, z + h]);
  }

  return deduplicateAndSortPoints(points);
}

/**
 * Generate candidate points for tier 3 items under top-layer enforcement.
 * Includes points at the top-left corner of each placed tier 1 and 2 item at Z = that item's max Z (Rule 6),
 * normal points with Z raised to layerTop, plus [0,0,layerTop], and points adjacent to placed tier 3 items.
 *
 * @param {Array<{ min: [number, number, number], dims: [number, number, number], profile: { tier: number } }>} placed
 * @param {number} layerTop
 * @returns {Array<[number, number, number]>}
 */
function getTier3CandidatePoints(placed, layerTop) {
  const normalPoints = [[0, 0, 0]];

  for (const p of placed) {
    const [x, y, z] = p.min;
    const [w, d, h] = p.dims;
    normalPoints.push([x + w, y, z]);
    normalPoints.push([x, y + d, z]);
    normalPoints.push([x, y, z + h]);
  }

  const points = [];

  // Rule 6: Top-left corner of each placed tier 1 and 2 item at Z = that item's max Z
  const placedLower = placed.filter((p) => p.profile.tier < 3);
  for (const p of placedLower) {
    points.push([p.min[0], p.min[1], p.min[2] + p.dims[2]]);
  }

  // All normal points with Z raised to layerTop
  for (const pt of normalPoints) {
    points.push([pt[0], pt[1], Math.max(pt[2], layerTop)]);
  }

  // Plus [0, 0, layerTop]
  points.push([0, 0, layerTop]);

  // Plus right/front/top points of already placed tier 3 items
  const placedTier3 = placed.filter((p) => p.profile.tier === 3);
  for (const p of placedTier3) {
    const [x, y, z] = p.min;
    const [w, d, h] = p.dims;
    points.push([x + w, y, z]);
    points.push([x, y + d, z]);
    points.push([x, y, z + h]);
  }

  return deduplicateAndSortPoints(points);
}

/**
 * Allocate 3D positions for a set of items inside the suitcase.
 *
 * @param {Array<{ id: string, type: string, profile: { dimensions: [number, number, number], tier: number, weight: number, elasticity: number, animation: string } }>} items
 * @param {{ enforceTopLayer?: boolean, enforceSupport?: boolean, supportRatio?: number }} [options={}]
 * @returns {{
 *   placements: Array<{ id: string, type: string, profile: object, min: [number, number, number], dims: [number, number, number], swapped: boolean, supportRatio: number }>,
 *   unplaced: Array<{ id: string, reason: string }>
 * }}
 */
export function allocate(items = [], options = {}) {
  const enforceTopLayer = options?.enforceTopLayer ?? true;
  const enforceSupport = options?.enforceSupport ?? true;
  const minSupportRatio = options?.supportRatio ?? MIN_SUPPORT_RATIO;

  if (!Array.isArray(items) || items.length === 0) {
    return {
      placements: [],
      unplaced: [],
    };
  }

  // a. Sort: tier asc, footprint (W x D) desc, id asc (lexical a < b ? -1 : a > b ? 1 : 0)
  const sortedItems = [...items].sort((a, b) => {
    if (a.profile.tier !== b.profile.tier) {
      return a.profile.tier - b.profile.tier;
    }

    const areaA = a.profile.dimensions[0] * a.profile.dimensions[1];
    const areaB = b.profile.dimensions[0] * b.profile.dimensions[1];
    if (areaB !== areaA) {
      return areaB - areaA;
    }

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const placements = [];
  const unplaced = [];

  for (const item of sortedItems) {
    const isTier3 = item.profile.tier === 3;
    const isTopLayerEnforced = enforceTopLayer && isTier3;

    // Determine layerTop if top layer is enforced
    let layerTop = 0;
    if (isTopLayerEnforced) {
      const placedLower = placements.filter((p) => p.profile.tier < 3);
      if (placedLower.length > 0) {
        layerTop = Math.max(...placedLower.map((p) => p.min[2] + p.dims[2]));
      }
    }

    const [w, d, h] = item.profile.dimensions;

    // c. For each point try original [W, D, H] first, then swapped [D, W, H]
    const orientations = [
      { dims: [w, d, h], swapped: false },
    ];

    if (w !== d) {
      orientations.push({ dims: [d, w, h], swapped: true });
    }

    /**
     * Attempts to place the item across a list of candidate points.
     * @param {Array<[number, number, number]>} pointsList
     * @returns {object | null}
     */
    const tryCandidatePoints = (pointsList) => {
      for (const point of pointsList) {
        for (const orient of orientations) {
          // d. Reject if out of bounds
          if (!inBounds(point, orient.dims, SUITCASE)) {
            continue;
          }

          // d. Reject if overlapping any already placed item
          let hasOverlap = false;
          for (const existing of placements) {
            if (overlaps(point, orient.dims, existing.min, existing.dims)) {
              hasOverlap = true;
              break;
            }
          }
          if (hasOverlap) {
            continue;
          }

          // Rules 1, 2, 3: Support ratio check (min Z = 0 always supported; min Z > 0 requires >= 70%)
          let supportRatio = 1.0;
          if (enforceSupport) {
            supportRatio = computeSupportRatio(point, orient.dims, placements);
            if (supportRatio < minSupportRatio - 1e-9) {
              continue;
            }
          }

          return {
            id: item.id,
            type: item.type,
            profile: { ...item.profile },
            min: [point[0], point[1], point[2]],
            dims: [...orient.dims],
            swapped: orient.swapped,
            supportRatio,
          };
        }
      }
      return null;
    };

    let placedItem = null;

    if (isTopLayerEnforced) {
      // 1. Try top-layer candidate points (raised to layerTop and atop lower tier items)
      const topLayerPoints = getTier3CandidatePoints(placements, layerTop);
      placedItem = tryCandidatePoints(topLayerPoints);

      // 2. If enforceSupport is enabled and no supported spot in top layer was found,
      // fallback to supported floor candidate points (min Z = 0)
      if (!placedItem && enforceSupport) {
        const floorPoints = getNormalCandidatePoints(placements).filter((p) => p[2] === 0);
        placedItem = tryCandidatePoints(floorPoints);
      }
    } else {
      const normalPoints = getNormalCandidatePoints(placements);
      placedItem = tryCandidatePoints(normalPoints);
    }

    if (placedItem) {
      placements.push(placedItem);
    } else {
      let reason;
      if (isTopLayerEnforced) {
        reason = enforceSupport ? 'No supported space in top layer' : 'No space in top layer';
      } else {
        reason = 'No valid candidate placement found';
      }
      unplaced.push({
        id: item.id,
        reason,
      });
    }
  }

  return {
    placements,
    unplaced,
  };
}
