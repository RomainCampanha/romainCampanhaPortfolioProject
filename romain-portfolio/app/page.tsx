"use client";

import { useRef } from "react";
import { useTrackScrollProgress } from "./hooks/useTrackScrollProgress";
import Romain3D from "@/components/Romain3D";
import ChatBubble from "@/components/ChatBubble";
import { ParcoursBubbles } from "../components/ParcoursBubbles";

export default function Home() {
  const trackRef = useRef<HTMLElement | null>(null);
  const progress = useTrackScrollProgress(trackRef); // 0..1 sur la piste
  const showParcours = progress > 0.35;

  // ✅ Bascule un peu plus tôt pour que la transition soit visible dans l’overlay
  const phase: "intro" | "run" = progress >= 0.50 ? "run" : "intro";

  // L’overlay reste visible pendant la piste
  const overlayVisible = progress < 1;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]">
      {/* HERO FIXE — piloté par le scroll */}
      <div
        className={
          "fixed inset-0 flex items-center justify-center transition-opacity duration-300 " +
          (overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        style={{ pointerEvents: "none" }} // laisse le body scroller
      >
        <div className="container mx-auto px-4 pointer-events-auto">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Modèle 3D piloté par progress + phase */}
            <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
              <div className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                              md:translate-x-[15%] lg:translate-x-[20%]
                              transition-transform duration-500">
                              <Romain3D progress={progress} phase={phase} forceClip={phase === "run" ? "run" : "idle"} />

              </div>
            </div>

            {/* Intro vs Parcours superposés */}
            <div className="order-1 md:order-2 w-full md:w-1/2 flex md:justify-start justify-center">
              <div className="relative w-full md:w-auto min-h-[120px] md:min-h-[240px]">
                {/* Intro */}
                <div className={`absolute inset-0 flex justify-center md:justify-start transition-opacity duration-300
                                 ${showParcours ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                  <div className="md:min-w-[22rem] md:max-w-[28rem]">
                    <ChatBubble
                      text="Salut, je m'appelle Romain 👋"
                      className="arrow-bottom md:arrow-left md:-translate-y-12"
                    />
                  </div>
                </div>

                {/* Parcours */}
                <div className={`absolute inset-0 flex justify-center md:justify-start transition-opacity duration-300
                                 ${showParcours ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <div className="w-full md:w-auto md:min-w-[22rem] md:max-w-[28rem]">
                    <ParcoursBubbles show />
                  </div>
                </div>

                {/* Spacer pour garder la hauteur */}
                <div className="invisible md:min-w-[22rem] md:max-w-[28rem]">
                  <ChatBubble text="." />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 PISTE DE SCROLL : génère le progress, mais l’UI reste fixe */}
      <section ref={trackRef} className="relative h-[160dvh]" />

      {/* === SECTION 2 : Le perso court en continu (phase 'run') === */}
      <section id="section-2" className="w-full min-h-dvh">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Perso en RUN fixe pour la page parcours */}
            <div className="order-2 md:order-1">
              <div className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]">
                {/* progress=1 pour caméra dézoomée, phase='run' */}    
                  <Romain3D key="run-page" progress={1} phase="run" forceClip="run" />
              </div>
            </div>

            {/* Tes cartes/parcours à droite (ou au-dessus sur mobile) */}
            <div className="order-1 md:order-2">
              <ParcoursBubbles show />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
