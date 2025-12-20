"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import * as THREE from "three";
import type { Group } from "three";

// === POSITIONS DE CAMÉRA ===
// Accueil/Parcours
const START_POS = new THREE.Vector3(-0.1, 0, 2.8);
const START_POS_MOBILE = new THREE.Vector3(0, 0.2, 3.2);

// Compétences : caméra reculée et légèrement plus basse pour voir le perso centré en bas
const SKILLS_POS = new THREE.Vector3(0, -0.2, 4.2);        // Desktop: reculé + centré + plus bas
const SKILLS_POS_MOBILE = new THREE.Vector3(0, -0.4, 4.0); // Mobile: plus proche et plus bas pour personnage plus grand

// Chatbot
const CHATBOT_POS_DESKTOP = new THREE.Vector3(0, -0.3, 3.8);
const CHATBOT_POS_MOBILE = new THREE.Vector3(0, -0.1, 4.2);

type Romain3DProps = {
  progress?: number;
  phase?: "intro" | "run";
  modelUrl?: string;
  theme?: "home" | "hobby" | "chatbot";
};

type RigProps = {
  progress: number;
  theme: "home" | "hobby" | "chatbot";
  isMobile: boolean;
};

function Rig({ progress, theme, isMobile }: RigProps) {
  const { camera } = useThree();
  
  // Refs pour le lerp fluide
  const currentPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  
  // Calculer la position cible basée sur le progress
  const getTargetPosition = () => {
    if (theme === "chatbot") {
      return isMobile ? CHATBOT_POS_MOBILE : CHATBOT_POS_DESKTOP;
    }
    
    // Home : transition vers compétences à partir de 55%
    const startPos = isMobile ? START_POS_MOBILE : START_POS;
    const skillsPos = isMobile ? SKILLS_POS_MOBILE : SKILLS_POS;
    
    // Avant 55% : position de départ
    if (progress < 0.55) {
      return startPos;
    }
    
    // 55% - 60% : transition fluide vers compétences
    if (progress < 0.60) {
      const t = (progress - 0.55) / 0.05; // 0 → 1
      return new THREE.Vector3().lerpVectors(startPos, skillsPos, t);
    }
    
    // Après 60% : position compétences
    return skillsPos;
  };
  
  useFrame(() => {
    const targetPos = getTargetPosition();
    
    // Initialiser la position au premier frame
    if (!initialized.current) {
      currentPos.current.copy(targetPos);
      camera.position.copy(targetPos);
      initialized.current = true;
    }
    
    // 🔥 Lerp fluide - exactement comme le mobile fait pour accueil → parcours
    currentPos.current.lerp(targetPos, 0.08);
    camera.position.copy(currentPos.current);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

function Model({ url, isMobile, phase, progress, theme }: { 
  url: string; 
  isMobile: boolean;
  phase: "intro" | "run";
  progress: number;
  theme: "home" | "hobby" | "chatbot";
}) {
  const group = useRef<Group>(null!);
  
  // Refs pour les animations fluides
  const currentY = useRef(0);
  const currentScale = useRef(1);
  const initialized = useRef(false);
  
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  const chosenName = useMemo(() => {
    const rx = /idle|breath|stand|wave|greet|hello|salut/i;
    return names.find((n) => rx.test(n)) ?? names[0];
  }, [names]);

  useEffect(() => {
    const action = chosenName ? actions[chosenName] : undefined;
    if (!action) return;
    action.reset().fadeIn(0.3).play();
    return () => { action.fadeOut(0.2); };
  }, [actions, chosenName]);

  // Calculer la position Y cible
  const getTargetY = () => {
    if (theme === "chatbot") {
      return isMobile ? -0.3 : 0.2;
    }
    
    // Home : transition pour compétences
    if (progress >= 0.55) {
      // Descendre pour les compétences - personnage plus bas et centré
      const baseY = isMobile ? 0.1 : 0.4;
      const skillsY = isMobile ? -1.0 : -0.4; // Mobile: beaucoup plus bas

      if (progress < 0.60) {
        const t = (progress - 0.55) / 0.05;
        return baseY + (skillsY - baseY) * t;
      }
      return skillsY;
    }
    
    // Mobile: position différente selon phase
    if (isMobile) {
      // Intro (accueil) : position normale
      // Parcours (run) : descendre le personnage sous les bulles
      return phase === "intro" ? 0.1 : -0.2;
    }
    
    return 0.4;
  };
  
  // Calculer le scale cible (pour rétrécir pendant compétences)
  const getTargetScale = () => {
    const baseScale = isMobile ? 1.6 : 1.2;
    
    // 🔥 Mobile parcours : rétrécir le personnage
    if (isMobile && phase === "run" && progress < 0.55) {
      return 1.2; // Plus petit sur parcours mobile
    }
    
    if (theme === "chatbot") {
      return isMobile ? 2.3 : 1.6;
    }
    
    // Home : ajuster pour compétences
    if (progress >= 0.55) {
      // Desktop: rétrécir, Mobile: garder plus grand
      const skillsScale = isMobile ? baseScale * 1.1 : baseScale * 0.75;

      if (progress < 0.60) {
        const t = (progress - 0.55) / 0.05;
        return baseScale + (skillsScale - baseScale) * t;
      }
      return skillsScale;
    }
    
    return baseScale;
  };

  // 🎯 OFFSETS pour ajuster la hauteur du personnage
  const getYOffset = () => {
    if (theme === "chatbot") {
      return isMobile ? 2.1 : 1; // Chat: remonter plus sur desktop
    }
    // Home/Hobby
    return isMobile ? 1 : 0.4; // Mobile: remonter plus
  };
  
  useFrame(() => {
    if (!group.current) return;
    
    const targetY = getTargetY() + getYOffset(); // Applique l'offset
    const targetScale = getTargetScale();
    
    // Initialiser au premier frame
    if (!initialized.current) {
      currentY.current = targetY;
      currentScale.current = targetScale;
      initialized.current = true;
    }
    
    // 🔥 Lerp fluide pour Y et Scale
    currentY.current += (targetY - currentY.current) * 0.08;
    currentScale.current += (targetScale - currentScale.current) * 0.08;
    
    group.current.position.y = currentY.current;
    group.current.scale.setScalar(currentScale.current);
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={scene} position={[0, -1.6, 0]} />
    </group>
  );
}

export default function Romain3D({
  progress = 0,
  phase = "intro",
  modelUrl = "/models/RomainSalut.glb",
  theme = "home",
}: Romain3DProps) {
  const url = modelUrl;
  
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useLayoutEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    setIsReady(true);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const fov = isMobile ? 55 : 45;

  // Position initiale de la caméra
  const initialCameraPosition = useMemo((): [number, number, number] => {
    if (theme === "chatbot") {
      return (isMobile ? CHATBOT_POS_MOBILE : CHATBOT_POS_DESKTOP).toArray() as [number, number, number];
    }
    return (isMobile ? START_POS_MOBILE : START_POS).toArray() as [number, number, number];
  }, [theme, isMobile]);

  if (!isReady) {
    return <div className="w-full h-full" />;
  }

  return (
    <Canvas
      className="w-full h-full"
      style={{ display: "block", background: "transparent" }}
      gl={{ alpha: true }}
      onCreated={(state) => state.gl.setClearColor(0x000000, 0)}
      camera={{ position: initialCameraPosition, fov }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[2, 5, 5]} intensity={1.4} />
      <Rig 
        progress={progress} 
        theme={theme}
        isMobile={isMobile}
      />
      <Model 
        url={url} 
        isMobile={isMobile}
        phase={phase}
        progress={progress}
        theme={theme}
      />
    </Canvas>
  );
}

useGLTF.preload("/models/RomainSalut.glb");
useGLTF.preload("/models/RomainVacanceSalut.glb");