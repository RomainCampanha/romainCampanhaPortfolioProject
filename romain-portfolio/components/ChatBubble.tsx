// app/components/ChatBubble.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Howl } from "howler";

type ChatBubbleProps = {
  text: string;
  startDelay?: number;
  typingSpeed?: number;   // ms par caractère
  onDone?: () => void;
  className?: string;     // <- on l’utilise pour arrow-bottom / arrow-left
  showCursor?: boolean;
  ariaLabel?: string;
  skipOnClick?: boolean;
  loop?: boolean;
  loopDelay?: number;     // ms après la fin
};

export default function ChatBubble({
  text,
  startDelay = 350,
  typingSpeed = 65,
  onDone,
  className = "",
  showCursor = true,
  ariaLabel,
  skipOnClick = true,
  loop = true,
  loopDelay = 4000,
}: ChatBubbleProps) {
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [pulse, setPulse] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const restartRef = useRef<number | null>(null);

  // Sons (optionnels)
  const typingSoundRef = useRef<Howl | null>(null);
  const popSoundRef = useRef<Howl | null>(null);

  const safeText = useMemo(() => text.replace(/\s+/g, " ").trim(), [text]);
  const isDone = index >= safeText.length;

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Typing effect (avec boucle optionnelle)
  useEffect(() => {
    if (prefersReduced) {
      setIndex(safeText.length);
      onDone?.();
      return;
    }

    let i = 0;
    let typingId: number | null = null;
    let startId: number | null = null;
    let loopId: number | null = null;
    setIndex(0);

    const type = () => {
      i += 1;
      setIndex(i);

      // Exemple si tu veux jouer un son sur les caractères non-espaces :
      // if (/\S/.test(safeText.charAt(i - 1))) typingSoundRef.current?.play();

      if (i < safeText.length) {
        typingId = window.setTimeout(type, typingSpeed) as unknown as number;
      } else {
        onDone?.();
        if (loop) {
          loopId = window.setTimeout(() => {
            // popSoundRef.current?.play();
            i = 0;
            setIndex(0);
            startId = window.setTimeout(type, startDelay) as unknown as number;
          }, loopDelay) as unknown as number;
        }
      }
    };

    startId = window.setTimeout(type, startDelay) as unknown as number;

    return () => {
      if (startId) window.clearTimeout(startId);
      if (typingId) window.clearTimeout(typingId);
      if (loopId) window.clearTimeout(loopId);
    };
  }, [safeText, typingSpeed, startDelay, loop, loopDelay, prefersReduced, onDone]);

  const handleSkip = () => {
    if (!skipOnClick || isDone) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setIndex(safeText.length);
    setSkipped(true);
    onDone?.();
    if (loop) {
      if (restartRef.current) window.clearTimeout(restartRef.current);
      restartRef.current = window.setTimeout(() => {
        popSoundRef.current?.play();
        setSkipped(false);
        setIndex(0);
      }, loopDelay) as unknown as number;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel ?? "Bulle de dialogue"}
      onClick={handleSkip}
      className={[
        // Base bulle + gradient + glow
        "bubble", // <- défini dans globals.css (@layer components)
        "max-w-[22rem] rounded-3xl p-4 md:p-5 cursor-text select-none",
        "bg-gradient-to-br from-[#7928CA]/90 to-[#FF00C3]/80",
        "backdrop-blur-sm text-white border border-white/20 relative",
        "shadow-[0_0_24px_rgba(199,0,255,.25)]",
        "font-orbitron",
        pulse ? "animate-glow" : "",
        className, // <- ex: "arrow-bottom md:arrow-left"
      ].join(" ")}
    >
      <p className="whitespace-pre-wrap leading-relaxed">
        {safeText.slice(0, index)}
        {showCursor && !isDone && <span className="animate-caret">|</span>}
      </p>

      {/* Indice de skip */}
      {//skipOnClick && !skipped && !isDone && (
        //<span className="mt-2 block text-xs text-white/70">
         // Cliquer pour tout afficher
       // </span>
      //)
      }
    </div>
  );
}
