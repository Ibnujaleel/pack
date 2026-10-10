import { describe, it, expect } from 'vitest';
import { getEffectiveProfile } from '../ruleEngine.js';
import catalog from '../../data/items_catalog.json';

describe('ruleEngine (Contract A6)', () => {
  const getCatalogItem = (type) => catalog.find((i) => i.type === type);

  it('computes sneakers baseline without overrides', () => {
    const sneakers = getCatalogItem('sneakers');
    const profile = getEffectiveProfile(sneakers);

    expect(profile).toEqual({
      dimensions: [20, 28, 12],
      weight: 0.85,
      tier: 1,
      elasticity: 0,
      animation: 'heavy_thud',
    });
  });

  it('forces laptop_15 (fragile tag) to tier 3 and gentle_glide, unaffected by height/weight rules', () => {
    const laptop = getCatalogItem('laptop_15');
    // Laptop has weight 1.8 (>1.2), but because it is fragile, rule 2 forces tier 3, gentle_glide
    const profile = getEffectiveProfile(laptop);

    expect(profile.tier).toBe(3);
    expect(profile.elasticity).toBe(0);
    expect(profile.animation).toBe('gentle_glide');

    // Even with height >= 15, fragile overrides remain in effect
    const overridden = getEffectiveProfile(laptop, { height: 20 });
    expect(overridden.tier).toBe(3);
    expect(overridden.elasticity).toBe(0);
    expect(overridden.animation).toBe('gentle_glide');
  });

  it('forces tsa_liquid_pouch (liquid tag) to tier 3 and gentle_glide', () => {
    const tsa = getCatalogItem('tsa_liquid_pouch');
    const profile = getEffectiveProfile(tsa);

    expect(profile.tier).toBe(3);
    expect(profile.elasticity).toBe(0);
    expect(profile.animation).toBe('gentle_glide');
  });

  describe('thickness rule (height 14.9 vs 15 for non-fragile item)', () => {
    it('keeps denim at tier 2, elasticity 0.4, soft_settle when height is 14.9', () => {
      const denim = getCatalogItem('folded_denim');
      const profile = getEffectiveProfile(denim, { height: 14.9 });

      expect(profile.dimensions[2]).toBe(14.9);
      expect(profile.tier).toBe(2);
      expect(profile.elasticity).toBe(0.4);
      expect(profile.animation).toBe('soft_settle');
    });

    it('triggers thickness rule when height is 15: promotes to tier 1, elasticity 0, heavy_thud', () => {
      const denim = getCatalogItem('folded_denim');
      const profile = getEffectiveProfile(denim, { height: 15 });

      expect(profile.dimensions[2]).toBe(15);
      expect(profile.tier).toBe(1);
      expect(profile.elasticity).toBe(0);
      expect(profile.animation).toBe('heavy_thud');
    });
  });

  describe('weight rule (1.2 vs 1.21 for non-fragile item)', () => {
    it('does NOT trigger rule when weight is exactly 1.2', () => {
      const tshirt = getCatalogItem('rolled_tshirt'); // default tier 2
      const profile = getEffectiveProfile(tshirt, { weight: 1.2 });

      expect(profile.weight).toBe(1.2);
      expect(profile.tier).toBe(2);
      expect(profile.animation).toBe('soft_settle');
    });

    it('triggers weight rule when weight is 1.21: promotes to tier 1 and heavy_thud', () => {
      const tshirt = getCatalogItem('rolled_tshirt');
      const profile = getEffectiveProfile(tshirt, { weight: 1.21 });

      expect(profile.weight).toBe(1.21);
      expect(profile.tier).toBe(1);
      expect(profile.animation).toBe('heavy_thud');
    });
  });

  describe('wide tier-2 promotion rule', () => {
    it('promotes non-fragile tier 2 item with width >= 30 cm to tier 1 and heavy_thud', () => {
      // Create a mock tier 2 item with width >= 30
      const wideItem = {
        type: 'wide_cushion',
        dimensions: [30, 20, 10],
        weight: 0.5,
        tier: 2,
        elasticity: 0.5,
        tags: [],
        animation: 'soft_settle',
      };

      const profile = getEffectiveProfile(wideItem);
      expect(profile.tier).toBe(1);
      expect(profile.animation).toBe('heavy_thud');
    });

    it('does NOT promote tier 2 item with width < 30 cm unless another rule triggers', () => {
      const denim = getCatalogItem('folded_denim'); // width is 22 < 30
      const profile = getEffectiveProfile(denim);

      expect(profile.tier).toBe(2);
      expect(profile.animation).toBe('soft_settle');
    });
  });

  it('ensures no state leaks between successive calls', () => {
    const denim = getCatalogItem('folded_denim');

    // First call with heavy overrides
    const call1 = getEffectiveProfile(denim, { height: 18, weight: 2.0 });
    expect(call1.tier).toBe(1);
    expect(call1.animation).toBe('heavy_thud');

    // Second call with baseline (no overrides)
    const call2 = getEffectiveProfile(denim);
    expect(call2.tier).toBe(2);
    expect(call2.elasticity).toBe(0.4);
    expect(call2.animation).toBe('soft_settle');
    expect(call2.dimensions).toEqual([22, 30, 8]);
    expect(call2.weight).toBe(0.65);
  });

  it('does NOT mutate the catalog entry or overrides object', () => {
    const denim = getCatalogItem('folded_denim');
    const denimCopy = JSON.parse(JSON.stringify(denim));
    const overrides = { height: 16 };
    const overridesCopy = { ...overrides };

    getEffectiveProfile(denim, overrides);

    expect(denim).toEqual(denimCopy);
    expect(overrides).toEqual(overridesCopy);
  });
});
