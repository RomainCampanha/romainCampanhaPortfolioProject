"use client";

import Romain3D from "@/components/Romain3D";
import ChatInterface from "@/components/ChatInterface";

export default function ChatbotPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#667EEA] via-[#764BA2] to-[#5B4DFF] relative overflow-hidden">
      {/* Effet de grille */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Desktop */}
      <div className="hidden md:flex h-dvh">
        <div className="w-2/5 flex items-center justify-center relative">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
            <h1 className="text-4xl lg:text-5xl font-bold font-orbitron text-white">
              Chat
            </h1>
          </div>
          
          {/* ROMAIN 3D */}
          <div className="w-full h-[70vh] max-w-[500px]">
            <Romain3D
              progress={0}
              phase="intro"
              modelUrl="/models/RomainChatBot.glb"
              theme="chatbot"
            />
          </div>
        </div>

        <div className="w-3/5 flex items-center justify-center py-8 pr-8">
          <div className="w-full h-full max-h-[85vh] bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            {/* ⬇️ AJOUTE ChatInterface ICI au lieu du placeholder */}
            <ChatInterface />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-dvh pt-20 pb-4">
        <div className="text-center mb-4 px-4">
          <h1 className="text-3xl font-bold font-orbitron text-white">Chat</h1>
        </div>
        
        <div className="w-full h-[30vh] flex items-center justify-center">
          <div className="w-full max-w-[300px] h-full">
            <Romain3D
              progress={0}
              phase="intro"
              modelUrl="/models/RomainChatBot.glb"
              theme="chatbot"
            />
          </div>
        </div>
        
        <div className="flex-1 mx-4 mb-4 bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}