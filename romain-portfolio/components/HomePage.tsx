"use client";

import { useRef } from "react";
import { useTrackScrollProgress } from "../app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import { ParcoursBubbles } from "../components/ParcoursBubbles";

export default function HomePage() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);
  const showParcours = progress > 0.35;
  const overlayVisible = progress < 1;
  const phase: "intro" | "run" = progress >= 0.4 ? "run" : "intro";

  // Masque l'indicateur sur la page parcours
  const showScrollIndicator = progress < 0.35;

  // Animation de sortie des bulles (commence à 60% du scroll)
  const exitProgress = Math.max(0, (progress - 0.6) / 0.4); // 0 à 1 entre 60% et 100%
  
  // Calcul des positions de sortie pour chaque bulle (séquence)
  const bubble1Exit = Math.min(1, exitProgress * 3); // Sort en premier
  const bubble2Exit = Math.min(1, Math.max(0, (exitProgress - 0.33) * 3)); // Sort en deuxième
  const bubble3Exit = Math.min(1, Math.max(0, (exitProgress - 0.66) * 3)); // Sort en dernier

  // Debug (à retirer après test)
  if (progress > 0.6) {
    console.log('Progress:', progress.toFixed(2), '| Exit:', exitProgress.toFixed(2), '| B1:', bubble1Exit.toFixed(2));
  }

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
        <div className="container mx-auto px-4 pointer-events-auto mt-16 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
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
            <div className="order-1 md:order-2 w-full md:w-1/2 flex justify-center md:justify-start">
              <div className="relative w-full md:w-auto md:min-h-[240px] flex justify-center md:block">
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
                  className={`absolute inset-0 transition-opacity duration-300
                              ${showParcours ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  {/* Mobile : Bulles avec animation de sortie */}
                  <div className="flex md:hidden justify-center items-start h-full">
                    <div className="w-[90%]">
                      <ParcoursBubbles 
                        show 
                        bubble1Exit={bubble1Exit}
                        bubble2Exit={bubble2Exit}
                        bubble3Exit={bubble3Exit}
                      />
                    </div>
                  </div>

                  {/* Desktop : Bulles avec animation de sortie vers la droite */}
                  <div className="hidden md:block">
                    {/* Bulle "Voici mon parcours pro" - Décalée à GAUCHE du personnage */}
                    <div className="absolute left-0 -translate-x-[230%] top-0">
                      <div className="w-[280px]">
                        <ChatBubble
                          text="Voici mon parcours pro ! 🚀"
                          className="arrow-right md:-translate-y-12"
                          loop={true}
                        />
                      </div>
                    </div>

                    {/* Bulles parcours - Position normale, alignées avec bulle intro */}
                    <div className="min-w-[22rem] max-w-[28rem] md:-translate-y-0">
                      <ParcoursBubbles 
                        show 
                        bubble1Exit={bubble1Exit}
                        bubble2Exit={bubble2Exit}
                        bubble3Exit={bubble3Exit}
                      />
                    </div>
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
              className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3
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

      {/* PISTE DE SCROLL - Plus haute = animation plus lente */}
      <section ref={trackRef} className="relative h-[200dvh]" />

      {/* Section suivante */}
      <section id="section-2" className="w-full min-h-dvh" />
    </main>
  );
}