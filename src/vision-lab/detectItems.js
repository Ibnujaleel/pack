/**
 * detectItems.js — Run COCO-SSD detection on an image element.
 *
 * Contract (A9): Do not infer actual dimensions or weight from image pixels.
 * Vision outputs item suggestions only.
 */

import { loadDetector } from './loadDetector.js';

/** Minimum confidence score to keep a detection (0–1). */
export const MIN_CONFIDENCE = 0.35;

/** Threshold below which a detection is flagged as low confidence. */
export const LOW_SCORE_THRESHOLD = 0.5;

/**
 * Run object detection on an image/video/canvas element.
 *
 * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement} imageElement
 * @returns {Promise<Array<{ class: string, score: number, bbox: [number, number, number, number] }>>}
 *   Each bbox is [x, y, width, height] in pixels (image-coordinate space).
 *   These are raw COCO-SSD class names — no catalog matching is performed here.
 */
export async function detectItems(imageElement) {
  if (!imageElement) {
    throw new Error('detectItems: imageElement is required.');
  }

  const model = await loadDetector();
  const predictions = await model.detect(imageElement);

  // Filter by confidence threshold (>= 0.35) and normalize the shape
  return predictions
    .filter((p) => p.score >= MIN_CONFIDENCE)
    .map((p) => ({
      class: p.class,
      score: p.score,
      // COCO-SSD bbox format is already [x, y, width, height]
      bbox: p.bbox,
    }));
}
