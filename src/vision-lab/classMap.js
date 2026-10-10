/**
 * classMap.js — Maps COCO-SSD class names to catalog type IDs and defines ignored background classes.
 *
 * Contract (A9): COCO-SSD detects generic classes, not exact catalog products.
 * This map bridges the two. Only catalog type IDs appear here — no dimensions,
 * weights, or colors. Those come from src/data/items_catalog.json at runtime.
 *
 * matchConfidence levels:
 *   "high"  — strong 1:1 correspondence (laptop → laptop_15, cell phone → cell_phone)
 *   "low"   — plausible but ambiguous (bottle → tsa_liquid_pouch needs user confirmation)
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
  return IGNORED_SET.has(cocoClass);
}

/**
 * Look up a COCO-SSD class name and return catalog mapping info,
 * or null if the class has no mapping.
 *
 * @param {string} cocoClass — raw COCO-SSD class string
 * @returns {{ catalogType: string, matchConfidence: "high" | "low" } | null}
 */
export function lookupClass(cocoClass) {
  return CLASS_MAP[cocoClass] ?? null;
}
