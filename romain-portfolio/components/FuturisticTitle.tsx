// components/FuturisticTitle.tsx
"use client";

type FuturisticTitleProps = {
  text: string;
  size?: "large" | "xlarge";
};

export default function FuturisticTitle({ 
  text, 
  size = "xlarge" 
}: FuturisticTitleProps) {
  const fontSize = size === "xlarge" ? "text-8xl md:text-9xl" : "text-6xl md:text-7xl";
  
  return (
    <h1 
      className={`${fontSize} font-bold font-orbitron tracking-wider uppercase
                  bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600
                  bg-clip-text text-transparent
                  drop-shadow-[0_0_30px_rgba(251,146,60,0.5)]
                  animate-pulse-slow`}
      style={{
        textShadow: "0 0 40px rgba(251, 146, 60, 0.3)",
        letterSpacing: "0.1em"
      }}
    >
      {text}
    </h1>
  );
}