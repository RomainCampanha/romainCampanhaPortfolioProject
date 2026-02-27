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

  // === PHASES D'ANIMATION (ajustées pour 650dvh track) ===

  // Phase 1 : Intro (0 → 15%)
  const showIntro = progress < 0.15;
  const showScrollIndicator = progress < 0.15;

  // Phase 2 : Parcours (15% → 38%)
  const showParcours = progress >= 0.15 && progress < 0.38;
  const exitProgress = Math.max(0, Math.min(1, (progress - 0.30) / 0.08));
  const bubble1Exit = Math.min(1, exitProgress * 3);
  const bubble2Exit = Math.min(1, Math.max(0, (exitProgress - 0.33) * 3));
  const bubble3Exit = Math.min(1, Math.max(0, (exitProgress - 0.66) * 3));

  // Phase 3 : Bulle Compétences (38% → 42%)
  const showCompetencesBubble = progress >= 0.38 && progress < 0.42;
  const competencesBubbleProgress = Math.max(0, Math.min(1, (progress - 0.38) / 0.04));

  // Phase 4 : Skills display (45% → 68%)
  const showSkills = progress >= 0.45 && progress < 0.70;
  const skillsProgress = Math.max(0, Math.min(1, (progress - 0.45) / 0.20));

  // Phase 5 : Contact bubble (70% → 75%)
  const showContactBubble = progress >= 0.70 && progress < 0.76;
  const contactBubbleProgress = Math.max(0, Math.min(1, (progress - 0.70) / 0.04));

  // Phase 6 : Contact links (76% → 92%)
  const showContact = progress >= 0.76 && progress < 0.92;
  const contactProgress = Math.max(0, Math.min(1, (progress - 0.76) / 0.08));

  // Transition layout : parcours → compétences
  const layoutTransitionProgress = Math.max(0, Math.min(1, (progress - 0.38) / 0.06));
  const layoutEased = 1 - Math.pow(1 - layoutTransitionProgress, 3);

  // Général
  const overlayVisible = progress < 1;
  const phase: "intro" | "run" = progress >= 0.18 ? "run" : "intro";
  const characterOpacity = progress < 0.92 ? 1 : 1 - ((progress - 0.92) / 0.08);

  if (!isReady) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]">
        <section className="relative h-[650dvh]" />
      </main>
    );
  }

  // Texte contact avec animation typing
  const contactText = "Contacte moi ! 📩";
  const contactTypedText = contactText.substring(0, Math.floor(contactBubbleProgress * contactText.length));

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
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-center"
            style={{ gap: isMobile ? '1rem' : `${2 * (1 - layoutEased)}rem` }}
          >

            {/* 🎯 PERSONNAGE 3D - Largeur interpolée par le scroll */}
            <div
              className="order-2 md:order-1 w-full"
              style={{
                width: isMobile ? '100%' : `${55 + layoutEased * 45}%`,
              }}
            >
              <div
                className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]"
                style={{ opacity: characterOpacity }}
              >
                <Romain3D
                  progress={progress}
                  phase={phase}
                />
              </div>
            </div>

            {/* Bulles - Masquées via opacity (restent dans le DOM pour éviter le reflow) */}
            <div
              className="order-1 md:order-2 w-full flex justify-center md:justify-start"
              style={{
                width: isMobile ? '100%' : `${50 * (1 - layoutEased)}%`,
                opacity: 1 - layoutEased,
                pointerEvents: layoutEased > 0.5 ? 'none' as const : 'auto' as const,
                overflow: layoutEased > 0 ? 'hidden' : 'visible',
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

                  {/* Desktop - Remonté avec -translate-y-16 */}
                  <div className="hidden md:block -translate-y-16">
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

                {/* Bulle "Voici mon parcours pro" - Plus à gauche */}
                {showParcours && (
                  <div className="hidden md:block fixed left-[8%] top-[30%] -translate-y-1/2 z-10">
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

          {!showScrollIndicator && progress < 0.70 && (
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

      {/* 📩 Bulle Contact (hors du hero overlay pour éviter les problèmes de stacking) */}
      {showContactBubble && (
        <div className="fixed inset-0 flex items-start justify-center z-30 pointer-events-none pt-[12vh] md:pt-[8vh]">
          <div
            className="pointer-events-auto"
            style={{
              opacity: Math.min(1, contactBubbleProgress * 2),
              transform: `scale(${0.9 + contactBubbleProgress * 0.1})`,
            }}
          >
            <div className="bubble max-w-[22rem] rounded-3xl p-4 md:p-5
                            bg-gradient-to-br from-[#7928CA]/90 to-[#FF00C3]/80
                            backdrop-blur-sm text-white border border-white/20 relative
                            shadow-[0_0_24px_rgba(199,0,255,.25)]
                            font-orbitron">
              <p className="whitespace-normal break-words hyphens-auto leading-relaxed">
                {contactTypedText}
                {contactBubbleProgress < 0.95 && <span className="animate-caret">|</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🔗 Liens Contact : LinkedIn + Instagram */}
      {showContact && (
        <div className="fixed inset-0 z-30 pointer-events-none"
             style={{
               display: 'flex',
               alignItems: isMobile ? 'center' : 'flex-end',
               justifyContent: 'center',
               paddingBottom: isMobile ? 0 : '5vh',
               marginTop: isMobile ? '-25vh' : 0,
             }}>
          <div className="flex gap-8 md:gap-12">

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/romain-c-9159ba267/"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto"
              style={{
                opacity: contactProgress,
                transform: `translateY(${(1 - contactProgress) * 50}px)`,
              }}
            >
              <div className="flex flex-col items-center gap-3 group cursor-pointer">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl
                                bg-gradient-to-br from-[#0077B5] to-[#00A0DC]
                                flex items-center justify-center
                                shadow-[0_0_20px_rgba(0,119,181,0.4)]
                                group-hover:shadow-[0_0_35px_rgba(0,119,181,0.7)]
                                group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <span className="text-white/80 font-orbitron text-xs md:text-sm tracking-wider
                                 group-hover:text-white transition-colors duration-300">
                  LinkedIn
                </span>
              </div>
            </a>

            {/* Instagram (staggered entrance) */}
            <a
              href="https://www.instagram.com/romain_yehhh/"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto"
              style={{
                opacity: Math.max(0, (contactProgress - 0.25) / 0.75),
                transform: `translateY(${(1 - Math.max(0, (contactProgress - 0.25) / 0.75)) * 50}px)`,
              }}
            >
              <div className="flex flex-col items-center gap-3 group cursor-pointer">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl
                                bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]
                                flex items-center justify-center
                                shadow-[0_0_20px_rgba(221,42,123,0.4)]
                                group-hover:shadow-[0_0_35px_rgba(221,42,123,0.7)]
                                group-hover:scale-110 transition-all duration-300">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </div>
                <span className="text-white/80 font-orbitron text-xs md:text-sm tracking-wider
                                 group-hover:text-white transition-colors duration-300">
                  Instagram
                </span>
              </div>
            </a>

          </div>
        </div>
      )}

      <CompetencesSection progress={skillsProgress} visible={showSkills} />
      <section ref={trackRef} className="relative h-[650dvh]" />
      <section id="section-2" className="w-full min-h-dvh" />
    </main>
  );
}
