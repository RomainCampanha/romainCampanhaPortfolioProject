"use client";

import { useRef } from "react";
import { useTrackScrollProgress } from "./hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import { ParcoursBubbles } from "../components/ParcoursBubbles";

export default function Home() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef); // 0..1 pendant la piste
  const showParcours = progress > 0.35;
  const overlayVisible = progress < 1; // cache le hero fixe quand la piste est finie
  const phase: "intro" | "run" = progress >= 0.98 ? "run" : "intro";

  return (
    <main
      className="min-h-dvh bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]"
    >
      {/* HERO FIXE — visible seulement durant la piste */}
      <div
        className={
          "fixed inset-0 flex items-center justify-center transition-opacity duration-300 " +
          (overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        // On laisse passer le scroll au body :
        style={{ pointerEvents: overlayVisible ? "none" : "none" }}
      >
        {/* Tout ce qui doit rester cliquable reprend pointer-events */}
        <div className="container mx-auto px-4 pointer-events-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* 3D piloté par progress */}
            <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
              <div
                className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                           md:translate-x-[15%] lg:translate-x-[20%]
                           transition-transform duration-500"
              >
                <Romain3D progress={progress} phase={phase} />
              </div>
            </div>

            {/* Intro vs Parcours superposés (pas d’effondrement) */}
            <div className="order-1 md:order-2 w-full md:w-1/2 flex md:justify-start justify-center">
              <div className="relative w-full md:w-auto min-h-[120px] md:min-h-[240px]">
                {/* Intro */}
                <div
                  className={`absolute inset-0 flex justify-center md:justify-start transition-opacity duration-300
                              ${showParcours ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                >
                  <div className="md:min-w-[22rem] md:max-w-[28rem]">
                    <ChatBubble
                      text="Salut, je m'appelle Romain 👋 Bienvenue chez moi !"
                      className="arrow-bottom md:arrow-left md:-translate-y-12"
                    />
                  </div>
                </div>

                {/* Parcours */}
                <div
                  className={`absolute inset-0 flex justify-center md:justify-start transition-opacity duration-300
                              ${showParcours ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  <div className="w-full md:w-auto md:min-w-[22rem] md:max-w-[28rem]">
                    <ParcoursBubbles show />
                  </div>
                </div>

                {/* Spacer pour garder la hauteur */}
                <div className="invisible md:min-w-[22rem] md:max-w-[28rem]">
                  <ChatBubble text="." />
                </div>
              </div>
            </div>
          </div>

          {/* Bouton Explorer (reste cliquable) */}
          <div className="absolute bottom-[5dvh] left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={() =>
                document.getElementById("section-2")?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-6 py-3 rounded-2xl text-white font-semibold
                         bg-gradient-to-r from-[#FF00C3] to-[#7C3AED]
                         shadow-[0_0_24px_rgba(255,0,195,.35)]
                         hover:scale-[1.05] active:scale-[0.98]
                         transition-transform duration-200 ease-out backdrop-blur-sm"
            >
              Explorer
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 PISTE DE SCROLL – c’est elle qui génère le progress, pas l’UI */}
      <section ref={trackRef} className="relative h-[160dvh]" />

      {/* Section suivante – même fond (pas de changement de couleur) */}
      <section id="section-2" className="w-full min-h-dvh" />

    </main>
  );
}
