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
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

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

  // Gestion du scroll (desktop uniquement)
  const handleWheel = (e: React.WheelEvent) => {
    if (isMobile) return; // Désactiver sur mobile
    
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    
    if (Math.abs(delta) > 10) {
      if (delta > 0) {
        setCurrentIndex(prev => (prev + 1) % images.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
      }
      setIsAutoPlaying(false);
    }
  };

  // Gestion du swipe améliorée
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = dragStartX.current - currentX;
    const diffY = dragStartY.current - currentY;

    // Swipe horizontal uniquement si le mouvement est plus horizontal que vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setCurrentIndex(prev => (prev + 1) % images.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
      }
      isDragging.current = false;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Drag pour desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    setIsAutoPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || isMobile) return;

    const currentX = e.clientX;
    const diff = dragStartX.current - currentX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentIndex(prev => (prev + 1) % images.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
      }
      isDragging.current = false;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Calculer la position et le style de chaque image avec VRAIE boucle infinie
  const getImageStyle = (index: number) => {
    let diff = index - currentIndex;
    const totalImages = images.length;
    
    // Toujours prendre le chemin le plus court
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
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Conteneur du carrousel */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: isMobile ? "1000px" : "1500px" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((imageUrl, index) => {
          const style = getImageStyle(index);
          
          // Calculer la distance pour afficher seulement les images proches
          let diff = index - currentIndex;
          const totalImages = images.length;
          if (diff > totalImages / 2) diff -= totalImages;
          else if (diff < -totalImages / 2) diff += totalImages;
          
          // Afficher plus d'images sur desktop, moins sur mobile pour les perfs
          const visibleRange = isMobile ? 3 : 4;
          const isVisible = Math.abs(diff) <= visibleRange;

          if (!isVisible) return null;

          return (
            <div
              key={index}
              className="absolute transition-all duration-500 ease-out"
              style={{
                ...style,
                transformStyle: "preserve-3d",
                width: imageWidth,
                height: imageHeight,
              }}
              onClick={() => {
                if (index !== currentIndex) {
                  setCurrentIndex(index);
                  setIsAutoPlaying(false);
                }
              }}
            >
              <img
                src={imageUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-xl"
                style={{
                  boxShadow: isMobile 
                    ? "0 15px 35px -10px rgba(0, 0, 0, 0.4)"
                    : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
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
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoPlaying(false);
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