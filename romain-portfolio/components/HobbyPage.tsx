"use client";

import { useRef, useState } from "react";
import { useTrackScrollProgress } from "../app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import CoverFlowCarousel from "@/components/CoverFlowCarousel";
import FuturisticTitle from "@/components/FuturisticTitle";
import { useDestinationImages } from "@/app/hooks/useDestinationImages";
import ScrollRunnerGame from "@/components/ScrollRunnerGame";

export default function HobbyPage() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);
  const [gameCompleted, setGameCompleted] = useState(false);

  // === PHASES D'ANIMATION ===
  
  // Phase 1 : Message intro (0-12%)
  const introMessageProgress = Math.min(1, progress / 0.12);
  const showIntroMessage = progress < 0.12;
  
  // Phase 2 : MINI-JEU (12-35% OU jusqu'à ce que le jeu soit complété)
  const gamePhaseStart = 0.12;
  const gamePhaseEnd = 0.35;
  const showGame = progress >= gamePhaseStart && progress < gamePhaseEnd;
  const gameProgress = Math.max(0, Math.min(1, (progress - gamePhaseStart) / (gamePhaseEnd - gamePhaseStart)));
  
  // Transition de bulle intro (12-18%)
  const bubbleTransitionProgress = Math.max(0, Math.min(1, (progress - 0.12) / 0.06));
  
  // Phase 3 : Message voyage (35%+) - Apparaît après 35% même si jeu pas fini
  const travelMessageStart = 0.35;
  const travelMessageProgress = Math.max(0, Math.min(1, (progress - travelMessageStart) / 0.08));
  const showTravelMessage = progress >= travelMessageStart && progress < (travelMessageStart + 0.17);
  
  // Animation de la première bulle (disparition)
  const introBubbleScale = showIntroMessage ? 1 : 1 - bubbleTransitionProgress * 0.5;
  const introBubbleOpacity = showIntroMessage ? 1 : 1 - bubbleTransitionProgress * 2;
  const introBubbleRotate = bubbleTransitionProgress * 15;
  
  // Personnage : wave avant de partir
  const waveProgress = Math.max(0, Math.min(1, (progress - (travelMessageStart + 0.03)) / 0.05));
  const waveRotation = Math.sin(waveProgress * Math.PI * 2) * 8;
  
  // Personnage sort avec style (après message voyage)
  const characterExitStart = travelMessageStart + 0.08;
  const characterExitProgress = Math.max(0, Math.min(1, (progress - characterExitStart) / 0.1));
  
  const characterRotationY = characterExitProgress * -90;
  const characterExitX = characterExitProgress * characterExitProgress * -150;
  const characterScale = 1 - (characterExitProgress * 0.3);
  const characterJump = characterExitProgress < 0.3 
    ? Math.sin(characterExitProgress * Math.PI * 3.33) * 0.15
    : 0;
  
  // === PHASES CARROUSELS (après sortie du personnage) ===
  const carouselsStart = characterExitStart + 0.1;
  const showCarousels = progress >= carouselsStart;
  
  // Destinations avec transitions
  const destinationProgress = Math.max(0, (progress - carouselsStart) / 0.6);
  
  let currentDestination: "Coree" | "Toronto" | "BrightonDubrovnik" = "Coree";
  let nextDestination: "Coree" | "Toronto" | "BrightonDubrovnik" | null = null;
  let transitionProgress = 0;
  
  const transitionDuration = 0.20;
  
  if (destinationProgress < 0.33) {
    currentDestination = "Coree";
    const transitionStart = 0.33 - transitionDuration;
    if (destinationProgress >= transitionStart) {
      const localProgress = destinationProgress - transitionStart;
      transitionProgress = Math.min(1, localProgress / transitionDuration);
      nextDestination = "Toronto";
    }
  } else if (destinationProgress < 0.66) {
    currentDestination = "Toronto";
    const transitionStart = 0.66 - transitionDuration;
    const localDestProgress = destinationProgress - 0.33;
    if (localDestProgress >= (transitionStart - 0.33)) {
      const localProgress = destinationProgress - transitionStart;
      transitionProgress = Math.min(1, localProgress / transitionDuration);
      nextDestination = "BrightonDubrovnik";
    }
  } else {
    currentDestination = "BrightonDubrovnik";
  }

  const showScrollIndicator = progress < 0.1;

  // Charger les images
  const coreeData = useDestinationImages("Coree");
  const torontoData = useDestinationImages("Toronto");
  const brightonData = useDestinationImages("BrightonDubrovnik");

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
        style={{ opacity: (showCarousels || showGame) ? 0 : 1, transition: "opacity 0.5s" }}
      >
        <div className="container mx-auto px-4 mt-16 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            
            {/* PERSONNAGE */}
            <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
              <div
                className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                           md:translate-x-[15%] lg:translate-x-[20%]
                           transition-all duration-300"
                style={{
                  transform: `
                    translateX(${characterExitX}%) 
                    translateY(${characterJump * 100}%) 
                    rotateY(${characterRotationY}deg)
                    ${characterExitProgress === 0 ? `rotateZ(${waveRotation}deg)` : ''}
                    scale(${characterScale})
                  `,
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
                
                {/* Message intro avec animation de disparition */}
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: introBubbleOpacity,
                    transform: `scale(${introBubbleScale}) rotate(${introBubbleRotate}deg)`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    pointerEvents: showIntroMessage ? "auto" : "none",
                  }}
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

                {/* Message voyages (après le jeu) */}
                {showTravelMessage && (
                  <div className="absolute inset-0">
                    <div className="md:min-w-[22rem] md:max-w-[28rem]">
                      <TravelMessageBubble 
                        progress={travelMessageProgress}
                        shouldAnimate={showTravelMessage}
                      />
                    </div>
                  </div>
                )}
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

          {/* Flèche qui reste visible (sauf sur carrousels) */}
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

        {/* Effet de whoosh quand le personnage part */}
        {characterExitProgress > 0 && characterExitProgress < 1 && (
          <div 
            className="fixed inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, 
                rgba(255, 193, 7, ${characterExitProgress * 0.15}) 0%, 
                transparent 50%)`,
              opacity: characterExitProgress * (1 - characterExitProgress) * 4,
            }}
          />
        )}
      </div>

      {/* === SECTION MINI-JEU FIXE === */}
      {showGame && (
        <div 
          className="fixed inset-0 flex items-center justify-center px-4 pt-20 z-50"
          style={{ 
            opacity: showGame ? 1 : 0,
            pointerEvents: showGame ? 'auto' : 'none',
            transition: "opacity 0.5s"
          }}
        >
          <ScrollRunnerGame 
            onGameComplete={() => {
              console.log("🎮 Jeu complété !");
              setGameCompleted(true);
            }}
            scrollProgress={gameProgress}
          />
        </div>
      )}

      {/* === SECTION CARROUSELS FIXE === */}
      {showCarousels && (
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center px-4 pt-20 md:pt-32"
          style={{ 
            zIndex: 50,
            pointerEvents: 'none'
          }}
        >
          
          {/* TITRES AVEC ROTATION 3D */}
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

          {/* Flèche vers le bas */}
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

      {/* PISTE DE SCROLL - Plus longue pour inclure le jeu */}
      <section ref={trackRef} className="relative h-[1200dvh]" />
    </main>
  );
}

// Bulle qui s'écrit progressivement
function TravelMessageBubble({ 
  progress, 
  shouldAnimate 
}: { 
  progress: number; 
  shouldAnimate: boolean;
}) {
  const fullText = "Viens découvrir mes voyages ! ✈️";
  const visibleLength = shouldAnimate ? Math.floor(fullText.length * progress) : fullText.length;
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
        {shouldAnimate && progress < 1 && <span className="animate-caret">|</span>}
      </p>
    </div>
  );
}