// app/components/Romain3D.tsx
"use client";

import { Canvas, ThreeElements } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import ChatBubble from "./ChatBubble";

type RomainModelProps = ThreeElements["group"]; // <-- typage safe

function RomainModel(props: RomainModelProps) {
  const { scene } = useGLTF("/models/Animation_Walking_withSkin.glb");
  return (
    <group {...props}>
      <primitive object={scene} scale={1.2} position={[0, -1.1, 0]} />
    </group>
  );
}

export default function Romain3D() {
  return (
    <Canvas camera={{ position: [-0.4, 0.5, 3.2]}}>
      <ambientLight intensity={1} />
      <directionalLight position={[2, 5, 5]} intensity={1.4} />

      <RomainModel position={[-0.5, 0, 0]} />

      <Html position={[0.9, 0.2, 0]} transform distanceFactor={2}>
        <ChatBubble
          text={`Salut, je m'appelle Romain,\nBienvenue chez moi !`}
          typingSpeed={100}
          startDelay={300}
          loop
          loopDelay={2000}
          className="text-[14px] md:text-[16px]"
          ariaLabel="Présentation de Romain"
        />
      </Html>

      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}

useGLTF.preload("/models/Animation_Walking_withSkin.glb");
