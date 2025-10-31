// app/page.tsx
import ChatBubble from "@/components/ChatBubble";
import Romain3D from "@/components/Romain3D";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center
                     bg-gradient-to-b from-[#0A0A1F] via-[#2A153A] to-[#00C1FF]">
      {/* Scène 3D */}
      <div className="w-full h-[120vh] md:h-[78vh]">
        <Romain3D />
      </div>

      {/* Bouton Explorer (exemple) */}
      <div className="absolute bottom-10">
        <button
          className="px-6 py-3 rounded-2xl text-white font-semibold
                     bg-gradient-to-r from-[#FF00C3] to-[#7C3AED]
                     shadow-[0_0_24px_rgba(255,0,195,.35)]
                     hover:scale-[1.03] transition"
        >
          Explorer
        </button>
      </div>
    </main>
  );
}
