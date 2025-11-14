"use client";

import Romain3D from "@/components/Romain3D";
import ChatInterface from "@/components/ChatInterface";

export default function ChatbotPage() {
  return (
    <main 
      className="fixed inset-0 bg-gradient-to-b from-[#667EEA] via-[#764BA2] to-[#5B4DFF] overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Effet de grille */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Desktop */}
      <div className="hidden md:flex h-full">
        <div className="w-2/5 flex flex-col items-center justify-center relative pt-16">
          {/* TITRE CHAT - Repositionné avec plus d'espace en haut */}
          <div className="mb-6 z-10">
            <h1 className="text-4xl lg:text-5xl font-bold font-orbitron text-white">
              Chat
            </h1>
          </div>
          
          {/* ROMAIN 3D - Hauteur augmentée pour voir les pieds */}
          <div className="w-full h-[75vh] max-w-[500px]">
            <Romain3D
              progress={0}
              phase="intro"
              modelUrl="/models/RomainChatBot.glb"
              theme="chatbot"
            />
          </div>
        </div>

        <div className="w-3/5 flex items-center justify-center py-8 pr-8 pt-24">
          <div className="w-full h-full max-h-[82vh] bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col h-full pt-20 pb-4">
        <div className="text-center mb-3 px-4 flex-shrink-0">
          <h1 className="text-3xl font-bold font-orbitron text-white">Chat</h1>
        </div>
        
        <div className="w-full h-[28vh] flex items-center justify-center flex-shrink-0">
          <div className="w-full max-w-[300px] h-full">
            <Romain3D
              progress={0}
              phase="intro"
              modelUrl="/models/RomainChatBot.glb"
              theme="chatbot"
            />
          </div>
        </div>
        
        <div className="flex-1 mx-4 mb-4 bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden min-h-0">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}