"use client";

import { Canvas, ThreeElements, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";

const START_POS = new THREE.Vector3(-0.1, 0, 2.8);
const END_POS = new THREE.Vector3(-0.1, 0.0, 3.2);

type Romain3DProps = {
  progress?: number;
  phase?: "intro" | "run";
};

type ModelProps = ThreeElements["group"] & {
  url: string;
  pick: "intro" | "run";
};

function Rig({ progress = 0 }: { progress?: number }) {
  const { camera } = useThree();
  useFrame(() => {
    const t = THREE.MathUtils.clamp(progress, 0, 1);
    const target = new THREE.Vector3().lerpVectors(START_POS, END_POS, t);
    camera.position.lerp(target, 0.12);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}

function Model({ url, pick, ...props }: ModelProps) {
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
    <group ref={group} {...props}>
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

      {/* Utilise key sur le Model au lieu du Canvas */}
      <Model key={url} url={url} pick={phase} position={[0, 0, 0]} />
    </Canvas>
  );
}

useGLTF.preload("/models/RomainSalut.glb");
useGLTF.preload("/models/Animation_Running_withSkin.glb");