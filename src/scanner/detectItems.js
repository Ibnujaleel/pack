/**
 * detectItems.js — Run COCO-SSD detection on an image element.
 */

import { loadDetector } from './loadDetector.js';

/** Minimum confidence score to keep a detection (0–1). */
export const MIN_CONFIDENCE = 0.35;

/** Threshold below which a detection is flagged as low confidence. */
export const LOW_SCORE_THRESHOLD = 0.5;

/**
 * Run object detection on an image/canvas/video element.
 *
 * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement} imageElement
 * @returns {Promise<Array<{ class: string, score: number, bbox: [number, number, number, number] }>>}
 */
export async function detectItems(imageElement) {
  if (!imageElement) {
    throw new Error('detectItems: imageElement is required.');
  }

  const model = await loadDetector();
  const predictions = await model.detect(imageElement);

  // Filter by confidence threshold (>= 0.35) and normalize the shape
  return (predictions || [])
    .filter((p) => p.score >= MIN_CONFIDENCE)
    .map((p) => ({
      class: p.class,
      score: p.score,
      bbox: p.bbox,
    }));
}
