"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import HorizontalSnapCarousel from "./HorizontalSnapCarousel";
import FuturisticTitle from "./FuturisticTitle";
import { useDestinationImages } from "@/app/hooks/useDestinationImages";
import { FLIGHT_ROUTES } from "./globe/geoUtils";

// Dynamic import to avoid SSR issues with Three.js
const TravelGlobe = dynamic(() => import("./TravelGlobe"), { ssr: false });

type TravelSectionProps = {
  progress: number; // 0-1 within the travel section
  visible: boolean;
};

// === SCROLL PHASE DEFINITIONS ===
// 3 cycles: globe+flight → carousel
const CYCLES = [
  { globeStart: 0.0,  flightStart: 0.03, flightEnd: 0.18, carouselStart: 0.16, carouselEnd: 0.36, destination: "Coree" as const },
  { globeStart: 0.34, flightStart: 0.37, flightEnd: 0.52, carouselStart: 0.50, carouselEnd: 0.68, destination: "Toronto" as const },
  { globeStart: 0.66, flightStart: 0.69, flightEnd: 0.84, carouselStart: 0.82, carouselEnd: 1.00, destination: "BrightonDubrovnik" as const },
];

export default function TravelSection({ progress, visible }: TravelSectionProps) {
  const [isMobile, setIsMobile] = useState(false);

  // === USER DRAG ROTATION ===
  const [userDragOffset, setUserDragOffset] = useState(0);
  const isDragging = useRef(false);
  const lastDragX = useRef(0);
  const dragSensitivity = 0.008;

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastDragX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastDragX.current;
    lastDragX.current = e.clientX;
    setUserDragOffset((prev) => prev + deltaX * dragSensitivity);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Load all destination images
  const coreeData = useDestinationImages("Coree");
  const torontoData = useDestinationImages("Toronto");
  const brightonData = useDestinationImages("BrightonDubrovnik");

  const dataMap = useMemo(() => ({
    Coree: coreeData,
    Toronto: torontoData,
    BrightonDubrovnik: brightonData,
  }), [coreeData, torontoData, brightonData]);

  if (!visible) return null;

  // Determine current state from progress
  let showGlobe = false;
  let globeOpacity = 0;
  let globeScale = 0.8;
  let flightIndex = 0;
  let flightProgress = 0;
  let isFlying = false;
  let showCarousel = false;
  let carouselOpacity = 0;
  let currentDestination: "Coree" | "Toronto" | "BrightonDubrovnik" = "Coree";
  let showTitle = false;
  let titleText = "";

  for (let i = 0; i < CYCLES.length; i++) {
    const c = CYCLES[i];

    // Globe fade-in phase
    if (progress >= c.globeStart && progress < c.flightEnd + 0.02) {
      showGlobe = true;
      flightIndex = i;

      // Globe opacity: fade in
      const fadeInEnd = c.globeStart + 0.03;
      if (progress < fadeInEnd) {
        globeOpacity = (progress - c.globeStart) / 0.03;
        globeScale = 0.8 + globeOpacity * 0.2;
      } else {
        globeOpacity = 1;
        globeScale = 1;
      }

      // Flight progress
      if (progress >= c.flightStart && progress <= c.flightEnd) {
        isFlying = true;
        flightProgress = (progress - c.flightStart) / (c.flightEnd - c.flightStart);
      }

      // Globe fade-out (overlap with carousel fade-in)
      if (progress >= c.carouselStart) {
        const fadeOut = (progress - c.carouselStart) / 0.04;
        globeOpacity = Math.max(0, 1 - fadeOut);
        globeScale = 1 - fadeOut * 0.1;
        if (globeOpacity <= 0) showGlobe = false;
      }
    }

    // Carousel phase
    if (progress >= c.carouselStart && progress <= c.carouselEnd) {
      showCarousel = true;
      currentDestination = c.destination;
      showTitle = true;
      titleText = dataMap[c.destination].config.title;

      // Carousel fade-in
      const fadeIn = Math.min(1, (progress - c.carouselStart) / 0.04);
      carouselOpacity = fadeIn;

      // Carousel fade-out at the end (to transition to next globe)
      if (i < CYCLES.length - 1) {
        const fadeOutStart = c.carouselEnd - 0.04;
        if (progress >= fadeOutStart) {
          const fadeOut = (progress - fadeOutStart) / 0.04;
          carouselOpacity = Math.max(0, 1 - fadeOut);
          if (carouselOpacity <= 0) showCarousel = false;
        }
      }
    }
  }

  const carouselData = dataMap[currentDestination];

  return (
    <div className="fixed inset-0"
         style={{ zIndex: 50, pointerEvents: "none" }}>

      {/* Globe 3D */}
      {showGlobe && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: globeOpacity,
            transform: `scale(${globeScale})`,
            pointerEvents: "none",
          }}
        >
          <div
            className={`${isMobile ? "w-[80vw] h-[80vw]" : "w-[450px] h-[450px]"}`}
            style={{
              pointerEvents: "auto",
              cursor: isDragging.current ? "grabbing" : "grab",
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <TravelGlobe
              flightIndex={flightIndex}
              flightProgress={flightProgress}
              isFlying={isFlying}
              userDragOffsetY={userDragOffset}
            />
          </div>
        </div>
      )}

      {/* Carousel + Title */}
      {showCarousel && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-20 md:pt-32"
          style={{
            opacity: carouselOpacity,
            transform: `translateY(${(1 - carouselOpacity) * 40}px)`,
            pointerEvents: "none",
          }}
        >
          {/* Title */}
          {showTitle && (
            <div className="mb-8 md:mb-16 z-10 relative w-full h-20 md:h-32 flex items-center justify-center overflow-hidden">
              <FuturisticTitle
                currentTitle={titleText}
                size="large"
              />
            </div>
          )}

          {/* Carousel */}
          <div
            className="w-full max-w-7xl h-[55vh] md:h-[60vh]"
            style={{ pointerEvents: "auto" }}
          >
            <HorizontalSnapCarousel images={carouselData.images} />
          </div>
        </div>
      )}

      {/* Scroll arrow */}
      <div
        className="absolute bottom-[3dvh] left-1/2 -translate-x-1/2 z-10"
        style={{ opacity: showCarousel ? carouselOpacity : globeOpacity, pointerEvents: "none" }}
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
  );
}
