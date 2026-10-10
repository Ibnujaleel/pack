/**
 * buildRequest.js — Construct engine request payload from confirmed items.
 *
 * Contract (A8, A9):
 * Output must be exactly:
 *   { "items": [ { "id": "sneakers-1", "type": "sneakers", "overrides": {} } ] }
 *
 * No extra fields (no scores, bounding boxes, labels, names, tiers, weights).
 *
 * Instance IDs:
 *   "<type with underscores replaced by hyphens, trailing '_15' suffix removed>-<n>"
 *   e.g. sneakers-1, hardcover-book-1, rolled-tshirt-1, folded-denim-1, laptop-1, tsa-liquid-pouch-1.
 *   Counters are per type, starting at 1, unique within the request, and never based on array index.
 *
 * Items with no type selected are excluded from `items` and reported in a separate `skipped` list.
 * Empty list returns { "items": [] }.
 *
 * Pure functions: do not mutate inputs or catalog objects.
 */

/**
 * Format catalog type into the ID prefix:
 * Replaces underscores with hyphens and strips trailing '_15' style numeric suffix.
 *
 * @param {string} type - e.g. "laptop_15", "hardcover_book", "sneakers"
 * @returns {string} - e.g. "laptop", "hardcover-book", "sneakers"
 */
export function formatTypePrefix(type) {
  if (!type || typeof type !== 'string') return '';
  return type
    .replace(/_\d+$/, '')
    .replace(/_/g, '-');
}

/**
 * Generate an instance ID from a catalog type and sequence number.
 *
 * @param {string} type - catalog type ID
 * @param {number} n - sequence number (1-based)
 * @returns {string} - e.g. "laptop-1", "tsa-liquid-pouch-2"
 */
export function generateInstanceId(type, n) {
  const prefix = formatTypePrefix(type);
  return `${prefix}-${n}`;
}

/**
 * Stateful tracker for item IDs within a session/list.
 * Ensures counters are per type, starting at 1, unique, stable,
 * and never reused after removal within the same list.
 */
export class ItemIdTracker {
  constructor() {
    /** @type {Map<string, number>} */
    this.counters = new Map();
  }

  /**
   * Get the next instance ID for the given type and advance its counter.
   * @param {string} type
   * @returns {string}
   */
  nextId(type) {
    const prefix = formatTypePrefix(type);
    const current = this.counters.get(prefix) || 0;
    const next = current + 1;
    this.counters.set(prefix, next);
    return `${prefix}-${next}`;
  }

  /**
   * Register an existing ID so subsequent generated IDs do not collide.
   * @param {string} id
   */
  registerId(id) {
    if (!id || typeof id !== 'string') return;
    const match = id.match(/^(.*)-(\d+)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10);
      const current = this.counters.get(prefix) || 0;
      if (num > current) {
        this.counters.set(prefix, num);
      }
    }
  }

  /**
   * Reset all counters to 0.
   */
  reset() {
    this.counters.clear();
  }
}

/**
 * Extract the type from an item object (supports `type`, `selectedType`, or `suggestedType`).
 * Returns null if no type is selected.
 *
 * @param {any} item
 * @returns {string | null}
 */
export function getItemType(item) {
  if (!item || typeof item !== 'object') return null;
  const rawType = item.type ?? item.selectedType ?? item.suggestedType;
  if (!rawType || typeof rawType !== 'string' || rawType.trim() === '') {
    return null;
  }
  return rawType.trim();
}

/**
 * Check if an item has no catalog type selected.
 * @param {any} item
 * @returns {boolean}
 */
export function isSkippedItem(item) {
  return getItemType(item) === null;
}

/**
 * Extract items that were skipped due to lack of type selection.
 * @param {Array<any>} items
 * @returns {Array<any>}
 */
export function getSkippedItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items.filter(isSkippedItem);
}

/**
 * Build the exact packing engine request JSON structure.
 *
 * Output shape:
 * {
 *   "items": [
 *     { "id": "sneakers-1", "type": "sneakers", "overrides": {} }
 *   ]
 * }
 *
 * Excluded items are available via `result.skipped` (or `getSkippedItems(confirmedItems)`).
 * `skipped` is a non-enumerable property on the returned object so that `JSON.stringify(result)`
 * contains ONLY `"items"` with no extra fields, while still allowing callers and tests to inspect
 * `result.skipped`.
 *
 * @param {Array<any>} confirmedItems - list of review items
 * @param {ItemIdTracker} [customTracker] - optional tracker instance
 * @returns {{ items: Array<{ id: string, type: string, overrides: Record<string, any> }>, skipped: Array<any> }}
 */
export function buildRequest(confirmedItems = [], customTracker = null) {
  if (!Array.isArray(confirmedItems) || confirmedItems.length === 0) {
    const emptyResult = { items: [] };
    Object.defineProperty(emptyResult, 'skipped', {
      value: [],
      enumerable: false,
      writable: true,
      configurable: true,
    });
    return emptyResult;
  }

  const tracker = customTracker || new ItemIdTracker();
  const validItems = [];
  const skipped = [];

  // Register existing IDs to avoid duplicate counter collisions
  for (const item of confirmedItems) {
    if (item && typeof item === 'object' && item.id) {
      tracker.registerId(item.id);
    }
  }

  // Pure iteration — do not mutate input items
  for (const item of confirmedItems) {
    if (!item || typeof item !== 'object') {
      skipped.push(item);
      continue;
    }

    const type = getItemType(item);
    if (!type) {
      skipped.push(item);
      continue;
    }

    // Preserve existing valid ID if present, otherwise generate next stable ID
    const id = (item.id && typeof item.id === 'string' && item.id.trim() !== '')
      ? item.id.trim()
      : tracker.nextId(type);

    const overrides = (item.overrides && typeof item.overrides === 'object' && !Array.isArray(item.overrides))
      ? { ...item.overrides }
      : {};

    // Exact output shape: only id, type, overrides
    validItems.push({
      id,
      type,
      overrides,
    });
  }

  const result = {
    items: validItems,
  };

  Object.defineProperty(result, 'skipped', {
    value: skipped,
    enumerable: false,
    writable: true,
    configurable: true,
  });

  return result;
}
