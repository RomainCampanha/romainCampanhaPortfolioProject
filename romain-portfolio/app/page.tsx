'use client';

import ChatSection from '@/components/ChatSection';

export default function Home() {
  return (
    <main
      className="min-h-dvh flex flex-col items-stretch overflow-x-hidden
                 bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]"
    >
      {/* HERO : 3D + bulle dans UNE section (via ChatSection) */}
      <section className="relative w-full min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <ChatSection />
        </div>

        {/* Bouton Explorer dans la même section */}
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

      {/* Section suivante (contenu libre) */}
      <section id="section-2" className="w-full min-h-screen bg-[#0A0A1F]" />
    </main>
  );
}
