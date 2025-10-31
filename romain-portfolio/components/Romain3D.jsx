'use client';

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'

function RomainModel() {
  const { scene } = useGLTF('/models/Animation_Walking_withSkin.glb')
  return <primitive object={scene} scale={1.2} />
}

export default function Romain3D() {
  return (
    <Canvas camera={{ position: [0, 1.5, 3] }}>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} />
      <OrbitControls enableZoom={false} />
      <RomainModel />
    </Canvas>
  )
}

useGLTF.preload('/models/Animation_Walking_withSkin.glb');