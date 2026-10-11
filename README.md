# Layover (StowAway 3D)

**Pack smarter. Visualize your luggage. Prepare for your journey.**

Layover is an interactive 3D suitcase-packing assistant built with React, Three.js, and TensorFlow.js. It helps travelers plan luggage arrangements before departure, visualize how items fit inside standard cabin baggage, identify unplaceable overflow items, detect belongings from photos and live camera feeds, and review route-specific international travel and customs restrictions.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Installation and Local Development](#installation-and-local-development)
- [Usage Workflow](#usage-workflow)
- [Project Structure](#project-structure)
- [Team Contributions](#team-contributions)
- [Testing and Code Quality](#testing-and-code-quality)
- [Current Limitations and Roadmap](#current-limitations-and-roadmap)
- [Credits and Acknowledgements](#credits-and-acknowledgements)

---

## Overview

Packing for international travel often involves spatial guesswork, strict airline cabin baggage limits, and complex security regulations. Overpacking leads to stressful airport repacking, while packing regulated goods (such as lithium batteries or liquids) incorrectly can cause checkpoint confiscations or delays.

**Layover** bridges the gap between travel planning and baggage preparation by combining:
1. **A deterministic 3D spatial packing solver** with collision detection, gravitational support rules, and packing tier prioritization.
2. **Sequential 3D packing animations** and an adaptive **beside-the-suitcase overflow area** for items exceeding capacity.
3. **An in-browser AI item scanner** using TensorFlow.js and COCO-SSD for instant photo-based and live camera object detection.
4. **Country-based travel policy intelligence** verifying items against civil aviation security and customs rules (UK CAA, UAE GCAA, IATA, DEFRA, and HMRC).
5. **A travel portal experience** inspired by *The Visa Guy* (`visaguy.ae`), connecting visa-sanctioned journeys directly to luggage preparation.

---

## Key Features

### 1. Interactive 3D Suitcase Simulation
- **Cabin Dimensions**: Accurately modeled cabin suitcase cavity measuring **40 cm (W) × 55 cm (D) × 20 cm (H)** with internal floor guidelines, aluminum reinforcement rims, and an angled open lid.
- **Full Camera Control**: OrbitControls supporting 360-degree rotation, perspective zooming, and right-click panning, complete with a quick-reset camera shortcut.
- **Lighting and Grounding**: Studio lighting with directional highlights and real-time contact shadows.
- **Cavity Boundary Guide**: Optional wireframe overlay illustrating the internal usable packing envelope.

### 2. Comprehensive Travel Item Catalog
Catalog of 11 travel items with real-world dimensions, weights, tiers, elasticity, geometry profiles, and security tags:
- **Footwear & Apparel**: Sneakers (featuring a dedicated 3D GLB model), Folded Denim, Rolled T-Shirt, Small Towel.
- **Electronics & Work**: 15-inch Laptop, Smartphone, Phone Charger, Charging Cable.
- **Toiletries & Personal Goods**: TSA Liquid Pouch, Small Diary, Hardcover Book, Wallet, Snack Bar.
- **Item Customization**: Add, remove, and adjust quantities dynamically; items are assigned guaranteed unique instance IDs.

### 3. Rule-Based 3D Packing Engine
- **Boundary & Collision Enforcement**: Axis-Aligned Bounding Box (AABB) overlap prevention and boundary constraint checks.
- **Tier Prioritization**:
  - *Tier 1 (Heavy / Rigid)*: Sneakers, books, diaries placed on the base layer.
  - *Tier 2 (Soft / Flexible)*: Denim, rolled T-shirts, towels filling gaps.
  - *Tier 3 (Fragile / Quick Access)*: Laptops, phones, liquid pouches placed near the top.
- **Gravitational Support Validation**: Verifies that upper-layer items receive physical support from lower layers.
- **Thickness & Height Overrides**: Recalculates packing layouts dynamically when item dimensions are adjusted.

### 4. Sequential Packing Animations
- Items animate smoothly one-by-one from the staging area into their exact engine-assigned cavity coordinates.
- Uses cubic ease-in-out interpolation (`easeInOutCubic`) along parabolic vertical arcs to cleanly clear the suitcase rim.
- Replay control allows re-watching the packing sequence without recomputing the layout.

### 5. Dedicated Beside-the-Suitcase Overflow Area
- Items that exceed suitcase capacity are displayed in a dedicated, grounded overflow tray to the right (+X side) of the suitcase.
- Avoids floating or stacking items above the suitcase rim, keeping packed items fully visible.
- Arranged neatly in rows and columns based on quantity, complete with an amber border guide and a **"Doesn't Fit"** badge.
- Dynamic camera framing automatically shifts perspective when overflow items appear, keeping both the suitcase and overflow area in view.

### 6. AI Photo-Based Item Scanner
- **Client-Side Object Detection**: Runs TensorFlow.js and the COCO-SSD MobileNet model directly inside the browser with zero server latency.
- **Two Capture Modes**: Device camera preview (via `navigator.mediaDevices.getUserMedia`) with instant frame capture, or local photo upload (PNG, JPEG, WebP).
- **Interactive Review**: Displays detected bounding boxes with confidence scores, automatic catalog mapping, quantity adjusters, and manual addition fallbacks.

### 7. Country-Based Travel Restrictions & Biosecurity
- Evaluates selected packing list items against verified aviation safety and destination customs policies for the selected route (e.g. **United Arab Emirates ➔ United Kingdom (London)**).
- Explicit rule classifications:
  - `Prohibited` (e.g., spare lithium batteries / power banks in checked baggage).
  - `Restricted / conditions apply` (e.g., carry-on liquids 100ml / 1L transparent bag rule; non-EU meat/dairy biosecurity bans).
  - `No specific rule found` (personal apparel/reading material; explicitly notes that general screening still applies).
- Surfaces official authority references and citations from UK CAA, UAE GCAA, IATA, DEFRA, and HMRC.
- Allows removing flagged items directly from the restrictions panel.

### 8. The Visa Guy Portal Integration
- Mobile-first client portal inspired by *The Visa Guy* (`visaguy.ae`) and modern travel onboarding interfaces.
- **Client Login**: Demo authentication (`alfaz@visaguy.ae` / `layover2026`) with password toggle, input validation, and 1-click credential autofill.
- **Sanctioned Journey Dashboard**: Personalized travel card for **Mr. Alfaz** flying Dubai (DXB) to London (LHR) with a verified demo *Sanctioned* visa status.
- **Suitcase Preparation CTA**: Integrated **"Pack My Suitcase"** action that transitions directly into the 3D packing studio, with return navigation preserving all packing state.

---

## Technology Stack

| Category | Technology | Version / Details |
| :--- | :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/) | `^19.2.8` (Functional components, Hooks) |
| **Build Tool & Bundler** | [Vite](https://vite.dev/) | `^8.3.0` (Fast HMR, ES modules) |
| **3D Graphics Engine** | [Three.js](https://threejs.org/) | `^0.186.1` (WebGL scene, lighting, shadows) |
| **React 3D Integration** | [React Three Fiber](https://r3f.docs.pmnd.rs/) | `^9.8.1` (Declarative Three.js components) |
| **3D Helpers & Controls** | [@react-three/drei](https://github.com/pmndrs/drei) | `^10.7.9` (OrbitControls, ContactShadows, useGLTF) |
| **Machine Learning** | [@tensorflow/tfjs](https://www.tensorflow.org/js) | `^4.22.0` (In-browser ML runtime) |
| **Object Detection Model** | [@tensorflow-models/coco-ssd](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) | `^2.2.3` (Pre-trained 80-class object detection) |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com/) | `^3.4.19` + PostCSS & Autoprefixer |
| **Iconography** | [Lucide React](https://lucide.dev/) | `^1.55.0` (Feather-based SVG icons) |
| **Test Runner** | [Vitest](https://vitest.dev/) | `^5.0.3` (Unit and integration test runner) |
| **Linter** | [Oxlint](https://oxc.rs/) | `^1.81.0` (High-performance JS/React linter) |

---

## Installation and Local Development

### Prerequisites
- **Node.js**: Version `18.0.0` or higher (recommended: Node 20 LTS).
- **npm**: Version `9.0.0` or higher.
- A modern WebGL2-compatible browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari).
- *(Optional)* A built-in or USB webcam for live photo item scanning.

### 1. Clone the Repository
```bash
git clone https://github.com/Ibnujaleel/packwise.git
cd packwise
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173/`.

> **Note on Camera Access**: Modern browsers require a secure context (`localhost` or `HTTPS`) to access device cameras via `navigator.mediaDevices.getUserMedia`. Camera preview and capture work out of the box on `http://localhost:5173/`. Local image file upload is available as a permanent fallback regardless of camera permissions or hardware.

### 4. Build for Production
```bash
npm run build
```
Builds the optimized production client bundle in the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```
Previews the compiled production build locally.

---

## Usage Workflow

1. **Sign In**:
   - On the login screen, click **"Fill Demo User"** (or enter `alfaz@visaguy.ae` with password `layover2026`) and click **"Sign In to Travel Portal"**.
2. **Review Your Sanctioned Journey**:
   - View your approved travel details from **Dubai (DXB)** to **London (LHR)**, flight schedule (EK 029), and verified route travel restrictions.
3. **Launch the 3D Packing Studio**:
   - In the **"Ready to pack for London?"** section, click **"Pack My Suitcase"**.
4. **Build Your Packing List**:
   - Add items manually from the catalog sidebar.
   - Or click **"Scan Items from Photo"** to take a picture with your camera or upload an image for automated COCO-SSD object detection.
   - Review and correct detected items before confirming them into the suitcase list.
5. **Pack the Suitcase**:
   - Click **"Pack Suitcase"** to run the spatial packing engine.
   - Watch placed items animate sequentially into the suitcase cavity.
   - Items that exceed capacity are placed neatly on the **beside-the-suitcase overflow tray** with the **"Doesn't Fit"** indicator.
6. **Evaluate Travel Rules**:
   - Review route-specific travel warnings in the right column for your packed items (e.g. 100ml liquid limits, laptop battery carry-on rules, and food biosecurity restrictions).
7. **Return to Portal**:
   - Click **"Visa Portal"** in the top navigation bar at any time; all packed items and calculations are preserved.

---

## Project Structure

```text
layover/
├── public/
│   ├── favicon.svg              # Browser favicon
│   ├── logo.svg                 # StowAway 3D vector brand logo
│   ├── icons.svg                # Reusable SVG sprite icons
│   └── sneaker.glb              # High-fidelity 3D sneaker mesh asset
├── src/
│   ├── App.jsx                  # Root state coordinator and screen router
│   ├── index.css                # Global styles and Tailwind directives
│   ├── main.jsx                 # React DOM mount point
│   ├── assets/                  # Static media assets
│   ├── components/
│   │   ├── Header.jsx           # App header with portal return navigation
│   │   ├── Sidebar.jsx          # Catalog browsing and item list management
│   │   ├── PackControls.jsx     # Pack, Reset, Replay, and Clear controls
│   │   ├── PackingStatus.jsx    # Packing progress, weight, and error status
│   │   ├── SuitcaseDimensions.jsx # Suitcase volume specification card
│   │   ├── FooterStatus.jsx     # Bottom status indicators
│   │   ├── ItemIcon.jsx         # Category-specific item icon resolver
│   │   ├── ItemScannerModal.jsx # Camera preview, upload, and COCO-SSD detector
│   │   ├── TravelRestrictions.jsx # Searchable country route & policy checker
│   │   ├── VisaLoginScreen.jsx  # Mobile-first login screen
│   │   ├── VisaDashboard.jsx    # Personalized visa-sanctioned travel dashboard
│   │   └── VisaGuyLogo.jsx      # The Visa Guy vector brand mark
│   ├── data/
│   │   ├── items_catalog.json   # 11 catalog items with physical metadata
│   │   ├── categories.json      # Item classification schema
│   │   ├── travelCountries.js   # Country and hub city catalog
│   │   ├── travelPolicies.js    # Verified aviation and customs policy registry
│   │   ├── mockAuth.js          # Demo credentials and session management
│   │   └── mockVisaData.js      # Mock journey dataset (Dubai ➔ London)
│   ├── engine/
│   │   ├── allocator.js         # 3D bin placement and coordinate assignment
│   │   ├── geometry.js          # Bounding-box and AABB collision calculations
│   │   ├── ruleEngine.js        # Packing priority and orientation rules
│   │   ├── support.js           # Gravitational layer support validator
│   │   ├── validatePacking.js   # Final boundary and overlap verification
│   │   ├── validateRequest.js   # Request payload contract validation
│   │   └── index.js             # Engine public API (packItems)
│   ├── policy/
│   │   └── evaluateRestrictions.js # Policy matching and route severity engine
│   ├── scanner/
│   │   └── scannerEngine.js     # COCO-SSD detector, mapping, and confidence filters
│   └── scene/
│       ├── Scene.jsx            # Main R3F Canvas, lighting, camera, and controls
│       ├── Suitcase.jsx         # Procedural 3D open suitcase mesh
│       ├── PackingItem.jsx      # Procedural and GLB item rendering
│       ├── animationSequence.js # Sequential packing animation calculations
│       └── overflowLayout.js    # Dedicated beside-the-suitcase overflow layout
└── package.json
```

---

## Team Contributions

This project was built collaboratively with a strict architectural separation of concerns between the frontend user experience and the core 3D packing engine.

### Member 1 — Mohamad Afsal M
**Role:** Frontend Architecture, 3D Visualization, Computer Vision & UX Lead

**Contributions**
- **Interactive 3D Suitcase Scene & Procedural Geometry (`src/scene/Scene.jsx`, `Suitcase.jsx`, `PackingItem.jsx`):** Developed the React Three Fiber and Three.js 3D viewport, implementing realistic studio lighting, contact shadows, floor guidelines, internal cavity boundary guides ($40 \times 55 \times 20$ cm), and procedural geometry representations for clothing, electronics, and toiletries.
- **Realistic Sneaker GLTF/GLB Integration (`public/sneaker.glb`):** Integrated and configured the high-fidelity 3D sneaker mesh using `@react-three/drei`'s `useGLTF`, applying automatic bounding box normalization to match engine-assigned dimensions.
- **Sequential Packing Animations & Physics Easing (`src/scene/animationSequence.js`):** Built the sequential packing animation controller utilizing cubic easing (`easeInOutCubic`) and parabolic flight curves that lift items over suitcase edges before lowering them into their allocated coordinates.
- **Beside-the-Suitcase Overflow Tray (`src/scene/overflowLayout.js`):** Designed and implemented the dedicated grounded overflow area on the +X side of the suitcase, dynamic multi-item grid distribution, amber boundary indicators, "Doesn't Fit" badge, and automatic camera reframing (`getOptimalCameraFraming`).
- **AI Item Scanner & Camera Capture (`src/scanner/scannerEngine.js`, `src/components/ItemScannerModal.jsx`):** Integrated in-browser TensorFlow.js and COCO-SSD object detection, supporting live webcam initialization (`getUserMedia` with stream validation), image file upload processing, detection bounding boxes, confidence thresholding, and an interactive review/correction modal.
- **Country-Based Travel Policy Engine & UI (`src/policy/evaluateRestrictions.js`, `src/components/TravelRestrictions.jsx`):** Built the multi-authority travel policy evaluation system and sidebar panel checking luggage items against aviation and customs regulations (UK CAA, UAE GCAA, IATA, DEFRA, HMRC) for routes like Dubai (DXB) ➔ London (LHR).
- **The Visa Guy Travel Portal Integration (`src/components/VisaLoginScreen.jsx`, `VisaDashboard.jsx`, `VisaGuyLogo.jsx`):** Developed the mobile-first travel portal experience inspired by *The Visa Guy* (`visaguy.ae`), including demo client authentication (`alfaz@visaguy.ae` / `layover2026`), Dubai ➔ London sanctioned travel cards, and seamless navigation into the 3D packing studio while maintaining application state.
- **Frontend State & UI Controls (`src/App.jsx`, `Sidebar.jsx`, `PackControls.jsx`, `PackingStatus.jsx`):** Implemented global application state, catalog item selection, quantity adjustment, manual item entry fallback, packing progress monitoring, and control actions (Pack, Replay, Reset, Clear).
- **Testing & Quality Assurance:** Authored automated unit test suites for sequential animation curves, camera preview initialization, overflow layout geometry, travel policy evaluation, and mock authentication session flows.

### Member 2 — Alfaz (Ibnujaleel)
**Role:** 3D Packing Solver & Spatial Optimization Architecture Lead

**Contributions**
- **Deterministic 3D Bin Packing Solver (`src/engine/index.js`, `src/engine/allocator.js`):** Architected and implemented the core deterministic 3D packing algorithm using greedy spatial heuristics, footprint sorting, and candidate point generation (origin, right, front, top of existing placements).
- **Geometric Collision & AABB Boundary Validation (`src/engine/geometry.js`, `src/engine/validatePacking.js`):** Built the 3D spatial geometry module enforcing strict Axis-Aligned Bounding Box (AABB) intersection detection and container boundary compliance within the $40 \times 55 \times 20$ cm cavity.
- **Packing Rule Engine & Priority Tiers (`src/engine/ruleEngine.js`):** Developed the item classification rule engine managing packing stability tiers (Tier 1 heavy/rigid on base, Tier 2 soft/flexible mid-layer, Tier 3 fragile/quick-access top-layer), elasticity attributes, unrotated vs. swapped orientations ($[W, D, H]$ vs. $[D, W, H]$), and dynamic thickness overrides.
- **Gravitational Layer Support Analysis (`src/engine/support.js`):** Implemented structural support checks ensuring upper-layer items maintain adequate base contact with lower-layer items, preventing physically unrealistic floating placements.
- **Shared JSON Protocol & Request Validation (`src/engine/validateRequest.js`, `protocolCompiler.js`):** Defined and enforced the formal data contract between the solver and frontend, ensuring input validation, error handling codes (`INVALID_INPUT`, `INTERNAL_ERROR`), and standardized protocol coordinate output (bounding box centers and dimensions in centimetres).
- **Canonical Catalog Definition (`src/data/items_catalog.json`, `categories.json`):** Co-established the canonical item catalog schema containing physical dimensions, weights, tiers, elasticity, and default animation profiles.
- **Engine Unit Testing & Test Fixtures (`src/engine/__tests__/`):** Built extensive automated unit tests verifying allocator determinism, orientation swaps, boundary constraint enforcement, support ratios, custom items, and partial packing failure states.

> *Note on Team Attribution*: If your team contains additional contributors or requires specific naming updates (such as full academic or professional titles), please update the names in this section accordingly.

---

## Testing and Code Quality

The repository includes a comprehensive automated test suite and linter configuration.

### Run Unit Tests
```bash
npm test
```
Runs 163 tests across 15 test suites with [Vitest](https://vitest.dev/):
- **Engine**: Geometry calculations, request validation, collision checks, gravitational support, and allocator solver.
- **Animations**: Sequential cubic easing curves and timeline transformations.
- **Overflow**: Coordinate generation, grid spacing, and dynamic camera framing.
- **Policy Engine**: Route matching, multi-quantity grouping, and biosecurity warnings.
- **Scanner**: Detection filters, confidence thresholds, and catalog mappings.
- **Authentication**: Credential validation, input normalization, and session persistence.

### Run Linter
```bash
npm run lint
```
Runs [Oxlint](https://oxc.rs/) across all JavaScript and JSX source files with zero warnings and zero errors.

---

## Current Limitations and Roadmap

### Implemented Features (Current Release)
- [x] Interactive 3D suitcase simulation with standard cabin dimensions ($40 \times 55 \times 20$ cm).
- [x] Heuristic 3D bin packing solver with collision prevention and gravitational support checks.
- [x] Sequential packing animations with cubic easing and parabolic flight arcs.
- [x] Dedicated beside-the-suitcase overflow area for unplaced items.
- [x] 11-item canonical catalog with dimensions, weights, and priority tiers.
- [x] Realistic 3D item models, including procedurals and high-fidelity sneaker GLB asset.
- [x] In-browser AI item detection using TensorFlow.js and COCO-SSD with camera and upload support.
- [x] Country-based travel restrictions evaluator (UK CAA, UAE GCAA, IATA, DEFRA, HMRC).
- [x] The Visa Guy mobile-first travel portal integration with client authentication and journey cards.

### Current Limitations
- **Object Detection Scope**: In-browser object detection relies on COCO-SSD, which recognizes 80 common object classes. Non-standard luggage items are mapped to the closest catalog category and may require manual user confirmation or adjustment.
- **Packing Heuristics**: The packing algorithm is a deterministic heuristic spatial allocator prioritizing stability and access tiers. It does not attempt computationally exhaustive, NP-hard global volumetric optimization.
- **Fixed Suitcase Dimensions**: The internal suitcase cavity is configured to standard international cabin dimensions ($40 \times 55 \times 20$ cm). Custom suitcase shell resizing is not yet exposed in the UI.
- **Demonstration Visa Data**: Visa statuses shown in the portal are simulated for product demonstration purposes and do not represent actual government visa issuances.

### Planned Features (Future Roadmap)
- [ ] **Custom Luggage Dimensions**: User-configurable suitcase dimensions for checked baggage, duffel bags, and personal items.
- [ ] **Multi-Suitcase Packing**: Splitting packing lists across carry-on and checked luggage simultaneously.
- [ ] **3D Rotation Along 3 Axes**: Full 6-degree-of-freedom rotation for asymmetric luggage items.
- [ ] **Augmented Reality (AR) Preview**: WebXR support to project the packed suitcase directly onto a real-world surface.

---

## Credits and Acknowledgements

- **3D Graphics**: Built using [Three.js](https://threejs.org/) and [React Three Fiber](https://github.com/pmndrs/react-three-fiber).
- **Computer Vision**: Powered by [TensorFlow.js](https://www.tensorflow.org/js) and the [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) model team.
- **Icons**: Designed by [Lucide](https://lucide.dev/).
- **Aviation & Customs References**: Policy rules derived from official guidelines published by the UK Civil Aviation Authority (CAA), UAE General Civil Aviation Authority (GCAA), IATA Dangerous Goods Regulations, UK DEFRA, and HM Revenue & Customs (HMRC).
- **Design Inspiration**: Visa travel portal experience inspired by *The Visa Guy* ([visaguy.ae](https://visaguy.ae)).
