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
        // Auto-play continue
      } else if (e.key === "ArrowRight") {
        setCurrentIndex(prev => (prev + 1) % images.length);
        // Auto-play continue
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  // SCROLL HORIZONTAL uniquement - Le scroll vertical fait descendre la page
  const handleWheel = (e: React.WheelEvent) => {
    console.log('🎡 Wheel event:', { deltaX: e.deltaX, deltaY: e.deltaY });
    
    // Détecter si c'est un scroll horizontal (deltaX) ou vertical (deltaY)
    const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    
    console.log('  → isHorizontalScroll?', isHorizontalScroll);
    
    // Si c'est un scroll vertical, laisser la page défiler normalement
    if (!isHorizontalScroll) {
      console.log('  → Scroll vertical, on laisse passer');
      return; // Ne rien faire, le scroll de la page continue
    }
    
    console.log('  → Scroll horizontal, on navigue dans le carousel');
    
    // Si c'est un scroll horizontal, naviguer dans le carousel
    e.preventDefault();
    e.stopPropagation();
    
    if (Math.abs(e.deltaX) > 10) {
      if (e.deltaX > 0) {
        console.log('  → Suivant');
        goToNext();
      } else {
        console.log('  → Précédent');
        goToPrev();
      }
    }
  };

  // SWIPE MOBILE - Uniquement horizontal
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Swipe HORIZONTAL uniquement (pas vertical pour le scroll de page)
    // Le mouvement doit être nettement plus horizontal que vertical
    if (Math.abs(diffX) > Math.abs(diffY) * 2 && Math.abs(diffX) > 60) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    // Sinon, on laisse le scroll vertical de la page se faire naturellement
  };

  // Fonctions de navigation
  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
    // Auto-play continue
  };

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    // Auto-play continue
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    // Auto-play continue
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
      style={{
        pointerEvents: 'auto' // Intercepte les événements
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
                pointerEvents: 'auto', // CRITIQUE : Les images interceptent les clicks !
              }}
              onClick={(e) => {
                console.log('🖱️ CLICK détecté sur image', index);
                if (!isCenterImage) {
                  e.stopPropagation(); // Empêche le click de remonter à la page
                  console.log('✅ Navigation vers', index);
                  goToImage(index);
                } else {
                  console.log('❌ Image centrale, pas de navigation');
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