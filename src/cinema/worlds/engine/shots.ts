// Shot list and world state of EP04 "Bensin Boros? Cek Mesinnya" (see
// docs/ep04/PLAN.md, section 4). Every cut lands on a cue word.

import { interpolate } from "remotion";
import type { CamKey, Shot, Vec3 } from "../../rig";
import { cue, type CueMap } from "../../timeline";
import { ANCHORS, PART_ORDER, PARTS, type PartName } from "./layout";

export type EngineState = {
  dirt: Record<PartName, number>;
  // Flame size (0..1) and colour (0 = dirty orange, 1 = clean blue).
  flame: number;
  clean: number;
  gauge: number;
  lamp: boolean;
  litres: number;
  total: number;
  // Sweep light position along X, or null when off.
  sweepX: number | null;
  // Where the key light points.
  target: Vec3;
  // Red rim strength (0..1).
  rim: number;
};

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));

// A key looking at `at` from `offset`.
const near = (t: number, at: Vec3, offset: Vec3, extra: Partial<CamKey> = {}): CamKey => ({ t, pos: add(at, offset), look: at, ...extra });

const SWEEP = { from: PARTS.intake.x - 0.25, to: PARTS.catalyst.x + 0.25, width: 0.12 } as const;

export const buildEngineShots = (cues: CueMap): Shot[] => {
  const c = (n: string) => cue(cues, n);
  const A = ANCHORS;
  const macro = { dofRange: 0.03, bokeh: 4, handheld: 0.0008 };
  return [
    { name: "1 pump", from: 0, to: c("pumpCut"), fov: 32, keys: [near(0, A.pump, [0.05, 0.08, 1.35]), near(1, A.pump, [0.02, 0.06, 1.18])], dofRange: 0.3, bokeh: 3, handheld: 0.002 },
    { name: "2 gauge", from: c("pumpCut"), to: c("tension:start"), fov: 30, keys: [near(0, A.gauge, [0.035, 0.02, 0.2]), near(1, A.gauge, [0.012, 0.008, 0.15])], ...macro },
    {
      name: "3 lineup dark",
      from: c("tension:start"),
      to: c("diveIn"),
      fov: 30,
      // Diagonal down the row from the catalyst end: every part reads.
      keys: [
        { t: 0, pos: [-0.6, 0.46, 0.46], look: [0.6, 0.02, 0] },
        { t: 1, pos: [-0.48, 0.38, 0.38], look: [0.6, 0.03, 0] },
      ],
      dofRange: 0.8,
      bokeh: 2,
      handheld: 0.003,
    },
    {
      name: "4 low dolly",
      from: c("diveIn"),
      to: c("cause:start"),
      fov: 34,
      keys: [
        { t: 0, pos: [-0.32, 0.09, 0.36], look: [0.35, 0.07, 0] },
        { t: 1, pos: [0.25, 0.09, 0.34], look: [0.95, 0.07, 0] },
      ],
      dofRange: 0.3,
      bokeh: 3,
      handheld: 0.002,
      drift: 0.85,
    },
    { name: "5 intake", from: c("cause:start"), to: c("pThrottle"), fov: 30, keys: [near(0, A.intake, [0.16, 0.1, 0.42]), near(1, A.intake, [0.12, 0.08, 0.36])], ...macro },
    { name: "6 throttle", from: c("pThrottle"), to: c("pPlug"), fov: 30, keys: [near(0, A.throttle, [0.12, 0.06, 0.26]), near(1, A.throttle, [0.06, 0.05, 0.24])], ...macro },
    { name: "7 plug", from: c("pPlug"), to: c("pPiston"), fov: 28, keys: [near(0, A.plug, [0.1, 0.05, 0.1]), near(1, A.plug, [0.08, 0.04, 0.085])], ...macro, dofRange: 0.04, bokeh: 2 },
    { name: "8 piston", from: c("pPiston"), to: c("pCat"), fov: 30, keys: [near(0, A.piston, [0.04, 0.09, 0.24]), near(1, A.piston, [0.02, 0.07, 0.2])], ...macro },
    { name: "9 catalyst", from: c("pCat"), to: c("burn"), fov: 30, keys: [near(0, A.catalyst, [0.14, 0.08, 0.38]), near(1, A.catalyst, [0.1, 0.06, 0.32])], ...macro },
    { name: "10 dirty flame", from: c("burn"), to: c("solution:start"), fov: 30, keys: [near(0, A.flame, [0.05, 0.01, 0.3]), near(1, A.flame, [0.03, 0.006, 0.25])], ...macro },
    { name: "11 hero dark", from: c("solution:start"), to: c("sweep"), fov: 30, keys: [
        { t: 0, pos: [-0.45, 0.3, 0.85], look: [0.6, 0.07, 0] },
        { t: 1, pos: [-0.35, 0.25, 0.72], look: [0.6, 0.07, 0] },
      ], dofRange: 0.8, bokeh: 2, handheld: 0.002 },
    {
      name: "12 sweep track",
      from: c("sweep"),
      to: c("price"),
      fov: 32,
      keys: [
        { t: 0, pos: [SWEEP.from + 0.05, 0.16, 0.45], look: [SWEEP.from + 0.35, 0.06, 0] },
        { t: 1, pos: [SWEEP.to - 0.35, 0.16, 0.45], look: [SWEEP.to - 0.05, 0.06, 0] },
      ],
      dofRange: 0.4,
      bokeh: 2,
      handheld: 0.0015,
      drift: 0.9,
    },
    { name: "13 clean hero", from: c("price"), to: c("cta:start"), fov: 30, keys: [
        { t: 0, pos: [1.75, 0.42, 0.62], look: [0.5, 0.1, 0] },
        { t: 1, pos: [1.62, 0.38, 0.56], look: [0.5, 0.1, 0] },
      ], dofRange: 0.8, bokeh: 2 },
    { name: "14 clean flame", from: c("cta:start"), to: c("end"), fov: 30, keys: [near(0, A.flame, [0.06, 0.012, 0.34]), near(1, A.flame, [0.04, 0.008, 0.29])], ...macro },
  ];
};

export const engineStateAt = (cues: CueMap, frame: number, shots: readonly Shot[]): EngineState => {
  const c = (n: string) => cue(cues, n);
  const sweepShot = shots.find((s) => s.name.startsWith("12"));
  const sweepT = sweepShot ? clamp01((frame - sweepShot.from) / Math.max(1, sweepShot.to - sweepShot.from)) : 0;
  const sweeping = sweepShot !== undefined && frame >= sweepShot.from && frame < sweepShot.to;
  const done = sweepShot !== undefined && frame >= sweepShot.to;
  const sweepX = SWEEP.from + (SWEEP.to - SWEEP.from) * (0.1 + 0.9 * sweepT);
  const dirt = Object.fromEntries(
    PART_ORDER.map((p) => [p, done ? 0 : sweeping ? clamp01((PARTS[p].x - sweepX) / SWEEP.width + 0.5) : 1]),
  ) as Record<PartName, number>;
  const shot = shots.find((s) => frame >= s.from && frame < s.to) ?? shots[shots.length - 1];
  const gaugeShot = shots[1];
  const g = ease((frame - gaugeShot.from) / Math.max(1, gaugeShot.to - gaugeShot.from));
  const gauge = 0.92 - 0.86 * g;
  // The flame burns from "sempurna" on; the piston shot shows the crust.
  const flameOn = frame >= c("burn") ? 1 : 0;
  return {
    dirt,
    flame: flameOn,
    clean: 1 - dirt.piston,
    gauge,
    lamp: gauge < 0.3 && Math.floor(frame / 8) % 2 === 0,
    litres: frame * 0.137,
    total: frame * 0.137 * 10000,
    sweepX: sweeping ? sweepX : null,
    target: shot.focus ?? shot.keys[0].look,
    rim: interpolate(frame, [c("tension:start"), c("diveIn"), c("solution:start"), c("price")], [0.4, 1, 1, 0.5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
};
