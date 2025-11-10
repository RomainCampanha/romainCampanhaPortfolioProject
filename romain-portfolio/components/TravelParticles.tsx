// components/TravelParticles.tsx
"use client";

import { useEffect, useState } from "react";

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  emoji: string;
  opacity: number;
  scale: number;
};

type TravelParticlesProps = {
  active: boolean; // Quand true, génère des particules
};

const EMOJIS = ["✈️", "🌴", "🗺️", "🎒", "📸", "🌏", "🏖️", "🎉"];

export default function TravelParticles({ active }: TravelParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Générer des particules initiales
    const initialParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      initialParticles.push(createParticle(i));
    }
    setParticles(initialParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            rotation: p.rotation + p.rotationSpeed,
            opacity: p.opacity - 0.01,
            scale: p.scale + 0.002,
          }))
          .filter((p) => p.opacity > 0 && p.y > -100) // Supprimer les particules invisibles
      );
    }, 16);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute text-2xl"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            opacity: p.opacity,
            transition: "all 0.016s linear",
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

function createParticle(id: number): Particle {
  return {
    id,
    x: 30 + Math.random() * 20, // Près du centre-gauche (où est le personnage)
    y: 40 + Math.random() * 20,
    vx: (Math.random() - 0.5) * 2, // Mouvement horizontal
    vy: -Math.random() * 1.5 - 0.5, // Mouvement vers le haut
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    opacity: 1,
    scale: 0.5 + Math.random() * 0.5,
  };
}