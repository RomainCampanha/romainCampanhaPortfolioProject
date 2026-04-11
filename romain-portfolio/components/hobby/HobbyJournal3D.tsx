"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DESTINATIONS } from "./destinationsConfig";
import DestinationScene from "./DestinationScene";
import JourneyCamera from "./JourneyCamera";
import AtmosphereParticles from "./AtmosphereParticles";

type HobbyJournal3DProps = {
  /** Journey progress 0..1 (already remapped from the global page progress) */
  progress: number;
};

/** Spacing along the Z axis between two consecutive destination "worlds" */
const SCENE_GAP = 22;

/**
 * Single R3F Canvas containing the whole travel journey.
 * - One Canvas, one GL context — no double-canvas penalty
 * - Progress is stored in a ref so children read it without React re-renders
 */
export default function HobbyJournal3D({ progress }: HobbyJournal3DProps) {
  // Stable ref written each render — children read this in useFrame
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Camera Z is written by JourneyCamera and read by every DestinationScene
  const cameraZRef = useRef(0);

  // Atmosphere color (lerps between destination colors)
  const atmosphereColorRef = useRef(new THREE.Color(DESTINATIONS[0].color));

  // Pre-parse destination colors once
  const destColors = useMemo(
    () => DESTINATIONS.map((d) => new THREE.Color(d.color)),
    []
  );

  // Z position of each destination (negative — camera flies down -Z)
  const sceneZs = useMemo(
    () => DESTINATIONS.map((_, i) => -i * SCENE_GAP),
    []
  );

  // Camera stations: pause at each destination so the user has time to look.
  // Each scene gets a `hold` window of journey progress; transitions split
  // the remainder. With 5 scenes × 0.14 = 0.70 hold, leaving 0.075 per
  // transition (4 transitions).
  // The camera "viewing" Z for a destination sits a few units in front of
  // its center along Z so the polaroids fit in frame.
  const stations = useMemo(
    () =>
      sceneZs.map((z) => ({
        z: z + 7, // viewing distance in front of the destination
        hold: 0.14,
      })),
    [sceneZs]
  );

  const startZ = stations[0].z;

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ position: [0, 0, startZ], fov: 55, near: 0.1, far: 200 }}
      dpr={[1, 2]}
    >
      <BackgroundColor colorRef={atmosphereColorRef} />

      {/* Soft fill light so polaroid frames pick up some color */}
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 5]} intensity={0.4} />

      <JourneyCamera
        progressRef={progressRef}
        stations={stations}
        cameraZRef={cameraZRef}
      />

      <AtmosphereParticles count={180} spread={70} colorRef={atmosphereColorRef} />

      {/* Drives the atmosphere color based on which scene the camera is closest to */}
      <AmbianceMixer
        cameraZRef={cameraZRef}
        sceneZs={sceneZs}
        destColors={destColors}
        targetRef={atmosphereColorRef}
      />

      {DESTINATIONS.map((dest, i) => (
        <DestinationScene
          key={dest.id}
          destination={dest}
          centerZ={sceneZs[i]}
          cameraZRef={cameraZRef}
          fadeRange={SCENE_GAP * 0.85}
        />
      ))}
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* Internal helpers (kept colocated to avoid extra files)              */
/* ------------------------------------------------------------------ */

/**
 * Updates the scene's clear color from a ref each frame so the background
 * smoothly fades from one destination ambiance to the next.
 */
function BackgroundColor({
  colorRef,
}: {
  colorRef: React.MutableRefObject<THREE.Color>;
}) {
  // Local working color so we don't allocate per frame
  const tmp = useRef(new THREE.Color());

  useFrame(({ scene, gl }) => {
    // Mix toward a darker space tone so polaroids pop
    tmp.current.copy(colorRef.current).lerp(new THREE.Color("#0a0a14"), 0.78);
    scene.background = tmp.current;
    gl.setClearColor(tmp.current, 1);
  });

  // Initialize once
  useEffect(() => {
    // no-op — first frame will set it
  }, []);

  return null;
}

/**
 * Lerps `targetRef` toward the color of the destination the camera is closest
 * to. Used by both the background and AtmosphereParticles.
 */
function AmbianceMixer({
  cameraZRef,
  sceneZs,
  destColors,
  targetRef,
}: {
  cameraZRef: React.MutableRefObject<number>;
  sceneZs: number[];
  destColors: THREE.Color[];
  targetRef: React.MutableRefObject<THREE.Color>;
}) {
  useFrame((_, delta) => {
    // Find nearest two scenes and blend by distance
    const camZ = cameraZRef.current;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < sceneZs.length; i++) {
      const d = Math.abs(sceneZs[i] - camZ);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    // Blend between nearest and its neighbor based on signed offset
    const nearestZ = sceneZs[nearestIdx];
    const dir = camZ < nearestZ ? 1 : -1; // moving forward = next scene
    const neighborIdx = Math.max(
      0,
      Math.min(sceneZs.length - 1, nearestIdx + dir)
    );
    const span = Math.abs(sceneZs[neighborIdx] - nearestZ) || 1;
    const t = Math.max(0, Math.min(1, nearestDist / span));

    // Build a temp blended color
    const blended = destColors[nearestIdx].clone().lerp(destColors[neighborIdx], t);

    // Smooth follow toward blended
    const k = 1 - Math.exp(-delta * 3);
    targetRef.current.lerp(blended, k);
  });
  return null;
}
