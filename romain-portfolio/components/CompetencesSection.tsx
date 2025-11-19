"use client";

import { motion } from "framer-motion";
import Image from "next/image";

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

export default function CompetencesSection({ progress, visible }: CompetencesSectionProps) {
  if (!visible) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Calculer combien de logos afficher (apparition progressive)
  const numVisibleSkills = Math.floor(progress * SKILLS.length);

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="container mx-auto px-4 h-full">
        {/* Grille de logos - Centrée au-dessus du personnage */}
        <div className="h-full flex items-start justify-center pt-20 md:pt-24">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-8 md:gap-12 max-w-5xl">
            {SKILLS.map((skill, index) => {
              const isVisible = index < numVisibleSkills;
              const itemProgress = Math.max(0, Math.min(1, (progress * SKILLS.length) - index));
              
              // Animation de flottement avec delay différent pour chaque logo
              const floatDelay = index * 0.15;
              const floatAmount = 12;

              return (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, scale: 0.3, y: 100 }}
                  animate={{
                    opacity: isVisible ? 1 : 0,
                    scale: isVisible ? 1 : 0.3,
                    y: isVisible ? 0 : 100,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  className="pointer-events-auto flex flex-col items-center gap-2"
                >
                  <motion.div
                    animate={{
                      y: [0, -floatAmount, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: floatDelay,
                    }}
                    className="flex flex-col items-center gap-2"
                  >
                    {/* Logo - Clean sans bulle */}
                    <div 
                      className="relative w-16 h-16 md:w-20 md:h-20 transition-transform duration-300 hover:scale-125"
                      style={{
                        filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))",
                      }}
                    >
                      <Image
                        src={skill.icon}
                        alt={skill.name}
                        fill
                        className="object-contain"
                        style={{
                          transform: `scale(${0.9 + itemProgress * 0.1})`,
                        }}
                      />
                    </div>

                    {/* Nom de la compétence */}
                    <span className="text-white text-xs md:text-sm font-medium text-center leading-tight font-orbitron">
                      {skill.name}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}