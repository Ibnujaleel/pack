/**
 * normalizeDetections.js — Convert raw COCO-SSD detections into catalog-based suggestions.
 *
 * Contract (A9): Never infer actual dimensions or weight from image pixels.
 * Vision outputs item suggestions; the user can correct, remove, or add items.
 *
 * Pure functions only. Does not mutate inputs.
 */

import { lookupClass } from './classMap.js';

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
 * Each suggestion has:
 *   - suggestionId: unique string identifier
 *   - detectedClass: original COCO-SSD class name
 *   - score: detection confidence (0–1)
 *   - bbox: [x, y, width, height] in pixels
 *   - suggestedType: catalog type ID or null if no mapping
 *   - matchConfidence: "high" | "low" | "none"
 *
 * @param {Array<{ class: string, score: number, bbox: number[] }>} rawDetections
 * @returns {Array<{
 *   suggestionId: string,
 *   detectedClass: string,
 *   score: number,
 *   bbox: number[],
 *   suggestedType: string | null,
 *   matchConfidence: "high" | "low" | "none"
 * }>}
 */
export function normalizeDetections(rawDetections) {
  if (!rawDetections || rawDetections.length === 0) {
    return [];
  }

  const merged = mergeDuplicates(rawDetections);

  return merged.map((det) => {
    const mapping = lookupClass(det.class);

    return {
      suggestionId: `suggestion-${nextSuggestionId++}`,
      detectedClass: det.class,
      score: det.score,
      bbox: [...det.bbox], // shallow copy to avoid mutating input
      suggestedType: mapping ? mapping.catalogType : null,
      matchConfidence: mapping ? mapping.matchConfidence : 'none',
    };
  });
}

/**
 * Reset the suggestion ID counter. For testing only.
 */
export function _resetSuggestionIdCounter() {
  nextSuggestionId = 1;
}
