"use client";

import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";

type SplineChestProps = {
  scrollProgress: number;
  visible: boolean;
};

export default function SplineChest({ scrollProgress, visible }: SplineChestProps) {
  const splineRef = useRef<Application | null>(null);
  const chestRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const onLoad = (spline: Application) => {
    console.log("🎨 Spline loaded!");
    splineRef.current = spline;
    
    // Trouver le coffre
    const chest = spline.findObjectByName("coffreSepareV4");
    
    if (chest) {
      console.log("📦 Coffre trouvé :", chest);
      chestRef.current = chest;
      
      // Désactiver les animations automatiques
      try {
        if ((chest as any).emitter) {
          (chest as any).emitter.enabled = false;
        }
      } catch (e) {
        console.log("Pas d'emitter sur le coffre");
      }
    } else {
      console.warn("⚠️ Coffre non trouvé !");
      console.log("Objects disponibles :", spline.getAllObjects?.());
    }
    
    setIsLoaded(true);
    setHasError(false);
  };

  const onError = (error: any) => {
    console.error("❌ Erreur Spline:", error);
    setHasError(true);
  };

  // Contrôler la rotation et l'animation avec le scroll
  useEffect(() => {
    if (!isLoaded || !chestRef.current) return;

    const chest = chestRef.current;
    
    // === ROTATION 3D (0-50% du scroll) ===
    // Le coffre commence de dos (180°) et tourne vers la caméra (0°)
    const rotationProgress = Math.min(1, scrollProgress * 2); // 0-50% du scroll
    const targetRotationY = Math.PI - (rotationProgress * Math.PI); // 180° → 0°
    
    try {
      if (chest.rotation) {
        chest.rotation.y = targetRotationY;
      }
    } catch (e) {
      console.log("Erreur rotation:", e);
    }
    
    // === OUVERTURE DU COFFRE (50-100% du scroll) ===
    const openProgress = Math.max(0, (scrollProgress - 0.5) * 2);
    
    // Rotation manuelle du couvercle
    if (splineRef.current) {
      const lid = splineRef.current.findObjectByName("Mesh_0001");
      
      if (lid) {
        try {
          if ((lid as any).rotation) {
            // Ouvrir progressivement (0° fermé → 120° ouvert)
            (lid as any).rotation.x = -openProgress * (Math.PI * 0.66);
          }
        } catch (e) {
          console.log("Erreur ouverture:", e);
        }
      }
    }

  }, [scrollProgress, isLoaded]);

  if (!visible) return null;

  const scale = Math.min(1.2, 0.4 + scrollProgress * 0.8);
  const opacity = Math.min(1, scrollProgress * 2);

  // Fallback si erreur de chargement
  if (hasError) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        style={{ opacity: opacity }}
      >
        <div className="bg-amber-900/80 backdrop-blur-sm rounded-3xl p-8 text-white text-center max-w-md">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold mb-2">Coffre Magique</h3>
          <p className="text-sm opacity-80">
            Le coffre 3D est en cours de chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      style={{
        opacity: opacity,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <div 
        className="relative w-full h-full"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* 🎨 Spline Scene avec la BONNE URL */}
        <Spline
          scene="https://prod.spline.design/iYayrjKvjy-W0eXM/scene.splinecode"
          onLoad={onLoad}
          onError={onError}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
          }}
        />
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm font-mono pointer-events-auto z-[100]">
          <div>Scroll: {(scrollProgress * 100).toFixed(1)}%</div>
          <div>Rotation: {((Math.PI - ((Math.min(1, scrollProgress * 2)) * Math.PI)) * 180 / Math.PI).toFixed(0)}°</div>
          <div>Opening: {(Math.max(0, (scrollProgress - 0.5) * 2) * 100).toFixed(1)}%</div>
          <div>Loaded: {isLoaded ? "✅" : "⏳"}</div>
          <div>Chest: {chestRef.current ? "✅" : "❌"}</div>
          <div>Error: {hasError ? "❌" : "✅"}</div>
        </div>
      )}
    </div>
  );
}