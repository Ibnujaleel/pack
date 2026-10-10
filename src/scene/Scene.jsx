import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import Suitcase from './Suitcase';
import PackingItem from './PackingItem';
import catalogData from '../data/items_catalog.json';
import { Eye, Layers, RotateCcw, Box, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Preview offsets for the 6 canonical models to inspect them inside/above the suitcase
 */
const CANONICAL_SHOWCASE_LAYOUT = [
  { type: 'sneakers', position: [-0.095, 0.06, -0.12], label: 'Sneakers' },
  { type: 'hardcover_book', position: [0.095, 0.03, -0.12], label: 'Book' },
  { type: 'folded_denim', position: [-0.095, 0.04, 0.08], label: 'Denim' },
  { type: 'rolled_tshirt', position: [0.095, 0.05, 0.08], label: 'T-shirt' },
  { type: 'laptop_15', position: [0, 0.24, -0.06], label: 'Laptop 15"' },
  { type: 'tsa_liquid_pouch', position: [0, 0.24, 0.15], label: 'TSA Pouch' },
];

export default function Scene({ items = [] }) {
  // Mode: 'showcase' (inspect all 6 canonical models) vs 'selected' (inspect user's added items)
  const [viewMode, setViewMode] = useState('showcase');
  const [showWireframe, setShowWireframe] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const controlsRef = useRef();

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Staging shelf accommodates up to 4 items per page cleanly without clipping
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  /**
   * Staging Layout:
   * Positions items on an elevated inspection staging platform (Y >= 0.24m)
   * strictly above the suitcase rim (H = 0.20m), guaranteeing zero wall clipping
   * and making it immediately obvious this is an inspection staging layout, not a packed solution.
   */
  const getStagingPosition = (slotIndex, item) => {
    const positions = [
      [-0.10, -0.10], // Slot 0: Top-Left
      [0.10, -0.10],  // Slot 1: Top-Right
      [-0.10, 0.11],  // Slot 2: Bottom-Left
      [0.10, 0.11],   // Slot 3: Bottom-Right
    ];
    const [x, z] = positions[slotIndex % 4];
    const itemHeightMetres = (item.dimensions[2] || 10) / 100;
    // Base platform is at Y = 0.23m (above suitcase walls); item sits at platform + half height
    const y = 0.235 + itemHeightMetres / 2;

    return [x, y, z];
  };

  return (
    <div className="relative flex-1 min-h-[500px] lg:min-h-[600px] bg-[#070b14] border border-[#1b2337] rounded-2xl flex flex-col overflow-hidden shadow-2xl select-none">
      {/* 3D Viewport Overlay Header Tools */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {/* View Mode Toggle: All 6 Models vs Selected Items */}
        <div className="flex items-center p-1 rounded-xl bg-[#0e1424]/90 border border-[#1e273e] backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() => setViewMode('showcase')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'showcase'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>6 Models Showcase</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('selected')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'selected'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Selected Staging ({items.length})</span>
          </button>
        </div>

        {/* Staging Pagination when items > 4 in selected mode */}
        {viewMode === 'selected' && items.length > ITEMS_PER_PAGE && (
          <div className="flex items-center space-x-1 bg-[#0e1424]/90 border border-[#1e273e] backdrop-blur-md px-2 py-1 rounded-xl shadow-lg text-xs text-slate-300">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPageIndex(Math.max(0, currentPage - 1))}
              className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPageIndex(Math.min(totalPages - 1, currentPage + 1))}
              className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Wireframe Bounds Toggle */}
        <button
          type="button"
          onClick={() => setShowWireframe(!showWireframe)}
          title="Toggle suitcase bounds guide"
          className={`p-1.5 rounded-xl border backdrop-blur-md text-xs font-medium transition-all ${
            showWireframe
              ? 'bg-[#152038] border-blue-500/40 text-blue-300'
              : 'bg-[#0e1424]/90 border-[#1e273e] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Reset Camera */}
        <button
          type="button"
          onClick={resetCamera}
          title="Reset Camera View"
          className="p-1.5 rounded-xl bg-[#0e1424]/90 border border-[#1e273e] text-slate-400 hover:text-slate-200 backdrop-blur-md shadow-lg transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Top Right: Status Pill & Prominent Visual Preview Disclaimer */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0e1424]/90 border border-[#1e273e] backdrop-blur-md shadow-lg text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>
            {viewMode === 'showcase'
              ? '6 Canonical 3D Models'
              : items.length > 0
              ? `${items.length} Item${items.length > 1 ? 's' : ''} Staged for Inspection`
              : 'Suitcase Ready (Empty Selection)'}
          </span>
        </div>

        {viewMode === 'selected' && items.length > 0 && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-600/40 text-amber-200 text-[10px] font-medium backdrop-blur-md shadow-md">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Visual Preview Only — Engine Packing Pending</span>
          </div>
        )}
      </div>

      {/* React Three Fiber Canvas */}
      <div className="w-full h-full flex-1 cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [0.70, 0.75, 0.85], fov: 42, near: 0.05, far: 20 }}
        >
          {/* Studio Lighting */}
          <ambientLight intensity={0.65} />
          <directionalLight
            position={[1.2, 2.0, 1.2]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-1.2, 1.0, -1.0]} intensity={0.4} color="#93c5fd" />
          <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#ffffff" />

          {/* Interactive Suitcase (Internal 40 × 55 × 20 cm) */}
          <Suitcase />

          {/* Render Items depending on active View Mode */}
          {viewMode === 'showcase' ? (
            /* Mode A: All 6 Canonical Models Showcase Preview */
            <group>
              {CANONICAL_SHOWCASE_LAYOUT.map((layout) => {
                const catalogItem = catalogData.find((c) => c.type === layout.type);
                if (!catalogItem) return null;
                return (
                  <PackingItem
                    key={layout.type}
                    type={catalogItem.type}
                    color={catalogItem.color}
                    dimensions={catalogItem.dimensions}
                    position={layout.position}
                    rotation={[0, 0, 0]}
                  />
                );
              })}
            </group>
          ) : (
            /* Mode B: User's Selected Items Staging Preview (Elevated to avoid wall clipping) */
            <group>
              {items.length > 0 && (
                <>
                  {/* Subtle Elevated Staging Guide Platform above suitcase cavity */}
                  <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.38, 0.52]} />
                    <meshBasicMaterial
                      color="#3b82f6"
                      opacity={0.06}
                      transparent
                      wireframe
                    />
                  </mesh>

                  {/* Render the currently paged items */}
                  {visibleItems.map((item, idx) => (
                    <PackingItem
                      key={item.id}
                      type={item.type}
                      color={item.color}
                      dimensions={item.dimensions}
                      position={getStagingPosition(idx, item)}
                      rotation={[0, 0, 0]}
                    />
                  ))}
                </>
              )}
            </group>
          )}

          {/* Soft Ground Contact Shadow underneath suitcase */}
          <ContactShadows
            position={[0, -0.045, 0]}
            opacity={0.7}
            scale={1.4}
            blur={2.0}
            far={1.0}
            color="#000000"
          />

          {/* Smooth OrbitControls for 360-degree inspection */}
          <OrbitControls
            ref={controlsRef}
            target={[0, 0.12, 0]}
            enableDamping
            dampingFactor={0.06}
            minDistance={0.35}
            maxDistance={2.5}
            maxPolarAngle={Math.PI / 2.05}
          />
        </Canvas>
      </div>

      {/* Bottom Floating Notice */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1 rounded-full bg-[#0b101c]/90 border border-[#1c263d] backdrop-blur-md text-[11px] text-slate-400 text-center shadow-lg pointer-events-none">
        Drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  );
}
