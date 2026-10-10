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

/**
 * Checks if a value is a non-null plain object (not an array).
 * @param {any} val
 * @returns {boolean}
 */
function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Validate an incoming packing request against the canonical catalog.
 *
 * @param {any} request - The packing request object
 * @param {Array<{ type: string }> | Record<string, any>} catalog - Canonical catalog entries
 * @returns {{ ok: true, items: Array<{ id: string, type: string, overrides: Record<string, number> }> }
 *         | { ok: false, code: "INVALID_INPUT", message: string }}
 */
export function validateRequest(request, catalog) {
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

    // Validate Type
    if (typeof item.type !== 'string' || !knownTypes.has(item.type)) {
      return {
        ok: false,
        code: 'INVALID_INPUT',
        message: `Item "${trimmedId}" at index ${i} has unknown type "${item.type}". Must be a valid catalog type.`,
      };
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

    cleanedItems.push({
      id: trimmedId,
      type: item.type,
      overrides: cleanedOverrides,
    });
  }

  return {
    ok: true,
    items: cleanedItems,
  };
}
