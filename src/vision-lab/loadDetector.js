/**
 * loadDetector.js — Lazy, cached COCO-SSD model loader.
 *
 * Contract (A9): Load browser-based TensorFlow.js with COCO-SSD.
 * The model is loaded lazily (only when called, never at app start).
 * Repeated calls reuse the cached instance.
 */

let cachedModel = null;
let loadingPromise = null;

/**
 * Lazily loads the COCO-SSD object-detection model.
 * The model is cached — repeated calls return the same instance.
 * If loading fails, throws a descriptive error (does not crash the page).
 *
 * @returns {Promise<import('@tensorflow-models/coco-ssd').ObjectDetection>}
 */
export async function loadDetector() {
  // Return cached model immediately if already loaded
  if (cachedModel) {
    return cachedModel;
  }

  // If a load is already in progress, wait for it rather than starting a second one
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // Dynamic imports ensure tfjs + coco-ssd are only fetched when needed
      await import('@tensorflow/tfjs');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const model = await cocoSsd.load();
      cachedModel = model;
      return model;
    } catch (err) {
      // Reset so a future call can retry
      loadingPromise = null;
      throw new Error(
        `Failed to load the COCO-SSD detection model. ` +
        `Check your network connection and try again.\n` +
        `Original error: ${err.message}`
      );
    }
  })();

  return loadingPromise;
}
