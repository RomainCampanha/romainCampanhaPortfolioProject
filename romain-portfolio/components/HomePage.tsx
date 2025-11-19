"use client";

import { useRef } from "react";
import { useTrackScrollProgress } from "../app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import { ParcoursBubbles } from "../components/ParcoursBubbles";
import CompetencesSection from "../components/CompetencesSection";

export default function HomePage() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);
  
  // === PHASES CORRIGÉES SANS CHEVAUCHEMENT ===
  
  // Phase 1 : Intro (0-20%)
  const showIntro = progress < 0.20;
  
  // Phase 2 : Parcours (20-40%)
  const showParcours = progress >= 0.20 && progress < 0.50;
  
  // Phase 3 : Sortie des bulles parcours (40-50%)
  const exitStart = 0.40;
  const exitEnd = 0.50;
  const exitProgress = Math.max(0, Math.min(1, (progress - exitStart) / (exitEnd - exitStart)));
  const bubble1Exit = Math.min(1, exitProgress * 3);
  const bubble2Exit = Math.min(1, Math.max(0, (exitProgress - 0.33) * 3));
  const bubble3Exit = Math.min(1, Math.max(0, (exitProgress - 0.66) * 3));
  
  // Phase 4 : Bulle Compétences (50-55%)
  const competencesBubbleStart = 0.50;
  const competencesBubbleEnd = 0.55;
  const showCompetencesBubble = progress >= competencesBubbleStart && progress < competencesBubbleEnd;
  const competencesBubbleProgress = Math.max(0, Math.min(1, (progress - competencesBubbleStart) / (competencesBubbleEnd - competencesBubbleStart)));
  
  // Phase 5 : Sortie bulle + Recentrage personnage (55-60%)
  const recenterStart = 0.55;
  const recenterEnd = 0.60;
  const recenterProgress = Math.max(0, Math.min(1, (progress - recenterStart) / (recenterEnd - recenterStart)));
  
  // Phase 6 : Affichage des compétences (60-85%)
  const skillsStart = 0.60;
  const skillsEnd = 0.85;
  const showSkills = progress >= skillsStart && progress < 1.0;
  const skillsProgress = Math.max(0, Math.min(1, (progress - skillsStart) / (skillsEnd - skillsStart)));
  
  // Calcul de l'opacité globale de la section
  const overlayVisible = progress < 1;
  const phase: "intro" | "run" = progress >= 0.25 ? "run" : "intro";
  
  // Indicateur de scroll (masqué après l'intro)
  const showScrollIndicator = progress < 0.20;
  
  // Position du personnage - Se centre horizontalement et reste en bas pour les compétences
  const characterTranslateX = progress < recenterStart 
    ? 15 // Position initiale à gauche (desktop)
    : 0; // Centré après le recentrage
  
  const characterTranslateXMobile = 0; // Toujours centré sur mobile
  
  // Position verticale - Descend vers le bas pour la section compétences
  const characterTranslateY = progress < recenterStart
    ? 0 // Position normale
    : progress < skillsStart
      ? recenterProgress * 25 // Descend vers le bas progressivement
      : 25; // Reste en bas pendant les compétences
  
  // Opacité du personnage - reste visible pendant les compétences
  const characterOpacity = progress < 0.95 ? 1 : 1 - ((progress - 0.95) / 0.05);

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
            {/* 3D piloté par progress avec recentrage et descente */}
            <div 
              className={`order-2 md:order-1 transition-all duration-500 ${
                progress >= skillsStart 
                  ? 'w-full' // Prend toute la largeur pendant les compétences
                  : 'w-full md:w-[55%] lg:w-[60%]' // Largeur normale avant
              }`}
            >
              <div
                className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                           transition-all duration-500"
                style={{
                  transform: progress >= skillsStart
                    ? `translate(0%, 40%)` // Centré et descendu pour les compétences
                    : `translate(${characterTranslateXMobile}%, ${characterTranslateY}%) md:translate(${characterTranslateX}%, ${characterTranslateY}%)`,
                  opacity: characterOpacity,
                }}
              >
                <Romain3D progress={progress} phase={phase} />
              </div>
            </div>

            {/* Bulles superposées */}
            <div className="order-1 md:order-2 w-full md:w-1/2 flex justify-center md:justify-start">
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
                    {/* Bulle "Voici mon parcours pro" - Plus à gauche */}
                    <div className="absolute left-0 -translate-x-[280%] -top-12">
                      <div className="w-[280px]">
                        <ChatBubble
                          text="Voici mon parcours pro ! 🚀"
                          className="arrow-right md:-translate-y-12"
                          loop={true}
                        />
                      </div>
                    </div>

                    {/* Bulles parcours */}
                    <div className="min-w-[22rem] max-w-[28rem] md:-translate-y-16">
                      <ParcoursBubbles 
                        show 
                        bubble1Exit={bubble1Exit}
                        bubble2Exit={bubble2Exit}
                        bubble3Exit={bubble3Exit}
                      />
                    </div>
                  </div>
                </div>

                {/* Bulle Compétences - Apparaît au centre avec animation progressive */}
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
                          {/* Texte qui apparaît progressivement */}
                          {"Voici mes compétences ! 💻".substring(0, Math.floor(competencesBubbleProgress * "Voici mes compétences ! 💻".length))}
                          {competencesBubbleProgress < 0.95 && <span className="animate-caret">|</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spacer */}
                <div className="invisible md:min-w-[22rem] md:max-w-[28rem]">
                  <ChatBubble text="." />
                </div>
              </div>
            </div>
          </div>

          {/* Indicateur de scroll */}
          {showScrollIndicator && (
            <div 
              className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3
                         transition-opacity duration-500"
              style={{ opacity: showScrollIndicator ? 1 : 0 }}
            >
              <span className="text-white/80 font-semibold text-lg tracking-wide font-orbitron">
                Explorer
              </span>
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

          {/* Flèche seule après intro */}
          {!showScrollIndicator && progress < 0.95 && (
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

      {/* SECTION COMPÉTENCES FIXE */}
      <CompetencesSection 
        progress={skillsProgress}
        visible={showSkills}
      />

      {/* PISTE DE SCROLL - Plus longue pour accommoder la section compétences */}
      <section ref={trackRef} className="relative h-[500dvh]" />

      {/* Section suivante */}
      <section id="section-2" className="w-full min-h-dvh" />
    </main>
  );
}