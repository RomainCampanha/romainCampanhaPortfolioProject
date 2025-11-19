"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group } from "three";

const START_POS = new THREE.Vector3(-0.1, 0, 2.8);
const END_POS = new THREE.Vector3(-0.1, 0.0, 3.2);

// Positions spécifiques pour mobile (caméra plus reculée pour voir les pieds)
const START_POS_MOBILE = new THREE.Vector3(0, 0.2, 3.2);
const END_POS_MOBILE = new THREE.Vector3(0, 0, 4.4);

// 🎯 Positions spécifiques pour le CHATBOT (caméra plus basse et reculée pour voir les pieds)
const CHATBOT_POS_DESKTOP = new THREE.Vector3(0, -0.3, 3.8);
const CHATBOT_POS_MOBILE = new THREE.Vector3(0, -0.1, 4.2);

type Romain3DProps = {
  progress?: number;
  phase?: "intro" | "run";
  modelUrl?: string;
  theme?: "home" | "hobby" | "chatbot";
  disableCameraMovement?: boolean; // ⬅️ NOUVEAU : désactive le mouvement de caméra
};

type ModelProps = {
  url: string;
  isMobile: boolean;
  position: [number, number, number];
  theme?: "home" | "hobby" | "chatbot";
};

function Rig({ 
  progress = 0, 
  theme = "home",
  disableCameraMovement = false 
}: { 
  progress?: number; 
  theme?: "home" | "hobby" | "chatbot";
  disableCameraMovement?: boolean;
}) {
  const { camera } = useThree();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  useFrame(() => {
    // 🔥 SI désactivé, on fixe la caméra et on ne bouge plus !
    if (disableCameraMovement) {
      const fixedPos = isMobile ? START_POS_MOBILE : START_POS;
      camera.position.copy(fixedPos);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      return;
    }
    
    // 🎯 Si c'est le chatbot, utiliser des positions fixes spéciales
    if (theme === "chatbot") {
      const targetPos = isMobile ? CHATBOT_POS_MOBILE : CHATBOT_POS_DESKTOP;
      camera.position.lerp(targetPos, 0.12);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      return;
    }

    // Sinon, comportement normal (home/hobby avec progress)
    const t = THREE.MathUtils.clamp(progress, 0, 1);
    
    const startPos = isMobile ? START_POS_MOBILE : START_POS;
    const endPos = isMobile ? END_POS_MOBILE : END_POS;
    
    const target = new THREE.Vector3().lerpVectors(startPos, endPos, t);
    camera.position.lerp(target, 0.12);
    
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  return null;
}

function Model({ url, isMobile, position, theme = "home" }: ModelProps) {
  const group = useRef<Group>(null!);
  const currentY = useRef(position[1]); // Position Y actuelle (pour lerp)
  
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  // Cherche l'animation d'intro (salut/wave)
  const chosenName = useMemo(() => {
    const rx = /idle|breath|stand|wave|greet|hello|salut/i;
    const found = names.find((n) => rx.test(n));
    return found ?? names[0];
  }, [names]);

  useEffect(() => {
    const action = chosenName ? actions[chosenName] : undefined;
    if (!action) return;
    action.reset().fadeIn(0.3).play();
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, chosenName]);

  // Anime la transition de position
  useFrame(() => {
    if (!group.current) return;
    
    // Lerp vers la position cible
    const targetY = position[1];
    currentY.current += (targetY - currentY.current) * 0.08; // Transition douce
    
    group.current.position.y = currentY.current;
  });

  // 🎯 Scale différent selon le theme
  const modelScale = useMemo(() => {
    if (theme === "chatbot") {
      // Chatbot : plus grand !
      return isMobile ? 2.3 : 1.6;
    }
    // Home/Hobby : scale normal
    return isMobile ? 1.6 : 1.2;
  }, [theme, isMobile]);

  return (
    <group ref={group} position={[position[0], currentY.current, position[2]]}>
      <primitive object={scene} scale={modelScale} position={[0, -1.6, 0]} />
    </group>
  );
}

export default function Romain3D({
  progress = 0,
  phase = "intro",
  modelUrl = "/models/RomainSalut.glb",
  theme = "home",
  disableCameraMovement = false, // ⬅️ NOUVEAU prop
}: Romain3DProps) {
  // Utiliser le modèle passé en prop ou le modèle par défaut
  const url = modelUrl;

  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // FOV plus large sur mobile pour voir le perso en entier même quand il est bas
  const fov = isMobile ? 55 : 45;

  // 🎯 Position du modèle spécifique pour le chatbot
  const getModelPosition = (): [number, number, number] => {
    if (theme === "chatbot") {
      // Pour le chatbot, on descend le modèle pour voir les pieds
      return isMobile ? [0, -0.3, 0] : [0, 0.2, 0];
    }
    
    // Positions normales pour home/hobby
    if (isMobile) {
      return phase === "intro" ? [0, 0.1, 0] : [0, -0.5, 0];
    }
    return [0, 0.4, 0];
  };

  return (
    <Canvas
      className="w-full h-full"
      style={{ display: "block", background: "transparent" }}
      gl={{ alpha: true }}
      onCreated={(state) => state.gl.setClearColor(0x000000, 0)}
      camera={{ position: START_POS.toArray() as [number, number, number], fov }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[2, 5, 5]} intensity={1.4} />

      <Rig 
        progress={progress} 
        theme={theme}
        disableCameraMovement={disableCameraMovement} // ⬅️ Passer le prop
      />

      <Model 
        url={url} 
        position={getModelPosition()}
        isMobile={isMobile}
        theme={theme}
      />
    </Canvas>
  );
}

useGLTF.preload("/models/RomainSalut.glb");
useGLTF.preload("/models/RomainVacanceSalut.glb");