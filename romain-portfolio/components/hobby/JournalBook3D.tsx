"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type JournalBook3DProps = {
  /** Optional callback when the book is clicked (e.g. to scroll to journey) */
  onClick?: () => void;
};

/**
 * Standalone Canvas containing a single interactive "travel journal" book.
 * - Floats with a gentle sin/cos animation
 * - Can be dragged to rotate (free orbit)
 * - Glows on hover
 *
 * Used during the intro phase as a small, ambient interaction that hints
 * "click me / drag me" while the user is reading the bubble.
 */
export default function JournalBook3D({ onClick }: JournalBook3DProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 4, 5]} intensity={1.2} color="#FFE082" />
      <pointLight position={[-3, -2, 4]} intensity={0.6} color="#ffffff" />
      <Book onClick={onClick} />
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* Book mesh — procedural, no GLB needed                               */
/* ------------------------------------------------------------------ */

function Book({ onClick }: { onClick?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const coverMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Drag state in refs to avoid re-renders
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.2, y: -0.4 });
  const rotationVel = useRef({ x: 0, y: 0 });

  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;

    // Apply velocity → angle (so drag has inertia)
    rotation.current.x += rotationVel.current.x;
    rotation.current.y += rotationVel.current.y;
    // Friction
    rotationVel.current.x *= 0.92;
    rotationVel.current.y *= 0.92;

    // Idle wobble (only when not actively dragging)
    if (!isDragging.current) {
      rotation.current.y += Math.sin(t * 0.4) * 0.0025;
      rotation.current.x += Math.cos(t * 0.3) * 0.0015;
    }

    groupRef.current.rotation.x = rotation.current.x;
    groupRef.current.rotation.y = rotation.current.y;

    // Vertical float
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.18;

    // Hover glow on cover
    if (coverMatRef.current) {
      const target = hovered ? 0.55 : 0.15;
      coverMatRef.current.emissiveIntensity +=
        (target - coverMatRef.current.emissiveIntensity) * 0.1;
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    rotationVel.current.y = dx * 0.01;
    rotationVel.current.x = dy * 0.01;
  };
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  // Book dimensions
  const W = 2.4;
  const H = 3.2;
  const D = 0.45;

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Only treat as a click if we didn't drag much
        if (
          Math.abs(rotationVel.current.x) < 0.005 &&
          Math.abs(rotationVel.current.y) < 0.005
        ) {
          onClick?.();
        }
      }}
    >
      {/* Front cover */}
      <mesh position={[0, 0, D / 2]}>
        <boxGeometry args={[W, H, 0.05]} />
        <meshStandardMaterial
          ref={coverMatRef}
          color="#8b5a2b"
          emissive="#FFB300"
          emissiveIntensity={0.15}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Pages (slightly inset) */}
      <mesh>
        <boxGeometry args={[W - 0.08, H - 0.08, D - 0.05]} />
        <meshStandardMaterial color="#fdf6e3" roughness={0.9} />
      </mesh>

      {/* Back cover */}
      <mesh position={[0, 0, -D / 2]}>
        <boxGeometry args={[W, H, 0.05]} />
        <meshStandardMaterial
          color="#8b5a2b"
          emissive="#FFB300"
          emissiveIntensity={0.05}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Spine */}
      <mesh position={[-W / 2, 0, 0]}>
        <boxGeometry args={[0.05, H, D]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.7} />
      </mesh>

      {/* Title text on the front cover */}
      <Text
        position={[0, 0.6, D / 2 + 0.03]}
        fontSize={0.32}
        color="#FFE082"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
        outlineWidth={0.012}
        outlineColor="#000000"
        outlineOpacity={0.4}
        maxWidth={W - 0.3}
        textAlign="center"
      >
        CARNET DE VOYAGE
      </Text>

      {/* Decorative subtitle */}
      <Text
        position={[0, -0.2, D / 2 + 0.03]}
        fontSize={0.16}
        color="#FFE082"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
        letterSpacing={0.1}
      >
        ✈ ROMAIN ✈
      </Text>

      {/* Plane icon */}
      <Text
        position={[0, -0.9, D / 2 + 0.03]}
        fontSize={0.55}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        🌍
      </Text>
    </group>
  );
}
