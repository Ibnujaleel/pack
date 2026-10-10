/**
 * Animation Sequence Utility for Phase 6: Sequential Packing Animations
 *
 * Implements smooth cinematic interpolation for items moving from staging platform
 * to their exact engine-assigned cavity destinations.
 */

/**
 * Smooth cubic ease-in-out easing curve:
 * Produces zero initial and final velocity (C^1 continuous).
 */
export function easeInOutCubic(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Converts engine bounding-box center coordinates (in cm) into Three.js metres.
 * Suitcase cavity dimensions: 40 W x 55 D x 20 H cm
 * - Engine X in [0, 40] cm -> Three.js X = (X - 20) / 100
 * - Engine Y in [0, 55] cm -> Three.js Z = (Y - 27.5) / 100
 * - Engine Z in [0, 20] cm -> Three.js Y = Z / 100
 */
export function convertEngineToThree(position) {
  const [px, py, pz] = position;
  return [
    (px - 20) / 100,
    pz / 100,
    (py - 27.5) / 100,
  ];
}

/**
 * Canonical non-overlapping staging positions on the staging shelf (Y >= 0.24m)
 * strictly above the suitcase rim (H = 0.20m).
 * Grid supports up to 6 canonical items cleanly across 2 columns x 3 rows.
 */
export const STAGING_SLOT_COORDINATES = [
  [-0.10, -0.16], // Slot 0: Top-Left
  [0.10, -0.16],  // Slot 1: Top-Right
  [-0.10, 0.00],   // Slot 2: Mid-Left
  [0.10, 0.00],    // Slot 3: Mid-Right
  [-0.10, 0.16],   // Slot 4: Bottom-Left
  [0.10, 0.16],    // Slot 5: Bottom-Right
];

export function getStagingPosition(slotIndex, itemOrDims = [10, 10, 10]) {
  const coords = STAGING_SLOT_COORDINATES[slotIndex % STAGING_SLOT_COORDINATES.length];
  const [x, z] = coords;
  const dims = Array.isArray(itemOrDims) ? itemOrDims : (itemOrDims?.dimensions || [10, 10, 10]);
  const heightMetres = (dims[2] || 10) / 100;
  // Elevated platform is at Y = 0.23m. Item center is at Y = 0.235m + height / 2.
  const y = 0.235 + heightMetres / 2;
  return [x, y, z];
}

/**
 * Animation Configuration Defaults
 */
export const DEFAULT_ANIMATION_CONFIG = {
  itemDuration: 0.65, // seconds for an individual item to travel from staging to cavity
  staggerDelay: 0.35, // seconds between start of item i and item i+1
  arcHeight: 0.09,    // extra vertical arc height (in metres) to cleanly clear suitcase rim
};

/**
 * Calculates current 3D position and rotation for item at elapsed time.
 */
export function calculateItemTransform(elapsedTime, itemIndex, options = {}) {
  const config = { ...DEFAULT_ANIMATION_CONFIG, ...options };
  const {
    itemDuration,
    staggerDelay,
    arcHeight,
    startPosition = [0, 0.25, 0],
    targetPosition = [0, 0.05, 0],
    startRotation = [0, 0, 0],
    targetRotation = [0, 0, 0],
  } = config;

  const startTime = itemIndex * staggerDelay;
  const endTime = startTime + itemDuration;

  // Case 1: Before animation starts for this item
  if (elapsedTime <= startTime) {
    return {
      position: [...startPosition],
      rotation: [...startRotation],
      progress: 0,
      isFinished: false,
      isStarted: false,
    };
  }

  // Case 2: After animation completes for this item
  if (elapsedTime >= endTime) {
    return {
      position: [...targetPosition],
      rotation: [...targetRotation],
      progress: 1,
      isFinished: true,
      isStarted: true,
    };
  }

  // Case 3: In-flight interpolation
  const linearProgress = (elapsedTime - startTime) / itemDuration;
  const easedProgress = easeInOutCubic(linearProgress);

  // Linear interpolation for horizontal axes X and Z
  const x = startPosition[0] + (targetPosition[0] - startPosition[0]) * easedProgress;
  const z = startPosition[2] + (targetPosition[2] - startPosition[2]) * easedProgress;

  // Vertical axis Y: smooth linear descent + parabolic arc boost
  const baseLinearY = startPosition[1] + (targetPosition[1] - startPosition[1]) * easedProgress;
  const arcBoost = Math.sin(Math.PI * linearProgress) * arcHeight;
  const y = baseLinearY + arcBoost;

  // Rotation: interpolate with subtle flight pitch tilt
  const rx = startRotation[0] + (targetRotation[0] - startRotation[0]) * easedProgress - Math.sin(Math.PI * linearProgress) * 0.05;
  const ry = startRotation[1] + (targetRotation[1] - startRotation[1]) * easedProgress;
  const rz = startRotation[2] + (targetRotation[2] - startRotation[2]) * easedProgress;

  return {
    position: [x, y, z],
    rotation: [rx, ry, rz],
    progress: easedProgress,
    isFinished: false,
    isStarted: true,
  };
}

/**
 * Calculates total sequence duration in seconds for N items.
 */
export function getTotalSequenceDuration(itemCount, options = {}) {
  if (itemCount <= 0) return 0;
  const config = { ...DEFAULT_ANIMATION_CONFIG, ...options };
  return (itemCount - 1) * config.staggerDelay + config.itemDuration;
}

/**
 * Checks whether the entire packing sequence has finished at elapsed time.
 */
export function isSequenceFinished(elapsedTime, itemCount, options = {}) {
  const total = getTotalSequenceDuration(itemCount, options);
  return elapsedTime >= total;
}
