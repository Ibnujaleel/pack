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
 */
function RolledTshirtModel({ dimensions, color = '#22c55e' }) {
  const W = (dimensions?.[0] || 18) / 100;
  const D = (dimensions?.[1] || 18) / 100;
  const H = (dimensions?.[2] || 10) / 100;
  const length = W * 0.97;
  const radius = Math.min(D, H) / 2 * 0.98;

  return (
    <group position={[0, 0, 0]}>
      {/* Cylindrical Main Rolled Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, length, 32]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Outer fold overlap layer */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius * 1.02, radius * 1.02, length * 0.7, 32, 1, true, 0, Math.PI * 1.2]} />
        <meshStandardMaterial color="#16a34a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Concentric fabric spiral roll caps at both ends */}
      {[-length / 2 - 0.001, length / 2 + 0.001].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <circleGeometry args={[radius * 0.98, 24]} />
            <meshStandardMaterial color="#15803d" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[radius * 0.4, radius * 0.7, 24]} />
            <meshStandardMaterial color="#86efac" roughness={0.8} />
          </mesh>
        </group>
      ))}
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
