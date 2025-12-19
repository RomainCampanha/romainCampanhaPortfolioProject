"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type CompetencesSectionProps = {
  progress: number; // 0 à 1 pour cette section
  visible: boolean;
};

const SKILLS = [
  { name: "React", icon: "/iconePortfolio/atom.png" },
  { name: "Next.js", icon: "/iconePortfolio/nextJS.png" },
  { name: "Tailwind CSS", icon: "/iconePortfolio/tailwindCss.png" },
  { name: "Node.js", icon: "/iconePortfolio/nodeJS.png" },
  { name: "PHP", icon: "/iconePortfolio/php.png" },
  { name: "Python", icon: "/iconePortfolio/python.png" },
  { name: "C#", icon: "/iconePortfolio/c-sharp.png" },
  { name: "MySQL", icon: "/iconePortfolio/mysql.png" },
  { name: "Nom de domaine", icon: "/iconePortfolio/web.png" },
  { name: "Web Hosting", icon: "/iconePortfolio/server.png" },
];

// Regrouper les skills par paires/triplets pour affichage rotatif
const SKILL_GROUPS = [
  [SKILLS[0], SKILLS[1]],           // React, Next.js
  [SKILLS[2], SKILLS[3], SKILLS[4]], // Tailwind, Node, PHP
  [SKILLS[5], SKILLS[6]],           // Python, C#
  [SKILLS[7], SKILLS[8], SKILLS[9]], // MySQL, Domaine, Hosting
];

// Positions en arc pour 2 éléments (gauche/droite du personnage)
const POSITIONS_2 = [
  { x: -180, y: -120, rotate: -8 },  // Gauche haut
  { x: 180, y: -120, rotate: 8 },   // Droite haut
];

// Positions en arc pour 3 éléments
const POSITIONS_3 = [
  { x: -200, y: -80, rotate: -12 },  // Gauche
  { x: 0, y: -180, rotate: 0 },      // Centre haut
  { x: 200, y: -80, rotate: 12 },   // Droite
];

// Positions mobile - plus compactes
const POSITIONS_2_MOBILE = [
  { x: -80, y: -140, rotate: -5 },
  { x: 80, y: -140, rotate: 5 },
];

const POSITIONS_3_MOBILE = [
  { x: -100, y: -100, rotate: -8 },
  { x: 0, y: -180, rotate: 0 },
  { x: 100, y: -100, rotate: 8 },
];

export default function CompetencesSection({ progress, visible }: CompetencesSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!visible) return null;

  // Calculer quel groupe afficher basé sur le progress
  // Diviser le progress en segments égaux pour chaque groupe
  const segmentSize = 1 / SKILL_GROUPS.length;
  const currentGroupIndex = Math.min(
    Math.floor(progress / segmentSize),
    SKILL_GROUPS.length - 1
  );

  // Progress au sein du groupe actuel (0 à 1)
  const groupProgress = (progress % segmentSize) / segmentSize;

  // Le groupe actuel
  const currentGroup = SKILL_GROUPS[currentGroupIndex];

  // Choisir les positions selon le nombre d'éléments et le device
  const getPositions = (count: number) => {
    if (isMobile) {
      return count === 2 ? POSITIONS_2_MOBILE : POSITIONS_3_MOBILE;
    }
    return count === 2 ? POSITIONS_2 : POSITIONS_3;
  };

  const positions = getPositions(currentGroup.length);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Container centré avec le personnage */}
      <div className="relative w-full h-full flex items-center justify-center">

        {/* Indicateur de groupe (petits points) */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SKILL_GROUPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentGroupIndex
                  ? "bg-white scale-125"
                  : index < currentGroupIndex
                  ? "bg-white/60"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Skills flottants autour du personnage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGroupIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {currentGroup.map((skill, index) => {
              const pos = positions[index];
              const floatDelay = index * 0.3;

              return (
                <motion.div
                  key={skill.name}
                  initial={{
                    opacity: 0,
                    scale: 0.5,
                    x: pos.x * 0.5,
                    y: pos.y + 50,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: pos.x,
                    y: pos.y,
                    rotate: pos.rotate,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.5,
                    y: pos.y - 30,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  className="absolute pointer-events-auto"
                  style={{
                    // Centrer par rapport au milieu de l'écran (où est le personnage)
                    left: "50%",
                    top: "45%",
                    marginLeft: "-60px", // Demi-largeur du container
                    marginTop: "-60px",  // Demi-hauteur du container
                  }}
                >
                  <motion.div
                    animate={{
                      y: [0, -15, 0],
                    }}
                    transition={{
                      duration: 2.5 + index * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: floatDelay,
                    }}
                    className="flex flex-col items-center gap-3"
                  >
                    {/* Icône avec glow effect */}
                    <div
                      className="relative w-20 h-20 md:w-24 md:h-24 transition-transform duration-300 hover:scale-110"
                      style={{
                        filter: "drop-shadow(0 0 20px rgba(121, 40, 202, 0.4)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))",
                      }}
                    >
                      <Image
                        src={skill.icon}
                        alt={skill.name}
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Nom avec style amélioré */}
                    <span
                      className="text-white text-sm md:text-base font-semibold text-center leading-tight font-orbitron px-3 py-1 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(121, 40, 202, 0.6), rgba(255, 0, 195, 0.4))",
                        backdropFilter: "blur(8px)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {skill.name}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Titre du groupe actuel */}
        <motion.div
          key={`title-${currentGroupIndex}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute top-[12%] md:top-[15%] left-1/2 -translate-x-1/2 z-10"
        >
          <h2 className="text-white/80 text-lg md:text-xl font-orbitron tracking-wider">
            {currentGroupIndex === 0 && "Frontend"}
            {currentGroupIndex === 1 && "Full Stack"}
            {currentGroupIndex === 2 && "Langages"}
            {currentGroupIndex === 3 && "Infrastructure"}
          </h2>
        </motion.div>
      </div>
    </div>
  );
}
