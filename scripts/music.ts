// Synthesizes the original music of the cinema episodes: a tension bed that
// keeps building until the reveal, a riser that ends on the reveal, and a
// resolve for the call to action. Each episode is a preset (key, tempo,
// patterns, chords). Oscillators, Karplus-Strong plucks and seeded noise
// only: original work, identical on every run, no third-party material.
//
//   npm run music            every preset
//   npm run music -- ep04    one episode
//
// Writes public/audio/bgm/<id>-build.wav, <id>-riser.wav, <id>-resolve.wav.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC_DIR, rel, runMain } from "./lib/common";

const SR = 48000;
// Beat length of the preset being rendered (set in main).
let BEAT = 0.5;
const OUT_DIR = path.join(PUBLIC_DIR, "audio", "bgm");

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

class Track {
  L: Float32Array;
  R: Float32Array;
  sendL: Float32Array;
  sendR: Float32Array;
  constructor(public seconds: number) {
    const n = Math.ceil(seconds * SR);
    this.L = new Float32Array(n);
    this.R = new Float32Array(n);
    this.sendL = new Float32Array(n);
    this.sendR = new Float32Array(n);
  }
  add(t0: number, sig: Float32Array, gain: number, pan = 0, send = 0.2) {
    const start = Math.round(t0 * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < sig.length; i++) {
      const k = start + i;
      if (k < 0 || k >= this.L.length) continue;
      this.L[k] += sig[i] * gl;
      this.R[k] += sig[i] * gr;
      this.sendL[k] += sig[i] * gl * send;
      this.sendR[k] += sig[i] * gr * send;
    }
  }
  // Schroeder reverb on the send bus, mixed back in.
  reverb(wet: number) {
    const combs = [1557, 1617, 1491, 1422, 1277, 1356];
    const aps = [225, 556, 441];
    const proc = (x: Float32Array, spread: number) => {
      const y = new Float32Array(x.length);
      for (const d0 of combs) {
        const d = d0 + spread;
        const buf = new Float32Array(d);
        let idx = 0;
        let lp = 0;
        for (let i = 0; i < x.length; i++) {
          const out = buf[idx];
          lp = out * 0.7 + lp * 0.3;
          buf[idx] = x[i] + lp * 0.84;
          idx = (idx + 1) % d;
          y[i] += out / combs.length;
        }
      }
      for (const d of aps) {
        const buf = new Float32Array(d);
        let idx = 0;
        for (let i = 0; i < y.length; i++) {
          const b = buf[idx];
          const v = y[i] + b * 0.5;
          buf[idx] = v;
          y[i] = b - v * 0.5;
          idx = (idx + 1) % d;
        }
      }
      return y;
    };
    const wl = proc(this.sendL, 0);
    const wr = proc(this.sendR, 23);
    for (let i = 0; i < this.L.length; i++) {
      this.L[i] += wl[i] * wet;
      this.R[i] += wr[i] * wet;
    }
  }
  // Peak-normalize, soft-clip, write 16-bit stereo WAV.
  write(file: string, peak = 0.89, fadeOut = 0) {
    let max = 0;
    for (let i = 0; i < this.L.length; i++) max = Math.max(max, Math.abs(this.L[i]), Math.abs(this.R[i]));
    const g = max > 0 ? peak / max : 1;
    const n = this.L.length;
    const fadeN = Math.round(fadeOut * SR);
    const buf = Buffer.alloc(44 + n * 4);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(36 + n * 4, 4);
    buf.write("WAVE", 8);
    buf.write("fmt ", 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(2, 22);
    buf.writeUInt32LE(SR, 24);
    buf.writeUInt32LE(SR * 4, 28);
    buf.writeUInt16LE(4, 32);
    buf.writeUInt16LE(16, 34);
    buf.write("data", 36);
    buf.writeUInt32LE(n * 4, 40);
    for (let i = 0; i < n; i++) {
      const f = fadeN > 0 && i > n - fadeN ? (n - i) / fadeN : 1;
      const l = Math.tanh(this.L[i] * g * 1.05) * f;
      const r = Math.tanh(this.R[i] * g * 1.05) * f;
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, l)) * 32767), 44 + i * 4);
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, r)) * 32767), 46 + i * 4);
    }
    writeFileSync(file, buf);
    console.log(`wrote ${rel(file)}`);
  }
}

// ---------------------------------------------------------------- voices
// Sub pulse with a pitch drop and soft drive.
const sub = (f: number, dur: number) => {
  const n = Math.round(dur * SR);
  const s = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (f * (1 + 1.2 * Math.exp(-t * 30)))) / SR;
    s[i] = Math.tanh(1.6 * Math.sin(ph)) * Math.min(1, t / 0.003) * Math.exp(-t * 5);
  }
  return s;
};

const click = (f: number, rnd: () => number) => {
  const n = Math.round(0.06 * SR);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    s[i] = (0.8 * Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 1.6 * t) + 0.15 * (rnd() * 2 - 1)) * Math.exp(-t * 110);
  }
  return s;
};

const hat = (rnd: () => number, dur = 0.05) => {
  const n = Math.round(dur * SR);
  const s = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    const hp = w - prev;
    prev = w;
    s[i] = hp * Math.exp(-(i / SR) * 70);
  }
  return s;
};

const pluck = (f: number, dur: number, rnd: () => number, bright = 0.45) => {
  const n = Math.round(dur * SR);
  const p = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(p);
  for (let i = 0; i < p; i++) buf[i] = rnd() * 2 - 1;
  const s = new Float32Array(n);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const a = buf[idx];
    const b = buf[(idx + 1) % p];
    buf[idx] = (bright * a + (1 - bright) * b) * 0.996;
    s[i] = a;
    idx = (idx + 1) % p;
  }
  return s;
};

// Detuned saw pad through a one-pole low-pass whose cutoff follows `cut(t)`.
const pad = (notes: number[], dur: number, cut: (t: number) => number, attack: number, release: number) => {
  const n = Math.round(dur * SR);
  const s = new Float32Array(n);
  const phases = notes.flatMap(() => [0, 0.33, 0.66]);
  let lp1 = 0;
  let lp2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    notes.forEach((m, k) => {
      [-0.11, 0, 0.12].forEach((det, j) => {
        const idx = k * 3 + j;
        phases[idx] = (phases[idx] + midi(m + det) / SR) % 1;
        v += (phases[idx] * 2 - 1) / (notes.length * 3);
      });
    });
    const a = 1 - Math.exp((-2 * Math.PI * cut(t)) / SR);
    lp1 += a * (v - lp1);
    lp2 += a * (lp1 - lp2);
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    s[i] = lp2 * Math.max(0, env);
  }
  return s;
};

const noiseSweep = (dur: number, rnd: () => number) => {
  const n = Math.round(dur * SR);
  const s = new Float32Array(n);
  let lp = 0;
  let prev = 0;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const k = t / dur;
    const w = rnd() * 2 - 1;
    const cutoff = 400 + 7000 * k * k;
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
    lp += a * (w - lp);
    const hp = lp - prev;
    prev = lp;
    ph += (2 * Math.PI * (180 + 900 * k * k)) / SR;
    s[i] = (hp * 1.6 + 0.25 * Math.sin(ph)) * k ** 2.2;
  }
  return s;
};

// ---------------------------------------------------------------- pieces
const BUILD_BASE_SECONDS = 34;

type Preset = {
  id: string;
  bpm: number;
  seed: number;
  // MIDI notes.
  bass: number;
  ostinato: number[];
  padA: number[];
  padB: number[];
  stinger: number[];
  resolveA: number[];
  resolveB: number[];
  arp: number[];
  // Clock click pitches (tick, tock) of the build.
  clicks: [number, number];
  // Length of the resolve; longer than the base 11 s repeats its progression.
  resolveSeconds?: number;
  // Length of the build bed (default 34 s); longer beds plateau after 22 s.
  buildSeconds?: number;
};

// EP03 "Ban Tebal Belum Tentu Aman": dark clock bed in A minor, 120 BPM,
// warm F to C resolve.
// EP04 "Bensin Boros? Cek Mesinnya": pump-counter groove in D minor,
// 112 BPM, bright Bb to F resolve for the Tune Up Express payoff.
const PRESETS: Preset[] = [
  {
    id: "ep03",
    bpm: 120,
    seed: 303,
    bass: 33,
    ostinato: [57, 60, 64, 65, 64, 60, 57, 52],
    padA: [45, 52, 60, 64],
    padB: [41, 53, 57, 60, 64],
    stinger: [33, 45, 52, 57, 60],
    resolveA: [41, 53, 55, 57, 60],
    resolveB: [36, 48, 55, 60, 64],
    arp: [65, 69, 72, 76, 72, 69, 64, 67, 72, 76, 79, 76],
    clicks: [2350, 1550],
  },
  {
    id: "ep04",
    bpm: 112,
    seed: 404,
    bass: 38,
    ostinato: [62, 65, 69, 62, 70, 69, 65, 64],
    padA: [50, 57, 65, 69],
    padB: [46, 58, 62, 65, 69],
    stinger: [38, 50, 57, 62, 65],
    resolveA: [46, 58, 60, 62, 65],
    resolveB: [41, 53, 60, 65, 69],
    arp: [70, 74, 77, 81, 77, 74, 69, 72, 77, 81, 84, 81],
    clicks: [2800, 2100],
  },
  // EP05 v2 "Masuk Sehat, Keluar Rusak": uneasy E minor bed for the rogue
  // shop (100 BPM), then a bright G major lift the moment the Doktermobil
  // wipe lands, long enough to carry the whole second act and the CTA.
  {
    id: "ep05",
    bpm: 100,
    seed: 515,
    bass: 40,
    ostinato: [64, 67, 71, 72, 71, 67, 64, 59],
    padA: [52, 59, 67, 71],
    padB: [48, 60, 64, 67, 71],
    stinger: [43, 55, 62, 67, 71],
    resolveA: [43, 55, 59, 62, 67],
    resolveB: [48, 60, 64, 67, 72],
    arp: [67, 71, 74, 79, 74, 71, 66, 69, 74, 78, 81, 78],
    clicks: [2600, 1800],
    resolveSeconds: 28,
  },
  {
    id: "ep06",
    bpm: 110,
    seed: 606,
    bass: 38,
    ostinato: [69, 72, 76, 72, 67, 71, 74, 71],
    padA: [50, 57, 62, 65],
    padB: [45, 57, 60, 64, 67],
    stinger: [38, 50, 57, 62, 65],
    resolveA: [45, 57, 60, 64, 67],
    resolveB: [41, 53, 57, 62, 65],
    arp: [69, 72, 76, 81, 76, 72, 69, 71, 74, 79, 83, 79],
    clicks: [3000, 2200],
  },
  // EP07 "Rem Bisa Hilang di Turunan": heavy D minor bed for the brake fade,
  // 108 BPM, dark Bb to F resolve once the rotor goes cold again.
  {
    id: "ep07",
    bpm: 108,
    seed: 707,
    bass: 38,
    ostinato: [62, 65, 69, 65, 62, 60, 57, 62],
    padA: [50, 57, 62, 65],
    padB: [46, 53, 58, 62, 65],
    stinger: [38, 50, 57, 62, 65],
    resolveA: [46, 53, 58, 62, 65],
    resolveB: [41, 53, 57, 60, 64],
    arp: [69, 72, 77, 81, 77, 72, 67, 70, 74, 77, 81, 77],
    clicks: [2200, 1500],
  },
  // EP10 "Kejadian 2 Jaecoo J5 EV" (16:9, no voice over): the music carries
  // the video, so a longer, quieter C minor bed (96 BPM) under the incident
  // and the statement, a riser into the lesson and a warm Ab to Eb resolve.
  {
    id: "ep10",
    bpm: 96,
    seed: 1010,
    bass: 36,
    ostinato: [60, 63, 67, 68, 67, 63, 60, 55],
    padA: [48, 55, 63, 67],
    padB: [44, 56, 60, 63, 67],
    stinger: [36, 48, 55, 60, 63],
    resolveA: [44, 56, 60, 63, 67],
    resolveB: [39, 51, 58, 63, 67],
    arp: [67, 70, 75, 79, 75, 70, 65, 68, 72, 77, 80, 77],
    clicks: [2100, 1450],
    buildSeconds: 43,
    resolveSeconds: 10,
  },
];

const build = (P: Preset) => {
  const BUILD_SECONDS = P.buildSeconds ?? BUILD_BASE_SECONDS;
  const tr = new Track(BUILD_SECONDS);
  const rnd = mulberry(P.seed);
  const beats = Math.floor(BUILD_SECONDS / BEAT);
  // Intensity rises over the whole bed.
  const level = (t: number) => 0.45 + 0.55 * Math.min(1, t / 22);
  for (let b = 0; b < beats; b++) {
    const t = b * BEAT;
    const lv = level(t);
    // Clock: tick on the beat, tock on the off-beat.
    tr.add(t, click(P.clicks[0], rnd), 0.16 * lv, 0.35, 0.25);
    tr.add(t + BEAT / 2, click(P.clicks[1], rnd), 0.11 * lv, -0.35, 0.25);
    // Sub pulse on every beat, doubled near the end.
    tr.add(t, sub(midi(P.bass), 0.45), 0.55 * lv, 0, 0.05);
    if (t > 16) tr.add(t + BEAT / 2, sub(midi(P.bass), 0.3), 0.3 * lv, 0, 0.05);
    // Hats from 8 s, 16ths from 14 s.
    if (t >= 8) {
      const steps = t >= 14 ? 4 : 2;
      for (let k = 0; k < steps; k++) {
        tr.add(t + (k * BEAT) / steps, hat(rnd), (k % 2 ? 0.05 : 0.08) * lv, k % 2 ? -0.5 : 0.5, 0.15);
      }
    }
  }
  // Ostinato pluck from 4 s (A minor with a b6 lean), eighths.
  const ost = P.ostinato;
  for (let i = 0; i * (BEAT / 2) < BUILD_SECONDS; i++) {
    const t = i * (BEAT / 2);
    if (t < 4) continue;
    const m = ost[i % ost.length] + (t >= 16 ? 12 : 0);
    tr.add(t, pluck(midi(m), 0.6, rnd, 0.42), 0.13 * level(t), (i % 2 ? 0.3 : -0.3), 0.3);
  }
  // Pad: Am, then Am with F underneath (tension), opening slowly.
  const cut = (t: number) => 260 + 2400 * Math.min(1, t / 26) ** 1.5;
  tr.add(0, pad(P.padA, 16, cut, 3, 1.5), 0.55, 0, 0.4);
  tr.add(15, pad(P.padB, BUILD_SECONDS - 15, (t) => cut(t + 15), 1.5, 0.5), 0.6, 0, 0.4);
  tr.reverb(0.35);
  tr.write(path.join(OUT_DIR, `${P.id}-build.wav`));
};

const RISER_SECONDS = 3;
const riser = (P: Preset) => {
  const tr = new Track(RISER_SECONDS);
  // EP03 kept its original riser seed so its file stays identical.
  const rnd = mulberry(P.id === "ep03" ? 404 : P.seed + 101);
  tr.add(0, noiseSweep(RISER_SECONDS, rnd), 1, 0, 0.3);
  // Accelerating ticks into the reveal.
  let t = 0;
  let gap = 0.25;
  while (t < RISER_SECONDS - 0.05) {
    tr.add(t, click(2600, rnd), 0.35 * (t / RISER_SECONDS + 0.2), t % 0.5 < 0.25 ? 0.3 : -0.3, 0.2);
    t += gap;
    gap = Math.max(0.045, gap * 0.86);
  }
  tr.reverb(0.25);
  tr.write(path.join(OUT_DIR, `${P.id}-riser.wav`));
};

const RESOLVE_SECONDS = 11;
const resolve = (P: Preset) => {
  const seconds = P.resolveSeconds ?? RESOLVE_SECONDS;
  const tr = new Track(seconds);
  const rnd = mulberry(P.id === "ep03" ? 505 : P.seed + 202);
  // Stinger on the reveal: low A minor hit that rings out.
  tr.add(0, pad(P.stinger, 2.6, (t) => 2400 * Math.exp(-t * 1.6) + 200, 0.005, 1.8), 1, 0, 0.5);
  tr.add(0, sub(midi(P.bass), 1.6), 0.8, 0, 0.1);
  // Resolve: F (add9) to C, warm and open, under the call to action.
  tr.add(1.2, pad(P.resolveA, 4.4, () => 1400, 1.2, 1.2), 0.5, 0, 0.5);
  tr.add(5.2, pad(P.resolveB, 5.8, () => 1500, 1, 2.6), 0.5, 0, 0.5);
  const arp = P.arp;
  arp.forEach((m, i) => {
    const t = 1.4 + i * BEAT * 0.75;
    tr.add(t, pluck(midi(m), 1.4, rnd, 0.5), 0.12, i % 2 ? 0.35 : -0.35, 0.45);
  });
  // The clock comes back, slower and calm.
  for (let b = 0; b < 8; b++) {
    tr.add(1.2 + b * BEAT * 2, click(1900, rnd), 0.06, 0.3, 0.4);
  }
  // Longer resolves run the progression again from 9.6 s.
  for (let start = 9.6; start + 4 < seconds; start += 8.4) {
    tr.add(start, pad(P.resolveA, 4.4, () => 1400, 1.2, 1.2), 0.45, 0, 0.5);
    tr.add(start + 4, pad(P.resolveB, Math.min(5.8, seconds - start - 4), () => 1500, 1, 2.2), 0.45, 0, 0.5);
    arp.forEach((m, i) => {
      const t = start + 0.2 + i * BEAT * 0.75;
      if (t < seconds - 1) tr.add(t, pluck(midi(m), 1.4, rnd, 0.5), 0.11, i % 2 ? 0.35 : -0.35, 0.45);
    });
  }
  tr.reverb(0.45);
  tr.write(path.join(OUT_DIR, `${P.id}-resolve.wav`), 0.89, 1.5);
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const only = process.argv[2];
  const chosen = PRESETS.filter((p) => !only || p.id === only);
  if (chosen.length === 0) {
    throw new Error(`No music preset "${only}" (have: ${PRESETS.map((p) => p.id).join(", ")})`);
  }
  for (const P of chosen) {
    BEAT = 60 / P.bpm;
    build(P);
    riser(P);
    resolve(P);
  }
};

runMain(main);
