"use client";
import Romain3D from "./Romain3D";
import ChatBubble from "./ChatBubble";

export default function ChatSection() {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-center gap-12 py-12">
      {/* Bulle : mobile au-dessus (order-1), desktop à droite (order-2) */}
      <div className="order-1 md:order-2 w-full md:w-1/2 flex justify-start md:pl-15">
        <ChatBubble
          text="Salut, je m'appelle Romain 👋 Bienvenue chez moi !"
          className="arrow-bottom md:arrow-left"  /* 👈 orientation responsive */
        />
      </div>

      {/* Modèle 3D */}
      <div className="order-2 md:order-1 w-full md:w-1/2">
        <div className="mx-auto h-[60vh] md:h-[70vh] w-full max-w-[720px] md:translate-x-25 lg:translate-x-12 transition-transform duration-500">
        <Romain3D />
        </div>
      </div>
    </div>
  );
}
