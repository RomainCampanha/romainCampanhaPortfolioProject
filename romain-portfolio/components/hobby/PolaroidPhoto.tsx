"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type PolaroidPhotoProps = {
  texture: THREE.Texture | undefined;
  position: [number, number, number];
  rotation: [number, number, number];
  /** Floating animation phase offset so multiple polaroids don't sync */
  floatSeed: number;
  /** Whole-mesh opacity (0–1), controlled by parent for fade in/out */
  opacityRef: React.MutableRefObject<number>;
  /** Polaroid size in world units (height; width is 4/5 of this for portrait look) */
  size?: number;
};

/**
 * A floating polaroid photo: white frame + photo plane + drop shadow plane.
 * - Uses individual MeshBasicMaterial with `transparent` so opacity can be lerped per frame.
 * - All animation is local (sin/cos based on time + floatSeed), no React state.
 */
export default function PolaroidPhoto({
  texture,
  position,
  rotation,
  floatSeed,
  opacityRef,
  size = 2.4,
}: PolaroidPhotoProps) {
  const groupRef = useRef<THREE.Group>(null);
  const photoMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const frameMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const shadowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Polaroid proportions: square photo on top, white frame around with bigger bottom
  const photoH = size;
  const photoW = size * 0.85;
  const frameW = photoW + 0.18;
  const frameH = photoH + 0.55; // extra bottom for caption area

  // Manually re-apply the texture map whenever it changes — R3F sometimes
  // doesn't trigger material.needsUpdate when a `null → Texture` swap happens
  // after the material has already been initialized.
  useEffect(() => {
    const mat = photoMatRef.current;
    if (!mat) return;
    mat.map = texture ?? null;
    mat.color.set(texture ? "#ffffff" : "#cccccc");
    mat.needsUpdate = true;
  }, [texture]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    // Subtle float + tilt
    const floatY = Math.sin(t * 0.6 + floatSeed) * 0.08;
    const tilt = Math.sin(t * 0.4 + floatSeed * 1.7) * 0.05;
    groupRef.current.position.set(position[0], position[1] + floatY, position[2]);
    groupRef.current.rotation.set(
      rotation[0] + tilt * 0.5,
      rotation[1] + tilt,
      rotation[2]
    );
    // Apply parent-controlled opacity
    const op = opacityRef.current;
    if (photoMatRef.current) photoMatRef.current.opacity = op;
    if (frameMatRef.current) frameMatRef.current.opacity = op;
    if (shadowMatRef.current) shadowMatRef.current.opacity = op * 0.4;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Drop shadow (a slightly larger black plane behind) */}
      <mesh position={[0.05, -0.05, -0.02]}>
        <planeGeometry args={[frameW + 0.1, frameH + 0.1]} />
        <meshBasicMaterial
          ref={shadowMatRef}
          color="#000000"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      {/* White polaroid frame */}
      <mesh>
        <planeGeometry args={[frameW, frameH]} />
        <meshBasicMaterial
          ref={frameMatRef}
          color="#fafafa"
          transparent
          opacity={1}
        />
      </mesh>
      {/* Photo (offset slightly up so caption space is at bottom) */}
      <mesh position={[0, 0.13, 0.001]}>
        <planeGeometry args={[photoW, photoH]} />
        <meshBasicMaterial
          ref={photoMatRef}
          map={texture ?? null}
          color={texture ? "#ffffff" : "#cccccc"}
          transparent
          opacity={1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
