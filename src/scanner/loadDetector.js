/**
 * loadDetector.js — Lazy, cached COCO-SSD model loader using TensorFlow.js.
 *
 * Runs client-side in the browser. The model is loaded on-demand when the user
 * initiates a scan and cached for subsequent detections.
 */

let cachedModel = null;
let loadingPromise = null;

/**
 * Lazily loads the COCO-SSD object-detection model.
 * The model is cached — repeated calls return the same instance.
 *
 * @returns {Promise<any>}
 */
export async function loadDetector() {
  if (cachedModel) {
    return cachedModel;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      await import('@tensorflow/tfjs');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const model = await cocoSsd.load();
      cachedModel = model;
      return model;
    } catch (err) {
      loadingPromise = null;
      throw new Error(
        `Failed to load the COCO-SSD detection model: ${err.message}. ` +
        `Please check your browser connection and try again.`
      );
    }
  })();

  return loadingPromise;
}

/**
 * Reset cached detector instance (useful for unit testing or memory cleanup).
 */
export function _resetDetector() {
  cachedModel = null;
  loadingPromise = null;
}
