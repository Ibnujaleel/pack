/**
 * geometry.js — 3D Suitcase geometry and bounding box helpers.
 *
 * Contract (A4):
 * - Suitcase internal dimensions: 40 W × 55 D × 20 H cm.
 * - Minimum corner [x, y, z] to bounding box center [x, y, z].
 * - An item is in bounds if all minimums >= 0 and maximums <= suitcase dimensions (boundary contact allowed).
 * - Overlap requires positive-volume 3D intersection; touching faces/edges is NOT an overlap.
 */

/** Internal dimensions of the suitcase in centimetres (Contract A4) */
export const SUITCASE = Object.freeze({
  width: 40,
  depth: 55,
  height: 20,
});

/**
 * Compute bounding box min and max coordinates from minimum corner and dimensions.
 *
 * @param {[number, number, number]} min - Minimum corner [x, y, z]
 * @param {[number, number, number]} dims - Oriented dimensions [width, depth, height]
 * @returns {{ min: [number, number, number], max: [number, number, number] }}
 */
export function toBounds(min, dims) {
  const [x, y, z] = min;
  const [w, d, h] = dims;
  return {
    min: [x, y, z],
    max: [x + w, y + d, z + h],
  };
}

/**
 * Check if an item given by minimum corner and dimensions is entirely within suitcase bounds.
 * Boundary contact (e.g. min = 0 or max = suitcase limit) is allowed.
 *
 * @param {[number, number, number]} min - Minimum corner [x, y, z]
 * @param {[number, number, number]} dims - Dimensions [width, depth, height]
 * @param {{ width: number, depth: number, height: number }} [suitcase=SUITCASE] - Suitcase boundaries
 * @returns {boolean}
 */
export function inBounds(min, dims, suitcase = SUITCASE) {
  const [x, y, z] = min;
  const [w, d, h] = dims;

  return (
    x >= 0 &&
    y >= 0 &&
    z >= 0 &&
    x + w <= suitcase.width &&
    y + d <= suitcase.depth &&
    z + h <= suitcase.height
  );
}

/**
 * Helper to normalize box representations into [min, max].
 * Supports { min, max }, { min, dims }, { position, dimensions }, or toBounds output.
 */
function extractBounds(box) {
  if (!box || typeof box !== 'object') return null;

  if (Array.isArray(box.min) && Array.isArray(box.max)) {
    return { min: box.min, max: box.max };
  }

  if (Array.isArray(box.min) && (Array.isArray(box.dims) || Array.isArray(box.dimensions))) {
    const d = box.dims || box.dimensions;
    return toBounds(box.min, d);
  }

  if (Array.isArray(box.position) && Array.isArray(box.dimensions)) {
    const pos = box.position;
    const dims = box.dimensions;
    return {
      min: [pos[0] - dims[0] / 2, pos[1] - dims[1] / 2, pos[2] - dims[2] / 2],
      max: [pos[0] + dims[0] / 2, pos[1] + dims[1] / 2, pos[2] + dims[2] / 2],
    };
  }

  return null;
}

/**
 * Check if two AABBs have positive-volume intersection.
 * Touching faces, edges, or vertices have zero intersection volume and are NOT considered overlapping.
 *
 * Can be called as:
 *   overlaps(boxA, boxB)
 *   overlaps(minA, dimsA, minB, dimsB)
 *
 * @param {object | number[]} a - Bounds object { min, max } or min corner
 * @param {object | number[]} b - Bounds object { min, max } or dimensions for a
 * @param {number[]} [c] - min corner for box B if 4-arg form
 * @param {number[]} [d] - dimensions for box B if 4-arg form
 * @returns {boolean}
 */
export function overlaps(a, b, c, d) {
  let boundsA;
  let boundsB;

  if (c !== undefined && d !== undefined) {
    boundsA = toBounds(a, b);
    boundsB = toBounds(c, d);
  } else {
    boundsA = extractBounds(a);
    boundsB = extractBounds(b);
  }

  if (!boundsA || !boundsB) {
    throw new Error('overlaps: invalid box arguments.');
  }

  const [aMinX, aMinY, aMinZ] = boundsA.min;
  const [aMaxX, aMaxY, aMaxZ] = boundsA.max;
  const [bMinX, bMinY, bMinZ] = boundsB.min;
  const [bMaxX, bMaxY, bMaxZ] = boundsB.max;

  // Strict inequality ensures zero-volume touching faces return false
  return (
    aMinX < bMaxX &&
    aMaxX > bMinX &&
    aMinY < bMaxY &&
    aMaxY > bMinY &&
    aMinZ < bMaxZ &&
    aMaxZ > bMinZ
  );
}

/**
 * Convert an item's minimum corner to its bounding-box center position.
 *
 * @param {[number, number, number]} min - Minimum corner [x, y, z]
 * @param {[number, number, number]} dims - Dimensions [width, depth, height]
 * @returns {[number, number, number]} - Center coordinates [x, y, z]
 */
export function minToCenter(min, dims) {
  return [
    min[0] + dims[0] / 2,
    min[1] + dims[1] / 2,
    min[2] + dims[2] / 2,
  ];
}

/**
 * Convert an item's bounding-box center position to its minimum corner.
 *
 * @param {[number, number, number]} center - Center coordinates [x, y, z]
 * @param {[number, number, number]} dims - Dimensions [width, depth, height]
 * @returns {[number, number, number]} - Minimum corner [x, y, z]
 */
export function centerToMin(center, dims) {
  return [
    center[0] - dims[0] / 2,
    center[1] - dims[1] / 2,
    center[2] - dims[2] / 2,
  ];
}
