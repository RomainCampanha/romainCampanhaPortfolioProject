"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type PlaceholderSceneProps = {
  /** Tinted color for the panel border / glow */
  color: string;
  /** Whole-mesh opacity (0–1), controlled by parent for fade in/out */
  opacityRef: React.MutableRefObject<number>;
};

/**
 * The "📸 Photos coming soon" panel rendered for destinations with photoCount === 0.
 * A floating dashed-border card with a camera icon (text), positioned where the
 * polaroids would normally be.
 */
export default function PlaceholderScene({ color, opacityRef }: PlaceholderSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const panelMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const borderMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.15;
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.04;

    const op = opacityRef.current;
    if (panelMatRef.current) panelMatRef.current.opacity = op * 0.18;
    if (borderMatRef.current) borderMatRef.current.opacity = op * 0.9;
  });

  const panelW = 5.5;
  const panelH = 3.2;
  const borderThickness = 0.08;

  return (
    <group ref={groupRef}>
      {/* Translucent backing panel */}
      <mesh>
        <planeGeometry args={[panelW, panelH]} />
        <meshBasicMaterial
          ref={panelMatRef}
          color={color}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* Border frame — 4 thin planes with the destination color */}
      <mesh position={[0, panelH / 2, 0.001]}>
        <planeGeometry args={[panelW, borderThickness]} />
        <meshBasicMaterial ref={borderMatRef} color={color} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -panelH / 2, 0.001]}>
        <planeGeometry args={[panelW, borderThickness]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh position={[-panelW / 2, 0, 0.001]}>
        <planeGeometry args={[borderThickness, panelH]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh position={[panelW / 2, 0, 0.001]}>
        <planeGeometry args={[borderThickness, panelH]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Camera icon */}
      <Text
        position={[0, 0.6, 0.01]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        📸
      </Text>

      {/* Main label */}
      <Text
        position={[0, -0.45, 0.01]}
        fontSize={0.36}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
      >
        PHOTOS BIENTÔT
      </Text>

      {/* Sub label */}
      <Text
        position={[0, -1.0, 0.01]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.7}
      >
        à venir prochainement
      </Text>
    </group>
  );
}
