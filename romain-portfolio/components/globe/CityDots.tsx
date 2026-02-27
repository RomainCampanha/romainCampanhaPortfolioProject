"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToVector3, CITIES } from "./geoUtils";

type CityDotsProps = {
  activeCity?: string; // City name that should pulse
  radius?: number;
};

const CITY_LIST = Object.values(CITIES);

export default function CityDots({ activeCity, radius = 1 }: CityDotsProps) {
  return (
    <group>
      {CITY_LIST.map((city) => (
        <CityDot
          key={city.name}
          lat={city.lat}
          lng={city.lng}
          name={city.name}
          isActive={city.name === activeCity}
          radius={radius}
        />
      ))}
    </group>
  );
}

function CityDot({
  lat,
  lng,
  name,
  isActive,
  radius,
}: {
  lat: number;
  lng: number;
  name: string;
  isActive: boolean;
  radius: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const pos = latLngToVector3(lat, lng, radius * 1.01); // Slightly above surface

  useFrame((state) => {
    if (glowRef.current) {
      const pulse = isActive
        ? 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5
        : 1;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={pos}>
      {/* Core dot */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial
          color={isActive ? "#ff6b35" : "#4fc3f7"}
        />
      </mesh>
      {/* Glow ring */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial
          color={isActive ? "#ff6b35" : "#4fc3f7"}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
