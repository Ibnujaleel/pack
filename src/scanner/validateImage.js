/**
 * validateImage.js — Validates uploaded or captured image files before processing.
 */

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates file format and file size.
 *
 * @param {File | Blob} file
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No image file provided.' };
  }

  // Check MIME type if available
  if (file.type && !SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type}). Please select a JPG, PNG, or WebP photo.`,
    };
  }

  // Check file size
  if (file.size && file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image file is too large (${sizeMb} MB). Maximum supported size is 10 MB.`,
    };
  }

  return { valid: true, error: null };
}
