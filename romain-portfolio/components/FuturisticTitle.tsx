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

  const titleClass = `${fontSize} font-bold font-orbitron tracking-wider uppercase
                      bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600
                      bg-clip-text text-transparent
                      drop-shadow-[0_0_30px_rgba(251,146,60,0.5)]
                      px-4 text-center absolute whitespace-nowrap`;

  // Slide horizontal : actuel sort à droite, nouveau entre par la gauche
  const currentTranslateX = isTransitioning ? transitionProgress * 120 : 0;
  const currentOpacity = isTransitioning ? 1 - transitionProgress : 1;

  const nextTranslateX = isTransitioning ? -120 + transitionProgress * 120 : -120;
  const nextOpacity = isTransitioning ? transitionProgress : 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Nouveau titre (entre par la gauche) */}
      {isTransitioning && (
        <h1
          className={`${titleClass} animate-pulse-slow`}
          style={{
            textShadow: "0 0 40px rgba(251, 146, 60, 0.3)",
            letterSpacing: "0.1em",
            transform: `translateX(${nextTranslateX}%)`,
            opacity: nextOpacity,
            willChange: "transform, opacity",
          }}
        >
          {nextTitle}
        </h1>
      )}

      {/* Titre actuel (sort vers la droite) */}
      <h1
        className={`${titleClass} ${!isTransitioning ? 'animate-pulse-slow' : ''}`}
        style={{
          textShadow: "0 0 40px rgba(251, 146, 60, 0.3)",
          letterSpacing: "0.1em",
          transform: isTransitioning ? `translateX(${currentTranslateX}%)` : undefined,
          opacity: currentOpacity,
          willChange: isTransitioning ? "transform, opacity" : undefined,
        }}
      >
        {currentTitle}
      </h1>
    </div>
  );
}
