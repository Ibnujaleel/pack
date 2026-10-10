import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import Suitcase from './Suitcase';
import PackingItem from './PackingItem';
import catalogData from '../data/items_catalog.json';
import { Eye, Layers, RotateCcw, Box, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStagingPosition, convertEngineToThree, calculateItemTransform } from './animationSequence.js';
import {
  getOverflowPosition,
  getOverflowAreaBounds,
  getOptimalCameraFraming
} from './overflowLayout.js';

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

/**
 * AnimatedPackingItem Component
 * Animates a placed item from its initial staging platform slot to its exact engine-assigned destination.
 */
function AnimatedPackingItem({
  placedItem,
  itemIndex,
  totalItems,
  stagingPosition,
  targetPosition,
  targetRotation,
  color,
  animationTrigger,
  onAnimationComplete,
}) {
  const groupRef = useRef();
  const startTimeRef = useRef(null);
  const isFinishedRef = useRef(animationTrigger === 0);

  React.useEffect(() => {
    startTimeRef.current = null;
    isFinishedRef.current = false;
  }, [animationTrigger]);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isFinishedRef.current) {
      groupRef.current.position.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      groupRef.current.rotation.set(targetRotation[0], targetRotation[1], targetRotation[2]);
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.getElapsedTime();
    }

    const elapsed = state.clock.getElapsedTime() - startTimeRef.current;
    const transform = calculateItemTransform(elapsed, itemIndex, {
      startPosition: stagingPosition,
      targetPosition: targetPosition,
      targetRotation: targetRotation,
    });

    groupRef.current.position.set(transform.position[0], transform.position[1], transform.position[2]);
    groupRef.current.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);

    if (transform.isFinished) {
      isFinishedRef.current = true;
      if (itemIndex === totalItems - 1) {
        setTimeout(() => {
          onAnimationComplete?.();
        }, 0);
      }
    }
  });

  return (
    <group ref={groupRef} position={stagingPosition} rotation={[0, 0, 0]}>
      <PackingItem
        type={placedItem.type}
        color={color}
        dimensions={placedItem.dimensions}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

export default function Scene({
  items = [],
  packingResult = null,
  animationTrigger = 0,
  isAnimating = false,
  onAnimationComplete = null,
}) {
  const isPacked = Boolean(packingResult && packingResult.status === 'success');
  const [userViewMode, setUserViewMode] = useState(null);
  const [prevPackingResult, setPrevPackingResult] = useState(packingResult);
  const [prevAnimationTrigger, setPrevAnimationTrigger] = useState(animationTrigger);
  const [showWireframe, setShowWireframe] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const controlsRef = useRef();

  // Reset user override if packingResult transitions or animation is triggered
  if (packingResult !== prevPackingResult) {
    setPrevPackingResult(packingResult);
    setUserViewMode(null);
  }
  if (animationTrigger !== prevAnimationTrigger) {
    setPrevAnimationTrigger(animationTrigger);
    setUserViewMode(null);
  }

  // Derive active view mode
  const viewMode = userViewMode ?? (
    isPacked && packingResult.items.length > 0
      ? 'packed'
      : items.length > 0
      ? 'selected'
      : 'showcase'
  );
  const setViewMode = setUserViewMode;

  const unplacedCount = isPacked && viewMode === 'packed'
    ? (packingResult.unplacedItems?.length || 0)
    : 0;
  const cameraConfig = getOptimalCameraFraming(unplacedCount);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.target.set(
        cameraConfig.target[0],
        cameraConfig.target[1],
        cameraConfig.target[2]
      );
      controlsRef.current.object.position.set(
        cameraConfig.position[0],
        cameraConfig.position[1],
        cameraConfig.position[2]
      );
      controlsRef.current.update();
    }
  };

  // Adjust camera target dynamically when overflow items appear/disappear
  React.useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(
        cameraConfig.target[0],
        cameraConfig.target[1],
        cameraConfig.target[2]
      );
      controlsRef.current.update();
    }
  }, [unplacedCount, cameraConfig.target]);

  // Staging shelf accommodates up to 4 items per page cleanly without clipping
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  return (
    <div className="relative flex-1 min-h-[500px] lg:min-h-[600px] bg-[#162032] border border-[#23304c] rounded-2xl flex flex-col overflow-hidden shadow-2xl select-none">
      {/* 3D Viewport Overlay Header Tools */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[#0e1424]/90 border border-[#1e273e] backdrop-blur-md shadow-lg">
          {/* Packed Solution Button (when packed result exists) */}
          {isPacked && (
            <button
              type="button"
              onClick={() => setViewMode('packed')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'packed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Packed ({packingResult.items.length})</span>
            </button>
          )}

          {/* Selected Staging Mode Button */}
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
            <span>Staging ({items.length})</span>
          </button>

          {/* 6 Models Showcase Button */}
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
            <span>Showcase</span>
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

      {/* Top Right: Status Pill & Badges */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5 pointer-events-none">
        {viewMode === 'packed' && isPacked ? (
          <>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 backdrop-blur-md shadow-lg text-[11px] text-emerald-200">
              <span className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-blue-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{isAnimating ? 'Sequential Packing in Progress...' : `${packingResult.items.length} Items Packed by Engine`}</span>
            </div>
            {packingResult.unplacedItems?.length > 0 && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-600/40 text-amber-200 text-[10px] font-medium backdrop-blur-md shadow-md">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{packingResult.unplacedItems.length} Unplaced Item{packingResult.unplacedItems.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </>
        ) : viewMode === 'selected' ? (
          <>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0e1424]/90 border border-[#1e273e] backdrop-blur-md shadow-lg text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>
                {items.length > 0
                  ? `${items.length} Item${items.length > 1 ? 's' : ''} Staged for Inspection`
                  : 'Suitcase Ready (Empty Selection)'}
              </span>
            </div>
            {items.length > 0 && !isPacked && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-600/40 text-amber-200 text-[10px] font-medium backdrop-blur-md shadow-md">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Visual Preview Only — Engine Packing Pending</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0e1424]/90 border border-[#1e273e] backdrop-blur-md shadow-lg text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>6 Canonical 3D Models Showcase</span>
          </div>
        )}
      </div>

      {/* React Three Fiber Canvas */}
      <div className="w-full h-full flex-1 cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [0.70, 0.75, 0.85], fov: 42, near: 0.05, far: 20 }}
        >
          <color attach="background" args={['#162032']} />
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

          {/* Optional Wireframe Usable Cavity Guide: 40 W × 20 H × 55 D cm */}
          {showWireframe && (
            <mesh position={[0, 0.10, 0]}>
              <boxGeometry args={[0.40, 0.20, 0.55]} />
              <meshBasicMaterial
                color="#3b82f6"
                wireframe
                opacity={0.12}
                transparent
              />
            </mesh>
          )}

          {/* Render Items depending on active View Mode with Suspense for GLB loading */}
          <React.Suspense fallback={null}>
            {viewMode === 'packed' && isPacked ? (
              /* Mode 1: Packed Layout (Placed items inside suitcase with sequential animation) */
              <group>
                {/* Placed Items Animated Sequentially */}
                {packingResult.items.map((placedItem, idx) => {
                  const catalogItem = catalogData.find((c) => c.type === placedItem.type);
                  const color = catalogItem?.color || '#3b82f6';
                  const slotIndex = items.findIndex((it) => it.id === placedItem.id);
                  const stagingPos = getStagingPosition(slotIndex >= 0 ? slotIndex : idx, placedItem.dimensions);
                  const targetPos = convertEngineToThree(placedItem.position);
                  const targetRot = placedItem.rotation || [0, 0, 0];

                  return (
                    <AnimatedPackingItem
                      key={placedItem.id}
                      placedItem={placedItem}
                      itemIndex={idx}
                      totalItems={packingResult.items.length}
                      stagingPosition={stagingPos}
                      targetPosition={targetPos}
                      targetRotation={targetRot}
                      color={color}
                      animationTrigger={animationTrigger}
                      onAnimationComplete={onAnimationComplete}
                    />
                  );
                })}

                {/* Dedicated Overflow Area Beside Suitcase (+X side) */}
                {packingResult.unplacedItems?.length > 0 && (() => {
                  const unplacedList = packingResult.unplacedItems;
                  const bounds = getOverflowAreaBounds(unplacedList.length);

                  return (
                    <group>
                      {/* 1. Floor Staging Mat for Overflow Items */}
                      <mesh
                        position={bounds.center}
                        rotation={[-Math.PI / 2, 0, 0]}
                        receiveShadow
                      >
                        <planeGeometry args={bounds.size} />
                        <meshStandardMaterial
                          color="#111827"
                          roughness={0.8}
                          metalness={0.15}
                        />
                      </mesh>

                      {/* 2. Subtle Amber Border Guide */}
                      <mesh
                        position={[bounds.center[0], 0.002, bounds.center[2]]}
                        rotation={[-Math.PI / 2, 0, 0]}
                      >
                        <planeGeometry args={bounds.size} />
                        <meshBasicMaterial
                          color="#f59e0b"
                          opacity={0.35}
                          transparent
                          wireframe
                        />
                      </mesh>

                      {/* 3. "Doesn't Fit" Badge Indicator */}
                      <Html
                        position={[bounds.center[0], 0.015, -bounds.size[1] / 2 - 0.025]}
                        center
                        distanceFactor={1.3}
                      >
                        <div className="px-2 py-0.5 rounded-md bg-[#0e1424]/95 border border-amber-500/50 text-amber-300 text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap shadow-lg flex items-center space-x-1.5 select-none pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>Doesn't Fit ({unplacedList.length})</span>
                        </div>
                      </Html>

                      {/* 4. Overflow Items positioned beside suitcase in neat grid */}
                      {unplacedList.map((unplaced, idx) => {
                        const fullItem = items.find((it) => it.id === unplaced.id) || unplaced;
                        const overflowPos = getOverflowPosition(
                          idx,
                          unplacedList.length,
                          fullItem.dimensions || [10, 10, 10]
                        );

                        return (
                          <group key={unplaced.id}>
                            {/* Individual slot floor highlight */}
                            <mesh
                              position={[overflowPos[0], 0.0025, overflowPos[2]]}
                              rotation={[-Math.PI / 2, 0, 0]}
                            >
                              <planeGeometry args={[0.12, 0.12]} />
                              <meshBasicMaterial
                                color="#f59e0b"
                                opacity={0.12}
                                transparent
                              />
                            </mesh>

                            <PackingItem
                              type={fullItem.type}
                              color={fullItem.color}
                              dimensions={fullItem.dimensions}
                              position={overflowPos}
                              rotation={[0, 0, 0]}
                            />
                          </group>
                        );
                      })}
                    </group>
                  );
                })()}
              </group>
            ) : viewMode === 'selected' ? (
              /* Mode 2: User's Selected Items Staging Preview (Elevated above rim) */
              <group>
                {items.length > 0 && (
                  <>
                    <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <planeGeometry args={[0.38, 0.52]} />
                      <meshBasicMaterial
                        color="#3b82f6"
                        opacity={0.06}
                        transparent
                        wireframe
                      />
                    </mesh>

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
            ) : (
              /* Mode 3: All 6 Canonical Models Showcase Preview */
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
            )}
          </React.Suspense>

          {/* Soft Ground Contact Shadow underneath suitcase & overflow tray */}
          <ContactShadows
            position={[unplacedCount > 0 ? 0.16 : 0, -0.045, 0]}
            opacity={0.7}
            scale={unplacedCount > 0 ? 2.2 : 1.4}
            blur={2.0}
            far={1.0}
            color="#000000"
          />

          {/* Smooth OrbitControls for 360-degree inspection */}
          <OrbitControls
            ref={controlsRef}
            target={cameraConfig.target}
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
