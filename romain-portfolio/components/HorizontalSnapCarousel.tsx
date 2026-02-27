"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type HorizontalSnapCarouselProps = {
  images: string[];
};

export default function HorizontalSnapCarousel({
  images,
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
  const [isMobile, setIsMobile] = useState(false);

  const BASE_SPEED = 0.5;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Responsive dimensions
  const getImageWidthPx = useCallback(() => {
    return isMobile ? window.innerWidth * 0.75 : 350;
  }, [isMobile]);

  const getGapPx = useCallback(() => {
    return isMobile ? 12 : 20;
  }, [isMobile]);

  // Compute width of one set of images
  const computeSingleSetWidth = useCallback(() => {
    const imgW = getImageWidthPx();
    const gap = getGapPx();
    return images.length * (imgW + gap);
  }, [images.length, getImageWidthPx, getGapPx]);

  // Init / reset offset to middle (2nd set)
  const resetOffset = useCallback(() => {
    const setW = computeSingleSetWidth();
    singleSetWidthRef.current = setW;
    offsetXRef.current = setW;
    currentSpeedRef.current = BASE_SPEED;
    targetSpeedRef.current = BASE_SPEED;
    userInteractingRef.current = false;
  }, [computeSingleSetWidth]);

  // Reset when images change
  useEffect(() => {
    resetOffset();
  }, [resetOffset, images]);

  // Recalculate on resize
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

  // Pause auto-scroll and resume after timeout
  const pauseAutoAndResume = useCallback(() => {
    userInteractingRef.current = true;
    targetSpeedRef.current = 0;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userInteractingRef.current = false;
      targetSpeedRef.current = BASE_SPEED;
    }, 2000);
  }, []);

  // === ANIMATION LOOP ===
  useEffect(() => {
    const animate = () => {
      const setW = singleSetWidthRef.current;
      if (setW <= 0) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Lerp speed towards target
      currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.03;

      // Advance strip
      offsetXRef.current += currentSpeedRef.current;

      // Infinite loop: silent reset
      if (offsetXRef.current >= setW * 2) {
        offsetXRef.current -= setW;
      }
      if (offsetXRef.current < 0) {
        offsetXRef.current += setW;
      }

      // Apply transform
      if (stripRef.current) {
        stripRef.current.style.transform = `translate3d(-${offsetXRef.current}px, 0, 0)`;
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

  // Attach events
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

  // Triple images for infinite loop
  const tripleImages = [...images, ...images, ...images];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center overflow-hidden"
      style={{ cursor: "grab" }}
    >
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
              alt={`Photo ${(index % images.length) + 1}`}
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
