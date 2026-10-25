"use client";

import { useLayoutEffect, useState } from "react";
import { waitForElement } from "./dom";

// Placement de la visite : le contenu clé d'une étape (TOUR_STEPS[i].keep) ne passe jamais sous la
// bulle du compagnon, son portrait ou le dock mobile. Après la mise en page, on mesure le contenu
// (coordonnées du document) et ce qui le recouvre (éléments fixés, sans leurs animations), puis on
// choisit le côté du compagnon (dès 48rem) et la position de défilement :
//   1. tout le contenu clé, côté préféré puis l'autre côté ;
//   2. sinon, en lâchant le contexte par la fin (en-tête de section…), jusqu'à l'élément principal ;
//   3. sinon (élément plus haut que l'écran) : son haut en haut de l'écran.
// Déjà à l'écran et dégagé : on ne défile pas. Redimensionnement, bulle ou page qui changent de
// taille : on recommence, sauf si le visiteur a défilé lui-même entre-temps.

export type CompanionSide = "start" | "end";

type Box = { top: number; bottom: number; left: number; right: number };

export type PlacementPlan = {
  side: CompanionSide;
  /** Position de défilement visée ; null = rien à faire (déjà visible, hors de la bulle). */
  scrollTop: number | null;
};

/** Écart minimal entre le contenu clé et ce qui le recouvre (px). */
const GAP = 16;

/** Marge au-dessus du contenu après défilement (le header n'est pas collant). */
function topMargin(): number {
  return window.matchMedia("(min-width: 48rem)").matches ? 40 : 28;
}

/** Boîte d'un élément fixé, dans la fenêtre, sans ses transformations (entrée, petit saut). */
function fixedBox(element: HTMLElement): Box {
  const style = window.getComputedStyle(element);
  const top = Number.parseFloat(style.top) || 0;
  const left = Number.parseFloat(style.left) || 0;
  return { top, left, bottom: top + element.offsetHeight, right: left + element.offsetWidth };
}

/** Ce que recouvre le compagnon : la bulle et le portrait de Rominou qui dépasse au-dessus. */
function companionBoxes(companion: HTMLElement): Box[] {
  const box = fixedBox(companion);
  const boxes = [box];
  const portrait = companion.querySelector<HTMLElement>("[data-tour-portrait]");
  if (portrait) {
    const left = box.left + portrait.offsetLeft;
    const top = box.top + portrait.offsetTop;
    boxes.push({ top, left, bottom: top + portrait.offsetHeight, right: left + portrait.offsetWidth });
  }
  return boxes;
}

/** Dock mobile (barre d'onglets fixée en bas), s'il est affiché. */
function dockBoxes(): Box[] {
  const dock = document.querySelector<HTMLElement>(".page-nav");
  if (!dock) return [];
  const style = window.getComputedStyle(dock);
  return style.position === "fixed" && style.display !== "none" ? [fixedBox(dock)] : [];
}

/**
 * Rectangle visible d'un élément du contenu clé, dans la fenêtre : celui de son texte pour un
 * titre (sa boîte fait toute la largeur de la colonne, pas ses lettres), sa boîte sinon.
 */
export function visibleRect(element: Element): DOMRect {
  if (/^H[1-6]$/.test(element.tagName)) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  return element.getBoundingClientRect();
}

/**
 * Même recouvrement, compagnon de l'autre côté de l'écran (insets symétriques) : le compagnon
 * entier est déplacé (le portrait reste à sa place dans la bulle, en haut à gauche).
 */
function otherSide(boxes: Box[], width: number): Box[] {
  const [main] = boxes;
  if (!main) return boxes;
  const shift = width - main.right - main.left;
  return boxes.map((box) => ({ ...box, left: box.left + shift, right: box.right + shift }));
}

/**
 * Positions de défilement où chaque rectangle (coordonnées du document) est entièrement à
 * l'écran, sous la marge du haut et au-dessus de tout ce qui le recouvre. null : impossible.
 */
function scrollRange(
  rects: Box[],
  covers: Box[],
  viewport: number,
  maxScroll: number,
  margin = topMargin(),
): [number, number] | null {
  let low = 0;
  let high = maxScroll;
  for (const rect of rects) {
    // Haut du contenu sous la marge (souple tout en haut de la page)
    high = Math.min(high, Math.max(0, rect.top - margin));
    let limit = viewport - 8;
    for (const cover of covers) {
      if (rect.left < cover.right + 8 && rect.right > cover.left - 8) limit = Math.min(limit, cover.top - GAP);
    }
    low = Math.max(low, rect.bottom - limit);
  }
  return low <= high ? [low, high] : null;
}

/**
 * Côté du compagnon et défilement pour garder le contenu clé (`keep`, par importance) visible et
 * dégagé. null si l'élément principal n'est pas (encore) dans la page.
 */
export function planPlacement(
  keep: readonly string[],
  preferred: CompanionSide,
  companion: HTMLElement | null,
): PlacementPlan | null {
  const elements = keep.map((selector) => document.querySelector(selector));
  if (!elements[0]) return null;
  const root = document.documentElement;
  const width = root.clientWidth;
  const viewport = root.clientHeight;
  const scrollY = window.scrollY;
  const maxScroll = Math.max(0, root.scrollHeight - viewport);
  const rects = elements.flatMap((element) => {
    if (!element) return [];
    const rect = visibleRect(element);
    if (rect.width === 0 && rect.height === 0) return [];
    return [{ top: rect.top + scrollY, bottom: rect.bottom + scrollY, left: rect.left, right: rect.right }];
  });
  if (rects.length === 0) return null;

  const dock = dockBoxes();
  const current: CompanionSide = companion?.dataset.side === "start" ? "start" : "end";
  const own = companion ? companionBoxes(companion) : [];
  // Sur mobile, la feuille occupe toute la largeur : un seul placement possible
  const sides: CompanionSide[] =
    companion && window.matchMedia("(min-width: 48rem)").matches
      ? [preferred, preferred === "end" ? "start" : "end"]
      : [current];
  const coversFor = (side: CompanionSide) => [...(side === current ? own : otherSide(own, width)), ...dock];

  // Idéal : tout le contenu clé aligné en haut (l'en-tête de la section, s'il en fait partie) ;
  // sinon, le plus de contexte possible au-dessus de ce qui est gardé
  const ideal = Math.min(...rects.map((rect) => rect.top)) - topMargin();
  for (let count = rects.length; count > 0; count--) {
    for (const side of sides) {
      const range = scrollRange(rects.slice(0, count), coversFor(side), viewport, maxScroll);
      if (!range) continue;
      const [low, high] = range;
      if (scrollY >= low - 1 && scrollY <= high + 1) return { side, scrollTop: null };
      let top = Math.min(Math.max(ideal, low), high);
      // Contexte lâché (ex. en-tête de section) : entier ou caché en haut, jamais coupé
      for (const dropped of [...rects.slice(count)].sort((a, b) => a.bottom - b.bottom)) {
        if (dropped.top < top && dropped.bottom > top && dropped.bottom + 4 <= high) top = dropped.bottom + 4;
      }
      return { side, scrollTop: Math.round(top) };
    }
  }
  // Très petit écran : l'élément principal seul, collé en haut (sans la marge de l'anneau)
  for (const side of sides) {
    const range = scrollRange(rects.slice(0, 1), coversFor(side), viewport, maxScroll, 8);
    if (!range) continue;
    const [low, high] = range;
    if (scrollY >= low - 1 && scrollY <= high + 1) return { side, scrollTop: null };
    return { side, scrollTop: Math.round(high) };
  }
  // Élément principal plus haut que la place libre : son haut en haut de l'écran
  const top = Math.min(Math.max(0, rects[0].top - topMargin()), maxScroll);
  return { side: sides[0], scrollTop: Math.abs(top - scrollY) <= 1 ? null : Math.round(top) };
}

/** Touches qui font défiler la page : le visiteur reprend la main. */
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

type PlacementOptions = {
  /** Étape affichée et à sa place (pas en route, ni repliée, ni cachée par le jeu). */
  enabled: boolean;
  /** Change à chaque étape (nouveau placement, défilement compris). */
  step: number;
  keep: readonly string[];
  preferred: CompanionSide;
};

/**
 * Place le compagnon et fait défiler la page à chaque étape (cf. planPlacement). Renvoie le côté
 * du compagnon, décidé avant l'affichage quand le contenu est déjà là (pas de saut visible).
 */
export function useTourPlacement({ enabled, step, keep, preferred }: PlacementOptions): CompanionSide {
  const [side, setSide] = useState<CompanionSide>(preferred);
  const keepKey = keep.join("\n");

  useLayoutEffect(() => {
    if (!enabled) return;
    const selectors = keepKey.split("\n");
    const controller = new AbortController();
    const { signal } = controller;
    // Le visiteur a fait défiler la page lui-même depuis le dernier placement : on le laisse lire
    let manual = false;
    let frame = 0;
    let timer = 0;

    const place = (scroll: ScrollBehavior | null, retried = false) => {
      const companion = document.querySelector<HTMLElement>("[data-tour-companion]");
      const plan = planPlacement(selectors, preferred, companion);
      if (!plan) return;
      setSide(plan.side);
      if (!scroll || plan.scrollTop === null) return;
      // Côté changé : le compagnon est re-rendu de l'autre côté avant de défiler (mesure à jour,
      // une seule fois)
      if (!retried && companion && companion.dataset.side !== plan.side) {
        frame = requestAnimationFrame(() => place(scroll, true));
        return;
      }
      window.scrollTo({ top: plan.scrollTop, behavior: scroll });
    };
    const behavior = (): ScrollBehavior =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";

    // Côté décidé tout de suite (avant l'affichage) ; défilement après celui de la navigation
    // (haut de page) et une fois l'élément principal arrivé (page qui se charge)
    place(null);
    void waitForElement(selectors[0], signal).then((element) => {
      if (!element || signal.aborted) return;
      frame = requestAnimationFrame(() => {
        if (!signal.aborted) place(behavior());
      });
    });

    const replace = (scroll: () => ScrollBehavior) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!manual) place(scroll());
      }, 120);
    };
    const onManual = () => {
      manual = true;
    };
    const onKey = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) manual = true;
    };
    const onResize = () => replace(() => "instant");
    window.addEventListener("wheel", onManual, { passive: true, signal });
    window.addEventListener("touchmove", onManual, { passive: true, signal });
    window.addEventListener("keydown", onKey, { signal });
    window.addEventListener("resize", onResize, { signal });
    // Bulle qui change de taille (police chargée, texte), page qui bouge (images, contenu chargé)
    const observer = new ResizeObserver(() => replace(behavior));
    const companion = document.querySelector("[data-tour-companion]");
    if (companion) observer.observe(companion);
    observer.observe(document.body);

    return () => {
      controller.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [enabled, step, keepKey, preferred]);

  return side;
}
