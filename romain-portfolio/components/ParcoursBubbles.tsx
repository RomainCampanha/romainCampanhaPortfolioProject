"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

type Props = { show: boolean };

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
  exit:  { opacity: 0, y: 12, transition: { duration: 0.25 } },
} satisfies Variants;


export function ParcoursBubbles({ show }: Props) {
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
          className="
            mt-4 md:mt-6 grid gap-3 md:gap-4
            w-[88%] md:w-auto md:min-w-[22rem] md:max-w-[28rem]
          "
        >
          <motion.div variants={item} className="bubble-card">
            🎓 Informaticien de gestion ES : 2023 - 2025
          </motion.div>

          <motion.div variants={item} className="bubble-card">
            💼 Support technique hosting L2 Infomaniak : Depuis mars 2023
          </motion.div>

          <motion.div variants={item} className="bubble-card">
            🛠️ CFC Informaticien developpeur d'application : 2017 - 2022
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
