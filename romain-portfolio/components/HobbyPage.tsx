"use client";

import { useRef } from "react";
import { useTrackScrollProgress } from "../app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import CoverFlowCarousel from "@/components/CoverFlowCarousel";
import FuturisticTitle from "@/components/FuturisticTitle";
import { useDestinationImages } from "@/app/hooks/useDestinationImages";

export default function HobbyPage() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);

  // === PHASES D'ANIMATION INTRO ===
  const showIntroMessage = progress < 0.15;
  const travelMessageProgress = Math.max(0, Math.min(1, (progress - 0.15) / 0.1));
  const showTravelMessage = progress >= 0.15 && progress < 0.35;
  
  // Personnage sort (25-35%)
  const characterExitProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.1));
  const characterRotation = characterExitProgress * 90;
  const characterExitX = characterExitProgress * -150;
  
  // === PHASES CARROUSELS (35%+) ===
  const showCarousels = progress >= 0.35;
  
  // Destinations (chaque destination = 20% de scroll)
  // Seoul: 35-55%
  // Toronto: 55-75%
  // Brighton: 75-95%
  const destinationProgress = Math.max(0, (progress - 0.35) / 0.6); // 0 à 1 sur 60%
  
  let currentDestination: "Coree" | "Toronto" | "BrightonDubrovnik" = "Coree";
  let destinationTransition = 0; // 0 = stable, 0-1 = transition
  
  if (destinationProgress < 0.33) {
    currentDestination = "Coree";
    // Transition out commence à 90% de la section (30% * 0.9 = 27%)
    if (destinationProgress > 0.27) {
      destinationTransition = (destinationProgress - 0.27) / 0.06; // 0 à 1
    }
  } else if (destinationProgress < 0.66) {
    currentDestination = "Toronto";
    const localProgress = (destinationProgress - 0.33) / 0.33;
    if (localProgress > 0.9) {
      destinationTransition = (localProgress - 0.9) / 0.1;
    }
  } else {
    currentDestination = "BrightonDubrovnik";
  }

  const showScrollIndicator = progress < 0.1;

  // Charger les images de la destination actuelle
  const { images, config } = useDestinationImages(currentDestination);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#FFD54F] via-[#FFF176] to-[#FFE082]">
      
      {/* === SECTION INTRO FIXE === */}
      <div 
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: showCarousels ? 0 : 1, transition: "opacity 0.5s" }}
      >
        <div className="container mx-auto px-4 mt-16 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            
            {/* PERSONNAGE AVEC ROTATION */}
            <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
              <div
                className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                           md:translate-x-[15%] lg:translate-x-[20%]
                           transition-all duration-500"
                style={{
                  transform: `translateX(${characterExitX}%) rotateY(${characterRotation}deg)`,
                  opacity: 1 - characterExitProgress,
                }}
              >
                <Romain3D 
                  progress={Math.min(0.25, progress)} 
                  phase="intro"
                  modelUrl="/models/RomainVacanceSalut.glb"
                  theme="hobby"
                />
              </div>
            </div>

            {/* BULLES */}
            <div className="order-1 md:order-2 w-full md:w-1/2 flex justify-center md:justify-start pointer-events-auto">
              <div className="relative w-full md:w-auto md:min-h-[240px] flex justify-center md:block">
                
                {/* Message intro */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    showIntroMessage ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="md:min-w-[22rem] md:max-w-[28rem]">
                    <ChatBubble
                      text="Viens découvrir mes hobbys ! 🌴"
                      className="arrow-bottom md:arrow-left md:-translate-y-12 
                                 bg-gradient-to-br from-amber-600/90 to-yellow-500/80
                                 shadow-[0_0_24px_rgba(245,158,11,.35)]
                                 hobby-bubble"
                      loop={false}
                    />
                  </div>
                </div>

                {/* Message voyages qui s'écrit */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    showTravelMessage ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="md:min-w-[22rem] md:max-w-[28rem]">
                    <TravelMessageBubble progress={travelMessageProgress} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Indicateur scroll */}
          {showScrollIndicator && (
            <div 
              className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
              style={{ opacity: showScrollIndicator ? 1 : 0 }}
            >
              <span className="text-amber-900 font-semibold text-lg tracking-wide font-orbitron">
                Explorer
              </span>
              <svg 
                className="w-8 h-8 text-amber-900/70 animate-bounce"
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

      {/* === SECTION CARROUSELS FIXE === */}
      {showCarousels && (
        <div className="fixed inset-0 flex flex-col items-center justify-center px-4 pt-20 md:pt-32">
          
          {/* TITRE DESTINATION */}
          <div 
            className="mb-8 md:mb-16 z-10"
            style={{
              transform: `translateX(${destinationTransition * -100}%)`,
              opacity: 1 - destinationTransition,
              transition: "all 0.5s ease-out"
            }}
          >
            <FuturisticTitle text={config.title} size="large" />
          </div>

          {/* CARROUSEL COVER FLOW */}
          <div className="w-full max-w-7xl h-[55vh] md:h-[60vh]">
            <CoverFlowCarousel images={images} />
          </div>

          {/* Instruction - Desktop uniquement */}
          <p className="hidden md:block mt-8 text-amber-900 font-orbitron text-sm md:text-base opacity-70">
            Scroll horizontal pour naviguer dans les photos
          </p>
        </div>
      )}

      {/* PISTE DE SCROLL */}
      <section ref={trackRef} className="relative h-[800dvh]" />
    </main>
  );
}

// Bulle qui s'écrit progressivement
function TravelMessageBubble({ progress }: { progress: number }) {
  const fullText = "Viens découvrir mes voyages ! ✈️";
  const visibleLength = Math.floor(fullText.length * progress);
  const visibleText = fullText.substring(0, visibleLength);

  return (
    <div
      className="bubble max-w-[22rem] rounded-3xl p-4 md:p-5 
                 bg-gradient-to-br from-amber-600/90 to-yellow-500/80
                 backdrop-blur-sm text-white border border-white/20 relative
                 shadow-[0_0_24px_rgba(245,158,11,.35)]
                 font-orbitron arrow-bottom md:arrow-left md:-translate-y-12 hobby-bubble"
    >
      <p className="whitespace-normal break-words hyphens-auto leading-relaxed">
        {visibleText}
        {progress < 1 && <span className="animate-caret">|</span>}
      </p>
    </div>
  );
}