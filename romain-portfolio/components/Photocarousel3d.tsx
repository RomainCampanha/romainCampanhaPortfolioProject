"use client";

import { useRef, useState, useEffect } from "react";

type PhotoCarousel3DProps = {
  images: string[];
  rotationSpeed?: number;
};

export default function PhotoCarousel3D({ 
  images, 
  rotationSpeed = 0.5 
}: PhotoCarousel3DProps) {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(rotationSpeed);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseY = useRef(0);

  // Rotation automatique
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setRotation(prev => prev + velocity);
      }
    }, 32); // ~60fps

    return () => clearInterval(interval);
  }, [velocity, isDragging]);

  // Gestion du scroll
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newVelocity = velocity + e.deltaY * 0.001;
    setVelocity(Math.max(-2, Math.min(2, newVelocity)));
    
    // Retour progressif à la vitesse normale
    setTimeout(() => {
      setVelocity(v => v * 0.95);
    }, 100);
  };

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouseY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - lastMouseY.current;
    setRotation(prev => prev - deltaY * 0.5);
    lastMouseY.current = e.clientY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const radius = 500; // Rayon du cercle en pixels
  const angleStep = 360 / images.length;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ 
        perspective: "1200px",
        touchAction: "none"
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotation}deg)`,
          transition: isDragging ? "none" : "transform 0.1s linear"
        }}
      >
        {images.map((imageUrl, index) => {
          const angle = index * angleStep;
          const angleRad = (angle * Math.PI) / 180;
          const x = Math.sin(angleRad) * radius;
          const z = Math.cos(angleRad) * radius;

          return (
            <div
              key={index}
              className="absolute"
              style={{
                transform: `translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg)`,
                width: "300px",
                height: "450px",
                transformStyle: "preserve-3d"
              }}
            >
              <img
                src={imageUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg shadow-2xl"
                style={{
                  backfaceVisibility: "visible",
                  border: "8px solid white",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
                }}
                onError={(e) => {
                  console.error(`Erreur chargement image: ${imageUrl}`);
                  e.currentTarget.style.backgroundColor = "#888";
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}