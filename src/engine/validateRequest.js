/**
 * validateRequest.js — Pure request validation for the StowAway packing engine.
 *
 * Contract (A8):
 * - Validates input: known item type, unique non-empty instance ID,
 *   valid override ranges. Malformed input returns { ok: false, code: "INVALID_INPUT", message }.
 * - Empty items array returns { ok: true, items: [] }.
 * - Pure function: never mutates input request or catalog.
 */

/** Allowed override keys per contract */
const ALLOWED_OVERRIDE_KEYS = new Set(['height', 'weight']);

const DEFAULT_CATEGORIES = new Set(['hard', 'soft', 'fragile', 'liquid']);

/**
 * Checks if a value is a non-null plain object (not an array).
 * @param {any} val
 * @returns {boolean}
 */
function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Validate an incoming packing request against the canonical catalog and categories.
 *
 * @param {any} request - The packing request object
 * @param {Array<{ type: string }> | Record<string, any>} catalog - Canonical catalog entries
 * @param {Array<any> | Record<string, any>} [categories] - Optional custom categories definition
 * @returns {{ ok: true, items: Array<{ id: string, type: string, custom?: object, overrides: Record<string, number> }> }
 *         | { ok: false, code: "INVALID_INPUT", message: string }}
 */
export function validateRequest(request, catalog, categories) {
  if (!isPlainObject(request)) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Request must be a plain object.',
    };
  }

  if (!Array.isArray(request.items)) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Request property "items" must be an array.',
    };
  }

  // Build a lookup set of known catalog type IDs
  const knownTypes = new Set(
    Array.isArray(catalog)
      ? catalog.map((c) => c && c.type).filter(Boolean)
      : Object.keys(catalog || {})
  );

  const validCategories = categories
    ? new Set(
        Array.isArray(categories)
          ? categories.map((c) => c.category || c.name || c.type).filter(Boolean)
          : Object.keys(categories)
      )
    : DEFAULT_CATEGORIES;

  const cleanedItems = [];
  const seenIds = new Set();

  for (let i = 0; i < request.items.length; i++) {
    const item = request.items[i];

    if (!isPlainObject(item)) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        message: `Item at index ${i} must be a plain object.`,
      };
    }

    // Validate ID
    if (typeof item.id !== 'string' || item.id.trim() === '') {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        message: `Item at index ${i} has an invalid "id": must be a non-empty string.`,
      };
    }

    const trimmedId = item.id.trim();
    if (seenIds.has(trimmedId)) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        message: `Duplicate item id "${trimmedId}" found at index ${i}.`,
      };
    }
    seenIds.add(trimmedId);

    // Validate Type & Custom definition
    let cleanedCustom = null;
    if (item.type === 'custom') {
      if (!isPlainObject(item.custom)) {
        return {
          ok: false,
          code: 'INVALID_INPUT',
          message: `Item "${trimmedId}" of type "custom" must have a "custom" plain object.`,
        };
      }

      // Name must be a non-empty string up to 40 characters
      if (
        typeof item.custom.name !== 'string' ||
        item.custom.name.trim() === '' ||
        item.custom.name.length > 40
      ) {
        return {
          ok: false,
          code: 'INVALID_INPUT',
          message: `Item "${trimmedId}" custom property "name" must be a non-empty string up to 40 characters.`,
        };
      }

      // Category must be one of the four
      if (
        typeof item.custom.category !== 'string' ||
        !validCategories.has(item.custom.category)
      ) {
        return {
          ok: false,
          code: 'INVALID_INPUT',
          message: `Item "${trimmedId}" has invalid category "${item.custom.category}". Must be one of: hard, soft, fragile, liquid.`,
        };
      }

      cleanedCustom = {
        name: item.custom.name,
        category: item.custom.category,
      };

      // Dimensions must be 3 finite positive numbers if provided
      if (item.custom.dimensions !== undefined) {
        if (
          !Array.isArray(item.custom.dimensions) ||
          item.custom.dimensions.length !== 3 ||
          !item.custom.dimensions.every(
            (d) => typeof d === 'number' && Number.isFinite(d) && d > 0
          )
        ) {
          return {
            ok: false,
            code: 'INVALID_INPUT',
            message: `Item "${trimmedId}" custom property "dimensions" must be an array of 3 finite positive numbers.`,
          };
        }
        cleanedCustom.dimensions = [...item.custom.dimensions];
      }

      // Weight must be finite and >= 0 if provided
      if (item.custom.weight !== undefined) {
        if (
          typeof item.custom.weight !== 'number' ||
          !Number.isFinite(item.custom.weight) ||
          item.custom.weight < 0
        ) {
          return {
            ok: false,
            code: 'INVALID_INPUT',
            message: `Item "${trimmedId}" custom property "weight" must be a finite number >= 0.`,
          };
        }
        cleanedCustom.weight = item.custom.weight;
      }
    } else {
      if (typeof item.type !== 'string' || !knownTypes.has(item.type)) {
        return {
          ok: false,
          code: 'INVALID_INPUT',
          message: `Item "${trimmedId}" at index ${i} has unknown type "${item.type}". Must be a valid catalog type.`,
        };
      }
    }

    // Validate Overrides
    let cleanedOverrides = {};
    if (item.overrides !== undefined) {
      if (!isPlainObject(item.overrides)) {
        return {
          ok: false,
          code: 'INVALID_INPUT',
          message: `Item "${trimmedId}" property "overrides" must be a plain object.`,
        };
      }

      for (const [key, val] of Object.entries(item.overrides)) {
        if (!ALLOWED_OVERRIDE_KEYS.has(key)) {
          return {
            ok: false,
            code: 'INVALID_INPUT',
            message: `Item "${trimmedId}" has unknown override key "${key}". Allowed overrides: height, weight.`,
          };
        }

        if (key === 'height') {
          if (typeof val !== 'number' || !Number.isFinite(val) || val <= 0) {
            return {
              ok: false,
              code: 'INVALID_INPUT',
              message: `Item "${trimmedId}" override "height" must be a finite number > 0, received ${val}.`,
            };
          }
          cleanedOverrides.height = val;
        }

        if (key === 'weight') {
          if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
            return {
              ok: false,
              code: 'INVALID_INPUT',
              message: `Item "${trimmedId}" override "weight" must be a finite number >= 0, received ${val}.`,
            };
          }
          cleanedOverrides.weight = val;
        }
      }
    }

    const cleanedItem = {
      id: trimmedId,
      type: item.type,
      overrides: cleanedOverrides,
    };
    if (cleanedCustom) {
      cleanedItem.custom = cleanedCustom;
    }

    cleanedItems.push(cleanedItem);
  }

  return {
    ok: true,
    items: cleanedItems,
  };
}
