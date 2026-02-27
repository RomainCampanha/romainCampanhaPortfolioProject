"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createFlightArc } from "./geoUtils";
import type { CityCoord } from "./types";

type FlightArcProps = {
  from: CityCoord;
  to: CityCoord;
  progress: number; // 0-1 how far along the flight
  radius?: number;
};

export default function FlightArc({
  from,
  to,
  progress,
  radius = 1,
}: FlightArcProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const lineObjRef = useRef<THREE.Line | null>(null);

  const curve = useMemo(
    () => createFlightArc(from, to, radius, 0.4),
    [from, to, radius]
  );

  const totalPoints = 80;

  // Create line object imperatively
  useEffect(() => {
    if (!groupRef.current) return;

    const geo = new THREE.BufferGeometry();
    const allPoints = curve.getPoints(totalPoints);
    const positions = new Float32Array((totalPoints + 1) * 3);
    for (let i = 0; i < allPoints.length; i++) {
      positions[i * 3] = allPoints[i].x;
      positions[i * 3 + 1] = allPoints[i].y;
      positions[i * 3 + 2] = allPoints[i].z;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const opacities = new Float32Array(totalPoints + 1);
    geo.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: { value: new THREE.Color("#ff6b35") },
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(uColor, vOpacity);
        }
      `,
    });

    const line = new THREE.Line(geo, mat);
    lineObjRef.current = line;
    groupRef.current.add(line);

    return () => {
      groupRef.current?.remove(line);
      geo.dispose();
      mat.dispose();
      lineObjRef.current = null;
    };
  }, [curve, totalPoints]);

  // Update visible portion based on progress
  useFrame(() => {
    if (!lineObjRef.current) return;

    const geo = lineObjRef.current.geometry;
    const opacityAttr = geo.getAttribute("aOpacity") as THREE.BufferAttribute;
    if (!opacityAttr) return;

    const count = opacityAttr.count;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      if (t <= progress) {
        const distFromHead = progress - t;
        const trailLength = 0.3;
        const fade = 1 - Math.min(distFromHead / trailLength, 1);
        opacityAttr.setX(i, fade * fade);
      } else {
        opacityAttr.setX(i, 0);
      }
    }
    opacityAttr.needsUpdate = true;
  });

  return <group ref={groupRef} />;
}
