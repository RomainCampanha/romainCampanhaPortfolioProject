import s from "./scenes.module.css";

// Pro : Genève en pâte à modeler. Ciel clair et soleil (CSS), nuages, Alpes lilas avec le
// Mont-Blanc enneigé et le Salève, collines, Léman et jet d'eau ; Rominou sur son île.

export function GenevaDecor() {
  return (
    <>
      <span className={s.genevaSun} />
      <svg viewBox="288 166 92 50" className={`${s.cloud} ${s.genevaCloudA}`} focusable="false">
        <path d="M300 214h70a16 16 0 0 0-10-29 22 22 0 0 0-41-4 16 16 0 0 0-19 33z" />
      </svg>
      <svg viewBox="414 228 64 36" className={`${s.cloud} ${s.genevaCloudB}`} focusable="false">
        <path d="M424 262h46a11 11 0 0 0-7-20 15 15 0 0 0-28-3 11 11 0 0 0-11 23z" />
      </svg>

      {/* Alpes (Mont-Blanc enneigé), Salève et collines */}
      <svg viewBox="0 -4 520 160" preserveAspectRatio="xMidYMax slice" className={s.genevaAlps} focusable="false">
        <path
          className={s.genevaMountains}
          d="M0 120C40 88 70 60 112 64C150 68 168 34 208 30C248 26 262 56 300 52C340 48 362-2 410 0C458 2 488 46 520 56V156H0z"
        />
        <path
          className={s.snow}
          d="M382 16C394 4 402-1 410 0C419 1 428 8 438 18C428 14 420 20 412 13C404 20 394 14 382 16z"
        />
        <path
          className={s.genevaHills}
          d="M0 140C70 114 120 120 172 108C232 94 272 118 332 106C392 94 444 112 520 102V156H0z"
        />
      </svg>

      {/* Léman */}
      <div className={s.genevaLake}>
        <svg viewBox="0 0 520 228" preserveAspectRatio="none" className={s.waves} focusable="false">
          <path d="M196 26h40M300 20h26M420 38h44M44 60h34M150 88h24M470 124h26M30 150h30" />
        </svg>
      </div>

      {/* Jet d'eau (colonne) et son panache, animé à part (calque composité, pas de repeinte du SVG) */}
      <svg viewBox="74 248 70 198" className={s.jet} focusable="false">
        <path d="M86 438C88 376 91 318 95 262C98 318 100 376 102 438Z" />
        <ellipse cx="94" cy="440" rx="18" ry="4" opacity=".8" />
      </svg>
      <svg viewBox="74 248 70 198" className={`${s.jet} ${s.spray}`} focusable="false">
        <circle cx="96" cy="262" r="10" />
        <circle cx="109" cy="270" r="11" opacity=".92" />
        <circle cx="121" cy="285" r="9" opacity=".8" />
        <circle cx="129" cy="302" r="7" opacity=".65" />
        <circle cx="134" cy="319" r="5" opacity=".5" />
        <circle cx="137" cy="335" r="3.5" opacity=".4" />
      </svg>
    </>
  );
}

/**
 * L'île de Rominou (pâte à modeler), sous ses pieds. Les pieds se posent à 39 % de la hauteur
 * du SVG (y = 599 sur 556..666) ; largeur = 0.68 × la boîte de scène (cf. scenes.module.css).
 */
export function GenevaIsland() {
  return (
    <svg viewBox="120 556 360 110" aria-hidden="true" focusable="false" className={`${s.underlay} ${s.island}`}>
      <ellipse cx="300" cy="614" rx="178" ry="48" className={s.ripple} />
      <ellipse cx="300" cy="604" rx="150" ry="42" className={s.islandBase} />
      <ellipse cx="300" cy="590" rx="150" ry="40" className={s.islandSide} />
      <ellipse cx="300" cy="585" rx="134" ry="31" className={s.islandTop} />
      <circle cx="182" cy="580" r="20" className={s.bush} />
      <circle cx="202" cy="588" r="13" className={s.bushLight} />
      <circle cx="420" cy="582" r="17" className={s.bush} />
      <circle cx="402" cy="592" r="11" className={s.bushLight} />
      <circle cx="226" cy="608" r="5.5" className={s.flowerPeach} />
      <circle cx="240" cy="614" r="4.5" className={s.flowerButter} />
      <circle cx="376" cy="610" r="5.5" className={s.flowerButter} />
      <circle cx="362" cy="616" r="4.5" className={s.flowerPeach} />
    </svg>
  );
}
