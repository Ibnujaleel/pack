/**
 * classMap.js — Maps COCO-SSD class names to canonical catalog type IDs and defines ignored background classes.
 *
 * Contract: COCO-SSD detects 80 generic classes.
 * This map bridges supported classes to canonical catalog types in items_catalog.json.
 * Only catalog type IDs appear here — dimensions, weights, and tiers come from items_catalog.json.
 */

/**
 * @type {Record<string, { catalogType: string, matchConfidence: "high" | "low" }>}
 */
export const CLASS_MAP = {
  laptop:       { catalogType: 'laptop_15', matchConfidence: 'high' },
  book:         { catalogType: 'hardcover_book', matchConfidence: 'high' },
  bottle:       { catalogType: 'tsa_liquid_pouch', matchConfidence: 'low' },
  'cell phone': { catalogType: 'cell_phone', matchConfidence: 'high' },
};

/**
 * Classes considered background or environment clutter that should be excluded from item suggestions.
 */
export const IGNORED_CLASSES = [
  'person',
  'dining table',
  'chair',
  'couch',
  'bed',
  'tv',
  'cup',
  'bowl',
  'potted plant',
];

const IGNORED_SET = new Set(IGNORED_CLASSES);

/**
 * Check if a class is an ignored background class.
 *
 * @param {string} cocoClass
 * @returns {boolean}
 */
export function isIgnoredClass(cocoClass) {
  if (!cocoClass) return false;
  return IGNORED_SET.has(cocoClass.toLowerCase().trim());
}

/**
 * Look up a COCO-SSD class name and return catalog mapping info,
 * or null if the class has no direct mapping.
 *
 * @param {string} cocoClass — raw COCO-SSD class string
 * @returns {{ catalogType: string, matchConfidence: "high" | "low" } | null}
 */
export function lookupClass(cocoClass) {
  if (!cocoClass) return null;
  const key = cocoClass.toLowerCase().trim();
  return CLASS_MAP[key] ?? null;
}
