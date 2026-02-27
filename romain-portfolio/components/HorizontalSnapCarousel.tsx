"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const offsetXRef = useRef(0);
  const currentSpeedRef = useRef(0.5);
  const targetSpeedRef = useRef(0.5);
  const userInteractingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchStartXRef = useRef(0);
  const singleSetWidthRef = useRef(0);
  const burstSpeedRef = useRef(0);
  const hasSwappedRef = useRef(false);
  const prevTransitionRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [displayedImages, setDisplayedImages] = useState(images);

  const BASE_SPEED = 0.5;
  const BURST_MAX_SPEED = 30; // vitesse max pendant le speed burst

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dimensions responsive
  const getImageWidthPx = useCallback(() => {
    return isMobile ? window.innerWidth * 0.75 : 350;
  }, [isMobile]);

  const getGapPx = useCallback(() => {
    return isMobile ? 12 : 20;
  }, [isMobile]);

  // Calculer la largeur d'un set complet d'images
  const computeSingleSetWidth = useCallback(() => {
    const imgW = getImageWidthPx();
    const gap = getGapPx();
    return images.length * (imgW + gap);
  }, [images.length, getImageWidthPx, getGapPx]);

  // Initialiser / reset l'offset au milieu (2e set)
  const resetOffset = useCallback(() => {
    const setW = computeSingleSetWidth();
    singleSetWidthRef.current = setW;
    offsetXRef.current = setW;
    currentSpeedRef.current = BASE_SPEED;
    targetSpeedRef.current = BASE_SPEED;
    userInteractingRef.current = false;
  }, [computeSingleSetWidth]);

  // === GESTION DES TRANSITIONS ENTRE DESTINATIONS ===

  // Quand la transition démarre (0 → >0), préparer le swap
  // Quand elle atteint ~0.5, swapper les images affichées
  // Quand elle finit (retour à 0), reset propre
  useEffect(() => {
    const wasTransitioning = prevTransitionRef.current > 0;
    const isNowTransitioning = transitionProgress > 0;

    // Transition vient de commencer
    if (!wasTransitioning && isNowTransitioning) {
      hasSwappedRef.current = false;
    }

    // Midpoint : swap les images pendant le speed burst
    if (transitionProgress >= 0.5 && !hasSwappedRef.current && nextImages.length > 0) {
      hasSwappedRef.current = true;
      setDisplayedImages(nextImages);
      // Reset l'offset au milieu du loop (le blur cache la discontinuité)
      const setW = singleSetWidthRef.current;
      offsetXRef.current = setW;
    }

    // Transition terminée : sync avec les images réelles
    if (wasTransitioning && !isNowTransitioning) {
      setDisplayedImages(images);
      hasSwappedRef.current = false;
      resetOffset();
    }

    // Update la vitesse burst
    burstSpeedRef.current = transitionProgress > 0
      ? Math.sin(transitionProgress * Math.PI) * BURST_MAX_SPEED // bell curve : monte puis descend
      : 0;

    prevTransitionRef.current = transitionProgress;
  }, [transitionProgress, nextImages, images, resetOffset]);

  // Sync images quand elles changent hors transition
  useEffect(() => {
    if (transitionProgress === 0) {
      setDisplayedImages(images);
    }
  }, [images, transitionProgress]);

  // Init au montage
  useEffect(() => {
    resetOffset();
  }, [resetOffset]);

  // Recalculer singleSetWidth au resize
  useEffect(() => {
    const handleResize = () => {
      const oldSetW = singleSetWidthRef.current;
      const newSetW = computeSingleSetWidth();
      if (oldSetW > 0) {
        const ratio = offsetXRef.current / oldSetW;
        offsetXRef.current = ratio * newSetW;
      }
      singleSetWidthRef.current = newSetW;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [computeSingleSetWidth]);

  // Pause auto et reprise progressive
  const pauseAutoAndResume = useCallback(() => {
    userInteractingRef.current = true;
    targetSpeedRef.current = 0;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userInteractingRef.current = false;
      targetSpeedRef.current = BASE_SPEED;
    }, 2000);
  }, []);

  // === BOUCLE D'ANIMATION ===
  useEffect(() => {
    const animate = () => {
      const setW = singleSetWidthRef.current;
      if (setW <= 0) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Lerp de la vitesse auto vers la cible
      currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.03;

      // Vitesse totale = auto + burst (le burst overrides l'interaction user)
      const totalSpeed = currentSpeedRef.current + burstSpeedRef.current;

      // Avancer le strip
      offsetXRef.current += totalSpeed;

      // Boucle infinie : reset silencieux
      if (offsetXRef.current >= setW * 2) {
        offsetXRef.current -= setW;
      }
      if (offsetXRef.current < 0) {
        offsetXRef.current += setW;
      }

      // Appliquer le transform + motion blur
      if (stripRef.current) {
        stripRef.current.style.transform = `translate3d(-${offsetXRef.current}px, 0, 0)`;

        // Motion blur proportionnel à la vitesse burst
        const blurAmount = Math.min(burstSpeedRef.current * 0.4, 10);
        stripRef.current.style.filter = blurAmount > 0.5 ? `blur(${blurAmount}px)` : "none";
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // === EVENT HANDLERS ===
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    offsetXRef.current += delta * 0.8;
    pauseAutoAndResume();
  }, [pauseAutoAndResume]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    pauseAutoAndResume();
  }, [pauseAutoAndResume]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const delta = touchStartXRef.current - currentX;
    touchStartXRef.current = currentX;
    offsetXRef.current += delta;
    pauseAutoAndResume();
  }, [pauseAutoAndResume]);

  // Attacher les events sur le container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  // Dimensions
  const imageWidth = isMobile ? "75vw" : "350px";
  const imageHeight = isMobile ? "50vh" : "500px";
  const gap = isMobile ? "12px" : "20px";

  // Images triplées pour la boucle infinie
  const tripleImages = [...displayedImages, ...displayedImages, ...displayedImages];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center overflow-hidden"
      style={{ cursor: "grab" }}
    >
      {/* Strip unique avec speed burst + motion blur */}
      <div
        ref={stripRef}
        className="flex items-center will-change-transform"
        style={{ gap }}
      >
        {tripleImages.map((imageUrl, index) => (
          <div
            key={`img-${index}`}
            className="flex-shrink-0"
            style={{
              width: imageWidth,
              height: imageHeight,
            }}
          >
            <img
              src={imageUrl}
              alt={`Photo ${(index % displayedImages.length) + 1}`}
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
    </div>
  );
}
