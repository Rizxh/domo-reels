// Shot list and world state of EP03 "Ban Tebal Belum Tentu Aman". Every
// cut lands on a cue word from the episode (see docs/ep03/PLAN.md, section
// 4). World units are metres; the wheel stands at the origin with its
// lettered sidewall facing +X and its front toward +Z.

import { interpolate } from "remotion";
import { projectToScreen, type CamKey, type Shot, type Vec3 } from "../../rig";
import { cue, type CueMap } from "../../timeline";
import { DATE_CODE, TIRE, wallA, wheelAnchor, wheelPointToWorld, type WheelPose } from "./geometry";

export type TireSet = "studio" | "timelapse" | "road";

export type TireState = {
  set: TireSet;
  pose: WheelPose;
  age: number;
  cracks: number;
  // 0..1 progress of the sun across the sky (time lapse set).
  sun: number;
  // Metres the road has travelled under the wheel (road set).
  road: number;
  // Red rim light strength (0..1): rises for the "11 TAHUN" reveal.
  rim: number;
  // Grazing back light over the tread (macro canyon shots), 0..1.
  graze: number;
  // Raking light along the lettered sidewall, 0..1.
  wall: number;
  // Studio key light, 0..1.
  key: number;
};

const R = TIRE.outerRadius;
const REST: WheelPose = { spin: 0, yaw: 0, z: 0 };

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const inRange = (f: number, a: number, b: number) => f >= a && f < b;
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));

// Point on the lettered sidewall at rest pose.
const wallPoint = (r: number, theta: number, lift = 0.002): Vec3 => wheelPointToWorld(r, theta, wallA(r) + lift, REST);

// Camera roll (degrees) that levels the arc of text around `theta` on screen.
const levelRoll = (pos: Vec3, look: Vec3, fov: number, r: number, theta: number): number => {
  const a = wallPoint(r, theta - 0.02);
  const b = wallPoint(r, theta + 0.02);
  const angleFor = (roll: number) => {
    const s = { pos, look, fov, roll, focus: look };
    const pa = projectToScreen(s, a, 1080, 1920);
    const pb = projectToScreen(s, b, 1080, 1920);
    return pa && pb ? Math.atan2(pb.y - pa.y, pb.x - pa.x) : 0;
  };
  const alpha = (angleFor(0) * 180) / Math.PI;
  // Pick the sign that actually levels the text (and reads left to right).
  return [alpha, -alpha]
    .map((roll) => ({ roll, err: Math.abs(angleFor(roll)) }))
    .sort((p, q) => p.err - q.err)[0].roll;
};

// A camera key looking at a sidewall point from `dist` along the outward
// normal (+X), nudged by `offset`, rolled so the text reads level.
const wallKey = (t: number, r: number, theta: number, dist: number, fov: number, offset: Vec3 = [0, 0, 0]): CamKey => {
  const look = wallPoint(r, theta);
  const pos = add(add(look, [dist, 0, 0]), offset);
  return { t, pos, look, fov, roll: levelRoll(pos, look, fov, r, theta) };
};

export const buildTireShots = (cues: CueMap): Shot[] => {
  const c = (name: string) => cue(cues, name);
  const code = DATE_CODE;
  const pitch = code.digitPitch / code.radius;
  const crackR = 0.282;
  const crackTh = code.theta + 0.32;
  return [
    {
      name: "1 tread canyon",
      from: 0,
      to: c("hookReveal"),
      fov: 36,
      keys: [
        { t: 0, pos: [0.2, 0.42, 0.5], look: [0.0, 0.47, 0.25] },
        { t: 1, pos: [0.17, 0.43, 0.45], look: [0.0, 0.475, 0.24] },
      ],
      focus: [0.0, 0.47, 0.25],
      dofRange: 0.05,
      bokeh: 5,
      handheld: 0.0008,
    },
    {
      name: "2 crane reveal",
      from: c("hookReveal"),
      to: c("clue:start"),
      fov: 30,
      keys: [
        { t: 0, pos: [0.42, 0.78, 0.5], look: [0.04, 0.42, 0.02] },
        { t: 1, pos: [1.05, 0.62, 1.12], look: [0.03, 0.27, 0] },
      ],
      dofRange: 0.6,
      bokeh: 2,
      handheld: 0.004,
      drift: 0.3,
    },
    {
      name: "3 sidewall dolly",
      from: c("clue:start"),
      to: c("fourDigits"),
      fov: 32,
      keys: [
        { t: 0, pos: [0.25, 0.66, 0.24], look: [0.1, 0.57, 0.07] },
        { t: 1, pos: [0.24, 0.62, 0.3], look: [0.1, 0.53, 0.12] },
      ],
      dofRange: 0.05,
      bokeh: 4,
      handheld: 0.0015,
    },
    {
      name: "4 date code, out of focus",
      from: c("fourDigits"),
      to: c("aging:start"),
      fov: 28,
      keys: [wallKey(0, code.radius, code.theta, 0.2, 28, [0, 0.02, 0.04]), wallKey(1, code.radius, code.theta, 0.15, 28, [0, 0.012, 0.025])],
      // Focus 3 cm in front of the digits: the answer stays unreadable.
      focus: add(wallPoint(code.radius, code.theta), [0.07, 0.01, 0.02]),
      dofRange: 0.006,
      bokeh: 10,
      handheld: 0.001,
    },
    {
      name: "5 time lapse",
      from: c("aging:start"),
      to: c("hard"),
      fov: 30,
      keys: [
        { t: 0, pos: [1.15, 0.2, -0.75], look: [0.02, 0.3, 0.02] },
        { t: 1, pos: [0.95, 0.24, -0.58], look: [0.02, 0.32, 0.02] },
      ],
      dofRange: 0.7,
      bokeh: 2,
    },
    {
      name: "6 cracks macro",
      from: c("hard"),
      to: c("grip"),
      fov: 30,
      keys: [wallKey(0, crackR, crackTh - 0.05, 0.1, 30, [0, 0.01, 0.03]), wallKey(1, crackR, crackTh + 0.05, 0.085, 30, [0, 0.006, 0.02])],
      dofRange: 0.015,
      bokeh: 5,
      handheld: 0.0008,
    },
    {
      name: "7 wet road",
      from: c("grip"),
      to: c("decode:start"),
      keys: [
        { t: 0, pos: [0.46, 0.04, 0.62], look: [0.0, 0.16, 0.02] },
        { t: 1, pos: [0.4, 0.035, 0.52], look: [0.0, 0.17, 0.0] },
      ],
      fov: 40,
      dofRange: 0.5,
      bokeh: 3,
      handheld: 0.006,
    },
    {
      name: "8 week digits",
      from: c("decode:start"),
      to: c("decodeYear"),
      fov: 26,
      keys: [wallKey(0, code.radius, code.theta - pitch * 0.8, 0.2, 26), wallKey(1, code.radius, code.theta - pitch * 0.5, 0.18, 26)],
      dofRange: 0.02,
      bokeh: 4,
      handheld: 0.0006,
    },
    {
      name: "9 year digits",
      from: c("decodeYear"),
      to: c("made"),
      fov: 26,
      keys: [wallKey(0, code.radius, code.theta + pitch * 0.4, 0.18, 26), wallKey(1, code.radius, code.theta + pitch * 0.7, 0.17, 26)],
      dofRange: 0.02,
      bokeh: 4,
      handheld: 0.0006,
    },
    {
      name: "10 pull back",
      from: c("made"),
      to: c("age"),
      fov: 28,
      keys: [wallKey(0, code.radius, code.theta, 0.17, 28), wallKey(1, code.radius, code.theta - 0.08, 0.32, 28, [0, -0.03, 0])],
      dofRange: 0.06,
      bokeh: 3,
    },
    {
      name: "11 hero, eleven years",
      from: c("age"),
      to: c("cta:start"),
      fov: 32,
      keys: [
        { t: 0, pos: [0.66, 0.16, 0.5], look: [0.05, 0.36, 0.02] },
        { t: 1, pos: [0.78, 0.13, 0.6], look: [0.05, 0.36, 0.02] },
      ],
      dofRange: 0.6,
      bokeh: 2,
      handheld: 0.003,
    },
    {
      name: "12 turntable",
      from: c("cta:start"),
      to: c("ctaMacro"),
      fov: 28,
      keys: [
        { t: 0, pos: [1.25, 0.5, 0.95], look: [0, 0.26, 0] },
        { t: 1, pos: [1.12, 0.45, 0.85], look: [0, 0.27, 0] },
      ],
      dofRange: 0.8,
      bokeh: 2,
    },
    {
      name: "13 tread canyon, loop",
      from: c("ctaMacro"),
      to: c("end"),
      fov: 36,
      keys: [
        { t: 0, pos: [0.23, 0.41, 0.56], look: [0.0, 0.465, 0.26] },
        { t: 1, pos: [0.2, 0.42, 0.5], look: [0.0, 0.47, 0.25] },
      ],
      focus: [0.0, 0.47, 0.25],
      dofRange: 0.05,
      bokeh: 5,
      handheld: 0.0008,
    },
  ];
};

// World state at a frame (the shot list decides the set).
export const tireStateAt = (cues: CueMap, frame: number): TireState => {
  const c = (name: string) => cue(cues, name);
  const agingStart = c("aging:start");
  const decodeStart = c("decode:start");
  // Spin: the wheel turns slowly through the hook, settles to rest during
  // the sidewall dolly so the date code lands where shot 4 expects it.
  const hookSpin = (f: number) => 0.0045 * (f - c("clue:start"));
  let spin = 0;
  if (frame < c("clue:start")) {
    spin = hookSpin(frame);
  } else if (frame < c("fourDigits")) {
    const k = (frame - c("clue:start")) / Math.max(1, c("fourDigits") - c("clue:start"));
    spin = -0.12 * (1 - ease(k));
  }
  let set: TireSet = "studio";
  if (frame >= agingStart && frame < c("hard")) {
    set = "timelapse";
  } else if (frame >= c("grip") && frame < decodeStart) {
    set = "road";
  }
  // Road: the wheel rolls (slow motion) and slips a touch.
  const roadFrames = Math.max(0, frame - c("grip"));
  const roll = 0.034;
  if (set === "road") {
    spin = roll * roadFrames;
  }
  const slip = set === "road" ? 0.06 * Math.sin(roadFrames / 7) * clamp01(roadFrames / 20) : 0;
  // Turntable during the CTA.
  const yaw = frame >= c("cta:start") && frame < c("ctaMacro") ? -0.5 + 0.006 * (frame - c("cta:start")) : slip;
  if (frame >= c("ctaMacro")) {
    spin = 0.0045 * (frame - c("ctaMacro"));
  }
  // Ageing: looks healthy until the aging beat, then oxidises and cracks.
  const age = interpolate(frame, [agingStart, c("hard"), c("grip")], [0.15, 0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cracks = interpolate(frame, [c("hard") - 6, c("crack") + 12, c("grip")], [0, 0.55, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sun = clamp01((frame - agingStart) / Math.max(1, c("hard") - agingStart));
  const rim = interpolate(frame, [c("age") - 2, c("age") + 4, c("cta:start"), c("cta:start") + 10], [0.35, 1, 1, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    set,
    pose: { spin, yaw, z: 0 },
    age: frame >= c("ctaMacro") ? 1 : age,
    cracks,
    sun,
    road: roll * R * roadFrames,
    // Macro shots: no red spill on the tread, the grazing light takes over.
    rim: frame < c("hookReveal") || frame >= c("ctaMacro") ? 0.12 : rim,
    graze: frame < c("hookReveal") || frame >= c("ctaMacro") ? 1 : 0,
    // Sidewall macros: dolly, out-of-focus code, cracks, digits.
    wall: inRange(frame, c("clue:start"), c("aging:start")) || inRange(frame, c("hard"), c("grip")) || inRange(frame, decodeStart, c("age")) ? 1 : 0,
    key: inRange(frame, c("hard"), c("grip")) ? 0 : 1,
  };
};

export const tireAnchor = (name: string, state: TireState): Vec3 | null => wheelAnchor(name, state.pose);

// Screen corners of a date digit pair (for the highlight box).
export const digitPairCorners = (which: "week" | "year", state: TireState): Vec3[] => {
  const code = DATE_CODE;
  const pitch = code.digitPitch / code.radius;
  const center = code.theta + (which === "week" ? -pitch : pitch);
  const half = pitch * 1.05;
  const r0 = code.radius - 0.0088;
  const r1 = code.radius + 0.0088;
  const p = (r: number, th: number) => wheelPointToWorld(r, th, wallA(r) + 0.002, state.pose);
  return [p(r0, center - half), p(r1, center - half), p(r1, center + half), p(r0, center + half)];
};
