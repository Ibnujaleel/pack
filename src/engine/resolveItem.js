/**
 * resolveItem.js — Pure catalog item resolution for the StowAway packing engine.
 *
 * Contract:
 * - resolveItem(requestItem, catalog, categories): returns a catalog-style entry.
 * - Catalog items return their catalog entry.
 * - Custom items are built from category defaults plus custom values.
 * - Missing dimensions or weight fall back to the category defaults.
 * - Never mutates inputs.
 */

/**
 * Resolves a request item into a standard catalog-style item profile entry.
 *
 * @param {object} requestItem - The validated request item ({ id, type, custom?, overrides? })
 * @param {Array<object> | Record<string, object>} catalog - Canonical catalog entries
 * @param {Array<object> | Record<string, object>} categories - Category default definitions
 * @returns {object | null} Catalog-style entry with dimensions, weight, tier, elasticity, tags, animation, color
 */
export function resolveItem(requestItem, catalog, categories) {
  if (!requestItem || typeof requestItem !== 'object') {
    return null;
  }

  // 1. Catalog item resolution
  if (requestItem.type !== 'custom') {
    if (Array.isArray(catalog)) {
      return catalog.find((c) => c && c.type === requestItem.type) || null;
    }
    if (catalog && typeof catalog === 'object') {
      return catalog[requestItem.type] || null;
    }
    return null;
  }

  // 2. Custom item resolution
  const custom = requestItem.custom || {};
  const catName = custom.category;

  let catDef = null;
  if (Array.isArray(categories)) {
    catDef = categories.find((c) => c && (c.category === catName || c.name === catName || c.type === catName)) || null;
  } else if (categories && typeof categories === 'object') {
    catDef = categories[catName] || null;
  }

  if (!catDef) {
    return null;
  }

  // Missing dimensions fall back to category defaults
  const dimensions =
    Array.isArray(custom.dimensions) &&
    custom.dimensions.length === 3 &&
    custom.dimensions.every((d) => typeof d === 'number' && Number.isFinite(d) && d > 0)
      ? [custom.dimensions[0], custom.dimensions[1], custom.dimensions[2]]
      : [...catDef.dimensions];

  // Missing weight falls back to category defaults
  const weight =
    typeof custom.weight === 'number' && Number.isFinite(custom.weight) && custom.weight >= 0
      ? custom.weight
      : catDef.weight;

  const name =
    typeof custom.name === 'string' && custom.name.trim() !== ''
      ? custom.name
      : (catDef.category || 'Custom item');

  return {
    type: 'custom',
    name,
    dimensions,
    weight,
    tier: catDef.tier,
    elasticity: catDef.elasticity,
    tags: Array.isArray(catDef.tags) ? [...catDef.tags] : [],
    geometry: catDef.geometry || 'box',
    color: catDef.color,
    animation: catDef.animation,
  };
}
