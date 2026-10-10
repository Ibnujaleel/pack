import { describe, it, expect } from 'vitest';
import { CLASS_MAP, lookupClass } from '../classMap.js';
import catalog from '../../data/items_catalog.json';

describe('classMap', () => {
  it('maps laptop to laptop_15 with high confidence', () => {
    const result = lookupClass('laptop');
    expect(result).toEqual({ catalogType: 'laptop_15', matchConfidence: 'high' });
  });

  it('maps book to hardcover_book with high confidence', () => {
    const result = lookupClass('book');
    expect(result).toEqual({ catalogType: 'hardcover_book', matchConfidence: 'high' });
  });

  it('maps bottle to tsa_liquid_pouch with low confidence (needs user confirmation)', () => {
    const result = lookupClass('bottle');
    expect(result).toEqual({ catalogType: 'tsa_liquid_pouch', matchConfidence: 'low' });
  });

  it('returns null for unsupported classes (e.g. dog, backpack, cup)', () => {
    expect(lookupClass('dog')).toBeNull();
    expect(lookupClass('backpack')).toBeNull();
    expect(lookupClass('cup')).toBeNull();
    expect(lookupClass('')).toBeNull();
    expect(lookupClass('unknown_item')).toBeNull();
  });

  it('only maps to catalog type IDs that exist in the canonical items_catalog.json', () => {
    const validCatalogTypes = new Set(catalog.map((item) => item.type));

    for (const [cocoClass, mapping] of Object.entries(CLASS_MAP)) {
      expect(
        validCatalogTypes.has(mapping.catalogType),
        `Mapped type "${mapping.catalogType}" for "${cocoClass}" must exist in catalog`
      ).toBe(true);
    }
  });

  it('does not contain any dimensions, weights or colors in CLASS_MAP', () => {
    for (const [_, mapping] of Object.entries(CLASS_MAP)) {
      const keys = Object.keys(mapping);
      expect(keys.sort()).toEqual(['catalogType', 'matchConfidence'].sort());
    }
  });
});
