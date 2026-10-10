import React from 'react';
import * as THREE from 'three';

/**
 * Procedural Open Suitcase Model
 * Internal Usable Space:
 * Width (X):  0.40 m (40 cm)
 * Depth (Z):  0.55 m (55 cm)
 * Height (Y): 0.20 m (20 cm)
 *
 * Cavity: X in [-0.20, +0.20], Z in [-0.275, +0.275], Y in [0, 0.20]
 */
export default function Suitcase() {
  const W = 0.40; // 40 cm
  const D = 0.55; // 55 cm
  const H = 0.20; // 20 cm
  const wallThick = 0.012; // 1.2 cm outer shell thickness

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Internal Usable Floor (Y = 0) with Grid Guidelines */}
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          color="#0f1523"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Internal Floor Grid lines */}
      <gridHelper
        args={[0.60, 12, '#3b82f6', '#1e293b']}
        position={[0, 0.001, 0]}
      />

      {/* 2. Outer Bottom Shell */}
      <mesh position={[0, -wallThick / 2, 0]} receiveShadow>
        <boxGeometry args={[W + wallThick * 2, wallThick, D + wallThick * 2]} />
        <meshStandardMaterial color="#131826" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* 3. Left Wall (-X) */}
      <mesh position={[-W / 2 - wallThick / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThick, H, D + wallThick * 2]} />
        <meshStandardMaterial color="#161c2c" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* 4. Right Wall (+X) */}
      <mesh position={[W / 2 + wallThick / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThick, H, D + wallThick * 2]} />
        <meshStandardMaterial color="#161c2c" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* 5. Front Wall (+Z) - Low profile / cut for easy visibility of packed items */}
      <mesh position={[0, H * 0.35 / 2, D / 2 + wallThick / 2]} castShadow receiveShadow>
        <boxGeometry args={[W + wallThick * 2, H * 0.35, wallThick]} />
        <meshStandardMaterial color="#161c2c" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* 6. Back Wall (-Z) - Where the hinge is attached */}
      <mesh position={[0, H / 2, -D / 2 - wallThick / 2]} castShadow receiveShadow>
        <boxGeometry args={[W + wallThick * 2, H, wallThick]} />
        <meshStandardMaterial color="#161c2c" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* 7. Aluminum Rim & Corner Protectors */}
      <group position={[0, H, 0]}>
        {/* Left top rim */}
        <mesh position={[-W / 2 - wallThick / 2, 0, 0]}>
          <boxGeometry args={[wallThick * 1.2, 0.008, D + wallThick * 2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Right top rim */}
        <mesh position={[W / 2 + wallThick / 2, 0, 0]}>
          <boxGeometry args={[wallThick * 1.2, 0.008, D + wallThick * 2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Back top rim */}
        <mesh position={[0, 0, -D / 2 - wallThick / 2]}>
          <boxGeometry args={[W + wallThick * 2, 0.008, wallThick * 1.2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* 8. Open Lid (Angled back at ~108 degrees from rear wall) */}
      <group position={[0, H, -D / 2 - wallThick]}>
        {/* Hinge Joint */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, W * 0.8, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Lid Panel Leaning Back */}
        <group rotation={[-Math.PI * 0.62, 0, 0]}>
          {/* Lid Outer Shell */}
          <mesh position={[0, 0, D / 2]} castShadow receiveShadow>
            <boxGeometry args={[W + wallThick * 2, 0.04, D]} />
            <meshStandardMaterial color="#131826" roughness={0.5} metalness={0.3} />
          </mesh>

          {/* Lid Inner Mesh Pocket */}
          <mesh position={[0, 0.021, D / 2]}>
            <boxGeometry args={[W * 0.9, 0.002, D * 0.85]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} wireframe={false} />
          </mesh>

          {/* Zipper lining accent on lid */}
          <mesh position={[0, 0.022, D / 2]}>
            <planeGeometry args={[W * 0.88, D * 0.82]} />
            <meshStandardMaterial color="#2d3748" roughness={0.8} wireframe />
          </mesh>
        </group>
      </group>

      {/* 9. Suitcase Hardware: Wheels & Handle */}
      {/* 4 Wheels underneath */}
      {[
        [-W / 2 + 0.03, -0.04, -D / 2 + 0.04],
        [W / 2 - 0.03, -0.04, -D / 2 + 0.04],
        [-W / 2 + 0.03, -0.04, D / 2 - 0.04],
        [W / 2 - 0.03, -0.04, D / 2 - 0.04],
      ].map(([wx, wy, wz], idx) => (
        <group key={`wheel-${idx}`} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.02, 16]} />
            <meshStandardMaterial color="#0b0f19" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.015, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Front Pull Handle */}
      <group position={[0, H * 0.2, D / 2 + wallThick * 2]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.018, 0.025]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* 10. Subtle Internal Usable Volume Outline (Bounding Box Guide: 40 × 55 × 20 cm) */}
      <lineSegments position={[0, H / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(W, H, D)]} />
        <lineBasicMaterial color="#3b82f6" opacity={0.25} transparent />
      </lineSegments>
    </group>
  );
}
