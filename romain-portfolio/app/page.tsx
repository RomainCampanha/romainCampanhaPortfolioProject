import Romain3D from '@/components/Romain3D';

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#050A30] via-[#301934] to-[#00E5FF]">
      <div className="w-full h-[80vh] flex items-center justify-center">
        <Romain3D />
      </div>
    </main>
  );
}
