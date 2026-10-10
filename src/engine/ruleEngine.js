/**
 * ruleEngine.js — Pure rule derivation engine for StowAway 3D.
 *
 * Contract (A6):
 * Recompute the effective profile from catalog defaults plus current validated overrides
 * for every packing run. Do not mutate catalog defaults or accumulate values.
 *
 * Exact order each call:
 * 1. Baseline: copy catalog; overrides.height replaces dimensions[2] only; overrides.weight replaces weight.
 * 2. Fragile/liquid override: if tags include "fragile" or "liquid", force tier 3, elasticity 0, animation "gentle_glide".
 * 3. Thickness rule: for a non-fragile item whose effective unrotated height is >= 15 cm, set elasticity 0, tier 1, animation "heavy_thud".
 * 4. Weight rule: for a non-fragile item whose effective weight is > 1.2 kg (exactly 1.2 does not trigger), set tier 1, animation "heavy_thud".
 * 5. Wide Tier 2 rule: for a non-fragile item whose effective width is >= 30 cm and current tier is 2, promote to tier 1 and set "heavy_thud".
 * 6. Default handling: if no rule overrides the baseline, keep default tier and elasticity; animation by tier:
 *    - Tier 1: "heavy_thud"
 *    - Tier 2: "soft_settle"
 *    - Tier 3: "gentle_glide"
 */

/**
 * Derives the effective physical and animation profile for an item given its catalog
 * entry and optional overrides.
 *
 * @param {object} catalogEntry - Raw catalog entry object
 * @param {object} [overrides={}] - Optional validated overrides ({ height?: number, weight?: number })
 * @returns {{ dimensions: [number, number, number], weight: number, tier: number, elasticity: number, animation: string }}
 */
export function getEffectiveProfile(catalogEntry, overrides = {}) {
  if (!catalogEntry || typeof catalogEntry !== 'object') {
    throw new Error('getEffectiveProfile: catalogEntry is required.');
  }

  // 1. Baseline copy
  const dimensions = [
    catalogEntry.dimensions[0],
    catalogEntry.dimensions[1],
    overrides?.height !== undefined ? overrides.height : catalogEntry.dimensions[2],
  ];

  let weight = overrides?.weight !== undefined ? overrides.weight : catalogEntry.weight;
  let tier = catalogEntry.tier;
  let elasticity = catalogEntry.elasticity;
  let animation = null;

  const tags = Array.isArray(catalogEntry.tags) ? catalogEntry.tags : [];
  const isFragileOrLiquid = tags.includes('fragile') || tags.includes('liquid');

  if (isFragileOrLiquid) {
    // 2. Fragile / liquid override
    tier = 3;
    elasticity = 0;
    animation = 'gentle_glide';
  } else {
    let ruleFired = false;

    // 3. Thickness rule (non-fragile, height >= 15 cm)
    if (dimensions[2] >= 15) {
      elasticity = 0;
      tier = 1;
      animation = 'heavy_thud';
      ruleFired = true;
    }

    // 4. Weight rule (non-fragile, weight > 1.2 kg)
    if (weight > 1.2) {
      tier = 1;
      animation = 'heavy_thud';
      ruleFired = true;
    }

    // 5. Wide Tier 2 rule (non-fragile, width >= 30 cm, current tier 2)
    if (dimensions[0] >= 30 && tier === 2) {
      tier = 1;
      animation = 'heavy_thud';
      ruleFired = true;
    }

    // 6. Default handling if no rule overrides baseline
    if (!ruleFired) {
      tier = catalogEntry.tier;
      elasticity = catalogEntry.elasticity;
      if (tier === 1) {
        animation = 'heavy_thud';
      } else if (tier === 2) {
        animation = 'soft_settle';
      } else {
        animation = 'gentle_glide';
      }
    }
  }

  return {
    dimensions,
    weight,
    tier,
    elasticity,
    animation,
  };
}
