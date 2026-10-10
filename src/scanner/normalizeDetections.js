/**
 * normalizeDetections.js — Convert raw COCO-SSD detections into catalog-based suggestions.
 *
 * Contract:
 * - Deduplicates bounding boxes for the same class with IoU > 0.6.
 * - Filters out background IGNORED_CLASSES into an `ignored` list.
 * - Maps supported classes to catalog type IDs.
 * - Demotes detections with score < LOW_SCORE_THRESHOLD (0.5) to `matchConfidence: "low"`.
 * - Unmapped classes get `suggestedType: null, matchConfidence: "none"`.
 */

import { lookupClass, isIgnoredClass } from './classMap.js';
import { LOW_SCORE_THRESHOLD } from './detectItems.js';

/** IoU threshold above which two same-class boxes are considered duplicates. */
export const IOU_MERGE_THRESHOLD = 0.6;

let nextSuggestionId = 1;

/**
 * Compute Intersection-over-Union for two bounding boxes in [x, y, w, h] format.
 * @param {number[]} a — [x, y, width, height]
 * @param {number[]} b — [x, y, width, height]
 * @returns {number} IoU in [0, 1]
 */
export function computeIoU(a, b) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;

  const interX = Math.max(ax, bx);
  const interY = Math.max(ay, by);
  const interR = Math.min(ax + aw, bx + bw);
  const interB = Math.min(ay + ah, by + bh);

  const interW = Math.max(0, interR - interX);
  const interH = Math.max(0, interB - interY);
  const interArea = interW * interH;

  const aArea = aw * ah;
  const bArea = bw * bh;
  const unionArea = aArea + bArea - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Remove duplicate detections: same class with bbox IoU > IOU_MERGE_THRESHOLD
 * keeps only the higher-scoring detection.
 *
 * @param {Array<{ class: string, score: number, bbox: number[] }>} detections
 * @returns {Array<{ class: string, score: number, bbox: number[] }>}
 */
export function mergeDuplicates(detections) {
  if (!Array.isArray(detections) || detections.length === 0) {
    return [];
  }

  const kept = [];

  for (const det of detections) {
    let isDuplicate = false;

    for (let i = 0; i < kept.length; i++) {
      if (kept[i].class === det.class) {
        const iou = computeIoU(kept[i].bbox, det.bbox);
        if (iou > IOU_MERGE_THRESHOLD) {
          // Keep the higher score
          if (det.score > kept[i].score) {
            kept[i] = det;
          }
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      kept.push(det);
    }
  }

  return kept;
}

/**
 * Normalize raw COCO-SSD detections into catalog-based suggestions.
 *
 * @param {Array<{ class: string, score: number, bbox: number[] }>} rawDetections
 * @returns {Array<{
 *   suggestionId: string,
 *   detectedClass: string,
 *   score: number,
 *   bbox: number[],
 *   suggestedType: string | null,
 *   matchConfidence: "high" | "low" | "none"
 * }> & { ignored: Array<{ detectedClass: string, score: number, bbox: number[] }> }}
 */
export function normalizeDetections(rawDetections) {
  if (!rawDetections || rawDetections.length === 0) {
    const emptyResult = [];
    Object.defineProperty(emptyResult, 'ignored', {
      value: [],
      enumerable: false,
      writable: true,
      configurable: true,
    });
    return emptyResult;
  }

  const merged = mergeDuplicates(rawDetections);
  const keptDetections = [];
  const ignoredDetections = [];

  for (const det of merged) {
    if (isIgnoredClass(det.class)) {
      ignoredDetections.push({
        detectedClass: det.class,
        score: det.score,
        bbox: [...det.bbox],
      });
    } else {
      keptDetections.push(det);
    }
  }

  const suggestions = keptDetections.map((det) => {
    const mapping = lookupClass(det.class);

    let matchConfidence = 'none';
    if (mapping) {
      matchConfidence = det.score < LOW_SCORE_THRESHOLD ? 'low' : mapping.matchConfidence;
    }

    return {
      suggestionId: `suggestion-${nextSuggestionId++}`,
      detectedClass: det.class,
      score: det.score,
      bbox: [...det.bbox],
      suggestedType: mapping ? mapping.catalogType : null,
      matchConfidence,
    };
  });

  Object.defineProperty(suggestions, 'ignored', {
    value: ignoredDetections,
    enumerable: false,
    writable: true,
    configurable: true,
  });

  return suggestions;
}

/**
 * Reset suggestion ID counter (for tests).
 */
export function _resetSuggestionIdCounter() {
  nextSuggestionId = 1;
}
