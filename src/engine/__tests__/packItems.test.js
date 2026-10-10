import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packItems } from '../index.js';
import { inBounds, overlaps, centerToMin } from '../geometry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

describe('packItems core packing engine', () => {
  it('packs one sneaker with center [10,14,6], dimensions [20,28,12], tier 1, animation "heavy_thud"', () => {
    const request = {
      items: [{ id: 'sneakers-1', type: 'sneakers', overrides: {} }],
    };

    const response = packItems(request);

    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]).toEqual({
      id: 'sneakers-1',
      type: 'sneakers',
      dimensions: [20, 28, 12],
      position: [10, 14, 6],
      rotation: [0, 0, 0],
      tier: 1,
      animation: 'heavy_thud',
    });
    expect(response.unplacedItems).toEqual([]);
    expect(response.validation).toEqual({ withinBounds: true, noOverlaps: true });
  });

  it('packs sneakers + book + laptop with centers [10,14,6], [28,12,3], [17.5,40,1] and laptop tier 3 "gentle_glide"', () => {
    const request = {
      items: [
        { id: 'sneakers-1', type: 'sneakers', overrides: {} },
        { id: 'hardcover-book-1', type: 'hardcover_book', overrides: {} },
        { id: 'laptop-1', type: 'laptop_15', overrides: {} },
      ],
    };

    const response = packItems(request);

    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(3);
    expect(response.items.map((i) => i.position)).toEqual([
      [10, 14, 6],
      [28, 12, 3],
      [17.5, 40, 1],
    ]);

    const laptop = response.items.find((i) => i.id === 'laptop-1');
    expect(laptop).toBeDefined();
    expect(laptop.tier).toBe(3);
    expect(laptop.animation).toBe('gentle_glide');
    expect(laptop.rotation).toEqual([0, 0, 0]);
  });

  it('handles swapped orientation: dimensions reflect the swap and rotation is [0,0,0]', () => {
    // 3 sneakers: 3rd sneaker cannot fit in [20, 28, 12] at Y=28 but fits swapped [28, 20, 12]
    const request = {
      items: [
        { id: 'sneakers-1', type: 'sneakers', overrides: {} },
        { id: 'sneakers-2', type: 'sneakers', overrides: {} },
        { id: 'sneakers-3', type: 'sneakers', overrides: {} },
      ],
    };

    const response = packItems(request);

    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(3);

    const thirdSneaker = response.items[2];
    expect(thirdSneaker.id).toBe('sneakers-3');
    // Dimensions must reflect the swapped orientation [28, 20, 12] vs default [20, 28, 12]
    expect(thirdSneaker.dimensions).toEqual([28, 20, 12]);
    expect(thirdSneaker.position).toEqual([14, 38, 6]);
    expect(thirdSneaker.rotation).toEqual([0, 0, 0]);
  });

  it('handles partial packing: keeps valid items and lists unplacedItems with only id and reason', () => {
    // 4 sneakers: suitcase cannot accommodate a 4th sneaker
    const request = {
      items: [
        { id: 'sneakers-1', type: 'sneakers', overrides: {} },
        { id: 'sneakers-2', type: 'sneakers', overrides: {} },
        { id: 'sneakers-3', type: 'sneakers', overrides: {} },
        { id: 'sneakers-4', type: 'sneakers', overrides: {} },
      ],
    };

    const response = packItems(request);

    expect(response.status).toBe('success');
    expect(response.items).toHaveLength(3);
    expect(response.unplacedItems).toHaveLength(1);
    expect(response.unplacedItems[0]).toEqual({
      id: 'sneakers-4',
      reason: 'No valid candidate placement found',
    });

    // Ensure unplaced entries contain ONLY { id, reason }
    const unplacedKeys = Object.keys(response.unplacedItems[0]).sort();
    expect(unplacedKeys).toEqual(['id', 'reason']);
  });

  it('returns INVALID_INPUT with readable message for invalid input', () => {
    const invalidRequest = {
      items: [{ id: 'banana-1', type: 'banana', overrides: {} }],
    };

    const response = packItems(invalidRequest);

    expect(response.status).toBe('error');
    expect(response.code).toBe('INVALID_INPUT');
    expect(typeof response.message).toBe('string');
    expect(response.message).toContain('banana');

    // Error response must contain ONLY status, code, message
    const errorKeys = Object.keys(response).sort();
    expect(errorKeys).toEqual(['code', 'message', 'status']);
  });

  it('returns success with empty arrays and both validation flags true for empty request', () => {
    const response = packItems({ items: [] });

    expect(response).toEqual({
      status: 'success',
      suitcase: { width: 40, depth: 55, height: 20 },
      items: [],
      unplacedItems: [],
      validation: { withinBounds: true, noOverlaps: true },
    });
  });

  it('returns INTERNAL_ERROR with no items field when an injected validator fails', () => {
    const request = {
      items: [{ id: 'sneakers-1', type: 'sneakers', overrides: {} }],
    };

    const failingValidator = () => ({ withinBounds: false, noOverlaps: true });
    const response = packItems(request, { validatePacking: failingValidator });

    expect(response.status).toBe('error');
    expect(response.code).toBe('INTERNAL_ERROR');
    expect(typeof response.message).toBe('string');
    expect('items' in response).toBe(false);

    // Errors contain ONLY status, code, message
    const errorKeys = Object.keys(response).sort();
    expect(errorKeys).toEqual(['code', 'message', 'status']);
  });

  it('is deterministic across 3 repeated runs and never mutates the input request', () => {
    const originalRequest = {
      items: [
        { id: 'sneakers-1', type: 'sneakers', overrides: {} },
        { id: 'hardcover-book-1', type: 'hardcover_book', overrides: {} },
        { id: 'laptop-1', type: 'laptop_15', overrides: {} },
      ],
    };
    const clonedRequest = JSON.parse(JSON.stringify(originalRequest));

    const run1 = packItems(originalRequest);
    const run2 = packItems(originalRequest);
    const run3 = packItems(originalRequest);

    // Determinism: 3 runs are deep-equal
    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);

    // Request was not mutated
    expect(originalRequest).toEqual(clonedRequest);
  });

  it('ensures every placement in successful responses is strictly in bounds and has no overlaps', () => {
    const request = {
      items: [
        { id: 'sneakers-1', type: 'sneakers', overrides: {} },
        { id: 'sneakers-2', type: 'sneakers', overrides: {} },
        { id: 'sneakers-3', type: 'sneakers', overrides: {} },
        { id: 'hardcover-book-1', type: 'hardcover_book', overrides: {} },
        { id: 'laptop-1', type: 'laptop_15', overrides: {} },
      ],
    };

    const response = packItems(request);
    expect(response.status).toBe('success');
    expect(response.validation.withinBounds).toBe(true);
    expect(response.validation.noOverlaps).toBe(true);

    const suitcase = response.suitcase;

    // Direct geometric validation of center-converted positions
    for (let i = 0; i < response.items.length; i++) {
      const item = response.items[i];
      const min = centerToMin(item.position, item.dimensions);
      expect(inBounds(min, item.dimensions, suitcase)).toBe(true);

      for (let j = i + 1; j < response.items.length; j++) {
        const other = response.items[j];
        const otherMin = centerToMin(other.position, other.dimensions);
        expect(overlaps(min, item.dimensions, otherMin, other.dimensions)).toBe(false);
      }
    }
  });

  it('stored fixtures equal a fresh engine run across all 4 fixture pairs', () => {
    const fixtureNames = ['one-sneaker', 'sneakers-book-laptop', 'partial-packing', 'invalid-input'];

    for (const name of fixtureNames) {
      const requestPath = path.join(FIXTURES_DIR, `${name}.request.json`);
      const responsePath = path.join(FIXTURES_DIR, `${name}.response.json`);

      const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
      const expectedResponse = JSON.parse(fs.readFileSync(responsePath, 'utf8'));

      const freshResponse = packItems(request);
      expect(freshResponse).toEqual(expectedResponse);
    }
  });
});
