// app/components/Romain3D.tsx
"use client";

import { Canvas, ThreeElements } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import ChatBubble from "./ChatBubble";

// ✅ Typage fiable pour un <group> (toutes versions de R3F)
type RomainModelProps = ThreeElements["group"];

function RomainModel(props: RomainModelProps) {
  const group = useRef<Group>(null!);
  const { scene, animations } = useGLTF("/models/RomainSalut.glb");
  const { actions, names } = useAnimations(animations, group);

  // ✅ Effet simplifié et typé correctement
  useEffect(() => {
  if (!names || names.length === 0 || !actions) return;

  const name = names.find((n) => n.toLowerCase().includes("idle")) ?? names[0];
  const action = actions[name];
  if (!action) return;

  action.reset().fadeIn(0.5).play();

  return () => {
    // ne rien retourner ici (juste des effets)
    action.fadeOut(0.3);
    // optionnel : arrêter/nettoyer l’action après le fade
    // action.stop();
  };
}, [actions, names]);

  return (
    <group ref={group} {...props}>
      <primitive object={scene} scale={1.2} position={[0, -1.1, 0]} />
    </group>
  );
}

export default function Romain3D() {
  return (
    <Canvas camera={{ position: [-0.4, 0.5, 3.2] }}>
      <ambientLight intensity={1} />
      <directionalLight position={[2, 5, 5]} intensity={1.4} />

      <RomainModel position={[-0.8, 0, 0]} />

      <Html position={[0.9, 0.2, 0]} transform distanceFactor={2}>
        <ChatBubble
          text={`Salut, je m'appelle Romain,\nBienvenue chez moi !`}
          typingSpeed={90}
          loop
          loopDelay={2000}
          className="whitespace-pre-line max-w-[220px]"
        />
      </Html>

      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}

useGLTF.preload("/models/RomainSalut.glb");
