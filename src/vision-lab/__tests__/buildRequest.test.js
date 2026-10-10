import { describe, it, expect } from 'vitest';
import {
  buildRequest,
  formatTypePrefix,
  generateInstanceId,
  ItemIdTracker,
  getSkippedItems,
} from '../buildRequest.js';

describe('buildRequest', () => {
  describe('formatTypePrefix and generateInstanceId', () => {
    it('formats prefixes by removing trailing _15 suffix and converting underscores to hyphens', () => {
      expect(formatTypePrefix('laptop_15')).toBe('laptop');
      expect(formatTypePrefix('hardcover_book')).toBe('hardcover-book');
      expect(formatTypePrefix('rolled_tshirt')).toBe('rolled-tshirt');
      expect(formatTypePrefix('folded_denim')).toBe('folded-denim');
      expect(formatTypePrefix('sneakers')).toBe('sneakers');
      expect(formatTypePrefix('tsa_liquid_pouch')).toBe('tsa-liquid-pouch');
      expect(formatTypePrefix('cell_phone')).toBe('cell-phone');
      expect(formatTypePrefix('phone_charger')).toBe('phone-charger');
      expect(formatTypePrefix('charging_cable')).toBe('charging-cable');
    });

    it('generates instance IDs with type prefix and 1-based index', () => {
      expect(generateInstanceId('sneakers', 1)).toBe('sneakers-1');
      expect(generateInstanceId('laptop_15', 1)).toBe('laptop-1');
      expect(generateInstanceId('hardcover_book', 2)).toBe('hardcover-book-2');
      expect(generateInstanceId('tsa_liquid_pouch', 1)).toBe('tsa-liquid-pouch-1');
      expect(generateInstanceId('cell_phone', 1)).toBe('cell-phone-1');
      expect(generateInstanceId('phone_charger', 1)).toBe('phone-charger-1');
      expect(generateInstanceId('charging_cable', 1)).toBe('charging-cable-1');
    });
  });

  describe('ID generation: counters per type, unique, stable, no reuse after removal', () => {
    it('maintains separate counters per item type starting at 1', () => {
      const items = [
        { type: 'laptop_15' },
        { type: 'hardcover_book' },
        { type: 'laptop_15' },
        { type: 'sneakers' },
        { type: 'sneakers' },
      ];

      const result = buildRequest(items);
      expect(result.items.map((i) => i.id)).toEqual([
        'laptop-1',
        'hardcover-book-1',
        'laptop-2',
        'sneakers-1',
        'sneakers-2',
      ]);
    });

    it('ensures all generated IDs within a request are unique', () => {
      const items = [
        { type: 'sneakers' },
        { type: 'sneakers' },
        { type: 'sneakers' },
        { type: 'folded_denim' },
        { type: 'folded_denim' },
      ];

      const result = buildRequest(items);
      const ids = result.items.map((i) => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ItemIdTracker ensures stability and no reuse after removal within the same list', () => {
      const tracker = new ItemIdTracker();

      // User adds laptop
      const id1 = tracker.nextId('laptop_15');
      expect(id1).toBe('laptop-1');

      // User adds second laptop
      const id2 = tracker.nextId('laptop_15');
      expect(id2).toBe('laptop-2');

      // User adds third laptop
      const id3 = tracker.nextId('laptop_15');
      expect(id3).toBe('laptop-3');

      // User simulates removing item 1 ("laptop-1") and item 2 ("laptop-2")
      // Remaining item in list: item 3 with ID "laptop-3"
      // User adds a NEW laptop to the list:
      const id4 = tracker.nextId('laptop_15');
      // Must NOT reuse laptop-1 or laptop-2! Must be laptop-4!
      expect(id4).toBe('laptop-4');

      // And existing item retains its stable ID
      expect(id3).toBe('laptop-3');
    });

    it('buildRequest respects pre-existing assigned IDs and does not renumber based on array index', () => {
      // Simulate user removing laptop-1 and keeping laptop-2
      const items = [
        { id: 'laptop-2', type: 'laptop_15' },
      ];

      const result = buildRequest(items);
      expect(result.items[0].id).toBe('laptop-2');
      // Array index is 0, but ID is NOT laptop-1
      expect(result.items[0].id).not.toBe('laptop-1');
    });
  });

  describe('buildRequest output shape and skipped items', () => {
    it('returns exact shape: only id, type, overrides per item', () => {
      const confirmed = [
        {
          id: 'sneakers-1',
          type: 'sneakers',
          score: 0.95,
          bbox: [1, 2, 3, 4],
          name: 'Sneakers',
          tier: 1,
          weight: 0.85,
          detectedClass: 'sneakers',
        },
      ];

      const result = buildRequest(confirmed);

      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(1);

      const item = result.items[0];
      expect(item).toEqual({
        id: 'sneakers-1',
        type: 'sneakers',
        overrides: {},
      });

      // Assert NO extra fields appear in the item
      const itemKeys = Object.keys(item);
      expect(itemKeys.sort()).toEqual(['id', 'overrides', 'type'].sort());

      // Assert JSON serialization contains ONLY items
      const json = JSON.parse(JSON.stringify(result));
      expect(json).toEqual({
        items: [
          {
            id: 'sneakers-1',
            type: 'sneakers',
            overrides: {},
          },
        ],
      });
      expect(Object.keys(json)).toEqual(['items']);
    });

    it('returns { items: [] } for empty list or null', () => {
      expect(buildRequest([])).toEqual({ items: [] });
      expect(buildRequest(null)).toEqual({ items: [] });
      expect(buildRequest(undefined)).toEqual({ items: [] });
    });

    it('excludes items with no type selected and reports them in skipped', () => {
      const items = [
        { type: 'laptop_15' },
        { type: null, detectedClass: 'bottle', score: 0.72 },
        { type: '', detectedClass: 'cup', score: 0.65 },
        { type: 'hardcover_book' },
        { detectedClass: 'unknown' }, // no type property
      ];

      const result = buildRequest(items);

      // Only valid typed items are included
      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.type)).toEqual(['laptop_15', 'hardcover_book']);

      // Skipped items are reported
      expect(result.skipped).toHaveLength(3);
      expect(result.skipped[0].detectedClass).toBe('bottle');
      expect(result.skipped[1].detectedClass).toBe('cup');
      expect(result.skipped[2].detectedClass).toBe('unknown');

      // Helper function getSkippedItems also matches
      const skippedFromHelper = getSkippedItems(items);
      expect(skippedFromHelper).toHaveLength(3);
    });

    it('preserves user overrides if provided', () => {
      const items = [
        {
          type: 'rolled_tshirt',
          overrides: { elasticity: 0.8 },
        },
      ];

      const result = buildRequest(items);
      expect(result.items[0].overrides).toEqual({ elasticity: 0.8 });
    });
  });

  describe('immutability', () => {
    it('does NOT mutate confirmedItems or items inside it', () => {
      const items = [
        { type: 'laptop_15', overrides: { note: 'test' } },
        { type: null, detectedClass: 'bottle' },
      ];
      const itemsCopy = JSON.parse(JSON.stringify(items));

      buildRequest(items);

      expect(items).toEqual(itemsCopy);
    });
  });
});
