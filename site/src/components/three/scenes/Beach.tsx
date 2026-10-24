import s from "./scenes.module.css";

// Hobby : plage au coucher du soleil (tenue de vacances). Ciel lilas → pêche → beurre (CSS),
// grand soleil qui se couche dans la mer, nuages étirés, mouettes, petit avion (les voyages),
// mer et reflets, sable, parasol et étoile de mer ; Rominou sur sa serviette.

export function BeachDecor() {
  return (
    <>
      <span className={s.beachSun} />
      <svg viewBox="0 -6 140 40" className={`${s.cloud} ${s.beachCloudA}`} focusable="false">
        <path d="M8 32h124a12 12 0 0 0-12-14 18 18 0 0 0-30-10 22 22 0 0 0-40 2 14 14 0 0 0-26 8 10 10 0 0 0-16 14z" />
      </svg>
      <svg viewBox="0 -6 140 40" className={`${s.cloud} ${s.beachCloudB}`} focusable="false">
        <path d="M8 32h124a12 12 0 0 0-12-14 18 18 0 0 0-30-10 22 22 0 0 0-40 2 14 14 0 0 0-26 8 10 10 0 0 0-16 14z" />
      </svg>

      {/* Mouettes */}
      <svg viewBox="0 0 60 24" className={s.birds} focusable="false">
        <path d="M4 15q6-8 12 0q6-8 12 0M36 8q4-5 8 0q4-5 8 0" />
      </svg>

      {/* Petit avion et sa traînée (les voyages) */}
      <svg viewBox="0 0 124 40" className={s.plane} focusable="false">
        <path className={s.trail} d="M4 37C34 37 66 33 99 24" />
        <path
          transform="translate(97 1)"
          d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
        />
      </svg>

      {/* Mer et reflets du soleil */}
      <div className={s.beachSea}>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={s.glints} focusable="false">
          <path d="M53 7h20M56 15h14M58 23h10M60 31h6" />
        </svg>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={s.waves} focusable="false">
          <path d="M8 12h8M86 9h7M20 27h6M80 30h9" />
        </svg>
      </div>

      {/* Sable, écume */}
      <svg viewBox="0 0 520 120" preserveAspectRatio="none" className={s.sand} focusable="false">
        <path className={s.sandFill} d="M0 22C70 6 150 18 240 12S420 0 520 14V120H0z" />
        <path className={s.sandWet} d="M0 22C70 6 150 18 240 12S420 0 520 14V26C420 14 330 26 240 24S70 20 0 34z" />
        <path className={s.foam} d="M0 22C70 6 150 18 240 12S420 0 520 14" />
      </svg>

      {/* Parasol */}
      <svg viewBox="0 0 120 150" className={s.parasol} focusable="false">
        <path className={s.parasolPole} d="M60 30v118" />
        <path
          className={s.parasolCanopy}
          d="M4 50C8 22 30 6 60 6s52 16 56 44c-4-5-12-5-16 0-4-5-12-5-16 0-4-5-12-5-16 0-4-5-12-5-16 0-4-5-12-5-16 0-4-5-12-5-16 0-4-5-12-5-16 0z"
        />
        <path className={s.parasolStripe} d="M60 6Q37 20 23 46L42 46Q47 22 60 6zM60 6Q73 22 78 46L97 46Q83 20 60 6z" />
        <circle cx="60" cy="5" r="3.5" className={s.parasolKnob} />
      </svg>

      {/* Étoile de mer */}
      <svg viewBox="0 0 24 24" className={s.starfish} focusable="false">
        <path d="M12 2.5l2.6 6.3 6.8.6-5.2 4.4 1.6 6.7L12 16.9l-5.8 3.6 1.6-6.7-5.2-4.4 6.8-.6z" />
      </svg>
    </>
  );
}

/**
 * Serviette de plage sous les pieds de Rominou (vue en perspective, rayures en travers).
 * Les pieds se posent à 50 % de la hauteur du SVG ; largeur = 0.42 × la boîte de scène
 * (cf. scenes.module.css).
 */
export function BeachTowel() {
  return (
    <svg viewBox="0 0 200 56" aria-hidden="true" focusable="false" className={`${s.underlay} ${s.towel}`}>
      <path className={s.towelBase} d="M40 6H160L194 50H6Z" />
      <path className={s.towelStripe} d="M33.2 14.8H166.8L170.2 19.2H29.8ZM22.5 28.6H177.5L181 33H19Z" />
      <path className={s.towelEdge} d="M36 10H164M10 46H190" />
    </svg>
  );
}
