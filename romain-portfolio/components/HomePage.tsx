"use client";

import { useRef, useState, useLayoutEffect } from "react";
import { useTrackScrollProgress } from "../app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import { ParcoursBubbles } from "../components/ParcoursBubbles";
import CompetencesSection from "../components/CompetencesSection";

export default function HomePage() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);
  
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useLayoutEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    setIsReady(true);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  
  // === PHASES D'ANIMATION ===
  const showIntro = progress < 0.20;
  const showParcours = progress >= 0.20 && progress < 0.50;
  
  const exitProgress = Math.max(0, Math.min(1, (progress - 0.40) / 0.10));
  const bubble1Exit = Math.min(1, exitProgress * 3);
  const bubble2Exit = Math.min(1, Math.max(0, (exitProgress - 0.33) * 3));
  const bubble3Exit = Math.min(1, Math.max(0, (exitProgress - 0.66) * 3));
  
  const showCompetencesBubble = progress >= 0.50 && progress < 0.55;
  const competencesBubbleProgress = Math.max(0, Math.min(1, (progress - 0.50) / 0.05));
  
  const showSkills = progress >= 0.60 && progress < 1.0;
  const skillsProgress = Math.max(0, Math.min(1, (progress - 0.60) / 0.25));
  
  const overlayVisible = progress < 1;
  const phase: "intro" | "run" = progress >= 0.25 ? "run" : "intro";
  const showScrollIndicator = progress < 0.20;
  
  // Masquer les bulles pendant la transition vers compétences
  const hideBubbles = progress >= 0.55;
  
  // Opacité du personnage (fade out à la fin)
  const characterOpacity = progress < 0.95 ? 1 : 1 - ((progress - 0.95) / 0.05);

  if (!isReady) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]">
        <section className="relative h-[500dvh]" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]">
      {/* HERO FIXE */}
      <div
        className={
          "fixed inset-0 flex items-center justify-center transition-opacity duration-300 " +
          (overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none")
        }
      >
        <div className="container mx-auto px-4 pointer-events-auto mt-16 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            
            {/* 🎯 PERSONNAGE 3D - PAS de transform CSS, tout est géré dans Three.js */}
            <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
              <div
                className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px] md:translate-x-[15%] lg:translate-x-[20%] transition-opacity duration-300"
                style={{ opacity: characterOpacity }}
              >
                <Romain3D 
                  progress={progress}  // 🔥 On passe le progress pour que Three.js gère le mouvement
                  phase={phase}
                />
              </div>
            </div>

            {/* Bulles */}
            <div 
              className="order-1 md:order-2 w-full md:w-1/2 flex justify-center md:justify-start"
              style={{
                opacity: hideBubbles ? 0 : 1,
                pointerEvents: hideBubbles ? 'none' : 'auto',
                transition: 'opacity 0.3s ease-out',
              }}
            >
              <div className="relative w-full md:w-auto md:min-h-[240px] flex justify-center md:block">
                
                {/* Bulle Intro */}
                <div
                  className={`absolute inset-0 flex justify-center md:justify-start transition-opacity duration-300
                              ${showIntro ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  <div className="md:min-w-[22rem] md:max-w-[28rem]">
                    <ChatBubble
                      text="Salut, je m'appelle Romain 👋 Bienvenue chez moi !"
                      className="arrow-bottom md:arrow-left md:-translate-y-12"
                    />
                  </div>
                </div>

                {/* Section Parcours */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300
                              ${showParcours ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  {/* Mobile */}
                  <div className="flex md:hidden justify-center items-start h-full">
                    <div className="w-[90%] -translate-y-14">
                      <ParcoursBubbles 
                        show 
                        bubble1Exit={bubble1Exit}
                        bubble2Exit={bubble2Exit}
                        bubble3Exit={bubble3Exit}
                      />
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block">
                    {/* Bulles parcours à droite */}
                    <div className="min-w-[22rem] max-w-[28rem]">
                      <ParcoursBubbles 
                        show 
                        bubble1Exit={bubble1Exit}
                        bubble2Exit={bubble2Exit}
                        bubble3Exit={bubble3Exit}
                      />
                    </div>
                  </div>
                </div>

                {/* Bulle "Voici mon parcours pro" - FIXÉE à gauche du personnage */}
                {showParcours && (
                  <div className="hidden md:block fixed left-[18%] top-1/2 -translate-y-1/2 z-10">
                    <ChatBubble
                      text="Voici mon parcours pro ! 🚀"
                      className="arrow-right"
                      loop={true}
                    />
                  </div>
                )}

                <div className="invisible md:min-w-[22rem] md:max-w-[28rem]">
                  <ChatBubble text="." />
                </div>
              </div>
            </div>
          </div>

          {/* Bulle Compétences */}
          {showCompetencesBubble && (
            <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div 
                className="pointer-events-auto"
                style={{
                  opacity: Math.min(1, competencesBubbleProgress * 2),
                  transform: `scale(${0.9 + competencesBubbleProgress * 0.1})`,
                }}
              >
                <div className="bubble max-w-[22rem] rounded-3xl p-4 md:p-5 
                                bg-gradient-to-br from-[#7928CA]/90 to-[#FF00C3]/80
                                backdrop-blur-sm text-white border border-white/20 relative
                                shadow-[0_0_24px_rgba(199,0,255,.25)]
                                font-orbitron">
                  <p className="whitespace-normal break-words hyphens-auto leading-relaxed">
                    {"Voici mes compétences ! 💻".substring(0, Math.floor(competencesBubbleProgress * "Voici mes compétences ! 💻".length))}
                    {competencesBubbleProgress < 0.95 && <span className="animate-caret">|</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scroll indicators */}
          {showScrollIndicator && (
            <div className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
              <span className="text-white/80 font-semibold text-lg tracking-wide font-orbitron">Explorer</span>
              <svg className="w-8 h-8 text-white/70 animate-bounce cursor-pointer hover:text-white hover:scale-110 transition-all duration-300"
                   onClick={() => document.getElementById("section-2")?.scrollIntoView({ behavior: "smooth" })}
                   fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          )}

          {!showScrollIndicator && progress < 0.95 && (
            <div className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10">
              <svg className="w-8 h-8 text-white/50 animate-bounce cursor-pointer hover:text-white/70 hover:scale-110 transition-all duration-300"
                   onClick={() => window.scrollTo({ top: window.innerHeight * 2, behavior: "smooth" })}
                   fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          )}
        </div>
      </div>

      <CompetencesSection progress={skillsProgress} visible={showSkills} />
      <section ref={trackRef} className="relative h-[500dvh]" />
      <section id="section-2" className="w-full min-h-dvh" />
    </main>
  );
}