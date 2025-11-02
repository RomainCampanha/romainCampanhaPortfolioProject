"use client";

import { Canvas, ThreeElements, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group } from "three";

const START_POS = new THREE.Vector3(-0.1, 0, 2.8);
const END_POS = new THREE.Vector3(-0.1, 0.0, 3.2);

// Positions spécifiques pour mobile
const START_POS_MOBILE = new THREE.Vector3(0, 0.2, 2.8);
const END_POS_MOBILE = new THREE.Vector3(0, 0, 4.5);

type Romain3DProps = {
  progress?: number;
  phase?: "intro" | "run";
};

type ModelProps = {
  url: string;
  pick: "intro" | "run";
  isMobile: boolean;
  position: [number, number, number];
};

function Rig({ progress = 0 }: { progress?: number }) {
  const { camera } = useThree();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  useFrame(() => {
    const t = THREE.MathUtils.clamp(progress, 0, 1);
    
    const startPos = isMobile ? START_POS_MOBILE : START_POS;
    const endPos = isMobile ? END_POS_MOBILE : END_POS;
    
    const target = new THREE.Vector3().lerpVectors(startPos, endPos, t);
    camera.position.lerp(target, 0.12);
    
    if (isMobile && t > 0.3) {
      console.log('Mobile Camera:', camera.position.toArray(), 'Progress:', t.toFixed(2));
    }
    
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}

function Model({ url, pick, isMobile, position }: ModelProps) {
  const group = useRef<Group>(null!);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  const chosenName = useMemo(() => {
    const rx =
      pick === "intro"
        ? /idle|breath|stand|wave|greet|hello/i
        : /run|jog|walk|sprint|locomotion/i;
    const found = names.find((n) => rx.test(n));
    return found ?? names[0];
  }, [names, pick]);

  useEffect(() => {
    const action = chosenName ? actions[chosenName] : undefined;
    if (!action) return;
    action.reset().fadeIn(0.3).play();
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, chosenName]);

  return (
    <group ref={group} position={position}>
      <primitive object={scene} scale={1.2} position={[0, -1.1, 0]} />
    </group>
  );
}

export default function Romain3D({
  progress = 0,
  phase = "intro",
}: Romain3DProps) {
  const url =
    phase === "run"
      ? "/models/Animation_Running_withSkin.glb"
      : "/models/RomainSalut.glb";

  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

      <Rig progress={progress} />

      <Model 
        key={url} 
        url={url} 
        pick={phase} 
        position={
          isMobile 
            ? phase === "intro" 
              ? [0, 0.1, 0]      // Home mobile : normal
              : [0, -0.5, 0]   // Parcours mobile : plus bas
            : [0, 0, 0]        // Desktop : normal
        }
        isMobile={isMobile}
      />
    </Canvas>
  );
}

useGLTF.preload("/models/RomainSalut.glb");
useGLTF.preload("/models/Animation_Running_withSkin.glb");