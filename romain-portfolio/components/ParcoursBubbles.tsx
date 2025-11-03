"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

type Props = { 
  show: boolean;
  bubble1Exit?: number; // 0 à 1
  bubble2Exit?: number;
  bubble3Exit?: number;
};

const container = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", staggerChildren: 0.12 },
  },
  exit: { opacity: 0, y: 16, transition: { duration: 0.3 } },
} satisfies Variants;

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.25 } },
} satisfies Variants;

export function ParcoursBubbles({ show, bubble1Exit = 0, bubble2Exit = 0, bubble3Exit = 0 }: Props) {
  // Détecte si mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          role="region"
          aria-label="Parcours"
          variants={container}
          initial="hidden"
          animate="show"
          exit="exit"
          className="grid gap-4 w-full max-w-[22rem] mx-auto"
        >
          {/* Bulle 1 : Sort à gauche sur mobile, droite sur desktop */}
          <motion.div 
            variants={item}
            animate={{
              x: `${bubble1Exit * (isMobile ? -200 : 200)}%`,
              opacity: 1 - bubble1Exit * 0.7
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-2xl p-5
                       bg-gradient-to-br from-purple-500/20 to-pink-500/20
                       border border-white/20 backdrop-blur-md
                       hover:border-white/40 hover:shadow-lg hover:shadow-purple-500/20
                       cursor-default"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🎓</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium leading-relaxed text-sm md:text-base">
                  Informaticien de gestion ES
                </p>
                <p className="text-white/60 text-xs md:text-sm mt-1">
                  2023 - 2025
                </p>
              </div>
            </div>
            {/* Effet de brillance au hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.div>

          {/* Bulle 2 : Sort à droite sur mobile et desktop */}
          <motion.div 
            variants={item}
            animate={{
              x: `${bubble2Exit * 200}%`,
              opacity: 1 - bubble2Exit * 0.7
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-2xl p-5
                       bg-gradient-to-br from-blue-500/20 to-cyan-500/20
                       border border-white/20 backdrop-blur-md
                       hover:border-white/40 hover:shadow-lg hover:shadow-blue-500/20
                       cursor-default"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💼</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium leading-relaxed text-sm md:text-base">
                  Support technique hosting L2 Infomaniak
                </p>
                <p className="text-white/60 text-xs md:text-sm mt-1">
                  Depuis mars 2023
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.div>

          {/* Bulle 3 : Sort à gauche sur mobile, droite sur desktop */}
          <motion.div 
            variants={item}
            animate={{
              x: `${bubble3Exit * (isMobile ? -200 : 200)}%`,
              opacity: 1 - bubble3Exit * 0.7
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-2xl p-5
                       bg-gradient-to-br from-orange-500/20 to-red-500/20
                       border border-white/20 backdrop-blur-md
                       hover:border-white/40 hover:shadow-lg hover:shadow-orange-500/20
                       cursor-default"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🛠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium leading-relaxed text-sm md:text-base">
                  CFC Informaticien développeur d'application
                </p>
                <p className="text-white/60 text-xs md:text-sm mt-1">
                  2017 - 2022
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}