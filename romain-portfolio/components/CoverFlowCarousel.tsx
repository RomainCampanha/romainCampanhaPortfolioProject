"use client";

import { useState, useEffect, useRef } from "react";

type CoverFlowCarouselProps = {
  images: string[];
};

export default function CoverFlowCarousel({ images }: CoverFlowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-play toutes les 3 secondes
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  // Navigation avec les flèches clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
        setIsAutoPlaying(false);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex(prev => (prev + 1) % images.length);
        setIsAutoPlaying(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  // SCROLL SIMPLE - Fonctionne sur tout le conteneur
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    
    if (Math.abs(delta) > 10) {
      if (delta > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // SWIPE MOBILE
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Si le mouvement est plus horizontal que vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // Fonctions de navigation
  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    setIsAutoPlaying(false);
  };

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    setIsAutoPlaying(false);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Calculer la position et le style de chaque image
  const getImageStyle = (index: number) => {
    let diff = index - currentIndex;
    const totalImages = images.length;
    
    // Chemin le plus court
    if (diff > totalImages / 2) {
      diff -= totalImages;
    } else if (diff < -totalImages / 2) {
      diff += totalImages;
    }
    
    const absDiff = Math.abs(diff);
    
    // Dimensions et espacement responsive
    const spacing = isMobile ? 200 : 280;
    const rotationAngle = isMobile ? 25 : 35;
    
    // Image centrale
    if (diff === 0) {
      return {
        transform: "translateX(0) scale(1) rotateY(0deg)",
        opacity: 1,
        zIndex: 50,
      };
    }
    
    // Images à gauche
    if (diff < 0) {
      return {
        transform: `translateX(${diff * spacing}px) scale(${1 - absDiff * 0.15}) rotateY(${rotationAngle}deg)`,
        opacity: Math.max(0.3, 1 - absDiff * 0.3),
        zIndex: 50 - absDiff,
      };
    }
    
    // Images à droite
    return {
      transform: `translateX(${diff * spacing}px) scale(${1 - absDiff * 0.15}) rotateY(-${rotationAngle}deg)`,
      opacity: Math.max(0.3, 1 - absDiff * 0.3),
      zIndex: 50 - absDiff,
    };
  };

  // Dimensions responsive des images
  const imageWidth = isMobile ? "280px" : "350px";
  const imageHeight = isMobile ? "400px" : "500px";

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Conteneur du carrousel */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 flex items-center justify-center"
        style={{ perspective: isMobile ? "1000px" : "1500px" }}
      >
        {images.map((imageUrl, index) => {
          const style = getImageStyle(index);
          
          // Calculer la distance
          let diff = index - currentIndex;
          const totalImages = images.length;
          if (diff > totalImages / 2) diff -= totalImages;
          else if (diff < -totalImages / 2) diff += totalImages;
          
          // Afficher seulement les images proches
          const visibleRange = isMobile ? 3 : 4;
          const isVisible = Math.abs(diff) <= visibleRange;

          if (!isVisible) return null;

          const isCenterImage = index === currentIndex;

          return (
            <div
              key={index}
              className={`absolute transition-all duration-500 ease-out ${
                !isCenterImage ? 'cursor-pointer' : 'cursor-default'
              }`}
              style={{
                ...style,
                transformStyle: "preserve-3d",
                width: imageWidth,
                height: imageHeight,
              }}
              onClick={() => {
                if (!isCenterImage) {
                  goToImage(index);
                }
              }}
            >
              <div className="relative w-full h-full group">
                <img
                  src={imageUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                  style={{
                    boxShadow: isMobile 
                      ? "0 15px 35px -10px rgba(0, 0, 0, 0.4)"
                      : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    userSelect: "none",
                  }}
                  draggable={false}
                />
                
                {/* Effet hover sur images latérales (desktop uniquement) */}
                {!isCenterImage && !isMobile && (
                  <>
                    {/* Bordure au hover */}
                    <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-4 ring-amber-400/50 transition-all duration-300 pointer-events-none" />
                    
                    {/* Flèche directionnelle */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <svg 
                          className="w-8 h-8 text-white drop-shadow-lg"
                          fill="none" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2.5" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          {diff < 0 ? (
                            <path d="M9 5l7 7-7 7" />
                          ) : (
                            <path d="M15 19l-7-7 7-7" />
                          )}
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicateurs de position (dots) - Mobile uniquement */}
      {isMobile && (
        <div className="flex gap-1.5 mt-4 pb-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
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