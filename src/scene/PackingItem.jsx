import React from 'react';
import * as THREE from 'three';

/**
 * 1. HIGH-REALISM SNEAKERS MODEL (W: 0.20m, D: 0.28m, H: 0.12m)
 * Renders a sculpted, realistic sneaker pair strictly within 20 × 28 × 12 cm.
 * Features:
 * - Layered dual-density sole (gripped outsole + sculpted EVA midsole + toe spring)
 * - Ergonomically shaped upper with rounded toe cap and side quarter panels
 * - Contrast athletic side sweep overlay
 * - Padded ankle collar with dark sockliner recess
 * - Detailed eyestay with metallic eyelets and criss-cross laces
 * - Padded tongue with branding patch and rear heel pull-loop
 */
function SneakersModel({ color = '#ea580c' }) {
  const shoeW = 0.088; // Total width for pair: 0.088 * 2 + 0.016 gap = 0.192m <= 0.20m
  const shoeL = 0.265; // Total depth: <= 0.28m
  const heelLift = 0.012; // Heel-to-toe drop

  const renderSingleShoe = (isLeft) => {
    const xPos = isLeft ? -0.051 : 0.051;
    const curveSign = isLeft ? -1 : 1; // Slight lateral curvature for foot shape

    return (
      <group key={isLeft ? 'left' : 'right'} position={[xPos, 0, 0]}>
        {/* === A. LAYERED SOLE SYSTEM === */}
        {/* 1. Outsole Tread Base (Dark Rubber) */}
        <mesh position={[0, 0.005, 0]} receiveShadow>
          <boxGeometry args={[shoeW * 0.96, 0.01, shoeL * 0.98]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>

        {/* 2. Sculpted EVA Midsole - Heel Wedge (taller at rear) */}
        <mesh position={[0, 0.018 + heelLift / 2, -shoeL * 0.2]} castShadow receiveShadow>
          <boxGeometry args={[shoeW, 0.026 + heelLift, shoeL * 0.55]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>

        {/* 3. Sculpted EVA Midsole - Forefoot with Toe Spring (tapers towards front) */}
        <group position={[0, 0.018, shoeL * 0.25]} rotation={[-0.04, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[shoeW * 0.98, 0.022, shoeL * 0.48]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
        </group>

        {/* 4. Midsole Accent Groove Stripe */}
        <mesh position={[0, 0.022, -shoeL * 0.05]}>
          <boxGeometry args={[shoeW * 1.01, 0.003, shoeL * 0.85]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>

        {/* === B. UPPER BODY & PANELS === */}
        {/* 5. Main Foot Bed / Lower Upper */}
        <mesh position={[curveSign * 0.002, 0.042, -shoeL * 0.02]} castShadow receiveShadow>
          <boxGeometry args={[shoeW * 0.90, 0.038, shoeL * 0.88]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>

        {/* 6. Rounded Toe Box (Curved Front Cap) */}
        <group position={[curveSign * 0.002, 0.032, shoeL * 0.34]}>
          {/* Rounded Front Cap */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.022, 0.022, shoeW * 0.84, 24, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
          {/* Protective Front Rubber Toe Bumper */}
          <mesh position={[0, -0.005, 0.014]} castShadow>
            <boxGeometry args={[shoeW * 0.75, 0.018, 0.012]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
          </mesh>
        </group>

        {/* 7. Perforated Vamp Top Panel */}
        <mesh position={[curveSign * 0.002, 0.048, shoeL * 0.18]} rotation={[-0.14, 0, 0]}>
          <planeGeometry args={[shoeW * 0.58, shoeL * 0.24]} />
          <meshStandardMaterial color="#c2410c" roughness={0.7} />
        </mesh>

        {/* 8. Contrast Athletic Side Sweep (Swoosh / Racing Stripe) */}
        {[-1, 1].map((side) => (
          <group key={`stripe-${side}`} position={[side * (shoeW * 0.455), 0.045, -shoeL * 0.04]}>
            {/* Main sweeping stripe */}
            <mesh rotation={[0, side * Math.PI / 2, 0.22]}>
              <boxGeometry args={[shoeL * 0.45, 0.007, 0.002]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Secondary lower accent accent */}
            <mesh position={[0, -0.01, 0.02]} rotation={[0, side * Math.PI / 2, 0.12]}>
              <boxGeometry args={[shoeL * 0.32, 0.004, 0.002]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* === C. REAR COLLAR & HEEL SYSTEM === */}
        {/* 9. Reinforced Heel Counter Wrap */}
        <mesh position={[0, 0.062, -shoeL * 0.32]} castShadow receiveShadow>
          <boxGeometry args={[shoeW * 0.88, 0.052, shoeL * 0.28]} />
          <meshStandardMaterial color="#9a3412" roughness={0.45} />
        </mesh>

        {/* 10. Sculpted Padded Collar Rim */}
        <mesh position={[0, 0.092, -shoeL * 0.25]} castShadow>
          <boxGeometry args={[shoeW * 0.82, 0.032, shoeL * 0.28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>

        {/* 11. Recessed Interior Sockliner Cavity */}
        <mesh position={[0, 0.098, -shoeL * 0.22]}>
          <boxGeometry args={[shoeW * 0.58, 0.022, shoeL * 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* 12. Rear Heel Pull Loop */}
        <mesh position={[0, 0.088, -shoeL * 0.455]}>
          <boxGeometry args={[0.014, 0.034, 0.004]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>

        {/* === D. EYESTAY, EYELETS & CRISS-CROSS LACES === */}
        {/* 13. Padded Tongue extending upward */}
        <group position={[0, 0.086, 0.02]} rotation={[-0.32, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[shoeW * 0.56, 0.018, shoeL * 0.34]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          {/* Tongue Branding Patch */}
          <mesh position={[0, 0.01, -shoeL * 0.12]}>
            <planeGeometry args={[shoeW * 0.42, 0.024]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        </group>

        {/* 14. Eyestay Panels along throat */}
        {[-1, 1].map((side) => (
          <group key={`eyestay-${side}`} position={[side * (shoeW * 0.28), 0.068, 0.04]} rotation={[-0.22, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.012, 0.008, shoeL * 0.32]} />
              <meshStandardMaterial color="#c2410c" roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* 15. Metallic Eyelet Grommets (5 pairs) */}
        {[-0.08, -0.04, 0, 0.04, 0.08].map((zOffset, idx) => (
          <group key={`eyelets-${idx}`} position={[0, 0.076 + idx * 0.004, zOffset]}>
            {/* Left Eyelet Ring */}
            <mesh position={[-shoeW * 0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.003, 0.003, 0.003, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right Eyelet Ring */}
            <mesh position={[shoeW * 0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.003, 0.003, 0.003, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* 16. Detailed Criss-Cross Laces & Bow */}
        {[-0.06, -0.02, 0.02, 0.06].map((zOffset, idx) => {
          const yOffset = 0.078 + idx * 0.005;
          const isEven = idx % 2 === 0;
          return (
            <group key={`cross-lace-${idx}`} position={[0, yOffset, zOffset]}>
              {/* Criss-Cross Diagonal Lace Strand A */}
              <mesh rotation={[0, isEven ? 0.42 : -0.42, 0]}>
                <boxGeometry args={[shoeW * 0.52, 0.003, 0.005]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.4} />
              </mesh>
              {/* Criss-Cross Diagonal Lace Strand B */}
              <mesh rotation={[0, isEven ? -0.42 : 0.42, 0]}>
                <boxGeometry args={[shoeW * 0.52, 0.003, 0.005]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.4} />
              </mesh>
            </group>
          );
        })}

        {/* 17. Tied Lace Knot & Bow loops at top */}
        <group position={[0, 0.104, -0.04]} rotation={[-0.2, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.006, 12, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          {/* Left Bow Loop */}
          <mesh position={[-0.016, 0.002, 0]} rotation={[0, 0, 0.35]}>
            <torusGeometry args={[0.012, 0.0025, 8, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          {/* Right Bow Loop */}
          <mesh position={[0.016, 0.002, 0]} rotation={[0, 0, -0.35]}>
            <torusGeometry args={[0.012, 0.0025, 8, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        </group>
      </group>
    );
  };

  return (
    <group position={[0, 0, 0]}>
      {renderSingleShoe(true)}
      {renderSingleShoe(false)}
    </group>
  );
}

/**
 * 2. HARDCOVER BOOK MODEL (W: 0.16m, D: 0.24m, H: 0.06m)
 * Renders a hardcover book with spine, paper block, and bookmark ribbon.
 */
function HardcoverBookModel({ color = '#8b5cf6' }) {
  const W = 0.16;
  const D = 0.24;
  const H = 0.06;
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
function RolledTshirtModel({ color = '#22c55e' }) {
  const radius = 0.049; // diameter 0.098m <= 0.10m H
  const length = 0.175; // <= 0.18m W/D

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
function FoldedDenimModel({ color = '#3b82f6' }) {
  const W = 0.22;
  const D = 0.30;
  const H = 0.08;

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
function Laptop15Model({ color = '#475569' }) {
  const W = 0.35;
  const D = 0.24;
  const H = 0.02;

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
function TsaLiquidPouchModel({ color = '#f59e0b' }) {
  const W = 0.15;
  const D = 0.10;
  const H = 0.05;

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
        return <SneakersModel color={color || '#ea580c'} />;
      case 'hardcover_book':
        return <HardcoverBookModel color={color || '#8b5cf6'} />;
      case 'rolled_tshirt':
        return <RolledTshirtModel color={color || '#22c55e'} />;
      case 'folded_denim':
        return <FoldedDenimModel color={color || '#3b82f6'} />;
      case 'laptop_15':
        return <Laptop15Model color={color || '#475569'} />;
      case 'tsa_liquid_pouch':
        return <TsaLiquidPouchModel color={color || '#f59e0b'} />;
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
