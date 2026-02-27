"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Hook-style rig that controls a group ref's rotation.
 * Combines: flight target rotation + auto-rotation + user drag offset.
 */
export function useGlobeRig(
  groupRef: React.RefObject<THREE.Group | null>,
  targetRotationY: number,
  isFlying: boolean,
  userDragOffsetY: number = 0
) {
  const currentRotY = useRef(0);
  const autoRotOffset = useRef(0);
  const initialized = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!initialized.current) {
      currentRotY.current = targetRotationY;
      initialized.current = true;
    }

    // Auto-rotation (continuous slow spin)
    autoRotOffset.current += delta * 0.15;

    // During flight: lerp towards flight target + user drag (user can rotate globe during flight)
    // Idle: apply auto-rotation + user drag
    if (isFlying) {
      // Reset auto offset smoothly during flight
      autoRotOffset.current *= 0.95;
      const flightTarget = targetRotationY + userDragOffsetY;
      currentRotY.current += (flightTarget - currentRotY.current) * 0.04;
    } else {
      // Idle: combine target + auto + user drag
      const idleTarget = targetRotationY + autoRotOffset.current + userDragOffsetY;
      currentRotY.current += (idleTarget - currentRotY.current) * 0.06;
    }

    groupRef.current.rotation.y = currentRotY.current;
  });
}
