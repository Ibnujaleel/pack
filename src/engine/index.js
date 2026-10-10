/**
 * index.js — Public entry point for the StowAway 3D Packing Engine.
 *
 * Contract (C2):
 * - Export packItems(request, deps = {})
 * - Pipeline: validateRequest -> getEffectiveProfile -> allocate (enforceTopLayer: true) -> validatePacking -> compileProtocol
 * - Invalid input: { status: "error", code: "INVALID_INPUT", message }
 * - Validation failure or unexpected exception: { status: "error", code: "INTERNAL_ERROR", message }
 * - Errors contain only status, code, message.
 * - Empty items: success with empty arrays and both flags true.
 * - Never mutates request or catalog.
 */

import defaultCatalog from '../data/items_catalog.json' with { type: 'json' };
import { validateRequest } from './validateRequest.js';
import { getEffectiveProfile } from './ruleEngine.js';
import { allocate } from './allocator.js';
import { validatePacking } from './validatePacking.js';
import { compileProtocol } from './protocolCompiler.js';

/**
 * Packs requested items into the suitcase using the deterministic heuristic engine.
 *
 * @param {object} request - The packing request containing { items: [...] }
 * @param {object} [deps={}] - Dependency injection options (e.g. custom catalog or validator for testing)
 * @returns {object} Canonical protocol success or error response
 */
export function packItems(request, deps = {}) {
  try {
    const catalog = deps.catalog || defaultCatalog;
    const validateRequestFn = deps.validateRequest || validateRequest;
    const getEffectiveProfileFn = deps.getEffectiveProfile || getEffectiveProfile;
    const allocateFn = deps.allocate || allocate;
    const validatePackingFn = deps.validatePacking || validatePacking;
    const compileProtocolFn = deps.compileProtocol || compileProtocol;

    // 1. Validate request against canonical catalog
    const valResult = validateRequestFn(request, catalog);
    if (!valResult.ok) {
      return {
        status: 'error',
        code: 'INVALID_INPUT',
        message: valResult.message,
      };
    }

    // 2. Handle empty items: success with empty arrays and both validation flags true
    if (valResult.items.length === 0) {
      return compileProtocolFn([], [], { withinBounds: true, noOverlaps: true });
    }

    // 3. Recompute effective profiles from catalog defaults plus validated overrides
    const catalogMap = new Map(catalog.map((entry) => [entry.type, entry]));
    const itemsWithProfiles = [];

    for (const item of valResult.items) {
      const catalogEntry = catalogMap.get(item.type);
      if (!catalogEntry) {
        return {
          status: 'error',
          code: 'INVALID_INPUT',
          message: `Unknown item type: "${item.type}".`,
        };
      }

      const profile = getEffectiveProfileFn(catalogEntry, item.overrides);
      itemsWithProfiles.push({
        id: item.id,
        type: item.type,
        profile,
      });
    }

    // 4. Deterministic greedy allocation with top-layer enforcement for tier 3
    const { placements, unplaced } = allocateFn(itemsWithProfiles, { enforceTopLayer: true });

    // 5. Independent validation of boundary constraints and mutual collisions
    const validation = validatePackingFn(placements);
    if (!validation || !validation.withinBounds || !validation.noOverlaps) {
      return {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Placement validation failed: placements violate suitcase bounds or mutual collision rules.',
      };
    }

    // 6. Compile protocol response
    return compileProtocolFn(placements, unplaced, validation);
  } catch (err) {
    return {
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: err?.message || 'An unexpected error occurred during packing.',
    };
  }
}
