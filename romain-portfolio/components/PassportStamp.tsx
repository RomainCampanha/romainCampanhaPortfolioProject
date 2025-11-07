// components/PassportStamp.tsx
"use client";

type PassportStampProps = {
  city: string;
  country?: string;
  date?: string;
  color?: string;
};

export default function PassportStamp({ 
  city, 
  country, 
  date = "2024",
  color = "#8B4513" // Brown par défaut
}: PassportStampProps) {
  return (
    <div 
      className="relative inline-block"
      style={{
        transform: "rotate(-2deg)",
      }}
    >
      {/* Bordure du tampon */}
      <div 
        className="border-4 rounded-lg p-6 relative"
        style={{
          borderColor: color,
          borderStyle: "dashed",
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            ${color}10 10px,
            ${color}10 20px
          )`,
        }}
      >
        {/* Contenu du tampon */}
        <div className="text-center space-y-1">
          {/* Ville */}
          <h2 
            className="text-5xl md:text-7xl font-bold uppercase tracking-wider"
            style={{ 
              color: color,
              textShadow: `2px 2px 0px ${color}40`,
              fontFamily: "Courier New, monospace",
              letterSpacing: "0.1em"
            }}
          >
            {city}
          </h2>
          
          {/* Pays (optionnel) */}
          {country && (
            <p 
              className="text-xl md:text-2xl uppercase tracking-widest"
              style={{ color: color, opacity: 0.8 }}
            >
              {country}
            </p>
          )}
          
          {/* Date */}
          <p 
            className="text-sm md:text-base font-mono"
            style={{ color: color, opacity: 0.6 }}
          >
            {date}
          </p>
        </div>

        {/* Symboles de tampon dans les coins */}
        <div 
          className="absolute top-2 left-2 text-2xl"
          style={{ color: color, opacity: 0.3 }}
        >
          ✈
        </div>
        <div 
          className="absolute top-2 right-2 text-2xl"
          style={{ color: color, opacity: 0.3 }}
        >
          ✈
        </div>
        <div 
          className="absolute bottom-2 left-2 text-2xl"
          style={{ color: color, opacity: 0.3 }}
        >
          ★
        </div>
        <div 
          className="absolute bottom-2 right-2 text-2xl"
          style={{ color: color, opacity: 0.3 }}
        >
          ★
        </div>
      </div>

      {/* Effet "encre qui bave" */}
      <div 
        className="absolute inset-0 rounded-lg blur-sm -z-10"
        style={{
          background: `${color}15`,
          transform: "scale(1.05)",
        }}
      />
    </div>
  );
}