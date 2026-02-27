"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import GlobeMesh from "./globe/GlobeMesh";
import CityDots from "./globe/CityDots";
import FlightArc from "./globe/FlightArc";
import AirplaneMesh from "./globe/AirplaneMesh";
import { useGlobeRig } from "./globe/GlobeRig";
import { computeGlobeRotationY, FLIGHT_ROUTES } from "./globe/geoUtils";

type TravelGlobeProps = {
  flightIndex: number; // 0, 1, or 2 (which flight route)
  flightProgress: number; // 0-1 how far along the flight
  isFlying: boolean; // Is the airplane actively flying
  userDragOffsetY?: number; // User drag rotation offset
};

// Load texture outside of R3F to avoid Suspense issues
function useEarthTexture() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/textures/earth_spec.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    });
    return () => {
      if (texture) texture.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return texture;
}

function GlobeScene({
  flightIndex,
  flightProgress,
  isFlying,
  userDragOffsetY = 0,
  earthTexture,
}: TravelGlobeProps & { earthTexture: THREE.Texture | null }) {
  const globeGroupRef = useRef<THREE.Group>(null!);

  const route = FLIGHT_ROUTES[flightIndex] || FLIGHT_ROUTES[0];

  // Compute target rotation to center the flight arc
  const targetRotY = computeGlobeRotationY(route.from, route.to);

  // Apply smooth rotation with user drag
  useGlobeRig(globeGroupRef, targetRotY, isFlying, userDragOffsetY);

  // Determine active city (destination when flying)
  const activeCity = isFlying ? route.to.name : undefined;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#4fc3f7" />

      <group ref={globeGroupRef}>
        <GlobeMesh earthTexture={earthTexture} />
        <CityDots activeCity={activeCity} />

        {isFlying && (
          <>
            <FlightArc
              from={route.from}
              to={route.to}
              progress={flightProgress}
            />
            <AirplaneMesh
              from={route.from}
              to={route.to}
              progress={flightProgress}
            />
          </>
        )}
      </group>
    </>
  );
}

export default function TravelGlobe(props: TravelGlobeProps) {
  const earthTexture = useEarthTexture();

  return (
    <Canvas
      className="w-full h-full"
      style={{ background: "transparent" }}
      gl={{ alpha: true }}
      onCreated={(state) => state.gl.setClearColor(0x000000, 0)}
      camera={{ position: [0, 0.3, 2.8], fov: 45 }}
    >
      <Suspense fallback={null}>
        <GlobeScene {...props} earthTexture={earthTexture} />
      </Suspense>
    </Canvas>
  );
}
