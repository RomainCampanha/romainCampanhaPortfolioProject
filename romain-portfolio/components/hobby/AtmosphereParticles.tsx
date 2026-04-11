"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type AtmosphereParticlesProps = {
  /** Total particle count (kept low for perf — default 200) */
  count?: number;
  /** Bounding cube edge length */
  spread?: number;
  /** Hex color (changes per destination via parent) */
  colorRef: React.MutableRefObject<THREE.Color>;
};

/**
 * Drifting dust/fog particles. Uses a single THREE.Points (one draw call).
 * Color is read from a ref so the parent can lerp it across destinations
 * without rebuilding any geometry/material.
 */
export default function AtmosphereParticles({
  count = 200,
  spread = 60,
  colorRef,
}: AtmosphereParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  // Build positions once
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return arr;
  }, [count, spread]);

  // Per-particle drift speed
  const speeds = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = 0.1 + Math.random() * 0.2;
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      // Slow upward drift
      arr[i * 3 + 1] += speeds[i] * delta;
      // Wrap around when out of bounds
      if (arr[i * 3 + 1] > spread * 0.3) {
        arr[i * 3 + 1] = -spread * 0.3;
      }
    }
    posAttr.needsUpdate = true;

    // Sync color from parent ref
    if (matRef.current) {
      matRef.current.color.copy(colorRef.current);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.12}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
