"use client";

import { useRef } from "react";
import { useTrackScrollProgress } from "./hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import { ParcoursBubbles } from "../components/ParcoursBubbles";

export default function Home() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);
  const showParcours = progress > 0.35;
  const overlayVisible = progress < 1;
  const phase: "intro" | "run" = progress >= 0.4 ? "run" : "intro";

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]">
      {/* HERO FIXE */}
      <div
        className={
          "fixed inset-0 flex items-center justify-center transition-opacity duration-300 " +
          (overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        style={{ pointerEvents: overlayVisible ? "none" : "none" }}
      >
        <div className="container mx-auto px-4 pointer-events-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            
            {/* 3D - Position différente sur mobile quand parcours visible */}
            <div className={`
              order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]
              transition-all duration-700 ease-in-out
              ${showParcours 
                ? 'md:translate-x-[15%] lg:translate-x-[20%]' // Desktop: position normale
                : 'md:translate-x-[15%] lg:translate-x-[20%]' // Desktop: position normale
              }
            `}>
              <div className={`
                mx-auto w-full max-w-[720px]
                transition-all duration-700 ease-in-out
                ${showParcours
                  ? 'h-[30vh] md:h-[70vh]' // Mobile: plus petit quand parcours visible
                  : 'h-[60vh] md:h-[70vh]' // Mobile: taille normale au début
                }
              `}>
                <Romain3D progress={progress} phase={phase} />
              </div>
            </div>

            {/* Bulles - Layout adapté mobile */}
            <div className={`
              order-1 md:order-2 w-full md:w-1/2 
              flex md:justify-start justify-center
              transition-all duration-700 ease-in-out
              ${showParcours ? 'items-start' : 'items-center'}
            `}>
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

                {/* Parcours - Positionnées en haut sur mobile */}
                <div
                  className={`absolute inset-0 flex justify-center md:justify-start transition-opacity duration-300
                              ${showParcours ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  <div className="w-full md:w-auto md:min-w-[22rem] md:max-w-[28rem]">
                    <ParcoursBubbles show />
                  </div>
                </div>

                {/* Spacer */}
                <div className="invisible md:min-w-[22rem] md:max-w-[28rem]">
                  <ChatBubble text="." />
                </div>
              </div>
            </div>
          </div>

          {/* Bouton Explorer */}
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

      {/* PISTE DE SCROLL */}
      <section ref={trackRef} className="relative h-[160dvh]" />

      {/* Section suivante */}
      <section id="section-2" className="w-full min-h-dvh" />
    </main>
  );
}