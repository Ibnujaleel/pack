# StowAway 3D — Detection Pipeline & Vision Lab 🧳🔬

[![Tests](https://img.shields.io/badge/tests-28%2F28%20passing-brightgreen)](https://github.com/Ibnujaleel/pack)
[![Framework](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Build Tool](https://img.shields.io/badge/Vite-8-purple)](https://vitejs.dev/)
[![ML](https://img.shields.io/badge/TensorFlow.js-COCO--SSD-orange)](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)

**StowAway 3D** is an interactive, browser-based 3D packing assistant that optimizes carry-on luggage arrangements. 

This repository contains the **Vision Lab** subsystem: a client-side object detection, normalization, and engine payload generation pipeline that converts real-world photos or manual item selections into the exact JSON contract expected by the 3D packing engine.

---

## 🌟 Features

### 1. Client-Side Lazy Object Detection (Phase 1)
- **Zero App-Start Overhead**: TensorFlow.js and the COCO-SSD model are loaded lazily on-demand upon the first detection request.
- **Model Caching**: Cached in memory to ensure fast subsequent detections without redundant downloads.
- **Visual Overlays**: Bounding boxes and confidence percentages rendered dynamically over previewed images.
- **Graceful Error Handling**: Network or model load failures trigger readable UI notifications without crashing the application.

### 2. Catalog Mapping & Review Bench (Phase 2)
- **Class Mapping**: Maps generic COCO-SSD labels to canonical catalog items:
  - `laptop` → `laptop_15` (*high confidence*)
  - `book` → `hardcover_book` (*high confidence*)
  - `bottle` → `tsa_liquid_pouch` (*low confidence, prompts confirmation*)
- **Duplicate Merging**: Same-class detections with bounding box **IoU > 0.6** are automatically merged, retaining the highest scoring detection.
- **Manual Item Fallback (A1, A9)**: Full manual item addition support for items not detectable by vision models (sneakers, rolled T-shirts, folded denim) — works even if cameras/models fail.
- **Running Total Weight**: Real-time weight tracking according to the canonical item catalog.
- **Stable ID Generation**: Generates per-type unique identifiers (`laptop-1`, `hardcover-book-1`, `sneakers-1`) with sequential counters that are never reused within the list.

### 3. Engine Request JSON Builder
- Generates the exact contract payload expected by the 3D packing engine:
  ```json
  {
    "items": [
      { "id": "laptop-1", "type": "laptop_15", "overrides": {} },
      { "id": "hardcover-book-1", "type": "hardcover_book", "overrides": {} }
    ]
  }
  ```
- **Copy & Download**: Built-in clipboard copy and single-click `request.json` file download.
- **Skipped Item Auditing**: Excludes items lacking a selected catalog type and displays an audit warning.

---

## 📋 Canonical Catalog (`src/data/items_catalog.json`)

All physical specifications (dimensions in cm, weights in kg, tiers) are derived strictly from the canonical catalog:

| Item Type | Display Name | Dimensions (W × D × H cm) | Weight (kg) | Tier | Geometry |
|-----------|--------------|---------------------------|-------------|------|----------|
| `sneakers` | Sneakers | 20 × 28 × 12 | 0.85 | 1 | Rounded Box |
| `hardcover_book` | Hardcover book | 16 × 24 × 6 | 0.60 | 1 | Box |
| `rolled_tshirt` | Rolled T-shirt | 18 × 18 × 10 | 0.20 | 2 | Cylinder |
| `folded_denim` | Folded denim | 22 × 30 × 8 | 0.65 | 2 | Box |
| `laptop_15` | 15-inch laptop | 35 × 24 × 2 | 1.80 | 3 | Slab |
| `tsa_liquid_pouch` | TSA liquid pouch | 15 × 10 × 5 | 0.40 | 3 | Box |

> ⚠️ **Contract Rule (A9)**: Never infer actual dimensions or weights from image pixels. Vision outputs suggestions only; canonical dimensions are assigned from the catalog.

---

## 📁 Repository Structure

```
packwise/
├── src/
│   ├── data/
│   │   └── items_catalog.json           # Single canonical item catalog (Contract A3)
│   ├── vision-lab/
│   │   ├── __tests__/                   # Vitest unit test suite (28 passing tests)
│   │   │   ├── buildRequest.test.js
│   │   │   ├── classMap.test.js
│   │   │   └── normalizeDetections.test.js
│   │   ├── buildRequest.js              # Pure functions for instance IDs & payload formatting
│   │   ├── classMap.js                  # COCO-SSD class-to-catalog type mapping
│   │   ├── detectItems.js               # Detection executor with confidence filtering
│   │   ├── loadDetector.js              # Lazy-loaded, memoized COCO-SSD model loader
│   │   ├── main.jsx                     # Vision Lab standalone React mount point
│   │   ├── normalizeDetections.js       # IoU calculations & duplicate suppression
│   │   ├── VisionLab.css                # Dark-mode test bench design system
│   │   └── VisionLab.jsx                # Review panel & interactive workspace
│   ├── App.jsx                          # Main application shell
│   └── main.jsx                         # Main app mount point
├── public/                              # Static public assets
├── vision-lab.html                      # Standalone Vite HTML entry point for Vision Lab
├── vite.config.js                       # Multi-page Vite configuration
└── package.json                         # Project dependencies and test scripts
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation
```bash
git clone https://github.com/Ibnujaleel/pack.git
cd pack
git checkout feature/vision-lab
npm install
```

### Running Locally
Start the Vite development server:
```bash
npm run dev
```

- **Vision Lab Workspace**: [`http://localhost:5173/vision-lab.html`](http://localhost:5173/vision-lab.html)
- **Main Application**: [`http://localhost:5173/`](http://localhost:5173/)

---

## 🧪 Testing & Linting

### Unit Tests
The test suite runs with [Vitest](https://vitest.dev/) in a pure Node environment:
```bash
npm test
```
**Coverage includes:**
- COCO-SSD class mapping and catalog type validation
- Bounding box IoU calculations and duplicate merging (threshold: 0.6)
- Instance ID sequence generation per type (`<type>-<n>`)
- ID stability and non-reuse after item removals
- Engine request JSON output format compliance
- Input immutability across all pure pipeline functions

### Code Linting
Run [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) for fast static analysis:
```bash
npm run lint
```

---

## 📜 Contract Compliance
This implementation adheres strictly to the **StowAway 3D Split Development Source of Truth** (Contract v3.0):
- **A1**: Fully browser-based without external backend dependencies.
- **A3**: Single shared canonical catalog at `src/data/items_catalog.json`.
- **A8**: Protocol payload structure `{ "items": [ { "id", "type", "overrides" } ] }`.
- **A9**: COCO-SSD lazy initialization, pixel-size detachment, manual fallback support, and user confirmation for ambiguous detections.

---

## 📄 License
MIT
