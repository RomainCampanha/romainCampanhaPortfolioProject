"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #define PI 3.14159265359

  uniform float uTime;
  uniform sampler2D uEarthSpec;
  uniform vec2 uTexSize;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;

  void main() {
    // Base color: very dark blue
    vec3 oceanColor = vec3(0.02, 0.02, 0.08);
    vec3 landColor = vec3(0.03, 0.04, 0.12);

    // Compute lat/lng from world normal for grid lines
    float lat = asin(clamp(vWorldNormal.y, -1.0, 1.0));
    float lng = atan(vWorldNormal.x, vWorldNormal.z);
    float latDeg = lat * 180.0 / PI;
    float lngDeg = lng * 180.0 / PI;

    // Grid lines every 15 degrees
    float latLine = 1.0 - smoothstep(0.0, 1.0, abs(mod(latDeg + 7.5, 15.0) - 7.5));
    float lngLine = 1.0 - smoothstep(0.0, 1.0, abs(mod(lngDeg + 7.5, 15.0) - 7.5));
    float grid = max(latLine, lngLine);

    // === COASTLINE OUTLINES (edge detection on land mask) ===
    // Sample land mask texture (black = land, white = ocean in this specular map)
    float landMask = 1.0 - texture2D(uEarthSpec, vUv).r; // Invert: 1 = land, 0 = ocean

    // Sobel edge detection - sample 4 neighbors
    vec2 texelSize = 1.0 / uTexSize;
    float maskRight = 1.0 - texture2D(uEarthSpec, vUv + vec2(texelSize.x, 0.0)).r;
    float maskLeft  = 1.0 - texture2D(uEarthSpec, vUv - vec2(texelSize.x, 0.0)).r;
    float maskUp    = 1.0 - texture2D(uEarthSpec, vUv + vec2(0.0, texelSize.y)).r;
    float maskDown  = 1.0 - texture2D(uEarthSpec, vUv - vec2(0.0, texelSize.y)).r;

    // Gradient magnitude = coastline edges
    float gx = maskRight - maskLeft;
    float gy = maskUp - maskDown;
    float edge = sqrt(gx * gx + gy * gy);
    float coastline = smoothstep(0.1, 0.4, edge);

    // Grid colors
    vec3 gridColor = vec3(0.08, 0.22, 0.45);
    vec3 coastColor = vec3(0.2, 0.7, 1.0); // Bright cyan for coastlines

    // Fresnel glow on sphere edges
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
    vec3 fresnelColor = vec3(0.2, 0.4, 0.9);

    // Combine: base (land slightly lighter) + grid + coastlines + fresnel
    vec3 baseColor = mix(oceanColor, landColor, landMask);
    vec3 color = mix(baseColor, gridColor, grid * 0.5);
    color = mix(color, coastColor, coastline * 0.9);
    color += fresnelColor * fresnel * 0.35;

    // Subtle pulse
    float pulse = 0.9 + 0.1 * sin(uTime * 0.5);
    color *= pulse;

    gl_FragColor = vec4(color, 0.95);
  }
`;

type GlobeMeshProps = {
  earthTexture?: THREE.Texture | null;
};

export default function GlobeMesh({ earthTexture }: GlobeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Stable uniforms — never recreated, texture updated imperatively
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEarthSpec: { value: new THREE.Texture() },
      uTexSize: { value: new THREE.Vector2(1000, 500) },
    }),
    []
  );

  // When earthTexture loads, inject it into the existing material
  useEffect(() => {
    if (earthTexture && materialRef.current) {
      materialRef.current.uniforms.uEarthSpec.value = earthTexture;
      materialRef.current.uniformsNeedUpdate = true;
    }
  }, [earthTexture]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
