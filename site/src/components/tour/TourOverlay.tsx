"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "@/i18n/navigation";
import { pageFromPathname, type PageId } from "@/lib/pages";
import { markVisited, TOUR_LENGTH, TOUR_STEPS, tourStore } from "@/lib/tour";
import { usePrefersReducedMotion } from "@/lib/avatar/hooks";
import type { AvatarScene } from "@/lib/avatar/scenes";
import { avatarStore, useAvatar } from "@/lib/avatar/store";
import { CompanionAnchor } from "@/components/three/CompanionAnchor";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { RominouHead } from "@/components/ui/RominouHead";
import type { BubbleTail } from "@/components/ui/SpeechBubble";
import { useTourPlacement, type CompanionSide } from "./placement";
import { TourSpotlight } from "./TourSpotlight";
import { useTour } from "./useTour";
import type { TourLabels, TourStepText } from "./types";
import styles from "./Tour.module.css";

// Interface de « La visite de Rominou » (chargée à la demande par TourLoader) :
// - la bulle de dialogue (non modale, compacte) : titre, texte court révélé par mots, fine barre de
//   progression, Précédent (icône) / compteur / Suivant, Réduire / Quitter, ← → et Échap ; dans le
//   hero Pro à la 1re étape (portail dans TourSlot), sinon dans le compagnon : bulle fixée en bas
//   de l'écran avec le portrait de Rominou qui dépasse en haut à gauche (le Canvas persistant le
//   suit) ; sur mobile, feuille basse au-dessus du dock ; « Réduire » la replie en pastille ;
// - le placement (placement.ts) : la page défile et le compagnon change de côté pour que la bulle
//   ne recouvre jamais le contenu clé de l'étape (TOUR_STEPS[i].keep) ;
// - l'anneau autour de la section commentée, les gestes de Rominou (coucou au début, petite
//   marche entre deux étapes, révérence à la fin) ;
// - une région live polie qui annonce chaque étape quand le focus n'est pas allé à la bulle (la
//   bulle qui prend le focus est lue avec sa description : pas de doublon) ; la pastille
//   « Reprendre la visite (4/10) » quand le visiteur est parti ailleurs.

/** Décor du cadre compagnon selon la page (comme les cadres des pages). */
const SCENES: Record<PageId, AvatarScene> = { pro: "geneva", hobby: "beach", chat: "dusk" };
/**
 * Révélation du texte : durée par caractère, plafonnée à 0,8 s (texte entier en moins de 0,9 s,
 * même avec des images en retard sur un appareil chargé).
 */
const REVEAL_MS_PER_CHAR = 8;
const REVEAL_MAX_MS = 800;
/** Petite marche entre deux étapes (ms), plus longue quand Rominou change de page. */
const WALK_MS = 1200;
const WALK_PAGE_MS = 2400;

type Tail = { tail: BubbleTail; tailOffset?: string; tailLg?: BubbleTail; tailOffsetLg?: string };

type TourOverlayProps = { steps: TourStepText[]; labels: TourLabels };

export default function TourOverlay({ steps, labels }: TourOverlayProps) {
  const status = useTour((s) => s.status);
  const step = useTour((s) => s.step);
  const pending = useTour((s) => s.pending);
  const direction = useTour((s) => s.direction);
  const slot = useTour((s) => s.slot);
  const suspended = useAvatar((s) => s.suspended);
  const page = pageFromPathname(usePathname());
  const reducedMotion = usePrefersReducedMotion();
  const [live, setLive] = useState("");
  // Dernière étape qui a reçu le focus : la bulle remontée sans changement d'étape (ex. à la
  // fermeture du jeu, qui cache la visite) ne vole pas le focus au contenu.
  const focusedKeyRef = useRef<string | null>(null);
  // Étape dont la bulle a VRAIMENT pris le focus (lue par le lecteur d'écran) : pas d'annonce live.
  const spokenKeyRef = useRef<string | null>(null);
  // Compagnon replié en pastille (« Réduire ») ; rouvert, le texte s'affiche d'un coup.
  const minimized = useTour((s) => s.minimized);
  const [reopenedStep, setReopenedStep] = useState<number | null>(null);

  const config = TOUR_STEPS[step];
  const text = steps[step];
  const active = status === "active";
  // Rominou est arrivé sur la page de l'étape (sinon : en route, ou visite en pause). Étape sur la
  // même page : arrivé d'emblée (pas de « En route… » d'une image, lu à tort par les lecteurs d'écran).
  const here = active && page === config.page && (pending === null || pending === page);
  const preferredSide: CompanionSide = "side" in config ? config.side : "end";

  // Côté du compagnon et défilement : le contenu clé de l'étape reste visible, hors de la bulle
  const side = useTourPlacement({
    enabled: here && !suspended && (config.dock === "hero" ? slot !== null : !minimized),
    step,
    keep: config.keep,
    preferred: preferredSide,
  });

  // La bulle du hero peut céder la place à celle de la visite (TourSlot)
  useEffect(() => {
    tourStore.setOverlay(true);
    return () => tourStore.setOverlay(false);
  }, []);

  // Arrivée sur une étape : page cochée, coucou au (re)départ (sens lu à l'arrivée)
  useEffect(() => {
    if (!here) return;
    if (page) markVisited(page);
    if (tourStore.getState().direction === 0) avatarStore.play("wave");
  }, [here, step, page]);

  // Région live : chaque étape est annoncée une fois (vidée puis remplie, pour être relue), sauf
  // si la bulle a pris le focus pour cette étape (le lecteur d'écran la lit déjà).
  useEffect(() => {
    const clear = window.setTimeout(() => setLive(""), 0);
    if (!here || !text) return () => window.clearTimeout(clear);
    const fill = window.setTimeout(() => {
      if (spokenKeyRef.current !== `${step}-false`) setLive(text.live);
    }, 450);
    return () => {
      window.clearTimeout(clear);
      window.clearTimeout(fill);
    };
  }, [here, step, text]);

  // La visite s'arrête ou se met en pause : Rominou se tait (et la bulle reprendra le focus)
  useEffect(() => {
    if (active) return;
    avatarStore.setSpeaking(false);
    focusedKeyRef.current = null;
    spokenKeyRef.current = null;
  }, [active]);

  if (!text) return null;

  const goNext = () => {
    if (step >= TOUR_LENGTH - 1) {
      // Fin : révérence (dans le cadre du chat), saisie prête pour la première question
      tourStore.finish();
      avatarStore.setSpeaking(false);
      avatarStore.play("bow");
      requestAnimationFrame(() => document.getElementById("chat-input")?.focus());
      return;
    }
    const crossesPage = TOUR_STEPS[step + 1].page !== config.page;
    avatarStore.play("walk", { loopMs: crossesPage ? WALK_PAGE_MS : WALK_MS });
    tourStore.next();
  };
  const goPrevious = () => {
    if (step === 0) return;
    const crossesPage = TOUR_STEPS[step - 1].page !== config.page;
    avatarStore.play("walk", { loopMs: crossesPage ? WALK_PAGE_MS : WALK_MS });
    tourStore.previous();
  };
  // Bouton d'action de l'étape (ex. « Jouer une partie ») : clique l'élément visé de la page.
  // Le jeu ouvert suspend le Canvas de Rominou : la visite s'efface, puis revient à la fermeture.
  const actionSelector = "action" in config ? config.action : null;
  const runAction = () => {
    if (actionSelector) document.querySelector<HTMLElement>(actionSelector)?.click();
  };
  // « Réduire » : pastille (tête de Rominou) qui libère la page ; le focus la suit.
  const minimize = () => {
    tourStore.setMinimized(true);
    avatarStore.setSpeaking(false);
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-tour-expand]")?.focus());
  };
  const expand = () => {
    // La bulle rouverte reprend le focus (sans retaper le texte)
    focusedKeyRef.current = null;
    setReopenedStep(step);
    tourStore.setMinimized(false);
  };
  const quit = () => {
    tourStore.stop();
    avatarStore.setSpeaking(false);
    // La bulle disparaît : le focus revient au contenu principal
    requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true }));
  };

  const dialogProps = {
    step,
    text,
    labels,
    direction,
    animate: !reducedMotion && reopenedStep !== step,
    focusedKeyRef,
    spokenKeyRef,
    onNext: goNext,
    onPrevious: goPrevious,
    onQuit: quit,
    onAction: actionSelector && text.action ? runAction : null,
  };

  let dialog: ReactNode = null;
  if (active && !suspended) {
    if (here && config.dock === "hero") {
      // Rominou parle depuis son île (bulle du hero) ; en attendant l'emplacement : rien
      dialog = slot
        ? createPortal(<TourDialog {...dialogProps} variant="hero" tail={slotTail(slot)} />, slot)
        : null;
    } else {
      dialog = minimized ? (
        <MiniCompanion side={side} text={text} labels={labels} page={page} onExpand={expand} onQuit={quit} />
      ) : (
        <Companion side={side} scene={SCENES[page ?? config.page]} step={step}>
          <TourDialog
            {...dialogProps}
            variant="companion"
            travelling={here ? null : labels.travelling[config.page]}
            tail={{ tail: "none" }}
            onMinimize={minimize}
          />
        </Companion>
      );
    }
  }

  return (
    <>
      {dialog}
      {here && !suspended && config.target ? (
        <TourSpotlight
          key={step}
          selector={config.target}
          label={text.title}
          tag={"tag" in config ? config.tag : "top"}
        />
      ) : null}
      {/* Jeu ouvert (Canvas de Rominou suspendu) : toute l'interface de la visite s'efface */}
      {status === "paused" && !suspended ? <ResumeChip text={text} labels={labels} page={page} /> : null}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {live}
      </div>
    </>
  );
}

/** Queue de la bulle du hero : lue sur l'emplacement (mêmes réglages que la bulle remplacée). */
function slotTail(slot: HTMLElement): Tail {
  const { tail, tailOffset, tailLg, tailOffsetLg } = slot.dataset;
  return {
    tail: (tail as BubbleTail | undefined) ?? "bottom",
    tailOffset,
    tailLg: tailLg as BubbleTail | undefined,
    tailOffsetLg,
  };
}

/* ------------------------------------------------------------------ */
/* Compagnon                                                          */
/* ------------------------------------------------------------------ */

type CompanionProps = {
  side: CompanionSide;
  scene: AvatarScene;
  step: number;
  children: ReactNode;
};

/**
 * Rominou accompagne le visiteur : sa bulle fixée en bas de l'écran (à droite ou à gauche, selon
 * le contenu à garder visible), son portrait (décor de la page) qui dépasse en haut à gauche ;
 * sur mobile, feuille basse au-dessus du dock.
 */
function Companion({ side, scene, step, children }: CompanionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const lastSide = useRef(side);

  // Petit saut du portrait à chaque nouvelle étape (pas au premier affichage)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    portraitRef.current?.animate(
      [{ translate: "0 0" }, { translate: "0 -8px", offset: 0.4 }, { translate: "0 0" }],
      { duration: 420, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    );
  }, [step]);

  // Changement de côté : le compagnon réapparaît en douceur plutôt que de sauter d'un bord à l'autre
  useEffect(() => {
    if (lastSide.current === side) return;
    lastSide.current = side;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate([{ opacity: 0, translate: "0 0.75rem" }, { opacity: 1, translate: "0 0" }], {
      duration: 320,
      easing: "ease-out",
    });
  }, [side]);

  return (
    <div ref={ref} className={styles.companion} data-side={side} data-tour-companion="">
      {children}
      <div ref={portraitRef} className={styles.portrait} data-tour-portrait="">
        <CompanionAnchor scene={scene} framing="portrait" className={styles.portraitFrame} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bulle de dialogue                                                  */
/* ------------------------------------------------------------------ */

type TourDialogProps = {
  step: number;
  text: TourStepText;
  labels: TourLabels;
  direction: -1 | 0 | 1;
  /** Texte révélé par mots (sinon affiché d'un coup : mouvement réduit). */
  animate: boolean;
  /** Étape (et trajet) ayant déjà reçu le focus, gardée par TourOverlay entre deux montages. */
  focusedKeyRef: RefObject<string | null>;
  /** Étape dont la bulle a pris le focus (lue par le lecteur d'écran : pas d'annonce live). */
  spokenKeyRef: RefObject<string | null>;
  variant: "hero" | "companion";
  tail: Tail;
  /** En route vers la page de l'étape : texte d'attente, sans Précédent / Suivant. */
  travelling?: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onQuit: () => void;
  /** Bouton d'action de l'étape (libellé : text.action), sinon null. */
  onAction: (() => void) | null;
  /** « Réduire » (compagnon seulement) : la bulle se replie en pastille. */
  onMinimize?: () => void;
};

function TourDialog({
  step,
  text,
  labels,
  direction,
  animate,
  focusedKeyRef,
  spokenKeyRef,
  variant,
  tail,
  travelling = null,
  onNext,
  onPrevious,
  onQuit,
  onAction,
  onMinimize,
}: TourDialogProps) {
  const titleId = useId();
  const textId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const last = step === TOUR_LENGTH - 1;
  const moving = travelling !== null;

  // Nouvelle étape : le focus va à la bulle (sauf s'il y est déjà, ex. sur « Suivant »).
  // Bulle simplement remontée (même étape, ex. après le jeu) : le focus reste où il est.
  useEffect(() => {
    const dialog = ref.current;
    const key = `${step}-${moving}`;
    if (!dialog || focusedKeyRef.current === key) return;
    focusedKeyRef.current = key;
    if (dialog.contains(document.activeElement)) return;
    dialog.focus({ preventScroll: true });
    spokenKeyRef.current = key;
  }, [step, moving, focusedKeyRef, spokenKeyRef]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onQuit();
    } else if (event.key === "ArrowRight" && !moving) {
      event.preventDefault();
      onNext();
    } else if (event.key === "ArrowLeft" && !moving && step > 0) {
      event.preventDefault();
      onPrevious();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={textId}
      aria-keyshortcuts="ArrowRight ArrowLeft Escape"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      data-tour-dialog={variant}
      data-tail={tail.tail}
      data-tail-lg={tail.tailLg}
      style={
        {
          ...(tail.tailOffset ? { "--tail-offset": tail.tailOffset } : {}),
          ...(tail.tailOffsetLg ? { "--tail-offset-lg": tail.tailOffsetLg } : {}),
        } as CSSProperties
      }
      className={cx("bubble", styles.dialog)}
    >
      {/* Cartouche dans le hero (Rominou est à côté) ; dans le compagnon, son portrait suffit */}
      {variant === "hero" ? <p className="bubble-name">{labels.guide}</p> : null}

      <div className={styles.head}>
        {/* Remonté à chaque étape (entrée en douceur) ; les boutons, eux, gardent le focus */}
        <h2 key={`${step}-${moving}`} id={titleId} className={styles.title} data-direction={direction}>
          {text.title}
        </h2>
        <span className={styles.headButtons}>
          {onMinimize ? (
            <button
              type="button"
              onClick={onMinimize}
              aria-label={labels.minimize}
              title={labels.minimize}
              data-tour-minimize=""
              className={styles.close}
            >
              <Icon name="chevron-down" />
            </button>
          ) : null}
          <button type="button" onClick={onQuit} aria-label={labels.quit} title={labels.quit} className={styles.close}>
            <Icon name="close" />
          </button>
        </span>
      </div>
      {/* Progression : fine jauge (le compteur « 3/10 » est à côté des boutons) */}
      <span aria-hidden="true" className={styles.progress}>
        <i style={{ inlineSize: `${((step + 1) / TOUR_LENGTH) * 100}%` }} />
      </span>

      <div key={`${step}-${moving}`} className={styles.body} data-direction={direction}>
        {moving ? (
          <p id={textId} className={cx(styles.text, styles.travelling)}>
            {travelling}
          </p>
        ) : (
          <>
            <RevealedText text={text.text} animate={animate} />
            <p id={textId} className="sr-only">
              {text.text}
            </p>
            {onAction && text.action ? (
              <Button size="sm" variant="secondary" icon="gamepad" onClick={onAction} className={styles.action}>
                {text.action}
              </Button>
            ) : null}
          </>
        )}
      </div>

      <div className={styles.actions}>
        {step > 0 && !moving ? (
          <Button
            size="icon"
            variant="secondary"
            icon="arrow-right"
            onClick={onPrevious}
            aria-label={labels.previous}
            title={labels.previous}
            className={styles.previous}
          />
        ) : null}
        <p className={styles.count}>
          <span aria-hidden="true">{text.counter}</span>
          <span className="sr-only">
            {labels.kicker}, {text.counterLabel}
          </span>
        </p>
        {moving ? null : (
          <Button
            size="sm"
            iconEnd={last ? "check" : "arrow-right"}
            onClick={onNext}
            title={labels.keys}
            className={styles.next}
          >
            {text.next}
          </Button>
        )}
      </div>
      {/* Raccourcis clavier : affichés à la 1re étape ; ensuite, en infobulle de « Suivant » */}
      {step === 0 && !moving ? <p className={styles.keys}>{labels.keys}</p> : null}
    </div>
  );
}

/**
 * Texte de l'étape, révélé par mots (moins d'une seconde) pendant que Rominou « parle »
 * (hochements de tête). Un clic affiche tout. La place finale est réservée (pas de saut de mise
 * en page) ; le texte complet est lu par les lecteurs d'écran (copie sr-only + région live).
 */
function RevealedText({ text: raw, animate }: { text: string; animate: boolean }) {
  const text = keepLastWordsTogether(raw);
  const [count, setCount] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const revealing = animate && !skipped;

  useEffect(() => {
    if (!revealing) return;
    avatarStore.setSpeaking(true);
    const duration = Math.min(REVEAL_MAX_MS, text.length * REVEAL_MS_PER_CHAR);
    const started = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min(1, (now - started) / duration);
      // Jusqu'à la fin du mot en cours : les mots apparaissent entiers, sans lettre coupée
      const target = Math.ceil(text.length * progress);
      const space = text.indexOf(" ", target);
      setCount(progress >= 1 || space === -1 ? text.length : space);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else avatarStore.setSpeaking(false);
    });
    return () => {
      cancelAnimationFrame(frame);
      avatarStore.setSpeaking(false);
    };
  }, [text, revealing]);

  const shown = revealing ? count : text.length;
  return (
    <p
      aria-hidden="true"
      className={styles.text}
      data-typing={shown < text.length || undefined}
      onClick={() => setSkipped(true)}
    >
      {text.slice(0, shown)}
      <span className={styles.rest}>{text.slice(shown)}</span>
    </p>
  );
}

/**
 * Pas de mot seul sur la dernière ligne (« IA ! », « Mid ! ») : les deux derniers mots sont liés
 * par une espace insécable, à toutes les largeurs de bulle (text-wrap: pretty ne suffit pas).
 */
function keepLastWordsTogether(text: string): string {
  const space = text.lastIndexOf(" ");
  return space > 0 ? `${text.slice(0, space)} ${text.slice(space + 1)}` : text;
}

/* ------------------------------------------------------------------ */
/* Compagnon replié (« Réduire »)                                     */
/* ------------------------------------------------------------------ */

type MiniCompanionProps = {
  side: CompanionSide;
  text: TourStepText;
  labels: TourLabels;
  page: PageId | null;
  onExpand: () => void;
  onQuit: () => void;
};

/** Bulle repliée : tête de Rominou + « Afficher la bulle (5/10) », là où était le compagnon. */
function MiniCompanion({ side, text, labels, page, onExpand, onQuit }: MiniCompanionProps) {
  return (
    <div role="group" aria-label={labels.kicker} className={styles.chip} data-side={side} data-tour-mini="">
      <RominouHead size={36} outfit={page === "hobby" ? "vacances" : "default"} className={styles.chipHead} />
      <button
        type="button"
        onClick={onExpand}
        aria-label={text.expandLabel}
        data-tour-expand=""
        className={styles.chipResume}
      >
        {text.expand}
      </button>
      <button type="button" onClick={onQuit} aria-label={labels.quit} title={labels.quit} className={styles.close}>
        <Icon name="close" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pastille « Reprendre la visite »                                   */
/* ------------------------------------------------------------------ */

function ResumeChip({ text, labels, page }: { text: TourStepText; labels: TourLabels; page: PageId | null }) {
  return (
    <div role="group" aria-label={labels.paused} className={styles.chip} data-tour-resume="">
      <RominouHead size={36} outfit={page === "hobby" ? "vacances" : "default"} className={styles.chipHead} />
      <button
        type="button"
        onClick={() => tourStore.resume()}
        aria-label={text.resumeLabel}
        className={styles.chipResume}
      >
        {text.resume}
      </button>
      <button type="button" onClick={() => tourStore.stop()} aria-label={labels.quit} title={labels.quit} className={styles.close}>
        <Icon name="close" />
      </button>
    </div>
  );
}
