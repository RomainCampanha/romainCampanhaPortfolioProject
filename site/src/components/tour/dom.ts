// Outils DOM de la visite guidée (client uniquement).

/**
 * Attend qu'un élément apparaisse (page qui arrive après une navigation client), au plus
 * `timeoutMs`. null si absent ou annulé.
 */
export function waitForElement(selector: string, signal: AbortSignal, timeoutMs = 5000): Promise<Element | null> {
  const found = document.querySelector(selector);
  if (found || signal.aborted) return Promise.resolve(found);
  return new Promise((resolve) => {
    const finish = (element: Element | null) => {
      observer.disconnect();
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve(element);
    };
    const onAbort = () => finish(null);
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) finish(element);
    });
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    signal.addEventListener("abort", onAbort);
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/** Au-delà de cet espace intérieur (px), c'est un vide de mise en page, pas une marge de carte. */
const LAYOUT_PADDING = 40;

/**
 * Grands espaces intérieurs d'une section (ex. padding-top qui l'écarte de la précédente) :
 * l'anneau et le défilement visent son contenu, pas ce vide (quelques px gardés). Les cartes
 * (padding modeste) gardent l'anneau autour de leur bord.
 */
export function paddingInsets(element: Element): { top: number; bottom: number } {
  const style = window.getComputedStyle(element);
  const inset = (value: string) => {
    const padding = Number.parseFloat(value) || 0;
    return padding > LAYOUT_PADDING ? padding - 16 : 0;
  };
  return { top: inset(style.paddingTop), bottom: inset(style.paddingBottom) };
}
