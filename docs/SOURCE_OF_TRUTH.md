# StowAway 3D — Split Development Source of Truth
**Contract version:** 3.0  
**Project:** StowAway 3D  
**Stack:** React + Vite + Tailwind CSS + React Three Fiber  
**Purpose:** Let Afsal and the Packing-Engine Teammate develop independently on separate laptops, then integrate without conflicting assumptions.

---

## 0. How to use this document

This is the single shared source of truth for the hackathon implementation.

1. Both developers keep the same copy of this file in the repository.
2. Each developer implements only the files and responsibilities assigned below.
3. Shared contracts, file paths, units, item IDs, and protocol fields must not be changed independently.
4. If a shared requirement changes, discuss it first, update this document, and commit the change before relying on it.
5. Both developers should work against the same Git repository and agreed branch strategy. Separate laptops do not mean separate, incompatible project structures.
6. The frontend must work with mock engine responses before the real engine is integrated.
7. The engine must be testable without React, Three.js, a camera, or browser UI.

### Source-of-truth precedence

If code, prompts, old notes, or messages conflict, use this order:

1. This document's Shared Contract sections.
2. The developer-specific section for the work being implemented.
3. The current agreed implementation in the repository.
4. Older documents or chat messages.

Do not silently reinterpret a shared requirement.

---

# Part A — Shared Contract (Both Developers Must Follow)

## A1. Product boundaries

- The MVP runs in the browser.
- No backend, database, authentication, cloud inference, or external API is required for the core experience.
- One canonical catalog lives at `src/data/items_catalog.json`.
- Packing must be deterministic: identical inputs and catalog version produce identical outputs.
- Invalid placements must never be animated as if valid.
- Valid placements must be preserved when other items cannot fit.
- Photo detections are suggestions, not reliable measurements. Users can correct, remove, or add items manually.
- Manual item entry must remain available if the camera or ML model fails.

## A2. Shared project structure

```text
src/
├── data/
│   └── items_catalog.json
├── shared/
│   ├── protocol.js              # Shared constants/helpers only; no duplicate catalog
│   └── protocolExamples.js      # Optional frontend fixtures/examples
├── engine/                      # Teammate owns these files
│   ├── index.js
│   ├── ruleEngine.js
│   ├── allocator.js
│   ├── protocolCompiler.js
│   ├── validatePacking.js
│   └── __tests__/
├── vision/                      # Afsal owns these files
│   ├── loadDetector.js
│   ├── detectItems.js
│   └── normalizeDetections.js
├── components/                  # Afsal owns these files
│   ├── Scanner.jsx
│   ├── ItemReview.jsx
│   ├── Sidebar.jsx
│   ├── PackControls.jsx
│   └── PackingStatus.jsx
├── scene/                       # Afsal owns these files
│   ├── Scene.jsx
│   ├── Suitcase.jsx
│   ├── PackingItem.jsx
│   └── PackSequencer.jsx
├── App.jsx                      # Afsal owns
└── main.jsx                     # Afsal owns
```

The repository may add tests, CSS, assets, or helper files, but do not move or rename shared/owned modules without agreeing first.

## A3. Canonical item catalog

All dimensions are centimetres in `[width, depth, height]` order. Weights are kilograms. Dimensions describe the unrotated bounding box.

| Stable type ID | Display name | Dimensions (W,D,H) cm | Weight kg | Tier | Elasticity | Geometry | Color |
|---|---|---:|---:|---:|---:|---|---|
| `sneakers` | Sneakers | `[20,28,12]` | 0.85 | 1 | 0 | rounded box | `#ea580c` |
| `hardcover_book` | Hardcover book | `[16,24,6]` | 0.60 | 1 | 0 | box | `#8b5cf6` |
| `rolled_tshirt` | Rolled T-shirt | `[18,18,10]` | 0.20 | 2 | 0.6 | cylinder | `#22c55e` |
| `folded_denim` | Folded denim | `[22,30,8]` | 0.65 | 2 | 0.4 | box | `#3b82f6` |
| `laptop_15` | 15-inch laptop | `[35,24,2]` | 1.80 | 3 | 0 | slab | `#475569` |
| `tsa_liquid_pouch` | TSA liquid pouch | `[15,10,5]` | 0.40 | 3 | 0 | box | `#f59e0b` |
| `cell_phone` | Cell phone | `[8,16,1]` | 0.20 | 3 | 0 | slab | `#06b6d4` |
| `phone_charger` | Phone charger | `[6,5,4]` | 0.12 | 2 | 0 | box | `#e5e7eb` |
| `charging_cable` | Charging cable (coiled) | `[12,12,3]` | 0.08 | 2 | 0.7 | cylinder | `#14b8a6` |

Catalog extended to 9 items (v3.1).

Every catalog entry must contain a stable `type`, display name, base dimensions, default weight, default tier, default elasticity, tags, geometry, color, and default animation.

Every instance must have a unique stable ID within the current packing request, e.g. `sneakers-1`, `sneakers-2`, `laptop-1`. Never use an array index as the only persistent identity.

The catalog is canonical. Components and engine code must import/read these values rather than copying dimensions, colors, or weights into separate item definitions.

## A4. Suitcase, coordinates, units, and positions

- Suitcase internal dimensions: **40 W × 55 D × 20 H cm**.
- Engine axes: X = width (0–40), Y = depth (0–55), Z = height (0–20).
- Engine protocol positions are the **center** of each item's oriented bounding box, in centimetres.
- Protocol dimensions are `[width, depth, height]` in centimetres.
- Three.js uses metres. Divide every position and dimension by 100 when passing values to the 3D scene.
- Internally, the engine should use minimum/maximum bounds for checks:
  - `min = center - dimensions / 2`
  - `max = center + dimensions / 2`
- An item is in bounds if all minimums are at least 0 and maximums are no greater than the corresponding suitcase dimensions.
- Boundary contact is allowed. Positive-volume intersection between two item AABBs is an overlap.
- The visible suitcase opening must match the same 40 × 55 × 20 cm internal coordinate system. Avoid decorative wall thickness accidentally reducing the usable internal volume.

## A5. Rotation contract (MVP restriction)

Only two orientations are supported:

1. Original: `[W, D, H]`
2. Swapped: `[D, W, H]`

The engine must return the chosen oriented dimensions in `dimensions` and always return `rotation: [0,0,0]`. The renderer must use the returned dimensions directly and must not rotate the item a second time.

This is intentionally a limitation for the MVP. Do not implement rotations that change height unless both developers agree to revise the protocol and scene.

## A6. Rule engine precedence

Recompute the effective profile from catalog defaults plus the current validated user inputs for every packing run. Do not mutate catalog defaults or accumulate values from prior slider changes.

Apply in this exact order:

1. **Baseline:** copy catalog profile and apply current validated overrides (e.g. thickness and weight if editable).
2. **Fragile/liquid override:** if tags include `fragile` or `liquid`, force tier 3, elasticity 0, animation `gentle_glide`.
3. **Thickness rule:** for a non-fragile item whose effective unrotated height/thickness is **>= 15 cm**, set elasticity 0, tier 1, animation `heavy_thud`.
4. **Weight rule:** for a non-fragile item whose effective weight is **> 1.2 kg**, set tier 1 and animation `heavy_thud`. Exactly 1.2 kg does not trigger the rule.
5. **Wide Tier 2 rule:** for a non-fragile item whose effective width is **>= 30 cm** and current tier is 2, promote to tier 1 and set `heavy_thud`.
6. **Default handling:** if no rule overrides the baseline, keep default tier and elasticity; tier 1 defaults to `heavy_thud`, tier 2 to `soft_settle`, tier 3 to `gentle_glide`.

The denim thickness slider derives values from the original catalog profile plus the current slider value on every change. Resetting the slider restores the original rule-derived profile. The slider changes **height only** for the MVP; width and depth remain unchanged.

## A7. Deterministic packing algorithm contract

The allocator is a deterministic greedy heuristic, not a globally optimal solver.

1. Recalculate each instance's effective profile before packing.
2. Sort instances by ascending tier, then descending footprint area (`width × depth`), then ascending stable instance ID using a consistent lexical comparison.
3. Candidate points include the origin and points adjacent to the right, front, and top faces of already placed items.
4. Deduplicate candidate points and sort them by Z ascending, then Y ascending, then X ascending.
5. For each point, test original orientation `[W,D,H]` before swapped orientation `[D,W,H]`.
6. Treat candidate coordinates as the item's **minimum corner** during placement generation. Convert the final minimum corner to center position before returning the protocol.
7. Reject any placement outside the suitcase or overlapping any already placed item's AABB.
8. Select the first valid placement in the fixed ordering. Do not use randomness or current time in the solver.
9. If an item cannot be placed, append `{ id, reason }` to `unplacedItems` and continue trying to place later items.
10. Validate all returned placements before compiling the response. If validation fails, return `INTERNAL_ERROR`; never pass invalid placements to the scene.

Candidate point generation:
- Origin: `[0,0,0]`.
- For each placed item with minimum corner `[x,y,z]` and oriented dimensions `[w,d,h]`, add:
  - right: `[x+w, y, z]`
  - front: `[x, y+d, z]`
  - top: `[x, y, z+h]`
- These are candidate points, not a full Maximal Voids solver. The algorithm may leave usable gaps; this is acceptable for the MVP.

## A8. Shared JSON protocol

### Success response (full or partial packing)

```json
{
  "status": "success",
  "suitcase": { "width": 40, "depth": 55, "height": 20 },
  "items": [
    {
      "id": "sneakers-1",
      "type": "sneakers",
      "dimensions": [20, 28, 12],
      "position": [10, 14, 6],
      "rotation": [0, 0, 0],
      "tier": 1,
      "animation": "heavy_thud"
    }
  ],
  "unplacedItems": [
    { "id": "laptop-2", "reason": "No valid candidate placement found" }
  ],
  "validation": { "withinBounds": true, "noOverlaps": true }
}
```

Contract notes:

- `status: "success"` means the computation completed and every item in `items` passed validation. Some requested items may still be in `unplacedItems`.
- `status: "error"` means the engine could not safely complete the computation or the request was invalid.
- Error codes are exactly `INVALID_INPUT`, `CAPACITY_EXCEEDED`, or `INTERNAL_ERROR`.
- `CAPACITY_EXCEEDED` is reserved for an explicitly defined fatal capacity condition that aborts the request. An individual item that cannot fit should normally be listed in `unplacedItems` while the rest of the request continues.
- Error response:
```json
{
  "status": "error",
  "code": "INVALID_INPUT",
  "message": "A human-readable explanation."
}
```
- `dimensions` always represents the oriented bounding box in centimetres.
- `position` is the bounding-box center in centimetres.
- `rotation` must always be `[0,0,0]`.
- `validation` covers only placed items.
- `unplacedItems` entries contain only `id` and `reason`.
- Validate input: known item type, unique non-empty instance ID, finite positive dimensions, finite non-negative weight, valid tier, and valid override ranges. Malformed input returns `INVALID_INPUT`.
- Unknown but well-formed item types must not be silently assigned arbitrary dimensions.
- A request with no items returns a valid success response with an empty `items` array and both validation flags true.

## A9. Vision / scanner contract

- Use browser camera APIs (`navigator.mediaDevices.getUserMedia`) only after a user action and handle permission denial/device absence gracefully.
- Use browser-based TensorFlow.js with COCO-SSD preferred for multi-object detection. A model may identify generic classes, not exact catalog products.
- Normalize detections into suggestions; do not infer actual dimensions or weight from image pixels.
- If the detected class is ambiguous or unsupported, ask the user to select an item from the six-item catalog before adding it.
- Support single-item photo and multi-object photo workflows where feasible.
- Users can edit item type, remove false detections, and manually add missing items.
- Manual item selection and the thickness slider must work without camera or ML.
- Keep vision code separate from the engine. Vision outputs item suggestions; it does not place objects in the suitcase.

## A10. Frontend and scene contract

- React owns UI state; the engine receives a plain validated input payload and returns the protocol.
- The 3D scene renders only validated `items` from a `status: "success"` response.
- Do not animate `unplacedItems`.
- On `status: "error"`, preserve the UI and show a readable error/toast; do not crash or render stale invalid placements as the new result.
- Render an open-front/open-lid suitcase. A clipped box is optional, not mandatory; prioritize visibility of all packed items and correct usable internal dimensions.
- Coordinate conversion: divide protocol position and dimensions by 100 for Three.js.
- Use `heavy_thud`, `soft_settle`, and `gentle_glide` animation profiles. Keep animation sequencing deterministic; item N finishing triggers item N+1.
- Guard against stale animation callbacks after Reset, Clear, Replay, or a new Pack run.
- Controls: Pack, Replay, Reset animation, Clear items. Their behavior must be explicit and consistent.
- God Mode is a development/demo fallback only. `Ctrl+Shift+D` may inject a clearly labeled static fixture into the scene without camera or engine. It must never be represented as a real solver result.

## A11. Minimum acceptance tests

- One sneaker renders at the correct dimensions and center.
- Swapped width/depth placement renders without a second rotation.
- All placed items are within bounds.
- No pair of placed items has positive-volume AABB overlap.
- An unplaceable item appears as unplaced and does not prevent valid items from rendering.
- Invalid input produces a readable error without crashing the UI.
- Repeating identical input produces identical placement output.
- Slider changes recalculate from baseline and resetting restores baseline behavior.
- Camera denial/model failure still permits manual item entry.
- Reset/Replay/new Pack do not allow stale animation callbacks to change the current run.

---

# Part B — Afsal's Work Package (Frontend, Scanner, 3D Scene)

## B1. Files you own

```text
src/App.jsx
src/main.jsx
src/components/Scanner.jsx
src/components/ItemReview.jsx
src/components/Sidebar.jsx
src/components/PackControls.jsx
src/components/PackingStatus.jsx
src/vision/loadDetector.js
src/vision/detectItems.js
src/vision/normalizeDetections.js
src/scene/Scene.jsx
src/scene/Suitcase.jsx
src/scene/PackingItem.jsx
src/scene/PackSequencer.jsx
```

You may add UI-specific files such as CSS, hooks, reusable controls, icons, or fixtures. Do not edit `src/engine/*` without coordinating first.

You may import `src/data/items_catalog.json`, but must not create a second item catalog.

## B2. Frontend-to-engine request shape

Suggested request:

```json
{
  "items": [
    { "id": "sneakers-1", "type": "sneakers", "overrides": {} },
    { "id": "folded-denim-1", "type": "folded_denim", "overrides": { "height": 15 } }
  ]
}
```

This shape is the agreed MVP request unless both developers explicitly revise it. Do not send Three.js objects, React setters, image objects, or DOM nodes to the engine.

## B3. Your implementation sequence

1. Build the Vite/Tailwind layout and catalog-driven manual item selector.
2. Build the open suitcase in React Three Fiber with correct internal dimensions and camera framing.
3. Render one mock protocol item and verify its dimensions and center.
4. Implement `PackingItem` using oriented `dimensions`; do not apply another rotation.
5. Implement Pack/Replay/Reset/Clear controls and prevent stale animation callbacks.
6. Implement the sidebar and packing status, including unplaced badges and error display.
7. Add the thickness slider; height-only scaling is the MVP rule.
8. Add scanner loading, camera permissions, detection suggestions, and manual correction.
9. Add the clearly labeled God Mode fixture.
10. Integrate the real engine and run shared acceptance tests.

## B4. Frontend-specific rules

- Never assume every item fits.
- Use `status`, `validation`, `items`, and `unplacedItems` to render state.
- Show total weight from catalog weights plus validated overrides, not image guesses.
- Do not mutate catalog objects when users adjust a slider.
- Use a run identifier or equivalent guard so old asynchronous work cannot overwrite a newer result.
- If using clipping planes, test all materials and ensure the interior remains visible. An open-front model is the fallback.
- Load the ML model lazily when scanning is requested, rather than delaying the first dashboard render.
- Retain manual entry if model loading fails.

## B5. Handoff to the engine teammate

Provide:
- The exact request payload and engine invocation.
- A sample success response your UI renders.
- A sample error response your UI handles.
- Confirmation that `position` means center and `dimensions` are pre-swapped.
- Any unresolved integration issue; do not independently alter shared fields.

---

# Part C — Packing-Engine Teammate Work Package

## C1. Files the teammate owns

```text
src/engine/index.js
src/engine/ruleEngine.js
src/engine/allocator.js
src/engine/protocolCompiler.js
src/engine/validatePacking.js
src/engine/__tests__/
```

The teammate may add pure JavaScript helpers and tests under `src/engine/`. Do not import React, JSX, Three.js, camera APIs, or frontend state.

The engine must use `src/data/items_catalog.json`; do not duplicate catalog definitions.

## C2. Required public interface

Export one stable function from `src/engine/index.js`:

```js
export function packItems(request) {
  // Return { status: "success", ... } or { status: "error", ... }
}
```

The function must not mutate the request or catalog. It should return the agreed error object for expected invalid input or packing failures. Agree before changing the public function name or request shape.

## C3. Engine implementation sequence

1. Read the shared catalog and implement request validation.
2. Implement `ruleEngine.js` as a pure function from catalog profile plus overrides to effective profile.
3. Implement the deterministic candidate-point allocator with only the two agreed orientations.
4. Implement AABB boundary and overlap validation.
5. Compile the protocol with center positions, pre-swapped dimensions, zero rotations, and lightweight unplaced entries.
6. Add unit tests for rules, sorting, placements, boundaries, overlaps, malformed input, partial success, and repeatability.
7. Export `packItems(request)` and provide sample input/output fixtures for Afsal.
8. Test the engine independently with Node/Vite-compatible imports before integration.

## C4. Engine invariants

- Same input and same catalog produce the same ordered output.
- No invalid or overlapping placement is returned as packed.
- One unplaceable item does not automatically abort the whole request.
- Position is the bounding-box center in centimetres.
- Dimensions are oriented dimensions in centimetres.
- Rotation is always `[0,0,0]`.
- Unplaced entries contain only `id` and `reason`.
- Validation flags are true only when all returned placements pass the relevant checks.
- Rule derivation starts from baseline catalog data plus current overrides.

## C5. Handoff to Afsal

Provide:
- Exact `packItems(request)` signature.
- Input schema and defaults for omitted overrides.
- At least three deterministic fixtures: one item, multiple items with a swapped orientation, and partial packing.
- Error fixtures for invalid input and internal failure.
- Candidate-point ordering and known limitations.
- Test command and confirmation that engine tests pass.

---

# Part D — Integration Plan

## D1. Agree these interfaces first

1. Catalog type IDs match Section A3 exactly.
2. Frontend calls `packItems({ items: [...] })` from `src/engine/index.js`.
3. Thickness slider sends `overrides.height`; omitted override means catalog default.
4. Protocol fields and units match Section A8 exactly.
5. Both sides use the same catalog file.

If any of these change, update this contract and commit it.

## D2. Integration checkpoints

- **Hour 0–1:** Vite app starts; catalog loads; one mock sneaker renders at the right scale and center.
- **Hours 1–4:** Frontend works with mock data; engine tests pass independently.
- **Hours 4–5:** Real `packItems()` replaces the mock function. One sneaker, multiple items, swapped orientation, and partial packing work end to end.
- **Hours 5–6.5:** Slider and scanning work; failures remain recoverable.
- **Hours 6.5–8:** Run acceptance tests, fix critical bugs, rehearse God Mode, and freeze shared protocol changes.

## D3. Git collaboration rules

- Use one shared repository and commit frequently.
- Suggested branches: `feature/afsal-frontend` and `feature/packing-engine`.
- Afsal avoids engine-owned files; teammate avoids frontend-owned files.
- Changes to `items_catalog.json`, `shared/protocol.js`, or this contract require coordination.
- Merge small changes frequently. Resolve conflicts carefully rather than accepting one entire side blindly.
- If separate branches are unavailable, keep the same ownership boundaries on the main branch and communicate before touching shared files.

---

# Part E — Definition of Done

The MVP is ready to demo when:

- The app starts reliably.
- Users can manually add and remove all six catalog item types.
- A sneaker travels from request input through the engine protocol to a correctly scaled 3D render.
- Engine tests pass and output is deterministic.
- Packed items are within bounds and have no positive-volume AABB overlap.
- Unplaced items are visibly identified without breaking valid placements.
- The thickness slider recalculates from baseline.
- Photo scanning is optional and supports manual correction/fallback.
- Pack animation is sequential and Reset/Replay/new Pack do not trigger stale callbacks.
- God Mode is clearly labeled as a demo fixture, not a real solver output.
- Both developers can run the project from a clean checkout and explain the shared protocol.

**Final rule:** prioritize one correct end-to-end packing flow over a polished but disconnected frontend or a sophisticated engine that has not been integrated.
