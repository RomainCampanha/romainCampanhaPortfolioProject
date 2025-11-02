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

  // Masque l'indicateur sur la page parcours
  const showScrollIndicator = progress < 0.35;

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

            {/* Intro vs Parcours superposés */}
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

                {/* Spacer */}
                <div className="invisible md:min-w-[22rem] md:max-w-[28rem]">
                  <ChatBubble text="." />
                </div>
              </div>
            </div>
          </div>

          {/* Indicateur de scroll animé */}
          {showScrollIndicator && (
            <div 
              className="absolute bottom-[1dvh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3
                         transition-opacity duration-500"
              style={{ opacity: showScrollIndicator ? 1 : 0 }}
            >
              {/* Texte "Explorer" */}
              <span className="text-white/80 font-semibold text-lg tracking-wide font-orbitron">
                Explorer
              </span>
              
              {/* Flèche animée */}
              <svg 
                className="w-8 h-8 text-white/70 animate-bounce cursor-pointer
                           hover:text-white hover:scale-110 transition-all duration-300"
                onClick={() =>
                  document.getElementById("section-2")?.scrollIntoView({ behavior: "smooth" })
                }
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2.5" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          )}

          {/* Flèche seule quand on arrive sur parcours */}
          {!showScrollIndicator && progress < 0.8 && (
            <div 
              className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10
                         transition-opacity duration-500"
            >
              <svg 
                className="w-8 h-8 text-white/50 animate-bounce cursor-pointer
                           hover:text-white/70 hover:scale-110 transition-all duration-300"
                onClick={() =>
                  window.scrollTo({ top: window.innerHeight * 2, behavior: "smooth" })
                }
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2.5" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* PISTE DE SCROLL */}
      <section ref={trackRef} className="relative h-[160dvh]" />

      {/* Section suivante */}
      <section id="section-2" className="w-full min-h-dvh" />
    </main>
  );
}