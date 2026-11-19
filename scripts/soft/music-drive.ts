// Synthesizes the temporary music bed of the "kantor" (office) theme: a
// light, modern, optimistic loop in C major at 100 BPM. Electric piano
// chords (I-vi-IV-V), soft kick and clap, closed hats, round bass and a
// pluck melody, all from oscillators and seeded noise: original work,
// identical on every run, no third-party material. 90 s, so it covers the
// longest video.
//
//   npx tsx scripts/music-office.ts

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 48000;
const BPM = 100;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const SECONDS = 90;
const OUT = path.resolve(import.meta.dirname, "..", "..", "public", "audio", "bgm", "soft-drive.wav");

const N = Math.ceil(SECONDS * SR) + SR * 2;
const L = new Float32Array(N);
const R = new Float32Array(N);
const sendL = new Float32Array(N);
const sendR = new Float32Array(N);

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry(2026);

const add = (t0: number, sig: Float32Array, gain: number, pan = 0, send = 0.15) => {
  const start = Math.round(t0 * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < sig.length && start + i < N; i++) {
    if (start + i < 0) continue;
    L[start + i] += sig[i] * gl;
    R[start + i] += sig[i] * gr;
    sendL[start + i] += sig[i] * gl * send;
    sendR[start + i] += sig[i] * gr * send;
  }
};
const midi = (m: number) => 440 * 2 ** ((m - 69) / 12);

// Electric piano: sine + soft bell partial, gentle tremolo, decaying.
const epiano = (f: number, dur: number) => {
  const n = Math.round((dur + 0.6) * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.008) * Math.exp(-t * 1.6) * (t > dur ? Math.exp(-(t - dur) * 8) : 1);
    const trem = 1 + 0.12 * Math.sin(2 * Math.PI * 5 * t);
    out[i] = env * trem * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 4) + 0.08 * Math.sin(2 * Math.PI * f * 7.1 * t) * Math.exp(-t * 9));
  }
  return out;
};
const pluck = (f: number, dur: number) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  const p = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(p);
  for (let i = 0; i < p; i++) buf[i] = rnd() * 2 - 1;
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const a = buf[idx];
    const b = buf[(idx + 1) % p];
    buf[idx] = 0.996 * 0.5 * (a + b);
    out[i] = a * (i < 40 ? i / 40 : 1);
    idx = (idx + 1) % p;
  }
  return out;
};
const kick = () => {
  const n = Math.round(0.4 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (48 + 110 * Math.exp(-t * 35))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 9);
  }
  return out;
};
const clap = () => {
  const n = Math.round(0.25 * SR);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const w = rnd() * 2 - 1;
    const bp = w - prev * 0.6;
    prev = w;
    const bursts = (t < 0.012 ? 1 : 0) + (t > 0.014 && t < 0.024 ? 0.8 : 0) + (t > 0.026 ? Math.exp(-(t - 0.026) * 22) : 0);
    out[i] = bp * bursts * 0.7;
  }
  return out;
};
const hat = (open = false) => {
  const n = Math.round((open ? 0.22 : 0.06) * SR);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const w = rnd() * 2 - 1;
    out[i] = (w - prev) * Math.exp(-t * (open ? 14 : 60));
    prev = w;
  }
  return out;
};
const bass = (f: number, dur: number) => {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(4 * Math.PI * f * t)) * Math.min(1, t / 0.01) * Math.exp(-t * 1.4) * Math.min(1, (dur - t) / 0.05);
  }
  return out;
};

// I - vi - IV - V in C: chord tones (MIDI) and bass roots.
const CHORDS = [
  [60, 64, 67, 71],
  [57, 60, 64, 67],
  [53, 57, 60, 64],
  [55, 59, 62, 65],
];
const ROOTS = [36, 33, 29, 31];
const MELODY = [72, 76, 79, 76, 74, 72, 69, 67];

const compose = () => {
  const bars = Math.ceil(SECONDS / BAR);
  for (let b = 0; b < bars; b++) {
    const t0 = b * BAR;
    const c = b % 4;
    const section = b < 2 ? 0 : b < 10 ? 1 : b < 30 ? 2 : 3; // intro, verse, chorus, outro
    if (t0 > SECONDS - 0.5) break;
    // Piano: chord on 1, a softer stab on the "and" of 3.
    for (const m of CHORDS[c]) {
      add(t0, epiano(midi(m), BEAT * 2), 0.11, -0.15, 0.35);
      if (section > 0) add(t0 + BEAT * 2.5, epiano(midi(m), BEAT), 0.06, -0.15, 0.35);
    }
    if (section === 0) continue;
    add(t0, bass(midi(ROOTS[c]), BEAT * 1.6), 0.5, 0, 0.03);
    add(t0 + BEAT * 2, bass(midi(ROOTS[c]), BEAT * 1.4), 0.42, 0, 0.03);
    for (let q = 0; q < 4; q++) {
      const t = t0 + q * BEAT;
      if (q === 0 || q === 2) add(t, kick(), 0.75, 0, 0.02);
      if ((q === 1 || q === 3) && section >= 1) add(t, clap(), 0.2, 0.05, 0.2);
      add(t, hat(), 0.045, 0.3, 0.05);
      add(t + BEAT / 2, hat(q === 3 && section === 2), 0.035, 0.3, 0.05);
    }
    // Pluck melody in the chorus (8ths, gentle variation per bar).
    if (section === 2) {
      for (let e = 0; e < 8; e++) {
        if ((b + e) % 3 === 2) continue;
        const m = MELODY[(e + c * 2) % MELODY.length] + (c === 1 ? -3 : 0);
        add(t0 + e * (BEAT / 2), pluck(midi(m), 0.5), 0.16, 0.35, 0.25);
      }
    }
  }
  // Ending: a held chord.
  const end = SECONDS - 3;
  for (const m of CHORDS[0]) add(end, epiano(midi(m), 2.5), 0.12, 0, 0.5);
};

const reverb = (input: Float32Array, offset: number) => {
  const out = new Float32Array(input.length);
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ buf: new Float32Array(d + offset), i: 0 }));
  for (let n = 0; n < input.length; n++) {
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = input[n] + y * 0.8;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    out[n] = s * 0.25;
  }
  for (const d of [225, 556]) {
    const buf = new Float32Array(d + offset);
    let i = 0;
    for (let n = 0; n < out.length; n++) {
      const y = buf[i];
      const x = out[n];
      buf[i] = x + y * 0.5;
      out[n] = y - x * 0.5;
      i = (i + 1) % buf.length;
    }
  }
  return out;
};

// RMS level then look-ahead limiter (same mastering as the festive bed).
const RMS_TARGET = 0.15;
const CEILING = 0.6;
const LOOKAHEAD = Math.round(0.005 * SR);
const RELEASE = Math.exp(-1 / (0.09 * SR));
const limit = (left: Float32Array, right: Float32Array, length: number) => {
  const need = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const p = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    need[i] = p > CEILING ? CEILING / p : 1;
  }
  const ahead = new Float32Array(length);
  const q: number[] = [];
  for (let i = length - 1; i >= 0; i--) {
    while (q.length && need[q[q.length - 1]] >= need[i]) q.pop();
    q.push(i);
    while (q[0] > i + LOOKAHEAD) q.shift();
    ahead[i] = need[q[0]];
  }
  let gain = 1;
  for (let i = 0; i < length; i++) {
    const target = ahead[i];
    gain = target < gain ? gain + (target - gain) * (4 / LOOKAHEAD) : target + (gain - target) * RELEASE;
    gain = Math.min(gain, 1);
    left[i] = Math.max(-CEILING, Math.min(CEILING, left[i] * gain));
    right[i] = Math.max(-CEILING, Math.min(CEILING, right[i] * gain));
  }
};

const writeWav = (file: string, left: Float32Array, right: Float32Array, length: number) => {
  const data = Buffer.alloc(length * 4);
  for (let i = 0; i < length; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
};

compose();
const wl = reverb(sendL, 0);
const wr = reverb(sendR, 23);
const length = Math.round(SECONDS * SR);
let sq = 0;
for (let i = 0; i < length; i++) {
  L[i] = Math.tanh((L[i] + wl[i]) * 0.9);
  R[i] = Math.tanh((R[i] + wr[i]) * 0.9);
  sq += L[i] * L[i] + R[i] * R[i];
}
const g = RMS_TARGET / Math.sqrt(sq / (2 * length));
for (let i = 0; i < length; i++) {
  L[i] *= g;
  R[i] *= g;
}
limit(L, R, length);
mkdirSync(path.dirname(OUT), { recursive: true });
writeWav(OUT, L, R, length);
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${SECONDS} s, ${BPM} BPM)`);
