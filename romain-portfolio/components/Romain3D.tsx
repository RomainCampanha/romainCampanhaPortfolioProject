"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import * as THREE from "three";
import type { Group } from "three";

// === POSITIONS DE CAMÉRA ===
// Accueil/Parcours - Desktop décalé à gauche, caméra à hauteur des yeux
const START_POS = new THREE.Vector3(0, -0.1, 3.0);
const START_POS_MOBILE = new THREE.Vector3(0, 0.15, 3.2);   // Mobile : garder le zoom d'origine

// Compétences : caméra centrée et légèrement reculée
const SKILLS_POS = new THREE.Vector3(0, -0.15, 3.8);        // Desktop: centré, plus proche
const SKILLS_POS_MOBILE = new THREE.Vector3(0, 0.05, 4.3);  // Mobile: un peu plus reculé

// Chatbot
const CHATBOT_POS_DESKTOP = new THREE.Vector3(0, -0.3, 3.8);
const CHATBOT_POS_MOBILE = new THREE.Vector3(0, -0.1, 4.2);

type Romain3DProps = {
  progress?: number;
  phase?: "intro" | "run";
  modelUrl?: string;
  theme?: "home" | "hobby" | "chatbot";
  rotationY?: number; // Rotation du modèle sur l'axe Y (en radians)
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
    
    // Home : transition vers compétences à partir de 38%
    const startPos = isMobile ? START_POS_MOBILE : START_POS;
    const skillsPos = isMobile ? SKILLS_POS_MOBILE : SKILLS_POS;

    // Avant 38% : position de départ
    if (progress < 0.38) {
      return startPos;
    }

    // 38% - 44% : transition fluide vers compétences
    if (progress < 0.44) {
      const t = (progress - 0.38) / 0.06; // 0 → 1
      return new THREE.Vector3().lerpVectors(startPos, skillsPos, t);
    }

    // Après 44% : position compétences
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

function Model({ url, isMobile, phase, progress, theme, rotationY = 0 }: {
  url: string;
  isMobile: boolean;
  phase: "intro" | "run";
  progress: number;
  theme: "home" | "hobby" | "chatbot";
  rotationY?: number;
}) {
  const group = useRef<Group>(null!);

  // Refs pour les animations fluides
  const currentX = useRef(0);
  const currentY = useRef(0);
  const currentScale = useRef(1);
  const currentRotY = useRef(0);
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
    if (progress >= 0.38) {
      const baseY = isMobile ? 0.1 : 0.3;
      const skillsY = isMobile ? -0.2 : -0.3;

      if (progress < 0.44) {
        const t = (progress - 0.38) / 0.06;
        return baseY + (skillsY - baseY) * t;
      }
      return skillsY;
    }

    // Mobile: position différente selon phase
    if (isMobile) {
      return phase === "intro" ? 0.1 : -0.4;
    }

    return 0.3; // Desktop intro/parcours
  };
  
  // Calculer le scale cible (pour rétrécir pendant compétences)
  const getTargetScale = () => {
    const baseScale = isMobile ? 1.6 : 1.2;

    // 🔥 Mobile parcours : rétrécir le personnage
    if (isMobile && phase === "run" && progress < 0.38) {
      return 1.3; // Plus petit sur parcours mobile
    }

    if (theme === "chatbot") {
      return isMobile ? 2.3 : 1.6;
    }

    // Home : ajuster pour compétences + contact
    if (progress >= 0.38) {
      const skillsScale = isMobile ? baseScale * 0.9 : baseScale * 0.85;

      if (progress < 0.44) {
        const t = (progress - 0.38) / 0.06;
        return baseScale + (skillsScale - baseScale) * t;
      }

      // 📱 Mobile contact : agrandir le personnage
      if (isMobile && progress >= 0.70) {
        const contactScale = 1.8;
        if (progress < 0.76) {
          const t = (progress - 0.70) / 0.06;
          return skillsScale + (contactScale - skillsScale) * t;
        }
        return contactScale;
      }

      return skillsScale;
    }

    return baseScale;
  };

  // 🎯 OFFSETS pour ajuster la hauteur du personnage
  const getYOffset = () => {
    if (theme === "chatbot") {
      return isMobile ? 2.1 : 1;
    }
    // Home/Hobby
    return isMobile ? 1 : 0.35;
  };

  // 🎯 OFFSET X : décaler le personnage vers la droite (desktop Home accueil/parcours uniquement)
  const getTargetX = () => {
    // Seulement pour Home desktop
    if (theme !== "home" || isMobile) return 0;

    // Desktop Home accueil/parcours : décaler vers la droite (léger)
    if (progress < 0.38) return 0.25;

    // Transition vers compétences : revenir au centre
    if (progress < 0.44) {
      const t = (progress - 0.38) / 0.06;
      return 0.25 * (1 - t);
    }

    // Compétences + Contact : centré
    return 0;
  };

  useFrame(() => {
    if (!group.current) return;
    
    const targetX = getTargetX();
    const targetY = getTargetY() + getYOffset(); // Applique l'offset
    const targetScale = getTargetScale();

    // Initialiser au premier frame
    if (!initialized.current) {
      currentX.current = targetX;
      currentY.current = targetY;
      currentScale.current = targetScale;
      currentRotY.current = rotationY;
      initialized.current = true;
    }

    // Lerp fluide pour X, Y, Scale et Rotation
    currentX.current += (targetX - currentX.current) * 0.08;
    currentY.current += (targetY - currentY.current) * 0.08;
    currentScale.current += (targetScale - currentScale.current) * 0.08;
    currentRotY.current += (rotationY - currentRotY.current) * 0.1;

    group.current.position.x = currentX.current;
    group.current.position.y = currentY.current;
    group.current.scale.setScalar(currentScale.current);
    group.current.rotation.y = currentRotY.current;
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
  rotationY = 0,
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
        rotationY={rotationY}
      />
    </Canvas>
  );
}

useGLTF.preload("/models/RomainSalut.glb");
useGLTF.preload("/models/RomainVacanceSalut.glb");