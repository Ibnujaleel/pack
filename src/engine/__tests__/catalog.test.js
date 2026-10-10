import { describe, it, expect } from 'vitest';
import catalog from '../../data/items_catalog.json';

describe('Canonical Items Catalog (Contract A3)', () => {
  it('contains exactly fourteen canonical items in catalog', () => {
    expect(catalog).toHaveLength(14);
  });

  it('contains unique type IDs matching canonical catalog including Phase 8 items', () => {
    const types = catalog.map((item) => item.type);
    expect(types).toEqual([
      'sneakers',
      'hardcover_book',
      'rolled_tshirt',
      'folded_denim',
      'laptop_15',
      'tsa_liquid_pouch',
      'cell_phone',
      'phone_charger',
      'charging_cable',
      'smartphone',
      'small_diary',
      'small_towel',
      'snack_bar',
      'wallet',
    ]);
  });

  it('validates sneakers against contract A3 specifications', () => {
    const item = catalog.find((i) => i.type === 'sneakers');
    expect(item).toBeDefined();
    expect(item.name).toBe('Sneakers');
    expect(item.dimensions).toEqual([20, 28, 12]);
    expect(item.weight).toBe(0.85);
    expect(item.tier).toBe(1);
    expect(item.elasticity).toBe(0);
    expect(item.color).toBe('#ea580c');
    expect(item.geometry).toBe('rounded box');
    expect(item.animation).toBe('heavy_thud');
    expect(item.tags).toEqual([]);
  });

  it('validates hardcover_book against contract A3 specifications', () => {
    const item = catalog.find((i) => i.type === 'hardcover_book');
    expect(item).toBeDefined();
    expect(item.name).toBe('Hardcover book');
    expect(item.dimensions).toEqual([16, 24, 6]);
    expect(item.weight).toBe(0.60);
    expect(item.tier).toBe(1);
    expect(item.elasticity).toBe(0);
    expect(item.color).toBe('#8b5cf6');
    expect(item.geometry).toBe('box');
    expect(item.animation).toBe('heavy_thud');
    expect(item.tags).toEqual([]);
  });

  it('validates rolled_tshirt against contract A3 specifications', () => {
    const item = catalog.find((i) => i.type === 'rolled_tshirt');
    expect(item).toBeDefined();
    expect(item.name).toBe('Rolled T-shirt');
    expect(item.dimensions).toEqual([18, 18, 10]);
    expect(item.weight).toBe(0.20);
    expect(item.tier).toBe(2);
    expect(item.elasticity).toBe(0.6);
    expect(item.color).toBe('#22c55e');
    expect(item.geometry).toBe('cylinder');
    expect(item.animation).toBe('soft_settle');
    expect(item.tags).toEqual([]);
  });

  it('validates folded_denim against contract A3 specifications', () => {
    const item = catalog.find((i) => i.type === 'folded_denim');
    expect(item).toBeDefined();
    expect(item.name).toBe('Folded denim');
    expect(item.dimensions).toEqual([22, 30, 8]);
    expect(item.weight).toBe(0.65);
    expect(item.tier).toBe(2);
    expect(item.elasticity).toBe(0.4);
    expect(item.color).toBe('#3b82f6');
    expect(item.geometry).toBe('box');
    expect(item.animation).toBe('soft_settle');
    expect(item.tags).toEqual([]);
  });

  it('validates laptop_15 against contract A3 specifications and fragile tags', () => {
    const item = catalog.find((i) => i.type === 'laptop_15');
    expect(item).toBeDefined();
    expect(item.name).toBe('15-inch laptop');
    expect(item.dimensions).toEqual([35, 24, 2]);
    expect(item.weight).toBe(1.80);
    expect(item.tier).toBe(3);
    expect(item.elasticity).toBe(0);
    expect(item.color).toBe('#475569');
    expect(item.geometry).toBe('slab');
    expect(item.animation).toBe('gentle_glide');
    expect(item.tags).toEqual(['fragile', 'electronics']);
  });

  it('validates tsa_liquid_pouch against contract A3 specifications and liquid tags', () => {
    const item = catalog.find((i) => i.type === 'tsa_liquid_pouch');
    expect(item).toBeDefined();
    expect(item.name).toBe('TSA liquid pouch');
    expect(item.dimensions).toEqual([15, 10, 5]);
    expect(item.weight).toBe(0.40);
    expect(item.tier).toBe(3);
    expect(item.elasticity).toBe(0);
    expect(item.color).toBe('#f59e0b');
    expect(item.geometry).toBe('box');
    expect(item.animation).toBe('gentle_glide');
    expect(item.tags).toEqual(['liquid', 'tsa']);
  });

  it('validates cell_phone against contract A3 specifications and fragile tags', () => {
    const item = catalog.find((i) => i.type === 'cell_phone');
    expect(item).toBeDefined();
    expect(item.name).toBe('Cell phone');
    expect(item.dimensions).toEqual([8, 16, 1]);
    expect(item.weight).toBe(0.20);
    expect(item.tier).toBe(3);
    expect(item.elasticity).toBe(0);
    expect(item.color).toBe('#06b6d4');
    expect(item.geometry).toBe('slab');
    expect(item.animation).toBe('gentle_glide');
    expect(item.tags).toEqual(['fragile', 'electronics']);
  });

  it('validates phone_charger against contract A3 specifications', () => {
    const item = catalog.find((i) => i.type === 'phone_charger');
    expect(item).toBeDefined();
    expect(item.name).toBe('Phone charger');
    expect(item.dimensions).toEqual([6, 5, 4]);
    expect(item.weight).toBe(0.12);
    expect(item.tier).toBe(2);
    expect(item.elasticity).toBe(0);
    expect(item.color).toBe('#e5e7eb');
    expect(item.geometry).toBe('box');
    expect(item.animation).toBe('soft_settle');
    expect(item.tags).toEqual(['electronics']);
  });

  it('validates charging_cable against contract A3 specifications', () => {
    const item = catalog.find((i) => i.type === 'charging_cable');
    expect(item).toBeDefined();
    expect(item.name).toBe('Charging cable (coiled)');
    expect(item.dimensions).toEqual([12, 12, 3]);
    expect(item.weight).toBe(0.08);
    expect(item.tier).toBe(2);
    expect(item.elasticity).toBe(0.7);
    expect(item.color).toBe('#14b8a6');
    expect(item.geometry).toBe('cylinder');
    expect(item.animation).toBe('soft_settle');
    expect(item.tags).toEqual([]);
  });

  it('validates smartphone against Phase 8 specifications', () => {
    const item = catalog.find((i) => i.type === 'smartphone');
    expect(item).toBeDefined();
    expect(item.name).toBe('Smartphone');
    expect(item.dimensions).toEqual([16, 8, 1]);
    expect(item.weight).toBe(0.20);
    expect(item.tier).toBe(3);
    expect(item.elasticity).toBe(0);
    expect(item.geometry).toBe('slab');
    expect(item.animation).toBe('gentle_glide');
    expect(item.tags).toEqual(['fragile', 'electronics']);
  });

  it('validates small_diary against Phase 8 specifications', () => {
    const item = catalog.find((i) => i.type === 'small_diary');
    expect(item).toBeDefined();
    expect(item.name).toBe('Small Diary');
    expect(item.dimensions).toEqual([15, 11, 2]);
    expect(item.weight).toBe(0.25);
    expect(item.tier).toBe(1);
    expect(item.elasticity).toBe(0);
    expect(item.geometry).toBe('box');
    expect(item.animation).toBe('heavy_thud');
  });

  it('validates small_towel against Phase 8 specifications', () => {
    const item = catalog.find((i) => i.type === 'small_towel');
    expect(item).toBeDefined();
    expect(item.name).toBe('Small Towel');
    expect(item.dimensions).toEqual([20, 15, 6]);
    expect(item.weight).toBe(0.25);
    expect(item.tier).toBe(2);
    expect(item.elasticity).toBe(0.5);
    expect(item.geometry).toBe('rounded box');
    expect(item.animation).toBe('soft_settle');
  });

  it('validates snack_bar against Phase 8 specifications', () => {
    const item = catalog.find((i) => i.type === 'snack_bar');
    expect(item).toBeDefined();
    expect(item.name).toBe('Snack Bar');
    expect(item.dimensions).toEqual([12, 4, 2]);
    expect(item.weight).toBe(0.06);
    expect(item.tier).toBe(2);
    expect(item.elasticity).toBe(0);
    expect(item.geometry).toBe('box');
    expect(item.animation).toBe('soft_settle');
    expect(item.tags).toContain('food');
  });

  it('validates wallet against Phase 8 specifications', () => {
    const item = catalog.find((i) => i.type === 'wallet');
    expect(item).toBeDefined();
    expect(item.name).toBe('Wallet');
    expect(item.dimensions).toEqual([12, 9, 2]);
    expect(item.weight).toBe(0.10);
    expect(item.tier).toBe(2);
    expect(item.elasticity).toBe(0.1);
    expect(item.geometry).toBe('rounded box');
    expect(item.animation).toBe('soft_settle');
  });
});
