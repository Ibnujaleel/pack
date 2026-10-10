/**
 * generateFixtures.js — Generates the 4 canonical fixture pairs for the packing engine.
 *
 * Runs the REAL engine to generate all response fixtures. Never hand-write responses.
 * Ensures stable key order, 2-space indent, and trailing newline.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packItems } from '../src/engine/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../src/engine/fixtures');

/**
 * Normalizes an object to have canonical key ordering for the protocol.
 *
 * @param {any} obj
 * @returns {any}
 */
function normalizeKeys(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(normalizeKeys);
    }
    return obj;
  }

  // Define canonical key order preferences
  const responseKeys = ['status', 'code', 'message', 'suitcase', 'items', 'unplacedItems', 'validation'];
  const itemKeys = ['id', 'type', 'dimensions', 'position', 'rotation', 'tier', 'animation', 'overrides'];
  const otherKeys = ['width', 'depth', 'height', 'withinBounds', 'noOverlaps', 'reason'];

  const order = [...responseKeys, ...itemKeys, ...otherKeys];

  const sortedObj = {};
  const allKeys = Object.keys(obj);

  // First add known keys in preferred order
  for (const k of order) {
    if (k in obj) {
      sortedObj[k] = normalizeKeys(obj[k]);
    }
  }

  // Then add any remaining keys alphabetically
  for (const k of allKeys.sort()) {
    if (!(k in sortedObj)) {
      sortedObj[k] = normalizeKeys(obj[k]);
    }
  }

  return sortedObj;
}

/**
 * Serializes data to JSON with stable key order, 2-space indent, and a trailing newline.
 *
 * @param {any} data
 * @returns {string}
 */
function serializeJson(data) {
  const normalized = normalizeKeys(data);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

const FIXTURES = [
  {
    name: 'one-sneaker',
    request: {
      items: [
        {
          id: 'sneakers-1',
          type: 'sneakers',
          overrides: {},
        },
      ],
    },
  },
  {
    name: 'sneakers-book-laptop',
    request: {
      items: [
        {
          id: 'sneakers-1',
          type: 'sneakers',
          overrides: {},
        },
        {
          id: 'hardcover-book-1',
          type: 'hardcover_book',
          overrides: {},
        },
        {
          id: 'laptop-1',
          type: 'laptop_15',
          overrides: {},
        },
      ],
    },
  },
  {
    name: 'partial-packing',
    request: {
      items: [
        {
          id: 'sneakers-1',
          type: 'sneakers',
          overrides: {},
        },
        {
          id: 'sneakers-2',
          type: 'sneakers',
          overrides: {},
        },
        {
          id: 'sneakers-3',
          type: 'sneakers',
          overrides: {},
        },
        {
          id: 'sneakers-4',
          type: 'sneakers',
          overrides: {},
        },
      ],
    },
  },
  {
    name: 'invalid-input',
    request: {
      items: [
        {
          id: 'banana-1',
          type: 'banana',
          overrides: {},
        },
      ],
    },
  },
];

export function generateFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  for (const fixture of FIXTURES) {
    const requestPath = path.join(FIXTURES_DIR, `${fixture.name}.request.json`);
    const responsePath = path.join(FIXTURES_DIR, `${fixture.name}.response.json`);

    const requestContent = serializeJson(fixture.request);
    fs.writeFileSync(requestPath, requestContent, 'utf8');

    // Generate response using the REAL engine
    const response = packItems(fixture.request);
    const responseContent = serializeJson(response);
    fs.writeFileSync(responsePath, responseContent, 'utf8');

    console.log(`Generated fixture pair: ${fixture.name}`);
  }
}

// Run when executed directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  generateFixtures();
}
