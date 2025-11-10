// components/FuturisticTitle.tsx
"use client";

type FuturisticTitleProps = {
  currentTitle: string;
  nextTitle?: string;
  transitionProgress?: number; // 0 à 1 pendant la transition
  size?: "large" | "xlarge";
};

export default function FuturisticTitle({ 
  currentTitle,
  nextTitle = "",
  transitionProgress = 0,
  size = "xlarge" 
}: FuturisticTitleProps) {
  const fontSize = size === "xlarge" 
    ? "text-6xl md:text-9xl" 
    : "text-4xl md:text-7xl";
  
  const isTransitioning = transitionProgress > 0 && nextTitle;

  // Animation synchronisée avec les images (rotation 3D + translation)
  // Phase 1 (0 → 0.5) : Titre actuel fait une rotation de 0° à 90° et disparaît
  // Phase 2 (0.5 → 1) : Nouveau titre entre avec rotation de -90° à 0°
  
  // Ancien titre : rotation de 0° à 90° + fade out
  const currentRotateY = transitionProgress * 90;
  const currentScale = 1 - (transitionProgress * 0.3); // Légère diminution de scale
  const currentOpacity = transitionProgress < 0.5 
    ? 1 - (transitionProgress * 2) // Fade out sur la première moitié
    : 0;

  // Nouveau titre : rotation de -90° à 0° + fade in
  const nextRotateY = -90 + (transitionProgress * 90);
  const nextScale = 0.7 + (transitionProgress * 0.3); // Augmente de 0.7 à 1
  const nextOpacity = transitionProgress < 0.5 
    ? 0 
    : (transitionProgress - 0.5) * 2; // Fade in sur la deuxième moitié

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center"
      style={{ perspective: "1200px" }}
    >
      {/* Titre actuel avec rotation 3D */}
      <h1 
        className={`${fontSize} font-bold font-orbitron tracking-wider uppercase
                    bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600
                    bg-clip-text text-transparent
                    drop-shadow-[0_0_30px_rgba(251,146,60,0.5)]
                    ${!isTransitioning ? 'animate-pulse-slow' : ''}
                    px-4 text-center
                    absolute whitespace-nowrap`}
        style={{
          textShadow: "0 0 40px rgba(251, 146, 60, 0.3)",
          letterSpacing: "0.1em",
          transform: `rotateY(${currentRotateY}deg) scale(${currentScale})`,
          opacity: currentOpacity,
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
        }}
      >
        {currentTitle}
      </h1>

      {/* Nouveau titre (pendant la transition) avec rotation 3D */}
      {isTransitioning && (
        <h1 
          className={`${fontSize} font-bold font-orbitron tracking-wider uppercase
                      bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600
                      bg-clip-text text-transparent
                      drop-shadow-[0_0_30px_rgba(251,146,60,0.5)]
                      animate-pulse-slow
                      px-4 text-center
                      absolute whitespace-nowrap`}
          style={{
            textShadow: "0 0 40px rgba(251, 146, 60, 0.3)",
            letterSpacing: "0.1em",
            transform: `rotateY(${nextRotateY}deg) scale(${nextScale})`,
            opacity: nextOpacity,
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
          }}
        >
          {nextTitle}
        </h1>
      )}
    </div>
  );
}