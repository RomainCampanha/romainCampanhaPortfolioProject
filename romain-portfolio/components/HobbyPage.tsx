"use client";

import { useEffect, useRef, useState } from "react";
import { useTrackScrollProgress } from "@/app/hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import HobbyJournal3D from "@/components/hobby/HobbyJournal3D";
import ChatBubble from "@/components/ChatBubble";
import "@/app/styles/hobby-bubble.css";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Linear remap of `p` from [a, b] → [0, 1], clamped */
function remap(p: number, a: number, b: number) {
  if (b <= a) return 0;
  return Math.max(0, Math.min(1, (p - a) / (b - a)));
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/**
 * "Le Carnet de Voyage de Romain" — single cinematic experience.
 *
 * Phases (mapped on a single 800dvh scroll track):
 *   - Intro       (0%   →  22%)  Romain3D + bulle + carnet 3D draggable
 *   - Journey     (18%  →  92%)  Travel scene plein écran (un seul Canvas)
 *   - Outro       (88%  → 100%)  Romain3D revient + bulle "à bientôt"
 *
 * The intro/journey and journey/outro overlaps create the cross-fade.
 */
export default function HobbyPage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = useTrackScrollProgress(trackRef);

  // Wake up R3F's ResizeObserver after mount. Without this, the journey
  // Canvas can stay stuck at its default 300×150 size if the initial layout
  // measurement misses (typical when multiple Canvases mount at once).
  useEffect(() => {
    const tick = () => window.dispatchEvent(new Event("resize"));
    const r1 = requestAnimationFrame(tick);
    const r2 = requestAnimationFrame(() => requestAnimationFrame(tick));
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, []);

  // Sub-progress for each phase
  const introOpacity = 1 - remap(progress, 0.18, 0.22); // 1 → 0
  const journeyOpacity = (() => {
    if (progress < 0.18) return 0;
    if (progress < 0.22) return remap(progress, 0.18, 0.22); // fade in
    if (progress < 0.88) return 1;
    if (progress < 0.92) return 1 - remap(progress, 0.88, 0.92); // fade out
    return 0;
  })();
  const outroOpacity = remap(progress, 0.88, 0.92); // 0 → 1

  // Journey progress remapped to its own 0..1 (drives the camera Z)
  const journeyProgress = remap(progress, 0.22, 0.88);

  // The intro/outro DOM (bubbles, scroll hints, book) is cheap and OK to gate
  // by phase. The Canvases themselves NEVER unmount — only their wrapper
  // opacity changes. This keeps WebGL context allocations stable at 2 max.
  const showIntroChrome = progress < 0.26;
  const showOutroChrome = progress > 0.84;

  // The intro/outro gradient layer fades with introOpacity / outroOpacity.
  const characterOpacity = Math.max(introOpacity, outroOpacity);
  const isOutroPhase = progress > 0.5;

  return (
    <main className="relative">
      {/* The scroll track — empty, just defines the scrollable height */}
      <div ref={trackRef} className="h-[800dvh] w-full" aria-hidden="true" />

      {/* Sticky stage that holds every visual layer */}
      <div className="fixed inset-0 pointer-events-none">
        {/* ============ JOURNEY (always mounted, opacity never touched) ============ */}
        <div
          className="absolute inset-0"
          style={{
            pointerEvents: journeyOpacity > 0.5 ? "auto" : "none",
          }}
        >
          <HobbyJournal3D progress={journeyProgress} />
        </div>

        {/* ============ AMBER BACKDROP — covers the journey canvas during intro/outro ============ */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#FFD54F] via-[#FFF176] to-[#FFE082]"
          style={{
            opacity: characterOpacity,
            pointerEvents: characterOpacity > 0.5 ? "auto" : "none",
          }}
        />

        {/* ============ JOURNEY UI (above the backdrop, fades with journey) ============ */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 font-orbitron text-[10px] md:text-xs tracking-widest pointer-events-none select-none"
          style={{ opacity: journeyOpacity }}
        >
          SCROLLE POUR VOYAGER · DRAG POUR REGARDER
        </div>
        <JourneyProgressDots progress={journeyProgress} opacity={journeyOpacity} />

        {/* ============ ROMAIN3D (always mounted, never animated) ============ */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[6dvh] w-[min(95vw,720px)] h-[62dvh]"
          style={{
            opacity: characterOpacity,
            visibility: characterOpacity > 0.01 ? "visible" : "hidden",
          }}
        >
          <Romain3D
            theme="hobby"
            phase="intro"
            modelUrl="/models/RomainVacanceSalut.glb"
            progress={0}
          />
        </div>

        {/* ============ INTRO CHROME (bubble + book + hint) ============ */}
        {showIntroChrome && !isOutroPhase && (
          <div
            className="absolute inset-0"
            style={{ opacity: introOpacity, transition: "opacity 120ms linear" }}
          >
            <div className="absolute top-[8dvh] left-1/2 -translate-x-1/2 w-[min(82vw,460px)] pointer-events-auto z-10">
              <ChatBubble
                text="Bienvenue dans mon carnet de voyage ✈️"
                className="hobby-bubble arrow-bottom bg-gradient-to-br from-amber-600/90 to-yellow-500/80 shadow-[0_0_24px_rgba(234,179,8,0.35)]"
              />
            </div>
            <CssJournalBook />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-amber-900 font-orbitron text-[10px] md:text-xs tracking-widest opacity-80 select-none whitespace-nowrap pointer-events-none z-10">
              ↓ scroll pour ouvrir le carnet
            </div>
          </div>
        )}

        {/* ============ OUTRO CHROME (farewell bubble) ============ */}
        {showOutroChrome && (
          <div
            className="absolute inset-0"
            style={{ opacity: outroOpacity, transition: "opacity 120ms linear" }}
          >
            <div className="absolute top-[8dvh] left-1/2 -translate-x-1/2 w-[min(82vw,460px)] pointer-events-auto z-10">
              <ChatBubble
                text="À bientôt pour la suite ! 🌍"
                className="hobby-bubble arrow-bottom bg-gradient-to-br from-amber-600/90 to-yellow-500/80 shadow-[0_0_24px_rgba(234,179,8,0.35)]"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* CSS-only floating journal book (mini-interaction)                   */
/* ------------------------------------------------------------------ */

/**
 * Pure CSS/HTML journal book that floats and tilts with the cursor.
 * Replaces the previous JournalBook3D Canvas to keep only one WebGL context
 * active during the intro phase.
 */
function CssJournalBook() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width; // -0.5 .. 0.5
    const dy = (e.clientY - cy) / rect.height;
    setTilt({ x: -dy * 25, y: dx * 35 });
  };
  const handleLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      className="absolute bottom-20 right-6 md:right-12 pointer-events-auto z-10 select-none"
      style={{ perspective: "900px" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        className="relative animate-[bookFloat_4s_ease-in-out_infinite] cursor-grab active:cursor-grabbing"
        style={{
          width: 140,
          height: 180,
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 250ms ease-out",
        }}
      >
        {/* Front cover */}
        <div
          className="absolute inset-0 rounded-md shadow-2xl border border-amber-900/40"
          style={{
            background:
              "linear-gradient(135deg, #8b5a2b 0%, #6b4220 50%, #8b5a2b 100%)",
            boxShadow:
              "0 20px 40px rgba(120,60,0,0.45), inset 0 0 30px rgba(0,0,0,0.25)",
          }}
        >
          <div className="absolute inset-3 border border-amber-200/40 rounded-sm flex flex-col items-center justify-center gap-2 text-amber-50 font-orbitron">
            <div className="text-[9px] tracking-[0.2em] opacity-80">CARNET</div>
            <div className="text-[12px] tracking-[0.18em]">DE</div>
            <div className="text-[14px] tracking-[0.18em] font-bold">
              VOYAGE
            </div>
            <div className="text-2xl mt-1">🌍</div>
            <div className="text-[8px] tracking-[0.25em] opacity-70 mt-2">
              ROMAIN
            </div>
          </div>
        </div>

        {/* Spine — left side */}
        <div
          className="absolute top-0 bottom-0 -left-1 w-1.5 rounded-l"
          style={{
            background:
              "linear-gradient(90deg, #4a2a10 0%, #6b4220 50%, #4a2a10 100%)",
          }}
        />

        {/* Pages edge — right side */}
        <div
          className="absolute top-1 bottom-1 -right-1 w-1 rounded-r"
          style={{
            background:
              "repeating-linear-gradient(180deg, #fdf6e3 0px, #fdf6e3 1px, #e9dfc7 1px, #e9dfc7 2px)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes bookFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-3deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Journey progress dots (5 destinations)                              */
/* ------------------------------------------------------------------ */

const DOT_COUNT = 5;

function JourneyProgressDots({
  progress,
  opacity = 1,
}: {
  progress: number;
  opacity?: number;
}) {
  const activeIdx = Math.min(
    DOT_COUNT - 1,
    Math.floor(progress * DOT_COUNT + 0.001)
  );
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none"
      style={{ opacity }}
    >
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            i === activeIdx ? "bg-white w-6" : "bg-white/30"
          }`}
        />
      ))}
    </div>
  );
}
