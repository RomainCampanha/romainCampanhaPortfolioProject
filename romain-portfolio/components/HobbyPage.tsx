"use client";

import { useRef, useState, useEffect } from "react";
import { useTrackScrollProgress } from "../app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import CoverFlowCarousel from "@/components/CoverFlowCarousel";
import FuturisticTitle from "@/components/FuturisticTitle";
import { useDestinationImages } from "@/app/hooks/useDestinationImages";

// 🎉 BONUS : Particules festives
type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  emoji: string;
  opacity: number;
  scale: number;
};

const EMOJIS = ["✈️", "🌴", "🗺️", "🎒", "📸", "🌏", "🏖️"];

export default function HobbyPage() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef);
  const [particles, setParticles] = useState<Particle[]>([]);

  // === PHASES D'ANIMATION INTRO AMÉLIORÉES ===
  
  const introMessageProgress = Math.min(1, progress / 0.12);
  const showIntroMessage = progress < 0.12;
  
  const bubbleTransitionProgress = Math.max(0, Math.min(1, (progress - 0.12) / 0.06));
  const isTransitioningBubble = progress >= 0.12 && progress < 0.18;
  
  const travelMessageProgress = Math.max(0, Math.min(1, (progress - 0.18) / 0.08));
  const showTravelMessage = progress >= 0.18 && progress < 0.35;
  
  const introBubbleScale = showIntroMessage ? 1 : 1 - bubbleTransitionProgress * 0.5;
  const introBubbleOpacity = showIntroMessage ? 1 : 1 - bubbleTransitionProgress * 2;
  const introBubbleRotate = bubbleTransitionProgress * 15;
  
  const travelBubbleScale = isTransitioningBubble 
    ? 0.5 + (bubbleTransitionProgress * 0.5)
    : (showTravelMessage ? 1 : 0);
  const travelBubbleOpacity = isTransitioningBubble 
    ? bubbleTransitionProgress 
    : (showTravelMessage ? 1 : 0);
  const travelBubbleRotate = isTransitioningBubble 
    ? (1 - bubbleTransitionProgress) * -15
    : 0;
  
  const waveProgress = Math.max(0, Math.min(1, (progress - 0.20) / 0.05));
  const waveRotation = Math.sin(waveProgress * Math.PI * 2) * 8;
  
  const characterExitProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.1));
  const characterRotationY = (waveProgress * 10) + (characterExitProgress * 80);
  const characterExitX = characterExitProgress * characterExitProgress * -180;
  const characterScale = 1 - (characterExitProgress * 0.4);
  const characterJump = characterExitProgress < 0.3 
    ? Math.sin(characterExitProgress * Math.PI * 3.33) * 0.2
    : -characterExitProgress * 0.5;
  
  // 🎉 Déclencher les particules quand la bulle voyage apparaît
  const shouldShowParticles = progress >= 0.18 && progress < 0.25;
  
  useEffect(() => {
    if (!shouldShowParticles) {
      setParticles([]);
      return;
    }

    // Générer des particules initiales
    const initialParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      initialParticles.push({
        id: Date.now() + i,
        x: 30 + Math.random() * 15,
        y: 45 + Math.random() * 15,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.2 - 0.3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        opacity: 1,
        scale: 0.6 + Math.random() * 0.4,
      });
    }
    setParticles(initialParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            rotation: p.rotation + p.rotationSpeed,
            opacity: p.opacity - 0.015,
            scale: p.scale + 0.003,
          }))
          .filter((p) => p.opacity > 0 && p.y > -10)
      );
    }, 20);

    return () => clearInterval(interval);
  }, [shouldShowParticles]);
  
  // === PHASES CARROUSELS (35%+) ===
  const showCarousels = progress >= 0.35;
  
  const destinationProgress = Math.max(0, (progress - 0.35) / 0.6);
  
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
      
      {/* 🎉 Particules festives */}
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute text-2xl md:text-3xl"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
                opacity: p.opacity,
                transition: "all 0.02s linear",
              }}
            >
              {p.emoji}
            </div>
          ))}
        </div>
      )}

      {/* === SECTION INTRO FIXE === */}
      <div 
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: showCarousels ? 0 : 1, transition: "opacity 0.5s" }}
      >
        <div className="container mx-auto px-4 mt-16 md:mt-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            
            {/* PERSONNAGE AVEC ROTATION ET SORTIE STYLÉE */}
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
                    rotateZ(${waveRotation}deg)
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

            {/* BULLES AVEC TRANSITION STYLÉE */}
            <div className="order-1 md:order-2 w-full md:w-1/2 flex justify-center md:justify-start pointer-events-auto">
              <div className="relative w-full md:w-auto md:min-h-[240px] flex justify-center md:block">
                
                {/* Message intro */}
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

                {/* Message voyages */}
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: travelBubbleOpacity,
                    transform: `scale(${travelBubbleScale}) rotate(${travelBubbleRotate}deg)`,
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    pointerEvents: (isTransitioningBubble || showTravelMessage) ? "auto" : "none",
                  }}
                >
                  <div className="md:min-w-[22rem] md:max-w-[28rem]">
                    {(isTransitioningBubble || showTravelMessage) && (
                      <TravelMessageBubble 
                        progress={travelMessageProgress}
                        shouldAnimate={showTravelMessage}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

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

        {/* Effet de whoosh */}
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

      {/* === SECTION CARROUSELS FIXE === */}
      {showCarousels && (
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center px-4 pt-20 md:pt-32"
          style={{ 
            zIndex: 50,
            pointerEvents: 'none'
          }}
        >
          <div className="mb-8 md:mb-16 z-10 relative w-full h-20 md:h-32 flex items-center justify-center overflow-hidden">
            <FuturisticTitle 
              currentTitle={currentData.config.title}
              nextTitle={nextData?.config.title || ""}
              transitionProgress={transitionProgress}
              size="large"
            />
          </div>

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

      <section ref={trackRef} className="relative h-[1400dvh]" />
    </main>
  );
}

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