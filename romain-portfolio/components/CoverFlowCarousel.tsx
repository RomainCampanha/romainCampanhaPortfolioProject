"use client";

import { useState, useEffect, useRef } from "react";

type CoverFlowCarouselProps = {
  images: string[];
  nextImages?: string[]; // Images de la prochaine destination
  transitionProgress?: number; // 0 à 1 pendant la transition
};

export default function CoverFlowCarousel({ 
  images, 
  nextImages = [],
  transitionProgress = 0 
}: CoverFlowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const isTransitioning = transitionProgress > 0 && nextImages.length > 0;

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-play toutes les 3 secondes (sauf pendant transition)
  useEffect(() => {
    if (!isAutoPlaying || isTransitioning) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length, isTransitioning]);

  // Réinitialiser l'index seulement quand on sort complètement de la transition
  // et qu'on a de nouvelles images
  const prevImagesRef = useRef(images);
  useEffect(() => {
    // Si les images ont changé ET qu'on n'est plus en transition
    if (transitionProgress === 0 && prevImagesRef.current !== images) {
      setCurrentIndex(0);
      prevImagesRef.current = images;
    }
  }, [transitionProgress, images]);

  // Navigation avec les flèches clavier
  useEffect(() => {
    if (isTransitioning) return; // Pas de navigation pendant transition

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, isTransitioning]);

  // SCROLL HORIZONTAL uniquement
  const handleWheel = (e: React.WheelEvent) => {
    if (isTransitioning) return; // Pas de navigation pendant transition

    const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    
    if (!isHorizontalScroll) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    if (Math.abs(e.deltaX) > 10) {
      if (e.deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // SWIPE MOBILE
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isTransitioning) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY) * 2 && Math.abs(diffX) > 60) {
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
  };

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Calculer la rotation globale du carousel pendant la transition
  // 0 → 0.5 : rotation de 0° à 180° (images actuelles disparaissent)
  // 0.5 → 1 : rotation de 180° à 360° (nouvelles images apparaissent)
  const globalRotation = transitionProgress * 360;

  // Calculer la position et le style de chaque image
  const getImageStyle = (index: number, isNextDestination: boolean = false) => {
    let diff = index - currentIndex;
    const totalImages = isNextDestination ? nextImages.length : images.length;
    
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
    
    // Rotation additionnelle pendant la transition
    let transitionRotationY = 0;
    if (isTransitioning) {
      // Les images actuelles et nouvelles tournent ensemble
      transitionRotationY = globalRotation;
    }
    
    // Opacité pendant la transition - Swap plus progressif
    let transitionOpacity = 1;
    if (isTransitioning) {
      if (isNextDestination) {
        // Nouvelles images : fade in progressif à partir de 40% jusqu'à 100%
        if (transitionProgress < 0.4) {
          transitionOpacity = 0;
        } else {
          transitionOpacity = (transitionProgress - 0.4) / 0.6; // 0 à 1 entre 40% et 100%
        }
      } else {
        // Anciennes images : fade out progressif de 0% à 60%
        if (transitionProgress > 0.6) {
          transitionOpacity = 0;
        } else {
          transitionOpacity = 1 - (transitionProgress / 0.6); // 1 à 0 entre 0% et 60%
        }
      }
    }
    
    // Image centrale
    if (diff === 0) {
      return {
        transform: `translateX(0) scale(1) rotateY(${transitionRotationY}deg)`,
        opacity: 1 * transitionOpacity,
        zIndex: 50,
      };
    }
    
    // Images à gauche
    if (diff < 0) {
      return {
        transform: `translateX(${diff * spacing}px) scale(${1 - absDiff * 0.15}) rotateY(${rotationAngle + transitionRotationY}deg)`,
        opacity: Math.max(0.3, 1 - absDiff * 0.3) * transitionOpacity,
        zIndex: 50 - absDiff,
      };
    }
    
    // Images à droite
    return {
      transform: `translateX(${diff * spacing}px) scale(${1 - absDiff * 0.15}) rotateY(${-rotationAngle + transitionRotationY}deg)`,
      opacity: Math.max(0.3, 1 - absDiff * 0.3) * transitionOpacity,
      zIndex: 50 - absDiff,
    };
  };

  // Dimensions responsive des images
  const imageWidth = isMobile ? "280px" : "350px";
  const imageHeight = isMobile ? "400px" : "500px";

  // Déterminer quelles images afficher
  // Dès que transitionProgress > 0.6, on affiche les nouvelles images
  // pour éviter un swap brutal à la fin
  const shouldShowNextImages = isTransitioning && transitionProgress > 0.6;
  const imagesToRender = shouldShowNextImages ? nextImages : images;

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        pointerEvents: 'auto'
      }}
    >
      {/* Conteneur du carrousel */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 flex items-center justify-center"
        style={{ 
          perspective: isMobile ? "1000px" : "1500px"
        }}
      >
        {/* Images actuelles */}
        {!isTransitioning && images.map((imageUrl, index) => {
          const style = getImageStyle(index, false);
          
          let diff = index - currentIndex;
          const totalImages = images.length;
          if (diff > totalImages / 2) diff -= totalImages;
          else if (diff < -totalImages / 2) diff += totalImages;
          
          const visibleRange = isMobile ? 3 : 4;
          const isVisible = Math.abs(diff) <= visibleRange;

          if (!isVisible) return null;

          const isCenterImage = index === currentIndex;

          return (
            <div
              key={`current-${index}`}
              className={`absolute ${
                !isCenterImage ? 'cursor-pointer' : 'cursor-default'
              }`}
              style={{
                ...style,
                transformStyle: "preserve-3d",
                width: imageWidth,
                height: imageHeight,
                pointerEvents: 'auto',
                transition: "transform 0.6s ease-in-out, opacity 0.6s ease-in-out",
                willChange: "transform, opacity",
              }}
              onClick={(e) => {
                if (!isCenterImage) {
                  e.stopPropagation();
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
              </div>
            </div>
          );
        })}

        {/* Images pendant transition - On affiche les deux sets superposés */}
        {isTransitioning && (
          <>
            {/* Anciennes images qui disparaissent */}
            {images.map((imageUrl, index) => {
              const style = getImageStyle(index, false);
              
              let diff = index - currentIndex;
              const totalImages = images.length;
              if (diff > totalImages / 2) diff -= totalImages;
              else if (diff < -totalImages / 2) diff += totalImages;
              
              const visibleRange = isMobile ? 3 : 4;
              const isVisible = Math.abs(diff) <= visibleRange;

              if (!isVisible) return null;

              return (
                <div
                  key={`old-${index}`}
                  className="absolute"
                  style={{
                    ...style,
                    transformStyle: "preserve-3d",
                    width: imageWidth,
                    height: imageHeight,
                    pointerEvents: 'none',
                    transition: "transform 0.6s ease-in-out, opacity 0.6s ease-in-out",
                    willChange: "transform, opacity",
                  }}
                >
                  <div className="relative w-full h-full">
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
                  </div>
                </div>
              );
            })}

            {/* Nouvelles images qui apparaissent */}
            {nextImages.map((imageUrl, index) => {
              const style = getImageStyle(index, true);
              
              let diff = index - currentIndex;
              const totalImages = nextImages.length;
              if (diff > totalImages / 2) diff -= totalImages;
              else if (diff < -totalImages / 2) diff += totalImages;
              
              const visibleRange = isMobile ? 3 : 4;
              const isVisible = Math.abs(diff) <= visibleRange;

              if (!isVisible) return null;

              return (
                <div
                  key={`new-${index}`}
                  className="absolute"
                  style={{
                    ...style,
                    transformStyle: "preserve-3d",
                    width: imageWidth,
                    height: imageHeight,
                    pointerEvents: 'none',
                    transition: "transform 0.6s ease-in-out, opacity 0.6s ease-in-out",
                    willChange: "transform, opacity",
                  }}
                >
                  <div className="relative w-full h-full">
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
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Indicateurs de position (dots) - Mobile uniquement - Masqués pendant transition */}
      {isMobile && !isTransitioning && (
        <div className="flex gap-1.5 mt-4 pb-2">
          {imagesToRender.map((_, index) => (
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