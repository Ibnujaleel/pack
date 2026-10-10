/**
 * classMap.js — Maps COCO-SSD class names to catalog type IDs.
 *
 * Contract (A9): COCO-SSD detects generic classes, not exact catalog products.
 * This map bridges the two. Only catalog type IDs appear here — no dimensions,
 * weights, or colors. Those come from src/data/items_catalog.json at runtime.
 *
 * matchConfidence levels:
 *   "high"  — strong 1:1 correspondence (laptop → laptop_15)
 *   "low"   — plausible but ambiguous (bottle → tsa_liquid_pouch needs user confirmation)
 */

/**
 * @type {Record<string, { catalogType: string, matchConfidence: "high" | "low" }>}
 */
export const CLASS_MAP = {
  laptop: { catalogType: 'laptop_15', matchConfidence: 'high' },
  book:   { catalogType: 'hardcover_book', matchConfidence: 'high' },
  bottle: { catalogType: 'tsa_liquid_pouch', matchConfidence: 'low' },
};

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
