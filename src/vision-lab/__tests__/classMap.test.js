import { describe, it, expect } from 'vitest';
import { CLASS_MAP, lookupClass, IGNORED_CLASSES, isIgnoredClass } from '../classMap.js';
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

  it('maps "cell phone" to cell_phone with high confidence', () => {
    const result = lookupClass('cell phone');
    expect(result).toEqual({ catalogType: 'cell_phone', matchConfidence: 'high' });
  });

  it('returns null for unsupported classes (e.g. dog, backpack, keyboard)', () => {
    expect(lookupClass('dog')).toBeNull();
    expect(lookupClass('backpack')).toBeNull();
    expect(lookupClass('keyboard')).toBeNull();
    expect(lookupClass('')).toBeNull();
    expect(lookupClass('unknown_item')).toBeNull();
  });

  it('identifies background objects in IGNORED_CLASSES', () => {
    expect(Array.isArray(IGNORED_CLASSES)).toBe(true);
    expect(IGNORED_CLASSES).toContain('person');
    expect(IGNORED_CLASSES).toContain('dining table');
    expect(isIgnoredClass('person')).toBe(true);
    expect(isIgnoredClass('dining table')).toBe(true);
    expect(isIgnoredClass('chair')).toBe(true);
    expect(isIgnoredClass('couch')).toBe(true);
    expect(isIgnoredClass('bed')).toBe(true);
    expect(isIgnoredClass('tv')).toBe(true);
    expect(isIgnoredClass('cup')).toBe(true);
    expect(isIgnoredClass('bowl')).toBe(true);
    expect(isIgnoredClass('potted plant')).toBe(true);
    expect(isIgnoredClass('cell phone')).toBe(false);
    expect(isIgnoredClass('laptop')).toBe(false);
    expect(isIgnoredClass('bottle')).toBe(false);
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
