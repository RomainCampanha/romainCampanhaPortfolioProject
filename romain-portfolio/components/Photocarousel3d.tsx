"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type PhotoCarousel3DProps = {
  images: string[]; // Chemins des images
  rotationSpeed?: number; // Vitesse de rotation (contrôlée par scroll)
  radius?: number; // Rayon du cercle
};

// Composant pour une photo individuelle
function Photo({ 
  position, 
  rotation, 
  imageUrl 
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  imageUrl: string;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    console.log(`🖼️ Tentative de chargement: ${imageUrl}`);
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        console.log(`✅ Image chargée avec succès: ${imageUrl}`);
        // Important : configurer la texture correctement
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      },
      (progress) => {
        console.log(`⏳ Chargement en cours: ${imageUrl} - ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
      },
      (error) => {
        console.error(`❌ Échec de chargement: ${imageUrl}`, error);
      }
    );
  }, [imageUrl]);
  
  if (!texture) {
    // Placeholder gris pendant le chargement
    return (
      <mesh position={position} rotation={rotation}>
        <planeGeometry args={[2, 3]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
    );
  }
  
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[2, 3]} />
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// Composant du carrousel qui tourne
function CarouselRing({ 
  images, 
  rotationSpeed 
}: { 
  images: string[]; 
  rotationSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const radius = 8; // Rayon du cercle
  const photoCount = images.length;

  // Rotation automatique + contrôle manuel
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed * 0.01; // Rotation continue
    }
  });

  // Calculer les positions des photos en cercle
  const photoPositions = images.map((_, index) => {
    const angle = (index / photoCount) * Math.PI * 2;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    
    // Rotation pour que la photo soit inclinée vers le centre
    const rotationY = -angle;
    
    return {
      position: [x, 0, z] as [number, number, number],
      rotation: [0, rotationY, 0] as [number, number, number],
    };
  });

  return (
    <group ref={groupRef}>
      {images.map((imageUrl, index) => (
        <Photo
          key={index}
          position={photoPositions[index].position}
          rotation={photoPositions[index].rotation}
          imageUrl={imageUrl}
        />
      ))}
    </group>
  );
}

// Caméra et contrôles
function CameraRig() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Position de la caméra : de face, légèrement en hauteur
    camera.position.set(0, 2, 12);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
}

// Composant principal du carrousel
export default function PhotoCarousel3D({ 
  images, 
  rotationSpeed = 0.5, // Vitesse par défaut
  radius = 8 
}: PhotoCarousel3DProps) {
  const [currentSpeed, setCurrentSpeed] = useState(rotationSpeed);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gestion du scroll/swipe pour contrôler la vitesse
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastY = 0;
    let velocity = rotationSpeed;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Le scroll influence la vitesse
      velocity += e.deltaY * 0.001;
      velocity = THREE.MathUtils.clamp(velocity, -2, 2);
      setCurrentSpeed(velocity);

      // Retour progressif à la vitesse normale
      setTimeout(() => {
        velocity *= 0.95;
        if (Math.abs(velocity) < 0.1) velocity = rotationSpeed;
        setCurrentSpeed(velocity);
      }, 100);
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = lastY - currentY;
      
      velocity += deltaY * 0.01;
      velocity = THREE.MathUtils.clamp(velocity, -2, 2);
      setCurrentSpeed(velocity);
      
      lastY = currentY;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [rotationSpeed]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      <Canvas>
        <CameraRig />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        {images.length > 0 && (
          <CarouselRing images={images} rotationSpeed={currentSpeed} />
        )}
      </Canvas>
    </div>
  );
}