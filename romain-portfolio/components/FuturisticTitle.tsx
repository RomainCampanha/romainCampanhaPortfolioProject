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

  // Calcul des transformations
  // Ancien titre : 0% → 200% (sort à droite)
  const currentTranslateX = transitionProgress * 200;
  const currentOpacity = 1 - transitionProgress;

  // Nouveau titre : -250% → 0% (entre de gauche, bien à l'extérieur)
  const nextTranslateX = -250 + (transitionProgress * 250);
  const nextOpacity = transitionProgress;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Titre actuel */}
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
          transform: `translateX(${currentTranslateX}%)`,
          opacity: currentOpacity,
          transition: "transform 0.8s ease-in-out, opacity 0.8s ease-in-out",
          willChange: "transform, opacity",
        }}
      >
        {currentTitle}
      </h1>

      {/* Nouveau titre (pendant la transition) */}
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
            transform: `translateX(${nextTranslateX}%)`,
            opacity: nextOpacity,
            transition: "transform 0.8s ease-in-out, opacity 0.8s ease-in-out",
            willChange: "transform, opacity",
          }}
        >
          {nextTitle}
        </h1>
      )}
    </div>
  );
}