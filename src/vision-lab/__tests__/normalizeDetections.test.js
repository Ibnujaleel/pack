import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeIoU,
  mergeDuplicates,
  normalizeDetections,
  _resetSuggestionIdCounter,
} from '../normalizeDetections.js';

describe('normalizeDetections', () => {
  beforeEach(() => {
    _resetSuggestionIdCounter();
  });

  describe('computeIoU', () => {
    it('returns 1.0 for identical bounding boxes', () => {
      const box = [10, 20, 100, 100];
      expect(computeIoU(box, box)).toBeCloseTo(1.0);
    });

    it('returns 0.0 for completely disjoint bounding boxes', () => {
      const a = [0, 0, 10, 10];
      const b = [50, 50, 10, 10];
      expect(computeIoU(a, b)).toBe(0.0);
    });

    it('calculates partial overlap correctly', () => {
      const a = [0, 0, 20, 20]; // area 400
      const b = [10, 0, 20, 20]; // area 400, intersection [10, 0, 10, 20] area 200
      // union = 400 + 400 - 200 = 600
      // IoU = 200 / 600 = 0.3333...
      expect(computeIoU(a, b)).toBeCloseTo(1 / 3);
    });
  });

  describe('mergeDuplicates', () => {
    it('merges same-class detections with IoU > 0.6 keeping the higher score', () => {
      const detections = [
        { class: 'laptop', score: 0.85, bbox: [100, 100, 200, 150] },
        { class: 'laptop', score: 0.95, bbox: [105, 102, 195, 148] }, // high overlap
      ];

      const merged = mergeDuplicates(detections);
      expect(merged).toHaveLength(1);
      expect(merged[0].class).toBe('laptop');
      expect(merged[0].score).toBe(0.95);
    });

    it('does NOT merge detections of different classes even with high IoU', () => {
      const detections = [
        { class: 'laptop', score: 0.85, bbox: [100, 100, 200, 150] },
        { class: 'book', score: 0.90, bbox: [100, 100, 200, 150] },
      ];

      const merged = mergeDuplicates(detections);
      expect(merged).toHaveLength(2);
    });

    it('does NOT merge same-class detections with IoU <= 0.6', () => {
      const detections = [
        { class: 'book', score: 0.88, bbox: [50, 50, 100, 100] },
        { class: 'book', score: 0.82, bbox: [200, 50, 100, 100] }, // disjoint
      ];

      const merged = mergeDuplicates(detections);
      expect(merged).toHaveLength(2);
    });
  });

  describe('normalizeDetections output shape and mapping', () => {
    it('normalizes laptop to suggestedType laptop_15 with matchConfidence high when score >= 0.5', () => {
      const raw = [{ class: 'laptop', score: 0.92, bbox: [10, 20, 300, 200] }];
      const suggestions = normalizeDetections(raw);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toEqual({
        suggestionId: 'suggestion-1',
        detectedClass: 'laptop',
        score: 0.92,
        bbox: [10, 20, 300, 200],
        suggestedType: 'laptop_15',
        matchConfidence: 'high',
      });
    });

    it('normalizes "cell phone" to suggestedType cell_phone with matchConfidence high when score >= 0.5', () => {
      const raw = [{ class: 'cell phone', score: 0.88, bbox: [5, 10, 80, 160] }];
      const suggestions = normalizeDetections(raw);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toEqual({
        suggestionId: 'suggestion-1',
        detectedClass: 'cell phone',
        score: 0.88,
        bbox: [5, 10, 80, 160],
        suggestedType: 'cell_phone',
        matchConfidence: 'high',
      });
    });

    it('normalizes bottle to suggestedType tsa_liquid_pouch with matchConfidence low', () => {
      const raw = [{ class: 'bottle', score: 0.75, bbox: [15, 25, 50, 120] }];
      const suggestions = normalizeDetections(raw);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].suggestedType).toBe('tsa_liquid_pouch');
      expect(suggestions[0].matchConfidence).toBe('low');
    });

    it('marks detections between 0.35 and 0.5 as matchConfidence low', () => {
      const raw = [
        { class: 'laptop', score: 0.42, bbox: [10, 20, 300, 200] },
        { class: 'cell phone', score: 0.38, bbox: [5, 10, 80, 160] },
      ];
      const suggestions = normalizeDetections(raw);

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].matchConfidence).toBe('low');
      expect(suggestions[0].suggestedType).toBe('laptop_15');
      expect(suggestions[1].matchConfidence).toBe('low');
      expect(suggestions[1].suggestedType).toBe('cell_phone');
    });

    it('excludes IGNORED_CLASSES from suggestions and returns them in .ignored list', () => {
      const raw = [
        { class: 'person', score: 0.95, bbox: [0, 0, 100, 200] },
        { class: 'dining table', score: 0.80, bbox: [50, 50, 300, 200] },
        { class: 'chair', score: 0.70, bbox: [10, 10, 50, 50] },
        { class: 'cell phone', score: 0.85, bbox: [20, 20, 30, 60] },
      ];

      const suggestions = normalizeDetections(raw);

      // Only cell phone is in suggestions
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].detectedClass).toBe('cell phone');

      // Ignored objects are in suggestions.ignored
      expect(suggestions.ignored).toHaveLength(3);
      expect(suggestions.ignored.map((i) => i.detectedClass)).toEqual([
        'person',
        'dining table',
        'chair',
      ]);
    });

    it('sets unmapped, non-ignored classes to suggestedType: null and matchConfidence: "none"', () => {
      const raw = [
        { class: 'dog', score: 0.88, bbox: [0, 0, 100, 100] },
        { class: 'keyboard', score: 0.65, bbox: [150, 150, 100, 100] },
        { class: 'mouse', score: 0.55, bbox: [200, 200, 30, 40] },
      ];
      const suggestions = normalizeDetections(raw);

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].suggestedType).toBeNull();
      expect(suggestions[0].matchConfidence).toBe('none');
      expect(suggestions[1].suggestedType).toBeNull();
      expect(suggestions[1].matchConfidence).toBe('none');
      expect(suggestions[2].suggestedType).toBeNull();
      expect(suggestions[2].matchConfidence).toBe('none');
    });

    it('returns empty array when given empty input or null', () => {
      expect(normalizeDetections([])).toEqual([]);
      expect(normalizeDetections(null)).toEqual([]);
      expect(normalizeDetections(undefined)).toEqual([]);
    });
  });

  describe('immutability', () => {
    it('does NOT mutate the input detections array or objects', () => {
      const rawDetections = [
        { class: 'laptop', score: 0.85, bbox: [10, 20, 30, 40] },
        { class: 'laptop', score: 0.95, bbox: [12, 22, 28, 38] },
        { class: 'book', score: 0.70, bbox: [100, 100, 50, 50] },
        { class: 'person', score: 0.90, bbox: [5, 5, 20, 40] },
      ];
      const rawCopy = JSON.parse(JSON.stringify(rawDetections));

      const result = normalizeDetections(rawDetections);

      expect(rawDetections).toEqual(rawCopy);
      // Ensure modifying the returned bbox does not affect rawDetections
      result[0].bbox[0] = 9999;
      expect(rawDetections[0].bbox[0]).not.toBe(9999);
    });
  });
});
