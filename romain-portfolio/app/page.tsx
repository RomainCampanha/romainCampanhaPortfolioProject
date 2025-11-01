'use client';

import Romain3D from '@/components/Romain3D';
import ChatBubble from '@/components/ChatBubble';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-stretch overflow-x-hidden
                 bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]"
    >
      {/* Section principale */}
      <section className="relative w-full min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            
            {/* --- 3D Model --- */}
            <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
              <div className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                              md:translate-x-[15%] lg:translate-x-[20%] transition-transform duration-500">
                <Romain3D />
              </div>
            </div>

            {/* --- Chat Bubble --- */}
            <div className="order-1 md:order-2 w-full md:w-1/2 flex md:justify-start justify-center">
              <ChatBubble
                text="Salut, je m'appelle Romain 👋 Bienvenue chez moi !"
                className="arrow-bottom md:arrow-left md:-translate-y-16"
              />
            </div>
          </div>
        </div>

        {/* Bouton Explorer */}
        <div className="absolute bottom-[5dvh] left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() =>
              document.getElementById('section-2')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="px-6 py-3 rounded-2xl text-white font-semibold
                       bg-gradient-to-r from-[#FF00C3] to-[#7C3AED]
                       shadow-[0_0_24px_rgba(255,0,195,.35)]
                       hover:scale-[1.05] active:scale-[0.98]
                       transition-transform duration-200 ease-out backdrop-blur-sm"
          >
            Explorer
          </button>
        </div>
      </section>

      {/* Section suivante */}
      <section id="section-2" className="w-full min-h-screen bg-[#0A0A1F]" />
    </main>
  );
}
