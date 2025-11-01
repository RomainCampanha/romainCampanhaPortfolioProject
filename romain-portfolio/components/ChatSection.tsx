'use client';

import ChatBubble from '@/components/ChatBubble';
import Romain3D from '@/components/Romain3D';

export default function ChatSection() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center
                 bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]"
    >
      <div className="container mx-auto px-4">
        {/* 🧠 Ici, items-center au lieu de items-end */}
        <div className="flex flex-col md:flex-row md:items-center gap-8">
          
          {/* --- 3D Model --- */}
          <div className="order-2 md:order-1 w-full md:w-[55%] lg:w-[60%]">
            <div className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px]
                            md:translate-x-[15%] lg:translate-x-[20%] transition-transform duration-500">
              <Romain3D />
            </div>
          </div>

          {/* --- Chat Bubble --- */}
          <div className="order-1 md:order-2 w-full md:w-1/2 flex md:justify-start justify-center md:-translate-y-36">
            <ChatBubble
              text="Salut, je m'appelle Romain 👋 Bienvenue chez moi !"
              className="arrow-bottom md:arrow-left md:-translate-y-10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
