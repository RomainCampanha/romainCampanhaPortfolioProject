// app/components/Romain3D.tsx
"use client";

import { Canvas, ThreeElements, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";

// === Paramètres caméra (on conserve TON orientation de départ) ===
const START_POS = new THREE.Vector3(-0.1, 0, 3);   // proche
const END_POS   = new THREE.Vector3(-0.1, 0.0, 3.2); // dézoom quand progress=1 (ajuste si tu veux)

type RomainModelProps = ThreeElements["group"];
type Romain3DProps = { progress?: number }; // 0..1

function Rig({ progress = 0 }: { progress?: number }) {
  const { camera } = useThree();

  useFrame(() => {
    // Lerp caméra entre START_POS et END_POS selon le progress (0..1)
    const target = new THREE.Vector3().lerpVectors(START_POS, END_POS, THREE.MathUtils.clamp(progress, 0, 1));
    // Lerp doux à chaque frame pour éviter les à-coups
    camera.position.lerp(target, 0.12);
    // Regarde le centre (ajuste si tu veux viser plus haut, ex: lookAt(0, 1.2, 0))
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

function RomainModel({ progress = 0, ...props }: RomainModelProps & { progress?: number }) {
  const group = useRef<Group>(null!);
  const { scene, animations } = useGLTF("/models/RomainSalut.glb");
  const { actions, names } = useAnimations(animations, group);

  // Choix des anims
  const idleName = names.find((n) => /idle|breath|stand/i.test(n)) ?? names[0];
  const altName  = names.find((n) => /wave|walk|talk|point/i.test(n)) ?? names[names.length - 1];

  // Lance l'idle une seule fois au montage
  useEffect(() => {
    const idle = actions[idleName];
    if (!idle) return;
    idle.reset().fadeIn(0.4).play();
    return () => { idle.fadeOut(0.2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, idleName]); // actions est stable côté drei; pas de dépendances superflues

  // Switch d'anim en franchissant un seuil, sans clignoter
  const isAltRef = useRef(false);
  useEffect(() => {
    const threshold = 0.25; // ajuste le palier de switch
    const wantAlt = progress >= threshold;
    if (wantAlt === isAltRef.current) return;

    const idle = actions[idleName];
    const alt  = actions[altName];
    if (wantAlt) {
      alt?.reset().fadeIn(0.3).play();
      idle?.fadeOut(0.2);
    } else {
      idle?.reset().fadeIn(0.3).play();
      alt?.fadeOut(0.2);
    }
    isAltRef.current = wantAlt;
  }, [progress, actions, idleName, altName]);

  return (
    <group ref={group} {...props}>
      <primitive object={scene} scale={1.2} position={[0, -1.1, 0]} />
    </group>
  );
}

export default function Romain3D({ progress = 0 }: Romain3DProps) {
  return (
    <Canvas
      className="w-full h-full"
      style={{ display: "block", background: "transparent" }}
      gl={{ alpha: true }}
      onCreated={(state) => state.gl.setClearColor(0x000000, 0)}
      camera={{ position: START_POS.toArray() as [number, number, number], fov: 45 }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[2, 5, 5]} intensity={1.4} />

      {/* 👉 Pas d'OrbitControls = pas de rotation au doigt/scroll.
          Si tu veux les garder mais verrouillés : 
          <OrbitControls enabled={false} enableZoom={false} enableRotate={false} enablePan={false} /> */}

      <Rig progress={progress} />
      <RomainModel progress={progress} position={[0, 0, 0]} />
    </Canvas>
  );
}

// Préchargement
useGLTF.preload("/models/RomainSalut.glb");
