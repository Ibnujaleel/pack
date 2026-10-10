# StowAway 3D — Packing Engine API Handoff

Contract version: v3.1 | Module: `src/engine/index.js` | Handoff to Afsal

---

## 1. Public Signature

```javascript
import { packItems } from './src/engine/index.js';

const response = packItems(request, deps = {});
```

- **`request`** (`object`): Request payload containing `{ items: [...] }`.
- **`deps`** (`object`, optional): Test injection options (e.g. custom validator or catalog).
- **Return value**: Always returns a response object with either `status: "success"` or `status: "error"`. Pure function; never mutates `request` or the catalog.

---

## 2. Request Schema & Defaults

```json
{
  "items": [
    {
      "id": "sneakers-1",
      "type": "sneakers",
      "overrides": {
        "height": 14,
        "weight": 0.90
      }
    }
  ]
}
```

- **`items`** (`Array<object>`): List of items to pack. An empty `items: []` array returns success with empty arrays.
- **`id`** (`string`, required): Unique, non-empty instance identifier (e.g. `sneakers-1`, `laptop-1`).
- **`type`** (`string`, required): Must exist in `src/data/items_catalog.json`. Unknown types return `INVALID_INPUT`.
- **`overrides`** (`object`, optional): User-modified properties.
  - `height`: Effective thickness/height in cm. If omitted, defaults to catalog dimensions[2].
  - `weight`: Effective weight in kg. If omitted, defaults to catalog weight.

---

## 3. Coordinates, Units & Orientations

- **Suitcase Internal Dimensions:** `40 W × 55 D × 20 H cm`.
- **Axes:** X = Width (0–40 cm), Y = Depth (0–55 cm), Z = Height (0–20 cm).
- **Position:** Bounding-box **center** `[x, y, z]` in centimetres.
- **Three.js Conversion:** Divide `position` and `dimensions` by 100 when passing to the 3D scene (Three.js uses metres).
- **Dimensions & Rotation:** `dimensions` are pre-oriented/swapped `[W, D, H]` in cm. `rotation` is always `[0, 0, 0]`. Do NOT rotate items a second time in Three.js.

---

## 4. Allocation Rules & Top-Layer Amendment (A7)

1. **Profile Derivation:** Recomputed per run via `ruleEngine.js` (fragile/liquid -> Tier 3; height >= 15 -> Tier 1; weight > 1.2 -> Tier 1; width >= 30 and Tier 2 -> Tier 1).
2. **Deterministic Sort:**
   - Ascending `tier` (Tier 1 heavy bases first, then Tier 2, then Tier 3).
   - Descending footprint area (`width × depth`).
   - Ascending lexical `id` (`a < b ? -1 : a > b ? 1 : 0`).
3. **Candidate Points:** Origin `[0,0,0]`, plus `[x+w, y, z]`, `[x, y+d, z]`, and `[x, y, z+h]` adjacent to placed items. Sorted Z asc, Y asc, X asc.
4. **Orientation Preference:** Original `[W, D, H]` tested before swapped `[D, W, H]`.
5. **Support Check Rule (`MIN_SUPPORT_RATIO = 0.7`):**
   - A placement on the suitcase floor (`min Z = 0`) is always supported (100%).
   - A placement at `min Z > 0` is valid only if at least 70% of its footprint area lies on top faces of already placed items whose `max Z` equals the placement's `min Z`.
   - Controlled via options `enforceSupport` (default `true`) and `supportRatio` (default `0.7`).
6. **Top-Layer Rule & Rule 6 Candidate Points (Tier 3 Fragile/Electronics):**
   - For Tier 3 items with `enforceTopLayer`, candidate points include the top-left corner of each placed Tier 1 and 2 item at `Z = that item's max Z` (Rule 6), plus points raised to `layerTop`.
   - If no supported top-layer space exists and `enforceSupport` is enabled, supported floor spots (`min Z = 0`) are evaluated.
   - If unable to place, reported in `unplacedItems` with reason `"No supported space in top layer"` (or `"No space in top layer"` when `enforceSupport` is false).

---

## 5. Error Codes

| Code | Trigger | Response Format |
|---|---|---|
| `INVALID_INPUT` | Malformed request, unknown item type, duplicate IDs, invalid override values | `{ status: "error", code: "INVALID_INPUT", message: string }` |
| `CAPACITY_EXCEEDED` | Reserved for fatal capacity abort conditions (individual unplaced items go to `unplacedItems` instead) | `{ status: "error", code: "CAPACITY_EXCEEDED", message: string }` |
| `INTERNAL_ERROR` | Validation failure (bounds violation or mutual collision) or unexpected exception | `{ status: "error", code: "INTERNAL_ERROR", message: string }` |

*Note: Error responses strictly contain only `status`, `code`, and `message`.*

---

## 6. Examples (From Canonical Fixtures)

### Success (One Item — `one-sneaker`)
```json
{
  "status": "success",
  "suitcase": {
    "width": 40,
    "depth": 55,
    "height": 20
  },
  "items": [
    {
      "id": "sneakers-1",
      "type": "sneakers",
      "dimensions": [
        20,
        28,
        12
      ],
      "position": [
        10,
        14,
        6
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "tier": 1,
      "animation": "heavy_thud"
    }
  ],
  "unplacedItems": [],
  "validation": {
    "withinBounds": true,
    "noOverlaps": true
  }
}
```

### Success (Multiple Items — `sneakers-book-laptop`)
```json
{
  "status": "success",
  "suitcase": {
    "width": 40,
    "depth": 55,
    "height": 20
  },
  "items": [
    {
      "id": "sneakers-1",
      "type": "sneakers",
      "dimensions": [
        20,
        28,
        12
      ],
      "position": [
        10,
        14,
        6
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "tier": 1,
      "animation": "heavy_thud"
    },
    {
      "id": "hardcover-book-1",
      "type": "hardcover_book",
      "dimensions": [
        16,
        24,
        6
      ],
      "position": [
        28,
        12,
        3
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "tier": 1,
      "animation": "heavy_thud"
    },
    {
      "id": "laptop-1",
      "type": "laptop_15",
      "dimensions": [
        35,
        24,
        2
      ],
      "position": [
        17.5,
        40,
        1
      ],
      "rotation": [
        0,
        0,
        0
      ],
      "tier": 3,
      "animation": "gentle_glide"
    }
  ],
  "unplacedItems": [],
  "validation": {
    "withinBounds": true,
    "noOverlaps": true
  }
}
```

### Error (`invalid-input`)
```json
{
  "status": "error",
  "code": "INVALID_INPUT",
  "message": "Item \"banana-1\" at index 0 has unknown type \"banana\". Must be a valid catalog type."
}
```

---

## 7. Known Limitations (MVP)

1. **Support check heuristic:** Hovering items are prevented by requiring >= 70% support area (`MIN_SUPPORT_RATIO = 0.7`) on coplanar top faces of underlying items, but continuous rigid-body physics is not simulated.
2. **Usable gaps:** Candidate points are generated at bounding box corners, not using a full maximal-voids decomposition. Empty spaces smaller than an item's footprint cannot be consolidated.
3. **Two orientations only:** Items can only be packed in `[W, D, H]` or `[D, W, H]`. No rolling onto sides (height never changes).
4. **Greedy heuristic:** Allocation is greedy and deterministic; it does not backtrack to find a globally optimal packing combination.
