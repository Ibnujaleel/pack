/**
 * Overflow Layout Utility for StowAway 3D
 *
 * Positions items that cannot fit inside the suitcase in a dedicated overflow
 * area beside the suitcase (+X side, right of suitcase in the initial camera view).
 *
 * Suitcase Cavity:
 * - Internal: 40 W x 55 D x 20 H cm
 * - World X: [-0.20, +0.20] m (Right outer wall at X = +0.212 m)
 * - World Z: [-0.275, +0.275] m
 * - World Y: [0, 0.20] m
 */

const BASE_X = 0.38; // First column center X (metres)
const COL_SPACING = 0.16; // Column spacing along X (metres)
const ROW_SPACING = 0.15; // Row spacing along Z (metres)

/**
 * Calculates row and column count based on total unplaced items.
 */
function getGridDimensions(totalCount) {
  if (totalCount <= 0) return { columns: 0, rows: 0, maxRows: 0 };
  if (totalCount <= 3) {
    return { columns: 1, rows: totalCount, maxRows: 3 };
  }
  if (totalCount <= 6) {
    const rows = Math.ceil(totalCount / 2);
    return { columns: 2, rows, maxRows: 3 };
  }
  const cols = Math.ceil(totalCount / 3);
  return { columns: cols, rows: 3, maxRows: 3 };
}

/**
 * Returns [x, y, z] coordinates in Three.js metres for an overflow item.
 * 
 * @param {number} index - Index of the item among unplaced items
 * @param {number} totalCount - Total number of unplaced items
 * @param {Array<number>} dimensions - Item dimensions [w, d, h] in cm
 * @returns {Array<number>} [x, y, z] position in metres
 */
export function getOverflowPosition(index, totalCount = 1, dimensions = [10, 10, 10]) {
  const { rows } = getGridDimensions(totalCount);

  // Column index (0, 1, 2...) along +X
  const col = Math.floor(index / rows);
  // Row index within column (0, 1, 2...) along Z
  const row = index % rows;

  const x = BASE_X + col * COL_SPACING;

  // Center rows symmetrically along Z around 0
  let z = 0;
  if (rows > 1) {
    const halfSpan = ((rows - 1) * ROW_SPACING) / 2;
    z = -halfSpan + row * ROW_SPACING;
  }

  // Determine item resting height (sitting flush on overflow floor mat at Y = 0.002m)
  const dims = Array.isArray(dimensions) ? dimensions : (dimensions?.dimensions || [10, 10, 10]);
  const heightMetres = (dims[2] || 10) / 100;
  const y = 0.002 + heightMetres / 2;

  return [x, y, z];
}

/**
 * Calculates bounding area geometry for the overflow tray / mat.
 * 
 * @param {number} totalCount - Total number of unplaced items
 * @returns {Object} { center: [x, y, z], size: [width, depth], columns, rows }
 */
export function getOverflowAreaBounds(totalCount = 1) {
  if (totalCount <= 0) {
    return { center: [BASE_X, 0.001, 0], size: [0.20, 0.20], columns: 0, rows: 0 };
  }

  const { columns, rows } = getGridDimensions(totalCount);

  const width = Math.max(0.20, columns * COL_SPACING + 0.04);
  const depth = Math.max(0.24, rows * ROW_SPACING + 0.06);

  const centerX = BASE_X + ((columns - 1) * COL_SPACING) / 2;
  const centerZ = 0;

  return {
    center: [centerX, 0.001, centerZ],
    size: [width, depth],
    columns,
    rows
  };
}

/**
 * Calculates optimal camera framing based on presence of overflow items.
 * Ensures both the suitcase and overflow area are simultaneously visible.
 * 
 * @param {number} unplacedCount - Number of unplaced items
 * @returns {Object} { position: [x, y, z], target: [tx, ty, tz] }
 */
export function getOptimalCameraFraming(unplacedCount = 0) {
  if (unplacedCount <= 0) {
    return {
      position: [0.70, 0.75, 0.85],
      target: [0, 0.12, 0]
    };
  }

  // When overflow items exist, expand target slightly to the right (+X)
  // and pull camera back slightly to keep suitcase and overflow area in view
  const { columns } = getGridDimensions(unplacedCount);
  const xOffset = columns > 1 ? 0.12 : 0.08;
  const camX = 0.78 + (columns - 1) * 0.06;
  const camY = 0.80;
  const camZ = 0.94 + (columns - 1) * 0.05;

  return {
    position: [camX, camY, camZ],
    target: [xOffset, 0.11, 0]
  };
}

export default {
  getOverflowPosition,
  getOverflowAreaBounds,
  getOptimalCameraFraming
};
