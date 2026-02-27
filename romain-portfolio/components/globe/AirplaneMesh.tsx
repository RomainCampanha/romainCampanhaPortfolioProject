"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createFlightArc } from "./geoUtils";
import type { CityCoord } from "./types";

type AirplaneMeshProps = {
  from: CityCoord;
  to: CityCoord;
  progress: number; // 0-1
  radius?: number;
};

export default function AirplaneMesh({
  from,
  to,
  progress,
  radius = 1,
}: AirplaneMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const curve = useMemo(
    () => createFlightArc(from, to, radius, 0.4),
    [from, to, radius]
  );

  useFrame(() => {
    if (!groupRef.current) return;

    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Position along the arc
    const pos = curve.getPointAt(clampedProgress);
    groupRef.current.position.copy(pos);

    // Orient along the tangent
    const tangent = curve.getTangentAt(clampedProgress);
    const up = pos.clone().normalize(); // "up" is away from globe center
    const lookTarget = pos.clone().add(tangent);
    groupRef.current.lookAt(lookTarget);
    // Tilt the airplane so it's aligned with the globe surface
    groupRef.current.up.copy(up);
  });

  return (
    <group ref={groupRef}>
      {/* Simple airplane shape: cone + wings */}
      <group rotation={[0, Math.PI / 2, 0]} scale={0.06}>
        {/* Fuselage */}
        <mesh>
          <coneGeometry args={[0.3, 1.5, 4]} />
          <meshBasicMaterial color="#ff8c42" />
        </mesh>
        {/* Wings */}
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[2.5, 0.06, 0.5]} />
          <meshBasicMaterial color="#ff6b35" />
        </mesh>
        {/* Tail */}
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[1, 0.06, 0.25]} />
          <meshBasicMaterial color="#ff6b35" />
        </mesh>
      </group>
      {/* Glow around airplane */}
      <pointLight color="#ff6b35" intensity={4} distance={0.5} />
    </group>
  );
}
