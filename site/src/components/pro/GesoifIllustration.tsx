// Illustration décorative de gesoif.ch (pas de capture : le domaine ne répondait pas
// au moment de l'écriture). Carte stylisée avec des repères "goutte d'eau".
// TODO: remplacer par une capture réelle (public/projects/gesoif.webp) quand le site est en ligne.

const PINS = [
  { x: 70, y: 62 },
  { x: 128, y: 120 },
  { x: 196, y: 70 },
  { x: 246, y: 138 },
  { x: 96, y: 160 },
];

export function GesoifIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 320 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="gesoif-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A0A1F" />
          <stop offset="1" stopColor="#2A153A" />
        </linearGradient>
        <radialGradient id="gesoif-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#00C1FF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#00C1FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="200" fill="url(#gesoif-bg)" />

      {/* Rues */}
      <g stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1">
        {[30, 70, 110, 150, 190].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="320" y2={y - 18} />
        ))}
        {[40, 100, 160, 220, 280].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x + 24} y2="200" />
        ))}
      </g>

      {/* Lac et fleuve, version très libre */}
      <path
        d="M-10 18 C 60 30, 110 10, 150 34 S 230 90, 330 72 L 330 -10 L -10 -10 Z"
        fill="#00C1FF"
        fillOpacity="0.12"
      />
      <path
        d="M150 34 C 170 70, 150 110, 182 150 S 230 190, 250 210"
        fill="none"
        stroke="#00C1FF"
        strokeOpacity="0.35"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Repères de fontaines */}
      {PINS.map(({ x, y }) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <circle r="16" fill="url(#gesoif-glow)" />
          <path d="M0 -14 C 7 -5, 9 0, 9 3 A 9 9 0 0 1 -9 3 C -9 0, -7 -5, 0 -14 Z" fill="#00C1FF" />
          <path d="M-3 2 a 3.5 3.5 0 0 0 4 4" stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
