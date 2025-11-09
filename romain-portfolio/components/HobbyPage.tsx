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
  
  // Destinations avec transitions fluides
  // Chaque destination = 20% de scroll
  // Seoul: 35-55% | Toronto: 55-75% | Brighton: 75-95%
  const destinationProgress = Math.max(0, (progress - 0.35) / 0.6); // 0 à 1 sur 60%
  
  let currentDestination: "Coree" | "Toronto" | "BrightonDubrovnik" = "Coree";
  let nextDestination: "Coree" | "Toronto" | "BrightonDubrovnik" | null = null;
  let transitionProgress = 0; // 0 à 1 pendant la transition
  
  // Durée de transition = 30% de chaque section (10% du total)
  // Augmenté pour rendre la transition bien visible et fluide
  const transitionDuration = 0.18; // 18% de la plage totale (0.6)
  
  // IMPORTANT : La transition doit se terminer AVANT le changement de section
  // pour éviter le glitch de reset
  
  if (destinationProgress < 0.33) {
    // Section Seoul (0 - 0.33)
    currentDestination = "Coree";
    
    // Transition commence à 70% de la section
    // Se termine à 0.23 + 0.18 = 0.41, mais on cap à 0.329 pour éviter le glitch
    if (destinationProgress > 0.23 && destinationProgress < 0.329) {
      transitionProgress = (destinationProgress - 0.23) / transitionDuration;
      transitionProgress = Math.min(1, transitionProgress);
      nextDestination = "Toronto";
    } else if (destinationProgress >= 0.329) {
      // Transition terminée mais pas encore dans la nouvelle section
      // On reste sur Seoul mais transitionProgress = 1 (terminé)
      transitionProgress = 1;
      nextDestination = "Toronto";
    }
  } else if (destinationProgress < 0.66) {
    // Section Toronto (0.33 - 0.66)
    const localProgress = destinationProgress - 0.33;
    currentDestination = "Toronto";
    
    // Même logique : transition de 0.23 à 0.329 (juste avant 0.33)
    if (localProgress > 0.23 && localProgress < 0.329) {
      transitionProgress = (localProgress - 0.23) / transitionDuration;
      transitionProgress = Math.min(1, transitionProgress);
      nextDestination = "BrightonDubrovnik";
    } else if (localProgress >= 0.329) {
      transitionProgress = 1;
      nextDestination = "BrightonDubrovnik";
    }
  } else {
    // Section Brighton (0.66 - 1.0)
    currentDestination = "BrightonDubrovnik";
  }

  const showScrollIndicator = progress < 0.1;

  // Charger les images de TOUTES les destinations (hooks doivent toujours être appelés)
  const coreeData = useDestinationImages("Coree");
  const torontoData = useDestinationImages("Toronto");
  const brightonData = useDestinationImages("BrightonDubrovnik");

  // Sélectionner les bonnes données selon la destination actuelle
  const currentData = 
    currentDestination === "Coree" ? coreeData :
    currentDestination === "Toronto" ? torontoData :
    brightonData;

  const nextData = 
    nextDestination === "Toronto" ? torontoData :
    nextDestination === "BrightonDubrovnik" ? brightonData :
    null;

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

          {/* Indicateur scroll - Texte "Explorer" */}
          {showScrollIndicator && (
            <div 
              className="absolute bottom-[9dvh] left-1/2 -translate-x-1/2 z-10"
              style={{ opacity: showScrollIndicator ? 1 : 0, transition: "opacity 0.3s" }}
            >
              <span className="text-amber-900 font-semibold text-lg tracking-wide font-orbitron">
                Explorer
              </span>
            </div>
          )}

          {/* Flèche qui reste toujours visible (sauf sur carrousels) */}
          {!showCarousels && (
            <div 
              className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10"
              style={{ opacity: 1, transition: "opacity 0.3s" }}
            >
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
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center px-4 pt-20 md:pt-32"
          style={{ 
            zIndex: 50,
            pointerEvents: 'none'
          }}
        >
          
          {/* TITRES AVEC ANIMATION SYNCHRONIZED */}
          <div className="mb-8 md:mb-16 z-10 relative w-full h-20 md:h-32 flex items-center justify-center overflow-hidden">
            <FuturisticTitle 
              currentTitle={currentData.config.title}
              nextTitle={nextData?.config.title || ""}
              transitionProgress={transitionProgress}
              size="large"
            />
          </div>

          {/* CARROUSEL COVER FLOW avec rotation 3D */}
          <div 
            className="w-full max-w-7xl h-[55vh] md:h-[60vh]"
            style={{ pointerEvents: 'auto' }}
          >
            <CoverFlowCarousel 
              images={currentData.images}
              nextImages={nextData?.images || []}
              transitionProgress={transitionProgress}
            />
          </div>

          {/* Flèche vers le bas - visible pendant les carrousels */}
          <div 
            className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10"
            style={{ opacity: 1, pointerEvents: 'none' }}
          >
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
        </div>
      )}

      {/* PISTE DE SCROLL - Plus haute = scroll plus lent et transitions plus visibles */}
      <section ref={trackRef} className="relative h-[1400dvh]" />
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