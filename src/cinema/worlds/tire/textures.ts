// Procedural surface maps of the hero wheel, drawn once on canvases with
// seeded randomness (deterministic, no image files to license): the raised
// sidewall lettering (bump + roughness), the crack overlay that grows with
// age, and a fine rubber grain. Polar canvases: x = angle, y = radius, so a
// row of text is a straight line and its glyphs keep their proportions by
// scaling x with the circumference at that radius.

import { random } from "remotion";
import { CanvasTexture, LinearSRGBColorSpace, RepeatWrapping } from "three";
import { CRACKS, DATE_CODE, TIRE } from "./geometry";

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d") as CanvasRenderingContext2D] as const;
};

const dataTexture = (c: HTMLCanvasElement, wrap = false) => {
  const t = new CanvasTexture(c);
  t.colorSpace = LinearSRGBColorSpace;
  t.anisotropy = 16;
  if (wrap) {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
  }
  return t;
};

// Sidewall copy is part of the 3D asset, not episode copy: generic markings
// every tire carries (size, construction, load/pressure limits) and no brand.
// The DOT code's last four digits come from the episode (date code).
export type SidewallCopy = {
  size: string;
  construction: readonly string[];
  limits: string;
  dotPrefix: string;
  date: string;
};

const WALL_W = 8192;
const WALL_H = 1024;
const WALL_SPAN = TIRE.wallOuter - TIRE.wallInner;
const pxPerM = WALL_H / WALL_SPAN;
const yOf = (r: number) => (1 - (r - TIRE.wallInner) / WALL_SPAN) * WALL_H;
const xOf = (theta: number) => (theta / (Math.PI * 2)) * WALL_W;
// Horizontal squeeze that keeps glyph proportions at radius r.
const sxAt = (r: number) => WALL_W / (Math.PI * 2 * r) / pxPerM;

const DATE_DIGIT_PITCH = DATE_CODE.digitPitch;

type Ink = { bg: string; ink: string; knurl: string; noise: number };

const drawWall = (g: CanvasRenderingContext2D, copy: SidewallCopy, ink: Ink) => {
  g.fillStyle = ink.bg;
  g.fillRect(0, 0, WALL_W, WALL_H);
  // Rubber speckle.
  if (ink.noise > 0) {
    for (let i = 0; i < 26000; i++) {
      const x = random(`wn-x-${i}`) * WALL_W;
      const y = random(`wn-y-${i}`) * WALL_H;
      g.globalAlpha = ink.noise * random(`wn-a-${i}`);
      g.fillStyle = ink.ink;
      g.fillRect(x, y, 2, 2);
    }
    g.globalAlpha = 1;
  }
  g.filter = "blur(1.4px)";
  // Concentric rings: rim guard near the bead, decor rings at the shoulder.
  g.strokeStyle = ink.ink;
  for (const [r, w] of [
    [0.2166, 0.0011],
    [0.2196, 0.0007],
    [0.2936, 0.0009],
    [0.2968, 0.0006],
  ] as const) {
    g.lineWidth = w * pxPerM;
    g.beginPath();
    g.moveTo(0, yOf(r));
    g.lineTo(WALL_W, yOf(r));
    g.stroke();
  }
  // Knurled band under the shoulder: fine radial ridges that catch light.
  g.strokeStyle = ink.knurl;
  g.lineWidth = 2.2;
  const knurlTop = yOf(0.2905);
  const knurlBottom = yOf(0.2815);
  for (let x = 0; x < WALL_W; x += 7) {
    g.beginPath();
    g.moveTo(x, knurlTop);
    g.lineTo(x + 3, knurlBottom);
    g.stroke();
  }
  g.fillStyle = ink.ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const row = (text: string, r: number, theta: number, em: number, weight = "bold", family = "Arial, Helvetica, sans-serif") => {
    g.save();
    g.translate(xOf(theta), yOf(r));
    g.scale(sxAt(r), 1);
    g.font = `${weight} ${em * pxPerM}px ${family}`;
    g.fillText(text, 0, 0);
    g.restore();
  };
  // Size: top of the wheel and again on the lower half.
  row(copy.size, 0.2665, Math.PI, 0.026, "900", "'Arial Black', Arial, sans-serif");
  row(copy.size, 0.2665, 0.35 * Math.PI, 0.026, "900", "'Arial Black', Arial, sans-serif");
  row(copy.construction[0] ?? "", 0.2665, Math.PI + 1.05, 0.02);
  row(copy.construction[1] ?? "", 0.2665, Math.PI - 1.05, 0.02);
  row(copy.construction[0] ?? "", 0.2665, 1.6 * Math.PI + 0.5, 0.02);
  row(copy.limits, DATE_CODE.radius, Math.PI + 0.62, 0.0105);
  // DOT line: prefix, then the four date digits in a raised oval.
  const em = 0.0158;
  const r = DATE_CODE.radius;
  const pitch = DATE_DIGIT_PITCH / r;
  // Prefix ends just before the oval.
  g.save();
  g.translate(xOf(DATE_CODE.theta - 3.15 * pitch), yOf(r));
  g.scale(sxAt(r), 1);
  g.font = `bold ${0.0128 * pxPerM}px Arial, Helvetica, sans-serif`;
  g.textAlign = "right";
  g.fillText(copy.dotPrefix, 0, 0);
  g.restore();
  [...copy.date].forEach((d, i) => row(d, r, DATE_CODE.theta + (i - 1.5) * pitch, em));
  // Oval around the digits.
  const ox = xOf(DATE_CODE.theta);
  const oy = yOf(r);
  const halfW = 2.55 * DATE_DIGIT_PITCH * pxPerM;
  const halfH = 0.0098 * pxPerM;
  g.save();
  g.translate(ox, oy);
  g.scale(sxAt(r), 1);
  g.strokeStyle = ink.ink;
  g.lineWidth = 0.0013 * pxPerM;
  g.beginPath();
  g.roundRect(-halfW, -halfH, halfW * 2, halfH * 2, halfH);
  g.stroke();
  g.restore();
  g.filter = "none";
};

const cache = new Map<string, { bump: CanvasTexture; rough: CanvasTexture }>();

export const sidewallMaps = (copy: SidewallCopy) => {
  const key = JSON.stringify(copy);
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  const [cb, gb] = canvas(WALL_W, WALL_H);
  drawWall(gb, copy, { bg: "#000000", ink: "#ffffff", knurl: "#9a9a9a", noise: 0.09 });
  const [cr, gr] = canvas(WALL_W, WALL_H);
  drawWall(gr, copy, { bg: "#dcdcdc", ink: "#8c8c8c", knurl: "#b4b4b4", noise: 0.25 });
  const maps = { bump: dataTexture(cb), rough: dataTexture(cr) };
  cache.set(key, maps);
  return maps;
};

// Crack overlay of the window around the date code. Each crack is a seeded
// polyline whose brightness encodes WHEN it appears (bright = early, and
// later along the crack = later), so one alphaTest threshold grows them.
const CRACK_W = 4096;
const CRACK_H = 1024;
let crackTex: CanvasTexture | null = null;

export const CRACK_LEVEL = { first: 1, last: 0.12 } as const;

export const crackMap = (): CanvasTexture => {
  if (crackTex) {
    return crackTex;
  }
  const [c, g] = canvas(CRACK_W, CRACK_H);
  g.fillStyle = "#000";
  g.fillRect(0, 0, CRACK_W, CRACK_H);
  const span = CRACKS.r1 - CRACKS.r0;
  const yAt = (r: number) => (1 - (r - CRACKS.r0) / span) * CRACK_H;
  const level = (o: number) => {
    const v = Math.round(255 * (CRACK_LEVEL.first - (CRACK_LEVEL.first - CRACK_LEVEL.last) * Math.min(1, o)));
    return `rgb(${v},${v},${v})`;
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  // Keep the date digits readable: no cracks across the code's oval.
  const codeX = ((DATE_CODE.theta - CRACKS.theta0) / (CRACKS.theta1 - CRACKS.theta0)) * CRACK_W;
  const codeHalfX = (0.12 / (CRACKS.theta1 - CRACKS.theta0)) * CRACK_W;
  const codeTop = yAt(DATE_CODE.radius + 0.0105);
  const codeBottom = yAt(DATE_CODE.radius - 0.0105);
  const excluded = (x: number, y: number) => Math.abs(x - codeX) < codeHalfX && y > codeTop && y < codeBottom;
  const crack = (seed: string, x0: number, y0: number, dir: number, len: number, order: number, width: number, depth: number) => {
    let x = x0;
    let y = y0;
    let a = dir;
    const steps = Math.round(len / 9);
    for (let s = 0; s < steps; s++) {
      a += (random(`${seed}-a-${s}`) - 0.5) * 0.55;
      a += (dir - a) * 0.25;
      const nx = x + Math.cos(a) * 9;
      const ny = y + Math.sin(a) * 9 * 0.8;
      if (excluded(nx, ny) || excluded(x, y)) {
        return;
      }
      g.strokeStyle = level(order + (s / steps) * 0.22);
      g.lineWidth = width * (1 - (0.6 * s) / steps);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(nx, ny);
      g.stroke();
      if (depth > 0 && random(`${seed}-b-${s}`) < 0.025) {
        crack(`${seed}-${s}`, nx, ny, a + (random(`${seed}-bd-${s}`) > 0.5 ? 1 : -1) * 0.9, len * 0.35, order + (s / steps) * 0.22 + 0.05, width * 0.7, depth - 1);
      }
      x = nx;
      y = ny;
    }
  };
  // Shoulder band: long circumferential cracks (classic dry rot).
  for (let i = 0; i < 260; i++) {
    const r = 0.262 + random(`cs-r-${i}`) * 0.035;
    crack(`cs-${i}`, random(`cs-x-${i}`) * CRACK_W, yAt(r), (random(`cs-d-${i}`) > 0.5 ? 0 : Math.PI) + (random(`cs-j-${i}`) - 0.5) * 0.25, 40 + random(`cs-l-${i}`) * 150, random(`cs-o-${i}`) * 0.7, 1.4 + random(`cs-w-${i}`) * 1.8, 1);
  }
  // Near the rim guard: short radial cracks.
  for (let i = 0; i < 70; i++) {
    const r = 0.2268 + random(`cr-r-${i}`) * 0.002;
    crack(`cr-${i}`, random(`cr-x-${i}`) * CRACK_W, yAt(r), -Math.PI / 2 + (random(`cr-j-${i}`) - 0.5) * 0.5, 30 + random(`cr-l-${i}`) * 60, 0.1 + random(`cr-o-${i}`) * 0.6, 2.6, 1);
  }
  // Fine crazing everywhere in between.
  for (let i = 0; i < 220; i++) {
    const r = CRACKS.r0 + 0.01 + random(`cf-r-${i}`) * (span - 0.02);
    crack(`cf-${i}`, random(`cf-x-${i}`) * CRACK_W, yAt(r), (random(`cf-d-${i}`) > 0.5 ? 0 : Math.PI) + (random(`cf-j-${i}`) - 0.5) * 0.6, 18 + random(`cf-l-${i}`) * 45, 0.25 + random(`cf-o-${i}`) * 0.55, 1.6, 0);
  }
  crackTex = dataTexture(c);
  return crackTex;
};

// Fine rubber grain for the tread blocks (tiles on every face).
let grainTex: CanvasTexture | null = null;
export const rubberGrain = (): CanvasTexture => {
  if (grainTex) {
    return grainTex;
  }
  const N = 512;
  const [c, g] = canvas(N, N);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, N, N);
  for (let i = 0; i < 9000; i++) {
    const v = Math.round(90 + random(`rg-v-${i}`) * 80);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(random(`rg-x-${i}`) * N, random(`rg-y-${i}`) * N, 2, 2);
  }
  grainTex = dataTexture(c, true);
  grainTex.repeat.set(3, 3);
  return grainTex;
};
