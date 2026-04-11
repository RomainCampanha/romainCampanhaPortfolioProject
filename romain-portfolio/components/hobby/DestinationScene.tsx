"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { Destination } from "./destinationsConfig";
import { getDestinationPhotos } from "./destinationsConfig";
import { usePhotoTextureCache } from "./usePhotoTextureCache";
import PolaroidPhoto from "./PolaroidPhoto";
import PlaceholderScene from "./PlaceholderScene";

type DestinationSceneProps = {
  destination: Destination;
  /** World position of this scene's center along the camera rail */
  centerZ: number;
  /** Ref the parent updates each frame with the camera's current Z position */
  cameraZRef: React.MutableRefObject<number>;
  /** Distance over which a scene fades in/out (must be smaller than the gap between scenes) */
  fadeRange?: number;
};

/**
 * One destination "world": title + (polaroids OR placeholder) + grouped under a parent
 * that fades in/out based on the camera's distance to its center along the Z axis.
 *
 * Performance: opacity is propagated via a ref (no React state per frame), so
 * polaroids and placeholders read their alpha from the same ref.
 */
export default function DestinationScene({
  destination,
  centerZ,
  cameraZRef,
  fadeRange = 8,
}: DestinationSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const titleMatRef = useRef<THREE.Material | null>(null);

  // Shared opacity ref read by every child polaroid/placeholder mesh
  const opacityRef = useRef(0);

  // Photo URLs (empty when photoCount === 0 → placeholder)
  const photoUrls = useMemo(() => getDestinationPhotos(destination), [destination]);
  const textures = usePhotoTextureCache(photoUrls);

  // Precompute polaroid layout (positions/rotations) once per destination.
  // The camera flies straight along Z, so we lay the polaroids in a wall-like
  // grid in the X/Y plane *in front of* the title (positive Z relative to the
  // group), with deterministic offsets so they overlap nicely without RNG.
  const layout = useMemo(() => {
    const n = photoUrls.length;
    return photoUrls.map((url, i) => {
      // Pick a cell on a 4-wide grid centered horizontally
      const cols = 4;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const totalRows = Math.ceil(n / cols);

      // Cell sizes (world units) — tuned so a 1.6-tall polaroid leaves a small gap
      const cellW = 1.55;
      const cellH = 1.7;

      // Centered grid coords
      const xBase = (col - (cols - 1) / 2) * cellW;
      const yBase = (row - (totalRows - 1) / 2) * cellH - 1.4; // shifted down so it sits below the title

      // Deterministic jitter (golden-ratio based, no RNG)
      const j1 = ((i * 0.6180339887) % 1) - 0.5;
      const j2 = ((i * 0.7548776662) % 1) - 0.5;
      const j3 = ((i * 0.8392867552) % 1) - 0.5;

      const x = xBase + j1 * 0.25;
      const y = yBase + j2 * 0.25;
      // Stagger Z so polaroids overlap depth-wise (in front of the title at z=-2)
      const z = 0 + j3 * 0.6;
      const rotZ = j1 * 0.2;

      return {
        url,
        position: [x, y, z] as [number, number, number],
        rotation: [0, 0, rotZ] as [number, number, number],
        seed: i * 1.37,
      };
    });
  }, [photoUrls]);

  useFrame(() => {
    if (!groupRef.current) return;
    // Distance along Z (camera looks down -Z)
    const dz = Math.abs(cameraZRef.current - centerZ);
    // Smoothstep fade
    const t = Math.max(0, Math.min(1, 1 - dz / fadeRange));
    const opacity = t * t * (3 - 2 * t);
    opacityRef.current = opacity;

    // Hide group entirely when far (saves draw calls)
    groupRef.current.visible = opacity > 0.01;

    // Update title material opacity if it exists
    if (titleMatRef.current && "opacity" in titleMatRef.current) {
      (titleMatRef.current as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  const isPlaceholder = destination.photoCount === 0;

  return (
    <group ref={groupRef} position={[0, 0, centerZ]}>
      {/* Big title — always rendered, glowing color */}
      <Text
        position={[0, 3.4, -2]}
        fontSize={
          destination.title.length > 16
            ? 0.6
            : destination.title.length > 10
            ? 0.95
            : 1.4
        }
        maxWidth={11}
        color={destination.color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
        outlineWidth={0.02}
        outlineColor="#ffffff"
        outlineOpacity={0.3}
      >
        {destination.title}
        <meshBasicMaterial
          ref={(m) => {
            titleMatRef.current = m;
          }}
          attach="material"
          color={destination.color}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </Text>

      {/* Country / date subtitle */}
      <Text
        position={[0, 2.45, -2]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
        fillOpacity={0.7}
      >
        {`${destination.country}  ·  ${destination.date}`}
      </Text>

      {/* Photo polaroids OR placeholder */}
      {isPlaceholder ? (
        <PlaceholderScene color={destination.color} opacityRef={opacityRef} />
      ) : (
        layout.map((item) => (
          <PolaroidPhoto
            key={item.url}
            texture={textures.get(item.url)}
            position={item.position}
            rotation={item.rotation}
            floatSeed={item.seed}
            opacityRef={opacityRef}
            size={1.6}
          />
        ))
      )}
    </group>
  );
}
