import { describe, it, expect } from 'vitest';
import { validateRequest } from '../validateRequest.js';
import catalog from '../../data/items_catalog.json';

describe('validateRequest', () => {
  it('rejects when request is not a plain object', () => {
    expect(validateRequest(null, catalog)).toEqual({
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Request must be a plain object.',
    });

    expect(validateRequest('not an object', catalog)).toEqual({
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Request must be a plain object.',
    });

    expect(validateRequest([1, 2, 3], catalog)).toEqual({
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Request must be a plain object.',
    });
  });

  it('rejects when request.items is not an array', () => {
    expect(validateRequest({ items: null }, catalog)).toEqual({
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Request property "items" must be an array.',
    });

    expect(validateRequest({ items: {} }, catalog)).toEqual({
      ok: false,
      code: 'INVALID_INPUT',
      message: 'Request property "items" must be an array.',
    });
  });

  it('accepts an empty items array per contract A8', () => {
    const res = validateRequest({ items: [] }, catalog);
    expect(res).toEqual({ ok: true, items: [] });
  });

  it('rejects an item that is not a plain object', () => {
    const res = validateRequest({ items: ['sneakers'] }, catalog);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_INPUT');
    expect(res.message).toContain('Item at index 0 must be a plain object');
  });

  it('rejects an item with missing, empty, or whitespace-only id', () => {
    const res1 = validateRequest({ items: [{ type: 'sneakers' }] }, catalog);
    expect(res1.ok).toBe(false);
    expect(res1.code).toBe('INVALID_INPUT');
    expect(res1.message).toContain('invalid "id"');

    const res2 = validateRequest({ items: [{ id: '', type: 'sneakers' }] }, catalog);
    expect(res2.ok).toBe(false);
    expect(res2.code).toBe('INVALID_INPUT');
    expect(res2.message).toContain('invalid "id"');

    const res3 = validateRequest({ items: [{ id: '   ', type: 'sneakers' }] }, catalog);
    expect(res3.ok).toBe(false);
    expect(res3.code).toBe('INVALID_INPUT');
    expect(res3.message).toContain('invalid "id"');
  });

  it('rejects duplicate item IDs across the request', () => {
    const request = {
      items: [
        { id: 'sneakers-1', type: 'sneakers' },
        { id: 'sneakers-1', type: 'sneakers' },
      ],
    };
    const res = validateRequest(request, catalog);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_INPUT');
    expect(res.message).toContain('Duplicate item id "sneakers-1"');
  });

  it('rejects items with types not found in the catalog', () => {
    const res = validateRequest(
      { items: [{ id: 'item-1', type: 'guitar' }] },
      catalog
    );
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_INPUT');
    expect(res.message).toContain('unknown type "guitar"');
  });

  it('rejects items where overrides is not a plain object', () => {
    const res = validateRequest(
      { items: [{ id: 'item-1', type: 'sneakers', overrides: [1, 2] }] },
      catalog
    );
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_INPUT');
    expect(res.message).toContain('overrides" must be a plain object');
  });

  it('rejects unknown override keys (allowed: height, weight)', () => {
    const res = validateRequest(
      { items: [{ id: 'item-1', type: 'sneakers', overrides: { depth: 10 } }] },
      catalog
    );
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INVALID_INPUT');
    expect(res.message).toContain('unknown override key "depth"');
  });

  it('rejects non-positive or non-finite overrides.height', () => {
    const testCases = [0, -5, NaN, Infinity, -Infinity, '10'];
    for (const invalidHeight of testCases) {
      const res = validateRequest(
        { items: [{ id: 'item-1', type: 'folded_denim', overrides: { height: invalidHeight } }] },
        catalog
      );
      expect(res.ok).toBe(false);
      expect(res.code).toBe('INVALID_INPUT');
      expect(res.message).toContain('override "height" must be a finite number > 0');
    }
  });

  it('rejects negative or non-finite overrides.weight', () => {
    const testCases = [-0.1, -10, NaN, Infinity, -Infinity, '0.5'];
    for (const invalidWeight of testCases) {
      const res = validateRequest(
        { items: [{ id: 'item-1', type: 'folded_denim', overrides: { weight: invalidWeight } }] },
        catalog
      );
      expect(res.ok).toBe(false);
      expect(res.code).toBe('INVALID_INPUT');
      expect(res.message).toContain('override "weight" must be a finite number >= 0');
    }
  });

  it('accepts valid overrides including weight 0', () => {
    const res = validateRequest(
      {
        items: [
          {
            id: 'denim-1',
            type: 'folded_denim',
            overrides: { height: 12.5, weight: 0 },
          },
        ],
      },
      catalog
    );
    expect(res.ok).toBe(true);
    expect(res.items[0].overrides).toEqual({ height: 12.5, weight: 0 });
  });

  it('sets omitted overrides to {}', () => {
    const res = validateRequest(
      {
        items: [{ id: 'sneakers-1', type: 'sneakers' }],
      },
      catalog
    );
    expect(res.ok).toBe(true);
    expect(res.items[0].overrides).toEqual({});
  });

  it('does NOT mutate the input request or catalog', () => {
    const originalRequest = {
      items: [
        { id: 'sneakers-1', type: 'sneakers', overrides: { height: 14 } },
      ],
    };
    const reqCopy = JSON.parse(JSON.stringify(originalRequest));
    const catCopy = JSON.parse(JSON.stringify(catalog));

    const res = validateRequest(originalRequest, catalog);
    expect(res.ok).toBe(true);

    expect(originalRequest).toEqual(reqCopy);
    expect(catalog).toEqual(catCopy);
  });
});
