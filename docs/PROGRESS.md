# StowAway 3D — Repository Audit & Progress Report

**Date:** 2026-10-10  
**Contract Reference:** `docs/SOURCE_OF_TRUTH.md` (`StowAway_3D_Split_Development_Source_of_Truth.md` v3.0)  
**Auditor:** Antigravity  

---

## 1. File Tree of `src/`

Every file currently in `src/` with its one-line purpose:

```text
src/
├── App.css                                        # Default Vite template placeholder styling for root App
├── App.jsx                                        # Default Vite template placeholder component
├── index.css                                      # Default Vite root stylesheet
├── main.jsx                                       # Default Vite React application entry point
├── assets/
│   ├── hero.png                                   # Static demonstration image asset from template
│   ├── react.svg                                  # React logo SVG asset
│   └── vite.svg                                   # Vite logo SVG asset
├── data/
│   └── items_catalog.json                         # Canonical 6-item catalog JSON defining physical specs (Contract A3)
└── vision-lab/
    ├── VisionLab.css                              # Dark-mode UI styles for the detection and review test bench
    ├── VisionLab.jsx                              # Standalone test bench component for detection, review, and request building
    ├── buildRequest.js                            # Pure functions for instance ID generation and engine request formatting
    ├── classMap.js                                # Mapping configuration from COCO-SSD classes to catalog type IDs
    ├── detectItems.js                             # Detection runner with lazy loading and confidence thresholding (>= 50%)
    ├── loadDetector.js                            # Lazy model loader with in-memory caching for COCO-SSD
    ├── main.jsx                                   # Dedicated React mount entry point for vision-lab.html
    ├── normalizeDetections.js                     # Pure functions for IoU math, duplicate suppression, and normalization
    └── __tests__/
        ├── buildRequest.test.js                   # Vitest unit tests for ID formatting, stability, skipped items, and output shape
        ├── classMap.test.js                       # Vitest unit tests for class mappings, confidence levels, and catalog validity
        └── normalizeDetections.test.js            # Vitest unit tests for IoU calculation, duplicate merging, and immutability
```

---

## 2. Component Status Audit

| Component | Status | Evidence & Exported Functions |
|---|:---:|---|
| **COCO-SSD loading and detection** (`src/vision-lab` or `src/vision`) | **DONE** | • `src/vision-lab/loadDetector.js`: exports `loadDetector()` (lazy dynamic import of `@tensorflow/tfjs` and `@tensorflow-models/coco-ssd`, cached in memory)<br>• `src/vision-lab/detectItems.js`: exports `detectItems(imageElement)` and `MIN_CONFIDENCE = 0.5`. Filters detections with score >= 0.5 without pixel-based dimension guessing (A9). |
| **Class mapping to catalog types** | **DONE** | • `src/vision-lab/classMap.js`: exports `CLASS_MAP` and `lookupClass(cocoClass)`. Maps `laptop` → `laptop_15` (`high`), `book` → `hardcover_book` (`high`), `bottle` → `tsa_liquid_pouch` (`low`). Unsupported classes return `null`. Verified in `classMap.test.js`. |
| **Request JSON builder** | **DONE** | • `src/vision-lab/buildRequest.js`: exports `buildRequest(confirmedItems, customTracker)`, `formatTypePrefix(type)`, `generateInstanceId(type, n)`, `ItemIdTracker`, `getItemType(item)`, `isSkippedItem(item)`, and `getSkippedItems(items)`.<br>Produces exact payload shape `{ "items": [ { "id", "type", "overrides": {} } ] }`. Generates stable per-type IDs (`<type>-<n>`), avoids ID reuse upon item removal, and excludes untyped items into `skipped`. Verified in `buildRequest.test.js`. |
| **`src/data/items_catalog.json`** | **DONE** *(with note)* | • Exists at `src/data/items_catalog.json`. Contains all 6 canonical items: `sneakers`, `hardcover_book`, `rolled_tshirt`, `folded_denim`, `laptop_15`, `tsa_liquid_pouch`.<br>• Dimensions `[W, D, H]`, weights, tiers, elasticity, geometry, colors, and animations match Section A3 exactly.<br>• *Difference:* Section A6 references checking if tags include `"fragile"` or `"liquid"`. In `items_catalog.json`, all items currently define `"tags": []` (e.g. `tsa_liquid_pouch` has `tags: []` rather than `tags: ["liquid"]`, though its default tier is already 3). |
| **`ruleEngine.js`** (exact order in A6) | **MISSING** | • `src/engine/ruleEngine.js` does not exist in the repository. |
| **Geometry helpers (bounds, overlap)** | **MISSING** | • `src/vision-lab/normalizeDetections.js` contains 2D bounding box `computeIoU(a, b)` for vision suppression, but 3D bounding helpers (`withinBounds` against 40×55×20 cm suitcase, 3D positive-volume AABB `noOverlaps`) do not exist. |
| **`allocator.js`** (A7, top-layer rule) | **MISSING** | • `src/engine/allocator.js` does not exist in the repository. |
| **`validatePacking.js`, `protocolCompiler.js`, `packItems()` in `src/engine/index.js`** | **MISSING** | • Neither `src/engine/validatePacking.js`, `src/engine/protocolCompiler.js`, nor `src/engine/index.js` exist in the repository. |

---

## 3. Test Status

Vitest test runner is configured in `package.json` under `"scripts": { "test": "vitest run" }`.

Running `npm test` produces the following result:

```text
> packwise@0.0.0 test
> vitest run

 RUN  v5.0.3 C:/Users/ibnuj/OneDrive/Desktop/packwise

 ✓ src/vision-lab/__tests__/classMap.test.js (6 tests) 10ms
 ✓ src/vision-lab/__tests__/buildRequest.test.js (11 tests) 17ms
 ✓ src/vision-lab/__tests__/normalizeDetections.test.js (11 tests) 18ms

 Test Files  3 passed (3)
      Tests  28 passed (28)
   Start at  21:02:12
   Duration  3.38s (transform 63%, import 24%, worker 7%, tests 6%)
```

**Pass/Fail Summary:**  
- **Test Files:** 3 passed, 0 failed (3 total)  
- **Tests:** 28 passed, 0 failed (28 total)  
- **Status:** **PASS**

---

## 4. Contract Deviations, Ownership & Known Issues

### Ownership Boundaries
- Current implemented code is isolated in `src/vision-lab/` and `src/data/items_catalog.json`.
- `App.jsx`, `App.css`, `index.css`, and `src/main.jsx` are default boilerplate from the initial Vite template and have not yet been customized for Afsal's Part B UI.
- No files have been touched or created yet in `src/engine/`, `src/components/`, `src/scene/`, or `src/vision/`.

### Contract Deviations
1. **Directory Location:** Vision pipeline code was built in `src/vision-lab/` (under multi-page entry `vision-lab.html`) rather than `src/vision/`, keeping it isolated while engine and frontend components are being developed.
2. **Contract Filename:** The source of truth document exists as `StowAway_3D_Split_Development_Source_of_Truth.md` rather than `docs/SOURCE_OF_TRUTH.md`.
3. **Item Tags:** `tsa_liquid_pouch` in `items_catalog.json` has `tags: []` instead of `tags: ["liquid"]`.

### Known Bugs / Limitations
- **No Engine Implementation:** There is currently no `packItems()` solver in `src/engine/`; attempting to invoke the packing engine returns nothing.
- **No 3D Scene:** Three.js / React Three Fiber scene components from Part B do not exist yet.

---

## 5. Next Steps (In Order)

To complete the StowAway 3D implementation according to the Source of Truth:

1. **Implement `src/engine/ruleEngine.js`:**
   - Implement the pure function calculating effective profiles strictly in the 6-step order defined in A6 (baseline overrides → fragile/liquid tag check → thickness >= 15 cm → weight > 1.2 kg → wide tier 2 >= 30 cm → default animation handling).
   - Add unit tests in `src/engine/__tests__/ruleEngine.test.js`.
2. **Implement `src/engine/validatePacking.js`:**
   - Implement boundary validation against 40 W × 55 D × 20 H cm suitcase dimensions.
   - Implement positive-volume 3D AABB overlap detection between any two placed items.
   - Add unit tests in `src/engine/__tests__/validatePacking.test.js`.
3. **Implement `src/engine/allocator.js`:**
   - Implement sorting: tier ascending, footprint area (`W × D`) descending, instance ID lexical ascending.
   - Candidate point generation: origin `[0,0,0]`, right `[x+w, y, z]`, front `[x, y+d, z]`, top `[x, y, z+h]`.
   - Candidate point sorting: Z ascending, then Y ascending, then X ascending.
   - Orientation testing: original `[W, D, H]` before swapped `[D, W, H]`.
   - Add unit tests in `src/engine/__tests__/allocator.test.js`.
4. **Implement `src/engine/protocolCompiler.js` and `src/engine/index.js`:**
   - Convert item minimum corners to oriented bounding-box center positions.
   - Export `packItems(request)` following Section C2.
   - Add acceptance tests with deterministic fixtures.
5. **Implement Frontend & 3D Visualization (Part B):**
   - Implement React Three Fiber suitcase scene with internal dimensions 40 × 55 × 20 cm (`src/scene/`).
   - Implement `Scanner.jsx` / integrate `src/vision-lab/` components into `src/vision/` and `src/components/`.
   - Connect frontend controls to `packItems()`.

---

## 6. Example: Request and Output JSON

### Exact Request JSON (Sneakers + Book + Laptop)

Generated using `buildRequest([ { type: "sneakers" }, { type: "hardcover_book" }, { type: "laptop_15" } ])`:

```json
{
  "items": [
    {
      "id": "sneakers-1",
      "type": "sneakers",
      "overrides": {}
    },
    {
      "id": "hardcover-book-1",
      "type": "hardcover_book",
      "overrides": {}
    },
    {
      "id": "laptop-1",
      "type": "laptop_15",
      "overrides": {}
    }
  ]
}
```

### Exact Output JSON from `packItems()`

```text
not implemented
```

*(Reason: `src/engine/index.js` and `packItems()` have not been implemented yet).*
