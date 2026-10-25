// Petits sons du jeu, synthétisés avec WebAudio (aucun fichier audio, aucune dépendance).
// Désactivés par défaut : le contexte audio n'est créé qu'au premier son, après que le
// visiteur a activé le son (geste utilisateur).

export type Blip = "jump" | "double" | "stamp" | "hit" | "splash" | "finish" | "fail";

type Note = { f: number; f2?: number; at: number; len: number; type?: OscillatorType; gain?: number };

const SOUNDS: Record<Blip, Note[]> = {
  jump: [{ f: 420, f2: 680, at: 0, len: 0.11, type: "triangle" }],
  double: [{ f: 560, f2: 920, at: 0, len: 0.12, type: "triangle" }],
  stamp: [
    { f: 988, at: 0, len: 0.07, type: "sine", gain: 0.8 },
    { f: 1319, at: 0.06, len: 0.1, type: "sine", gain: 0.8 },
  ],
  hit: [{ f: 220, f2: 110, at: 0, len: 0.2, type: "square", gain: 0.45 }],
  splash: [{ f: 320, f2: 90, at: 0, len: 0.28, type: "sawtooth", gain: 0.3 }],
  finish: [
    { f: 523, at: 0, len: 0.12 },
    { f: 659, at: 0.11, len: 0.12 },
    { f: 784, at: 0.22, len: 0.12 },
    { f: 1047, at: 0.33, len: 0.3 },
  ],
  fail: [
    { f: 392, at: 0, len: 0.16, type: "triangle" },
    { f: 330, at: 0.15, len: 0.16, type: "triangle" },
    { f: 262, at: 0.3, len: 0.3, type: "triangle" },
  ],
};

const VOLUME = 0.07;
let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

/** Joue un petit son (silencieux si WebAudio est indisponible). */
export function playBlip(kind: Blip): void {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const note of SOUNDS[kind]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + note.at;
    const end = start + note.len;
    osc.type = note.type ?? "sine";
    osc.frequency.setValueAtTime(note.f, start);
    if (note.f2) osc.frequency.exponentialRampToValueAtTime(note.f2, end);
    const peak = VOLUME * (note.gain ?? 1);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

/** Libère le contexte audio (jeu fermé). */
export function closeAudio(): void {
  void context?.close().catch(() => undefined);
  context = null;
}
