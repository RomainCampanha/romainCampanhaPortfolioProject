// app/components/Romain3D.tsx
"use client";

import { Canvas, ThreeElements } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import ChatBubble from "./ChatBubble";

// ✅ Typage sûr et compatible : pas de JSX.*, on utilise ThreeElements
type RomainModelProps = ThreeElements["group"];

function RomainModel(props: RomainModelProps) {
  const group = useRef<Group>(null!); // ref non-null après montage
  const { scene, animations } = useGLTF("/models/RomainSalut.glb");
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions || !names || names.length === 0) return;
    const name = names.find((n) => n.toLowerCase().includes("idle")) ?? names[0];
    const action = actions[name];
    if (!action) return;

    action.reset().fadeIn(0.5).play();
    return () => {
      action.fadeOut(0.3);
      // optionnel : action.stop();
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
    <Canvas 
      className="w-full h-full"
      style={{ display: 'block', background: 'transparent' }}   // ✅
      gl={{ alpha: true }}                                      // ✅
      onCreated={(state) => state.gl.setClearColor(0x000000, 0)}// ✅ transparence sûre
      camera={{ position: [-0.1, 0, 1.6] }} >
      <ambientLight intensity={1} />
      <directionalLight position={[2, 5, 5]} intensity={1.4} />
      <OrbitControls enableZoom={false} />
      {/* décale ton perso à gauche */}
      <RomainModel position={[0, 0, 0]} />
      
    </Canvas>
  );
}

// Préchargement
useGLTF.preload("/models/RomainSalut.glb");
