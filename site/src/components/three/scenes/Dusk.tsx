import s from "./scenes.module.css";

// Chat : ciel du soir lilas (CSS), étoiles qui scintillent, croissant de lune, collines lilas
// et lac aux reflets pêche. Rominou en buste, coupé par le bas du cadre.

// [cx, cy, r, calque] : 0 = fixe, 1 et 2 = scintillent (décalés). Chaque calque est un SVG
// animé en entier (opacité composité, pas de repeinte).
const STARS: ReadonlyArray<[number, number, number, 0 | 1 | 2]> = [
  [60, 40, 2, 0],
  [118, 78, 1.6, 1],
  [170, 30, 2.2, 0],
  [250, 58, 1.5, 2],
  [330, 22, 1.8, 1],
  [392, 64, 1.3, 0],
  [470, 34, 2, 2],
  [430, 100, 1.6, 1],
  [28, 96, 1.4, 0],
  [214, 110, 1.2, 2],
  [500, 140, 1.3, 0],
];

const LAYERS = [0, 1, 2] as const;

export function DuskDecor() {
  return (
    <>
      {LAYERS.map((layer) => (
        <svg
          key={layer}
          viewBox="0 0 520 180"
          preserveAspectRatio="xMidYMin slice"
          className={s.stars}
          data-twinkle={layer || undefined}
          focusable="false"
        >
          {STARS.filter((star) => star[3] === layer).map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
          {layer === 0 ? <path d="M38 124l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" opacity=".9" /> : null}
          {layer === 2 ? <path d="M486 92l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" opacity=".85" /> : null}
        </svg>
      ))}

      <span className={s.moon} />

      <svg viewBox="0 0 520 72" preserveAspectRatio="xMidYMax slice" className={s.duskHills} focusable="false">
        <path d="M0 30C60 12 110 18 170 8C240-4 280 20 350 10C420 0 470 14 520 6V72H0z" />
      </svg>

      <div className={s.duskLake}>
        <svg viewBox="0 0 520 54" preserveAspectRatio="none" className={s.reflections} focusable="false">
          <path d="M60 16h40M140 32h26M396 18h50M262 42h30" />
        </svg>
      </div>
    </>
  );
}
