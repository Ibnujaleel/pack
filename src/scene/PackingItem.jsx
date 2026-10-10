import React from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

/**
 * 1. IMPORTED GLB SNEAKERS MODEL
 * Loads the realistic Blender 3.3.1 sneaker model (two shoes, 7,356 triangles, 4K textures).
 * - Excludes the giant studio backdrop ('Plane' mesh).
 * - Clones hierarchy so multiple instances do not collide or mutate shared scene graph nodes.
 * - Preserves materials and 4K textures.
 * - Uniformly normalizes scale to fit the canonical catalog bounding box: 20 × 28 × 12 cm.
 * - Centers the model at origin for consistent alignment with suitcase coordinates.
 */
function SneakersModel({ dimensions = [20, 28, 12] }) {
  const { scene } = useGLTF('/sneaker.glb');

  const modelGroup = React.useMemo(() => {
    // Deep clone hierarchy so multiple instances render independently without node collision
    const clone = scene.clone(true);

    // Strip out the 18-meter Blender backdrop plane ('Plane')
    const backdropPlane = clone.getObjectByName('Plane');
    if (backdropPlane && backdropPlane.parent) {
      backdropPlane.parent.remove(backdropPlane);
    }

    // Enable shadow casting and receiving on the shoe meshes
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Compute bounding box of the two shoes
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Target dimensions from catalog: [W, D, H] in cm -> metres
    const targetW = (dimensions[0] || 20) / 100;
    const targetD = (dimensions[1] || 28) / 100;
    const targetH = (dimensions[2] || 12) / 100;

    // Check if oriented dimensions swap the aspect ratio relative to model's natural orientation (size.x < size.z)
    const isSwapped = (targetW > targetD) !== (size.x > size.z);
    if (isSwapped) {
      clone.rotation.y = Math.PI / 2;
      box.setFromObject(clone);
      box.getSize(size);
      box.getCenter(center);
    }

    // Uniform base scale factor to fit within catalog dimensions
    const baseScale = Math.min(
      targetW / (size.x || 1),
      targetD / (size.z || 1),
      targetH / (size.y || 1)
    );

    // Apply a focused ~6.5% visual scale reduction (within requested 5–8% range)
    const scaleFactor = baseScale * 0.935;

    // Center X and Z horizontally; adjust Y offset so soles rest naturally on the surface without floating or clipping
    const scaledHeight = size.y * scaleFactor;
    const yFloorAdjustment = -(targetH - scaledHeight) / 2;

    clone.position.x = -center.x * scaleFactor;
    clone.position.y = -center.y * scaleFactor + yFloorAdjustment;
    clone.position.z = -center.z * scaleFactor;

    const wrapper = new THREE.Group();
    clone.scale.setScalar(scaleFactor);
    wrapper.add(clone);

    return wrapper;
  }, [scene, dimensions]);

  return <primitive object={modelGroup} />;
}

// Preload GLB for instant rendering
useGLTF.preload('/sneaker.glb');

/**
 * 2. HARDCOVER BOOK MODEL (W: 0.16m, D: 0.24m, H: 0.06m)
 * Renders a hardcover book with spine, paper block, and bookmark ribbon.
 */
function HardcoverBookModel({ dimensions, color = '#8b5cf6' }) {
  const W = (dimensions?.[0] || 16) / 100;
  const D = (dimensions?.[1] || 24) / 100;
  const H = (dimensions?.[2] || 6) / 100;
  const coverThick = 0.004;

  return (
    <group position={[0, 0, 0]}>
      {/* Top Cover */}
      <mesh position={[0, H / 2 - coverThick / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, coverThick, D]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Bottom Cover */}
      <mesh position={[0, -H / 2 + coverThick / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, coverThick, D]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Spine (Left -X Edge) */}
      <mesh position={[-W / 2 + coverThick / 2, 0, 0]} castShadow>
        <boxGeometry args={[coverThick, H, D]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Pages Block (Textblock) - Slightly inset on the 3 open sides */}
      <mesh position={[0.005, 0, 0]} receiveShadow>
        <boxGeometry args={[W - coverThick * 2 - 0.01, H - coverThick * 2, D - 0.01]} />
        <meshStandardMaterial color="#fef08a" roughness={0.9} />
      </mesh>

      {/* Gold Foil Title Emboss Accent on Front */}
      <mesh position={[0.01, H / 2 + 0.0005, 0]}>
        <planeGeometry args={[0.08, 0.14]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bookmark Ribbon hanging out at bottom */}
      <mesh position={[0.03, 0, D / 2 + 0.015]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.012, 0.002, 0.04]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * 3. ROLLED T-SHIRT MODEL (W: 0.18m, D: 0.18m, H: 0.10m)
 * Renders a cylindrical fabric roll with concentric roll swirl detail.
 * Accurately fills both height (H) and depth (D) to eliminate unnecessary front/back gaps.
 */
function RolledTshirtModel({ dimensions, color = '#22c55e' }) {
  const W = (dimensions?.[0] || 18) / 100;
  const D = (dimensions?.[1] || 18) / 100;
  const H = (dimensions?.[2] || 10) / 100;

  // Align length along the longer footprint dimension (or X by default)
  const isAlongZ = D > W;
  const length = (isAlongZ ? D : W) * 0.98;
  const transverse = (isAlongZ ? W : D) * 0.98;
  const radiusY = (H / 2) * 0.98;
  const radiusTrans = transverse / 2;
  const scaleTrans = radiusTrans / Math.max(radiusY, 0.001);

  const groupRotation = isAlongZ ? [0, Math.PI / 2, 0] : [0, 0, 0];
  const groupScale = [1, 1, scaleTrans];

  return (
    <group position={[0, 0, 0]} rotation={groupRotation}>
      <group scale={groupScale}>
        {/* Cylindrical Main Rolled Body */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[radiusY, radiusY, length, 32]} />
          <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Outer fold overlap layer */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[radiusY * 1.02, radiusY * 1.02, length * 0.7, 32, 1, true, 0, Math.PI * 1.2]} />
          <meshStandardMaterial color="#16a34a" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>

        {/* Concentric fabric spiral roll caps at both ends */}
        {[-length / 2 - 0.001, length / 2 + 0.001].map((xPos, idx) => (
          <group key={idx} position={[xPos, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <circleGeometry args={[radiusY * 0.98, 24]} />
              <meshStandardMaterial color="#15803d" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.001]}>
              <ringGeometry args={[radiusY * 0.4, radiusY * 0.7, 24]} />
              <meshStandardMaterial color="#86efac" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * 4. FOLDED DENIM MODEL (W: 0.22m, D: 0.30m, H: 0.08m)
 * Renders folded jeans with seams, creases, and gold topstitching.
 */
function FoldedDenimModel({ dimensions, color = '#3b82f6' }) {
  const W = (dimensions?.[0] || 22) / 100;
  const D = (dimensions?.[1] || 30) / 100;
  const H = (dimensions?.[2] || 8) / 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Lower Fold Layer */}
      <mesh position={[0, -H * 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H * 0.48, D]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>

      {/* Upper Fold Layer (Waistband & Top Layer) */}
      <mesh position={[0, H * 0.25, 0.005]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.98, H * 0.46, D * 0.96]} />
        <meshStandardMaterial color="#2563eb" roughness={0.88} />
      </mesh>

      {/* Fold Crease Shadow Inset */}
      <mesh position={[0, 0, D / 2 - 0.01]}>
        <boxGeometry args={[W * 0.99, 0.008, 0.02]} />
        <meshStandardMaterial color="#1d4ed8" roughness={0.9} />
      </mesh>

      {/* Gold Pocket / Jean Double-Stitch Line */}
      <mesh position={[0, H / 2 + 0.001, -0.02]}>
        <planeGeometry args={[W * 0.7, 0.006]} rotation={[-Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>
      <mesh position={[0, H / 2 + 0.001, 0.04]}>
        <planeGeometry args={[W * 0.7, 0.006]} rotation={[-Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>

      {/* Brass Rivet / Button Accent */}
      <mesh position={[0, H / 2 + 0.002, -D * 0.35]}>
        <cylinderGeometry args={[0.008, 0.008, 0.004, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * 5. 15-INCH LAPTOP MODEL (W: 0.35m, D: 0.24m, H: 0.02m)
 * Renders an ultra-sleek anodized aluminum unibody closed laptop.
 */
function Laptop15Model({ dimensions, color = '#475569' }) {
  const W = (dimensions?.[0] || 35) / 100;
  const D = (dimensions?.[1] || 24) / 100;
  const H = (dimensions?.[2] || 2) / 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Bottom Chassis Body */}
      <mesh position={[0, -H * 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H * 0.5, D]} />
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Top Display Lid */}
      <mesh position={[0, H * 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.995, H * 0.48, D * 0.995]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Dark Rear Hinge Strip */}
      <mesh position={[0, 0, -D / 2 + 0.006]}>
        <boxGeometry args={[W * 0.75, H * 0.9, 0.012]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Reflective Top Logo Accent */}
      <mesh position={[0, H / 2 + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.018, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Front Thumb Notch Opening Inset */}
      <mesh position={[0, 0.002, D / 2]}>
        <boxGeometry args={[0.045, 0.004, 0.004]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * 6. TSA LIQUID POUCH MODEL (W: 0.15m, D: 0.10m, H: 0.05m)
 * Renders a clear translucent zip bag with travel bottles inside.
 */
function TsaLiquidPouchModel({ dimensions, color = '#f59e0b' }) {
  const W = (dimensions?.[0] || 15) / 100;
  const D = (dimensions?.[1] || 10) / 100;
  const H = (dimensions?.[2] || 5) / 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Translucent Frosted PVC Pouch Exterior */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshPhysicalMaterial
          color="#e2e8f0"
          transparent
          opacity={0.4}
          roughness={0.15}
          transmission={0.8}
          thickness={0.02}
          ior={1.33}
        />
      </mesh>

      {/* Red/Blue Slider Zipper Top Seal */}
      <group position={[0, H / 2 - 0.004, -D / 2 + 0.008]}>
        {/* Zipper Track */}
        <mesh>
          <boxGeometry args={[W * 0.96, 0.008, 0.008]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        {/* Slider Tab */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.014, 0.012, 0.012]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Interior Travel Bottles Visible Inside Pouch */}
      {/* Bottle 1: Amber Shampoo Bottle */}
      <group position={[-0.038, -0.002, 0.005]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.034, 16]} />
          <meshStandardMaterial color={color} roughness={0.2} transparent opacity={0.85} />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 0.021, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.008, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>

      {/* Bottle 2: Clear Lotion Pump Bottle */}
      <group position={[0.005, -0.002, -0.005]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.032, 16]} />
          <meshStandardMaterial color="#60a5fa" roughness={0.2} transparent opacity={0.8} />
        </mesh>
        {/* Pump Head */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.008, 0.008, 0.014]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>

      {/* Bottle 3: Small Cosmetic Jar */}
      <group position={[0.045, -0.008, 0.01]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.02, 16]} />
          <meshStandardMaterial color="#10b981" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.012, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.005, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 7. SMARTPHONE MODEL (W: 0.16m, D: 0.08m, H: 0.01m)
 * Renders a slim slab with beveled edges, dark OLED glass display, and camera module.
 */
function SmartphoneModel({ dimensions, color = '#06b6d4' }) {
  const W = (dimensions?.[0] || 16) / 100;
  const D = (dimensions?.[1] || 8) / 100;
  const H = (dimensions?.[2] || 1) / 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Sleek Aluminum/Titanium Chassis Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W * 0.98, H * 0.95, D * 0.98]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Glossy OLED Display Screen (Top Face) */}
      <mesh position={[0, H * 0.48, 0]} receiveShadow>
        <boxGeometry args={[W * 0.93, 0.0008, D * 0.92]} />
        <meshStandardMaterial color="#020617" roughness={0.08} metalness={0.92} />
      </mesh>

      {/* Screen Glance Accent */}
      <mesh position={[0, H * 0.48 + 0.0005, 0]}>
        <planeGeometry args={[W * 0.25, D * 0.35]} rotation={[-Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color={color} roughness={0.4} opacity={0.65} transparent />
      </mesh>

      {/* Camera Island & Dual Lenses */}
      <mesh position={[-W * 0.36, H * 0.48 + 0.0006, -D * 0.26]}>
        <boxGeometry args={[W * 0.18, 0.0015, D * 0.32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[-W * 0.36, H * 0.48 + 0.0016, -D * 0.32]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.005, 16]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-W * 0.36, H * 0.48 + 0.0016, -D * 0.20]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.005, 16]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

/**
 * 8. SMALL DIARY MODEL (W: 0.15m, D: 0.11m, H: 0.02m)
 * Renders a compact notebook with hardcover, spine, cream textblock, and elastic closure band.
 */
function SmallDiaryModel({ dimensions, color = '#a855f7' }) {
  const W = (dimensions?.[0] || 15) / 100;
  const D = (dimensions?.[1] || 11) / 100;
  const H = (dimensions?.[2] || 2) / 100;
  const coverThick = 0.0025;

  return (
    <group position={[0, 0, 0]}>
      {/* Front & Back Notebook Hardcover */}
      <mesh position={[0, H / 2 - coverThick / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, coverThick, D]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, -H / 2 + coverThick / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, coverThick, D]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
      </mesh>

      {/* Book Spine on -X Edge */}
      <mesh position={[-W / 2 + coverThick / 2, 0, 0]} castShadow>
        <boxGeometry args={[coverThick, H * 0.98, D]} />
        <meshStandardMaterial color="#6b21a8" roughness={0.5} metalness={0.15} />
      </mesh>

      {/* Cream Paper Pages Textblock */}
      <mesh position={[0.003, 0, 0]} receiveShadow>
        <boxGeometry args={[W - coverThick * 2 - 0.006, H - coverThick * 2, D - 0.006]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.9} />
      </mesh>

      {/* Elastic Closure Band */}
      <mesh position={[W * 0.28, 0, 0]} castShadow>
        <boxGeometry args={[0.008, H * 1.05, D * 1.02]} />
        <meshStandardMaterial color="#3b0764" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * 9. SMALL TOWEL MODEL (W: 0.20m, D: 0.15m, H: 0.06m)
 * Renders soft-looking folded fabric with rounded edges and hemmed border.
 */
function SmallTowelModel({ dimensions, color = '#0d9488' }) {
  const W = (dimensions?.[0] || 20) / 100;
  const D = (dimensions?.[1] || 15) / 100;
  const H = (dimensions?.[2] || 6) / 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Lower Folded Layer */}
      <mesh position={[0, -H * 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.98, H * 0.48, D * 0.98]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>

      {/* Upper Folded Layer */}
      <mesh position={[0, H * 0.24, 0.002]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.96, H * 0.46, D * 0.95]} />
        <meshStandardMaterial color="#14b8a6" roughness={0.95} />
      </mesh>

      {/* Rounded Edge Crease / Fabric Fold */}
      <mesh position={[0, 0, D / 2 - 0.008]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[H * 0.46, H * 0.46, W * 0.96, 24, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>

      {/* Woven Border Ribbon Stripe */}
      <mesh position={[0, H * 0.48, -D * 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 0.94, 0.016]} />
        <meshStandardMaterial color="#ccfbf1" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * 10. SNACK BAR MODEL (W: 0.12m, D: 0.04m, H: 0.02m)
 * Renders a thin rectangular foil wrapper with crimped fin seals at both ends.
 */
function SnackBarModel({ dimensions, color = '#d97706' }) {
  const W = (dimensions?.[0] || 12) / 100;
  const D = (dimensions?.[1] || 4) / 100;
  const H = (dimensions?.[2] || 2) / 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Main Bar Wrapper Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W * 0.84, H * 0.95, D * 0.95]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.65} />
      </mesh>

      {/* Crimped Fin Seals at Both Ends */}
      {[-W * 0.46, W * 0.46].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[W * 0.08, 0.002, D * 0.92]} />
            <meshStandardMaterial color="#b45309" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.0012, 0]}>
            <boxGeometry args={[W * 0.04, 0.001, D * 0.9]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Brand Nutrition / Flavor Accent Stripe */}
      <mesh position={[0, H * 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 0.45, D * 0.65]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * 11. WALLET MODEL (W: 0.12m, D: 0.09m, H: 0.02m)
 * Renders a compact bifold leather wallet form with spine crease and stitch styling.
 */
function WalletModel({ dimensions, color = '#78350f' }) {
  const W = (dimensions?.[0] || 12) / 100;
  const D = (dimensions?.[1] || 9) / 100;
  const H = (dimensions?.[2] || 2) / 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Bifold Leather Bottom Leaf */}
      <mesh position={[0, -H * 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.98, H * 0.46, D * 0.98]} />
        <meshStandardMaterial color={color} roughness={0.65} metalness={0.12} />
      </mesh>

      {/* Bifold Leather Top Leaf */}
      <mesh position={[0, H * 0.22, 0.002]} castShadow receiveShadow>
        <boxGeometry args={[W * 0.96, H * 0.44, D * 0.96]} />
        <meshStandardMaterial color="#451a03" roughness={0.65} metalness={0.12} />
      </mesh>

      {/* Leather Spine Fold Along -X Edge */}
      <mesh position={[-W * 0.48, 0, 0]} castShadow>
        <boxGeometry args={[0.006, H * 0.9, D * 0.96]} />
        <meshStandardMaterial color="#290e02" roughness={0.7} />
      </mesh>

      {/* Outer Card Slot Accent Inset */}
      <mesh position={[W * 0.1, H * 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W * 0.65, D * 0.65]} />
        <meshStandardMaterial color="#92400e" roughness={0.7} />
      </mesh>

      {/* Metallic Logo Badge / Clip Accent */}
      <mesh position={[W * 0.35, H * 0.46, D * 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.005, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * Main PackingItem Component
 * Automatically delegates to the appropriate procedural 3D model
 * and strictly respects canonical catalog dimensions [W, D, H] cm -> /100 metres.
 */
export default function PackingItem({ type, color, dimensions = [10, 10, 10], position = [0, 0, 0], rotation = [0, 0, 0] }) {
  // Convert dimensions to metres for bounding box verification
  const [w, d, h] = dimensions.map((v) => v / 100);

  const renderModel = () => {
    switch (type) {
      case 'sneakers':
        return <SneakersModel dimensions={dimensions} />;
      case 'hardcover_book':
        return <HardcoverBookModel dimensions={dimensions} color={color || '#8b5cf6'} />;
      case 'rolled_tshirt':
        return <RolledTshirtModel dimensions={dimensions} color={color || '#22c55e'} />;
      case 'folded_denim':
        return <FoldedDenimModel dimensions={dimensions} color={color || '#3b82f6'} />;
      case 'laptop_15':
        return <Laptop15Model dimensions={dimensions} color={color || '#475569'} />;
      case 'tsa_liquid_pouch':
        return <TsaLiquidPouchModel dimensions={dimensions} color={color || '#f59e0b'} />;
      case 'smartphone':
      case 'cell_phone':
        return <SmartphoneModel dimensions={dimensions} color={color || '#06b6d4'} />;
      case 'small_diary':
        return <SmallDiaryModel dimensions={dimensions} color={color || '#a855f7'} />;
      case 'small_towel':
        return <SmallTowelModel dimensions={dimensions} color={color || '#0d9488'} />;
      case 'snack_bar':
        return <SnackBarModel dimensions={dimensions} color={color || '#d97706'} />;
      case 'wallet':
        return <WalletModel dimensions={dimensions} color={color || '#78350f'} />;
      default:
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color || '#94a3b8'} roughness={0.5} />
          </mesh>
        );
    }
  };

  return (
    <group position={position} rotation={rotation}>
      {renderModel()}
    </group>
  );
}
