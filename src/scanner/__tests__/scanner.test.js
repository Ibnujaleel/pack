import { describe, it, expect, beforeEach } from 'vitest';
import { CLASS_MAP, lookupClass, IGNORED_CLASSES, isIgnoredClass } from '../classMap.js';
import { validateImageFile, MAX_IMAGE_SIZE_BYTES } from '../validateImage.js';
import {
  computeIoU,
  mergeDuplicates,
  normalizeDetections,
  _resetSuggestionIdCounter,
} from '../normalizeDetections.js';
import catalog from '../../data/items_catalog.json';

describe('Phase 7: Scanner Mapping & Validation', () => {
  beforeEach(() => {
    _resetSuggestionIdCounter();
  });

  describe('classMap', () => {
    it('maps laptop to laptop_15 with high confidence', () => {
      const res = lookupClass('laptop');
      expect(res).toEqual({ catalogType: 'laptop_15', matchConfidence: 'high' });
    });

    it('maps book to hardcover_book with high confidence', () => {
      const res = lookupClass('book');
      expect(res).toEqual({ catalogType: 'hardcover_book', matchConfidence: 'high' });
    });

    it('maps bottle to tsa_liquid_pouch with low confidence', () => {
      const res = lookupClass('bottle');
      expect(res).toEqual({ catalogType: 'tsa_liquid_pouch', matchConfidence: 'low' });
    });

    it('maps "cell phone" to cell_phone with high confidence', () => {
      const res = lookupClass('cell phone');
      expect(res).toEqual({ catalogType: 'cell_phone', matchConfidence: 'high' });
    });

    it('returns null for unsupported classes (e.g. dog, backpack, shoe, couch)', () => {
      expect(lookupClass('dog')).toBeNull();
      expect(lookupClass('backpack')).toBeNull();
      expect(lookupClass('shoe')).toBeNull();
      expect(lookupClass('')).toBeNull();
      expect(lookupClass(null)).toBeNull();
    });

    it('identifies background objects in IGNORED_CLASSES', () => {
      expect(IGNORED_CLASSES).toContain('person');
      expect(isIgnoredClass('person')).toBe(true);
      expect(isIgnoredClass('chair')).toBe(true);
      expect(isIgnoredClass('couch')).toBe(true);
      expect(isIgnoredClass('bed')).toBe(true);
      expect(isIgnoredClass('dining table')).toBe(true);
      expect(isIgnoredClass('laptop')).toBe(false);
      expect(isIgnoredClass('book')).toBe(false);
    });

    it('guarantees that all mapped catalog types exist in items_catalog.json', () => {
      const validTypes = new Set(catalog.map((i) => i.type));
      for (const [, mapping] of Object.entries(CLASS_MAP)) {
        expect(validTypes.has(mapping.catalogType)).toBe(true);
      }
    });
  });

  describe('validateImageFile', () => {
    it('validates supported image formats (jpg, png, webp)', () => {
      const jpg = { type: 'image/jpeg', size: 1024 * 1024 };
      const png = { type: 'image/png', size: 2 * 1024 * 1024 };
      const webp = { type: 'image/webp', size: 500 * 1024 };

      expect(validateImageFile(jpg).valid).toBe(true);
      expect(validateImageFile(png).valid).toBe(true);
      expect(validateImageFile(webp).valid).toBe(true);
    });

    it('rejects unsupported file formats', () => {
      const gif = { type: 'image/gif', size: 500 * 1024 };
      const pdf = { type: 'application/pdf', size: 500 * 1024 };

      const resGif = validateImageFile(gif);
      expect(resGif.valid).toBe(false);
      expect(resGif.error).toContain('Unsupported image format');

      const resPdf = validateImageFile(pdf);
      expect(resPdf.valid).toBe(false);
      expect(resPdf.error).toContain('Unsupported image format');
    });

    it('rejects file sizes exceeding 10MB limit', () => {
      const oversized = { type: 'image/jpeg', size: MAX_IMAGE_SIZE_BYTES + 1024 };
      const res = validateImageFile(oversized);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Image file is too large');
    });

    it('rejects null or empty file', () => {
      expect(validateImageFile(null).valid).toBe(false);
    });
  });

  describe('computeIoU and mergeDuplicates', () => {
    it('calculates IoU 1.0 for identical boxes and 0.0 for disjoint boxes', () => {
      const boxA = [10, 20, 100, 100];
      expect(computeIoU(boxA, boxA)).toBeCloseTo(1.0);

      const boxB = [200, 200, 50, 50];
      expect(computeIoU(boxA, boxB)).toBe(0.0);
    });

    it('merges same-class detections with IoU > 0.6 keeping higher confidence score', () => {
      const detections = [
        { class: 'laptop', score: 0.82, bbox: [100, 100, 200, 150] },
        { class: 'laptop', score: 0.94, bbox: [102, 101, 198, 149] },
      ];
      const merged = mergeDuplicates(detections);
      expect(merged).toHaveLength(1);
      expect(merged[0].score).toBe(0.94);
    });

    it('preserves detections of different classes even with high spatial overlap', () => {
      const detections = [
        { class: 'laptop', score: 0.85, bbox: [100, 100, 200, 150] },
        { class: 'book', score: 0.90, bbox: [100, 100, 200, 150] },
      ];
      const merged = mergeDuplicates(detections);
      expect(merged).toHaveLength(2);
    });
  });

  describe('normalizeDetections', () => {
    it('handles empty or null detection lists', () => {
      const empty = normalizeDetections([]);
      expect(empty).toHaveLength(0);
      expect(empty.ignored).toEqual([]);
    });

    it('filters out background ignored classes into the ignored array', () => {
      const raw = [
        { class: 'laptop', score: 0.92, bbox: [10, 10, 100, 100] },
        { class: 'person', score: 0.95, bbox: [0, 0, 500, 500] },
        { class: 'chair', score: 0.75, bbox: [200, 200, 80, 80] },
      ];
      const result = normalizeDetections(raw);
      expect(result).toHaveLength(1);
      expect(result[0].detectedClass).toBe('laptop');
      expect(result[0].suggestedType).toBe('laptop_15');
      expect(result.ignored).toHaveLength(2);
      expect(result.ignored.map((i) => i.detectedClass)).toEqual(['person', 'chair']);
    });

    it('demotes match confidence to low when score < 0.5', () => {
      const raw = [
        { class: 'laptop', score: 0.42, bbox: [10, 10, 100, 100] },
      ];
      const result = normalizeDetections(raw);
      expect(result[0].suggestedType).toBe('laptop_15');
      expect(result[0].matchConfidence).toBe('low');
    });

    it('marks unmapped classes with suggestedType: null and matchConfidence: none', () => {
      const raw = [
        { class: 'backpack', score: 0.85, bbox: [20, 20, 80, 80] },
      ];
      const result = normalizeDetections(raw);
      expect(result[0].detectedClass).toBe('backpack');
      expect(result[0].suggestedType).toBeNull();
      expect(result[0].matchConfidence).toBe('none');
    });
  });
});
