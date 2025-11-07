"use client";

import { useRef } from "react";
import { useTrackScrollProgress } from "../app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";

export default function HobbyPage() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);
  const overlayVisible = progress < 1;

  // Indicateur de scroll
  const showScrollIndicator = progress < 0.35;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#FFD54F] via-[#FFF176] to-[#FFE082]">
      {/* HERO FIXE */}
      <div
        className={
          "fixed inset-0 flex items-center justify-center transition-opacity duration-300 " +
          (overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        style={{ pointerEvents: overlayVisible ? "none" : "none" }}
      >
        <div className="container mx-auto px-4 pointer-events-auto mt-16 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* 3D piloté par progress */}
            <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
              <div
                className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                           md:translate-x-[15%] lg:translate-x-[20%]
                           transition-transform duration-500"
              >
                <Romain3D 
                  progress={progress} 
                  phase="intro"
                  modelUrl="/models/RomainVacanceSalut.glb"
                  theme="hobby"
                />
              </div>
            </div>

            {/* Bulle de texte */}
            <div className="order-1 md:order-2 w-full md:w-1/2 flex justify-center md:justify-start">
              <div className="relative w-full md:w-auto min-h-[120px] md:min-h-[240px] flex justify-center md:block">
                <div className="md:min-w-[22rem] md:max-w-[28rem]">
                  <ChatBubble
                    text="Viens découvrir mes hobbys ! 🌴"
                    className="arrow-bottom md:arrow-left md:-translate-y-12 
                               bg-gradient-to-br from-amber-600/90 to-yellow-500/80
                               shadow-[0_0_24px_rgba(245,158,11,.35)]
                               hobby-bubble"
                  />
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
              <span className="text-amber-900 font-semibold text-lg tracking-wide font-orbitron">
                Explorer
              </span>
              
              {/* Flèche animée */}
              <svg 
                className="w-8 h-8 text-amber-900/70 animate-bounce cursor-pointer
                           hover:text-amber-900 hover:scale-110 transition-all duration-300"
                onClick={() =>
                  document.getElementById("hobby-section-2")?.scrollIntoView({ behavior: "smooth" })
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
      <section ref={trackRef} className="relative h-[200dvh]" />

      {/* Section suivante */}
      <section id="hobby-section-2" className="w-full min-h-dvh" />
    </main>
  );
}