"use client";

type NavigationProps = {
  currentPage: "home" | "hobby";
  onPageChange: (page: "home" | "hobby") => void;
};

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-center gap-1">
          {/* Bouton Home */}
          <button
            onClick={() => onPageChange("home")}
            className={`
              px-6 py-2 md:px-8 md:py-2.5 rounded-lg font-orbitron text-sm md:text-base
              transition-all duration-300 relative
              ${
                currentPage === "home"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/60 hover:text-white/80 hover:bg-white/5"
              }
            `}
          >
            Home
          </button>

          {/* Séparateur */}
          <div className="h-8 w-[2px] bg-white/20 mx-1" />

          {/* Bouton Hobby */}
          <button
            onClick={() => onPageChange("hobby")}
            className={`
              px-6 py-2 md:px-8 md:py-2.5 rounded-lg font-orbitron text-sm md:text-base
              transition-all duration-300 relative
              ${
                currentPage === "hobby"
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/60 hover:text-white/80 hover:bg-white/5"
              }
            `}
          >
            Hobby
          </button>
        </div>
      </div>
    </nav>
  );
}