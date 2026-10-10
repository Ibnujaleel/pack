# StowAway 3D — 3D Packing Assistant

StowAway 3D is a browser-based 3D suitcase-packing assistant built for hackathon collaboration with clean split-development boundaries.

## Tech Stack
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS + PostCSS
- **Icons:** Lucide React
- **3D Scene Engine (Upcoming Phases):** React Three Fiber + Three.js

## Git Branch Strategy
- Main branch: `main` (clean base)
- Frontend feature branch: `feature/afsal-frontend`
- Packing engine branch: `feature/packing-engine`

## Project Status — Phase 1 Complete
Phase 1 implements the static dashboard skeleton and project scaffolding:
- **Header:** Product branding, geometric logo, local browser status indicator.
- **Left Panel (Items):** Empty items state and non-functional action placeholders.
- **Center Workspace (3D View Scaffolding):** Coordinate axes gizmo (X, Y, Z), perspective grid, suitcase silhouette, and viewport placeholders.
- **Right Panel (Controls & Status):** Disabled Pack, Reset, Replay, and Clear Items controls, neutral Packing Status, and internal suitcase dimensions (40 × 55 × 20 cm).
- **Bottom Status Area:** Ready indicator and future phase instructions.

## Development & Build Commands

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### Run Production Build
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```
