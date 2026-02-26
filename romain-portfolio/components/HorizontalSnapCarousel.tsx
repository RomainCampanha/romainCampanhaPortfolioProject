"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type HorizontalSnapCarouselProps = {
  images: string[];
  nextImages?: string[];
  transitionProgress?: number; // 0 à 1 pendant la transition
};

export default function HorizontalSnapCarousel({
  images,
  nextImages = [],
  transitionProgress = 0,
}: HorizontalSnapCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const isAutoPlayingRef = useRef(true);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isTransitioning = transitionProgress > 0 && nextImages.length > 0;

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Suivre l'index courant via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) setCurrentIndex(index);
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [images]);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const items = container.querySelectorAll("[data-index]");
    if (items[index]) {
      items[index].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, []);

  // Pause auto-play quand l'utilisateur interagit
  const pauseAutoPlay = useCallback(() => {
    isAutoPlayingRef.current = false;
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
    autoPlayTimeoutRef.current = setTimeout(() => {
      isAutoPlayingRef.current = true;
    }, 8000);
  }, []);

  // Auto-play
  useEffect(() => {
    if (isTransitioning) return;

    const interval = setInterval(() => {
      if (!isAutoPlayingRef.current) return;
      const nextIndex = (currentIndex + 1) % images.length;
      scrollToIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex, images.length, isTransitioning, scrollToIndex]);

  // Navigation clavier
  useEffect(() => {
    if (isTransitioning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        pauseAutoPlay();
        scrollToIndex((currentIndex - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        pauseAutoPlay();
        scrollToIndex((currentIndex + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images.length, isTransitioning, pauseAutoPlay, scrollToIndex]);

  // Réinitialiser au changement de destination
  const prevImagesRef = useRef(images);
  useEffect(() => {
    if (transitionProgress === 0 && prevImagesRef.current !== images) {
      setCurrentIndex(0);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
      }
      prevImagesRef.current = images;
    }
  }, [transitionProgress, images]);

  const goNext = () => {
    pauseAutoPlay();
    scrollToIndex((currentIndex + 1) % images.length);
  };

  const goPrev = () => {
    pauseAutoPlay();
    scrollToIndex((currentIndex - 1 + images.length) % images.length);
  };

  // Dimensions responsive
  const imageWidth = isMobile ? "75vw" : "350px";
  const imageHeight = isMobile ? "50vh" : "500px";
  const gap = isMobile ? "12px" : "20px";
  const halfWidth = isMobile ? "37.5vw" : "175px";

  // Rendu du conteneur scroll (réutilisé pour current et next)
  const renderScrollContainer = (
    imgs: string[],
    ref?: React.RefObject<HTMLDivElement | null>,
    interactive?: boolean
  ) => (
    <div
      ref={ref}
      className="w-full flex items-center overflow-x-auto snap-carousel"
      style={{
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        gap,
        paddingLeft: `calc(50% - ${halfWidth})`,
        paddingRight: `calc(50% - ${halfWidth})`,
        pointerEvents: interactive ? "auto" : "none",
      }}
      onTouchStart={interactive ? pauseAutoPlay : undefined}
      onWheel={interactive ? (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          pauseAutoPlay();
        }
      } : undefined}
    >
      {imgs.map((imageUrl, index) => (
        <div
          key={`img-${index}`}
          data-index={interactive ? index : undefined}
          className="flex-shrink-0 snap-center"
          style={{
            scrollSnapAlign: "center",
            width: imageWidth,
            height: imageHeight,
          }}
        >
          <img
            src={imageUrl}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover rounded-xl"
            style={{
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.35)",
              userSelect: "none",
            }}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Nouvelles images (derrière, révélées par le wipe) */}
      {isTransitioning && (
        <div className="absolute inset-0 flex items-center">
          {renderScrollContainer(nextImages)}
        </div>
      )}

      {/* Images courantes (au-dessus, clippées de gauche à droite) */}
      <div
        className="relative w-full flex-1 flex items-center"
        style={{
          clipPath: isTransitioning
            ? `inset(0 0 0 ${transitionProgress * 100}%)`
            : undefined,
          willChange: isTransitioning ? "clip-path" : undefined,
        }}
      >
        {renderScrollContainer(images, scrollRef, true)}

        {/* Flèches de navigation (desktop uniquement) */}
        {!isMobile && !isTransitioning && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center
                         rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40
                         transition-colors text-white cursor-pointer"
              aria-label="Photo précédente"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center
                         rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40
                         transition-colors text-white cursor-pointer"
              aria-label="Photo suivante"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Ligne de wipe lumineuse */}
      {isTransitioning && (
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{
            left: `${transitionProgress * 100}%`,
            width: "3px",
            background: "linear-gradient(to bottom, transparent 5%, rgba(251, 146, 60, 0.8) 30%, rgba(251, 146, 60, 0.9) 50%, rgba(251, 146, 60, 0.8) 70%, transparent 95%)",
            boxShadow: "0 0 12px 3px rgba(251, 146, 60, 0.4), 0 0 30px 6px rgba(251, 146, 60, 0.15)",
          }}
        />
      )}

      {/* Indicateurs de position (dots) */}
      {!isTransitioning && (
        <div className="flex gap-1.5 mt-4 pb-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                pauseAutoPlay();
                scrollToIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-amber-900"
                  : "w-1.5 bg-amber-900/30"
              }`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
