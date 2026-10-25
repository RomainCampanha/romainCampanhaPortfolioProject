"use client";

import { useEffect, useRef, type RefObject } from "react";
import { obstacleX } from "@/lib/game/sim";
import type { Obstacle } from "@/lib/game/types";
import { blinkHidden, interpolated, viewSpan, type FrameSource } from "./frame";
import { mix, readPalette, type Palette } from "./palette";
import type { Theme } from "./themes";
import styles from "./game.module.css";

// Rendu de secours en 2D (canvas) : sans WebGL 2, contexte 3D perdu ou modèle introuvable.
// Même partie, même cadrage, en aplats pastel (vue de côté, parallaxe simple), aux couleurs
// de la ville (themes.ts : sol ; le ciel est le même dégradé CSS que pour la 3D).

const MAX_DPR = 2;
const HEAD_SRC = "/brand/rominou-head.webp";

export function Canvas2D({
  source,
  theme,
  onReady,
}: {
  source: RefObject<FrameSource | null>;
  theme: Theme;
  onReady: (draw: () => void) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const palette = readPalette(canvas);
    const head = new Image();
    head.src = HEAD_SRC;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    resize();
    const observer = new ResizeObserver(() => {
      resize();
      draw();
    });
    observer.observe(canvas);

    const draw = () => {
      const frame = source.current;
      if (frame) drawFrame(ctx, canvas.width, canvas.height, frame, palette, themeRef.current, head);
    };
    onReady(draw);
    return () => observer.disconnect();
  }, [source, onReady]);

  return <canvas ref={canvasRef} aria-hidden="true" className={styles.canvas} />;
}

type View = { scale: number; camX: number; groundY: number; w: number; h: number };

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: FrameSource,
  c: Palette,
  theme: Theme,
  head: HTMLImageElement,
) {
  const { level, run, fx } = frame;
  const g = theme.ground;
  const { x: px, y: py, t } = interpolated(frame);
  const span = viewSpan(level.speed, w / h);
  let scale = w / (span.behind + span.ahead);
  if (h / scale < 6) scale = h / 6;
  const groundY = h - Math.max(h * 0.22, 1.2 * scale);
  const v: View = { scale, camX: px - span.behind, groundY, w, h };
  const X = (wx: number) => (wx - v.camX) * scale;
  const Y = (wy: number) => groundY - wy * scale;

  ctx.clearRect(0, 0, w, h);

  // Parallaxe : montagnes lointaines, collines, immeubles.
  drawRidge(ctx, v, 0.15, 2.2, 0.8, 34, mix(c.lilac300, theme.sky.horizon, 0.35));
  drawCity(ctx, v, level.seed, c);
  drawRidge(ctx, v, 0.55, 0.7, 0.25, 14, g.back);

  // Sol (chemin, bordure du ton de l'étape, bande de devant) et trous (eau).
  ctx.fillStyle = g.socle;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = g.path;
  ctx.fillRect(0, groundY, w, Math.max(3, 0.16 * scale));
  ctx.fillStyle = c.tone300;
  ctx.fillRect(0, groundY + Math.max(3, 0.16 * scale), w, Math.max(2, 0.07 * scale));
  ctx.fillStyle = g.front;
  ctx.fillRect(0, groundY + 0.5 * scale, w, h);
  for (const g of level.gaps) {
    const gx = X(g.x);
    const gw = g.w * scale;
    if (gx > w || gx + gw < 0) continue;
    ctx.fillStyle = c.lake300;
    ctx.fillRect(gx, groundY, gw, h - groundY);
    ctx.fillStyle = c.lake500;
    ctx.fillRect(gx, groundY + 0.3 * scale, gw, h);
  }

  // Porte d'embarquement.
  drawGate(ctx, X(level.gateX), Y, scale, c);

  // Tampons.
  level.stamps.forEach((s, i) => {
    const sx = X(s.x);
    if (sx < -scale || sx > w + scale) return;
    const at = fx.collectedAt[i];
    if (at >= 0 && t - at > 0.25) return;
    const pop = at >= 0 ? 1 + (t - at) * 3 : 1;
    const r = 0.3 * scale * pop;
    ctx.globalAlpha = at >= 0 ? Math.max(0, 1 - (t - at) * 4) : 1;
    ctx.fillStyle = c.butter300;
    ctx.beginPath();
    ctx.arc(sx, Y(s.y), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.clay;
    ctx.lineWidth = Math.max(1.5, 0.06 * scale);
    ctx.setLineDash([0.08 * scale, 0.06 * scale]);
    ctx.beginPath();
    ctx.arc(sx, Y(s.y), r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  });

  // Obstacles.
  level.obstacles.forEach((o, i) => {
    const ox = obstacleX(o, t);
    if (X(ox + o.w) < -scale || X(ox) > w + scale) return;
    const knocked = fx.knockedAt[i];
    ctx.save();
    if (knocked >= 0) {
      const k = Math.min(1, (t - knocked) * 3);
      ctx.translate(X(ox + o.w / 2), Y(o.y));
      ctx.rotate(k * 1.2);
      ctx.translate(-X(ox + o.w / 2), -Y(o.y));
      ctx.globalAlpha = 1 - k * 0.5;
    }
    drawObstacle(ctx, o, X(ox), Y, scale, t, c);
    ctx.restore();
  });

  // Rominou et son ombre au sol (plus petite quand il saute).
  if (run.y > -0.05) {
    const shrink = 1 / (1 + Math.max(0, py) * 0.5);
    ctx.fillStyle = "rgb(43 36 51 / 0.16)";
    ctx.beginPath();
    ctx.ellipse(X(px), groundY + 0.02 * scale, 0.32 * scale * shrink, 0.07 * scale * shrink, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!blinkHidden(run, t)) drawRominou(ctx, X(px), Y(py), scale, frame, t, head, c);
}

function drawRidge(ctx: CanvasRenderingContext2D, v: View, factor: number, base: number, amp: number, period: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, v.h);
  for (let sx = 0; sx <= v.w + 8; sx += 8) {
    const wx = v.camX * factor + sx / v.scale;
    const y = base + amp * Math.sin((wx / period) * Math.PI * 2) + amp * 0.4 * Math.sin((wx / period) * 5.3);
    ctx.lineTo(sx, v.groundY - y * v.scale);
  }
  ctx.lineTo(v.w, v.h);
  ctx.closePath();
  ctx.fill();
}

function drawCity(ctx: CanvasRenderingContext2D, v: View, seed: number, c: Palette) {
  const factor = 0.35;
  const colors = [c.tone200, c.lilac200, c.peach200, c.lake200];
  const left = v.camX * factor;
  const step = 2.4;
  const first = Math.floor(left / step) - 1;
  for (let i = first; i < first + v.w / (step * v.scale) + 3; i++) {
    const n = Math.abs(Math.sin(i * 12.9898 + seed * 0.001) * 43758.5453) % 1;
    const bw = 1.1 + n * 0.9;
    const bh = 0.9 + ((n * 7.3) % 1) * 1.9;
    const sx = (i * step - left) * v.scale;
    const top = v.groundY - (bh + 0.5) * v.scale;
    ctx.fillStyle = colors[Math.abs(i) % colors.length];
    roundRect(ctx, sx, top, bw * v.scale, (bh + 0.5) * v.scale, 0.16 * v.scale);
    ctx.fill();
    // Fenêtres
    ctx.fillStyle = "rgb(43 36 51 / 0.12)";
    for (let wy = top + 0.2 * v.scale; wy < v.groundY - 0.6 * v.scale; wy += 0.42 * v.scale) {
      for (let wx = sx + 0.18 * v.scale; wx < sx + (bw - 0.3) * v.scale; wx += 0.36 * v.scale) {
        roundRect(ctx, wx, wy, 0.16 * v.scale, 0.2 * v.scale, 0.05 * v.scale);
        ctx.fill();
      }
    }
  }
}

function drawGate(ctx: CanvasRenderingContext2D, gx: number, Y: (y: number) => number, s: number, c: Palette) {
  ctx.fillStyle = c.tone300;
  roundRect(ctx, gx - 0.25 * s, Y(3.2), 0.5 * s, 3.2 * s, 0.15 * s);
  ctx.fill();
  roundRect(ctx, gx + 2.2 * s, Y(3.2), 0.5 * s, 3.2 * s, 0.15 * s);
  ctx.fill();
  ctx.fillStyle = c.clay;
  roundRect(ctx, gx - 0.6 * s, Y(3.9), 3.6 * s, 0.9 * s, 0.3 * s);
  ctx.fill();
  ctx.fillStyle = c.cream;
  ctx.beginPath();
  ctx.arc(gx + 1.2 * s, Y(3.45), 0.24 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  sx: number,
  Y: (y: number) => number,
  s: number,
  t: number,
  c: Palette,
) {
  const w = o.w * s;
  switch (o.kind) {
    case "cone": {
      ctx.fillStyle = c.peach500;
      ctx.beginPath();
      ctx.moveTo(sx + w * 0.5, Y(o.h));
      ctx.lineTo(sx + w * 0.9, Y(0.06));
      ctx.lineTo(sx + w * 0.1, Y(0.06));
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c.cream;
      ctx.fillRect(sx + w * 0.3, Y(0.42), w * 0.4, 0.1 * s);
      ctx.fillStyle = c.clayEdge;
      ctx.fillRect(sx, Y(0.06), w, 0.06 * s);
      break;
    }
    case "suitcase": {
      const colors = [c.lake500, c.peach300, c.lilac500];
      const each = o.h / o.stack;
      for (let k = 0; k < o.stack; k++) {
        ctx.fillStyle = colors[k % colors.length];
        roundRect(ctx, sx + (k % 2) * 0.04 * s, Y((k + 1) * each), w - 0.04 * s, each * s - 2, 0.1 * s);
        ctx.fill();
      }
      ctx.strokeStyle = c.ink;
      ctx.lineWidth = Math.max(1.5, 0.05 * s);
      ctx.beginPath();
      ctx.arc(sx + w / 2, Y(o.h), 0.12 * s, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case "bench": {
      ctx.fillStyle = c.butter500;
      ctx.fillRect(sx, Y(0.45), w, 0.09 * s);
      ctx.fillRect(sx, Y(o.h), w, 0.08 * s);
      ctx.fillStyle = c.clayEdge;
      ctx.fillRect(sx + 0.1 * s, Y(0.45), 0.08 * s, 0.45 * s);
      ctx.fillRect(sx + w - 0.18 * s, Y(0.45), 0.08 * s, 0.45 * s);
      break;
    }
    case "pigeon": {
      const cy = Y(o.y + o.h / 2);
      const flap = Math.sin(t * 18) * 0.12 * s;
      ctx.fillStyle = c.lilac300;
      ctx.beginPath();
      ctx.ellipse(sx + w * 0.55, cy, w * 0.45, o.h * s * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.lilac500;
      ctx.beginPath();
      ctx.ellipse(sx + w * 0.6, cy - flap, w * 0.3, 0.08 * s, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.lilac300;
      ctx.beginPath();
      ctx.arc(sx + w * 0.12, cy - o.h * s * 0.25, 0.13 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.butter500;
      ctx.beginPath();
      ctx.moveTo(sx, cy - o.h * s * 0.3);
      ctx.lineTo(sx - 0.12 * s, cy - o.h * s * 0.22);
      ctx.lineTo(sx, cy - o.h * s * 0.16);
      ctx.fill();
      break;
    }
  }
}

function drawRominou(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  s: number,
  frame: FrameSource,
  t: number,
  head: HTMLImageElement,
  c: Palette,
) {
  const { run, fx, reducedMotion } = frame;
  const airborne = !run.grounded;
  // Étirement au saut, écrasement à l'atterrissage (pas en mouvement réduit).
  const sinceLand = t - fx.landAt;
  let stretch = 1;
  if (!reducedMotion) {
    if (airborne) stretch = 1 + Math.max(-0.08, Math.min(0.1, run.vy * 0.01));
    else if (fx.landAt >= 0 && sinceLand < 0.15) stretch = 1 - 0.14 * (1 - sinceLand / 0.15);
  }
  const running = frame.phase === "playing" && run.status === "running";
  const cycle = running && !airborne && !reducedMotion ? Math.sin(t * 16) : 0;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1 / Math.sqrt(stretch), stretch);
  // Jambes
  ctx.strokeStyle = c.ink;
  ctx.lineCap = "round";
  ctx.lineWidth = 0.13 * s;
  ctx.beginPath();
  ctx.moveTo(-0.07 * s, -0.62 * s);
  ctx.lineTo((-0.07 + cycle * 0.16) * s, -0.04 * s);
  ctx.moveTo(0.07 * s, -0.62 * s);
  ctx.lineTo((0.07 - cycle * 0.16) * s, -0.04 * s);
  ctx.stroke();
  // Buste
  ctx.fillStyle = c.lake500;
  roundRect(ctx, -0.24 * s, -1.22 * s, 0.48 * s, 0.66 * s, 0.18 * s);
  ctx.fill();
  // Tête
  const r = 0.34 * s;
  if (head.complete && head.naturalWidth > 0) {
    ctx.drawImage(head, -r * 1.15, -1.22 * s - r * 2.05, r * 2.3, r * 2.3);
  } else {
    ctx.fillStyle = c.peach200;
    ctx.beginPath();
    ctx.arc(0, -1.22 * s - r, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}
