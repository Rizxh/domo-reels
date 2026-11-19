// Shot list and world state of EP07 "Rem Bisa Hilang di Turunan".
// Every cut lands on a cue word of the episode (see docs/ep07/PLAN.md).
// World units are metres; the assembly sits at the origin, rotor facing +Z.

import { interpolate } from "remotion";
import type { CamKey, Shot, Vec3 } from "../../rig";
import { cue, type CueMap } from "../../timeline";
import { ANCHORS, BRAKE, PAD_RADIUS, polar } from "./geometry";

export type BrakeState = {
  // Rotor rotation (radians).
  spin: number;
  // 0..1 rotor temperature; drives the emissive ramp and the heat light.
  heat: number;
  // 0..1 how hard the caliper squeezes.
  clamp: number;
  // 0..1 pad glazing (glossy, glassy friction face).
  glaze: number;
  // 0..1 smoke coming off the pads.
  smoke: number;
  // 0..1 studio key light.
  key: number;
  // 0..1 brand-red rim light.
  rim: number;
  // 0..1 grazing light along the rotor face (friction macro).
  graze: number;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// A camera key orbiting the assembly at `radius`, `height` and `angle`.
const orbit = (t: number, radius: number, height: number, angle: number, fov: number, look: Vec3 = [0, 0.01, 0]): CamKey => ({
  t,
  pos: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
  look,
  fov,
});

export const buildBrakeShots = (cues: CueMap): Shot[] => {
  const c = (name: string) => cue(cues, name);
  const pad = ANCHORS.pad;
  const caliper = ANCHORS.caliper;
  return [
    {
      name: "1 wide reveal",
      from: 0,
      to: c("hookCut"),
      fov: 32,
      keys: [orbit(0, 0.86, 0.2, 0.72, 32), orbit(1, 0.78, 0.17, 0.66, 32)],
      dofRange: 0.9,
      bokeh: 2,
      handheld: 0.0025,
      drift: 0.4,
    },
    {
      name: "2 rotor face",
      from: c("hookCut"),
      to: c("fadeName"),
      fov: 26,
      keys: [
        { t: 0, pos: [0.07, 0.06, 0.4], look: [0.02, 0.02, 0], fov: 26 },
        { t: 1, pos: [0.05, 0.05, 0.35], look: [0.02, 0.02, 0], fov: 26 },
      ],
      focus: ANCHORS.discFace,
      dofRange: 0.045,
      bokeh: 5,
      handheld: 0.0009,
    },
    {
      name: "3 caliper",
      from: c("fadeName"),
      to: c("padHot"),
      fov: 30,
      keys: [
        { t: 0, pos: add(caliper, [-0.16, 0.16, 0.24]), look: caliper, fov: 30 },
        { t: 1, pos: add(caliper, [-0.13, 0.13, 0.2]), look: caliper, fov: 30 },
      ],
      focus: caliper,
      dofRange: 0.05,
      bokeh: 4,
      handheld: 0.0012,
    },
    {
      name: "4 pad macro",
      from: c("padHot"),
      to: c("discHot"),
      fov: 24,
      keys: [
        { t: 0, pos: add(pad, [0.05, 0.05, 0.15]), look: pad, fov: 24 },
        { t: 1, pos: add(pad, [0.04, 0.04, 0.12]), look: pad, fov: 24 },
      ],
      focus: pad,
      dofRange: 0.014,
      bokeh: 7,
      handheld: 0.0007,
    },
    {
      name: "5 disc glow",
      from: c("discHot"),
      to: c("gripDown"),
      fov: 27,
      keys: [
        { t: 0, pos: [0.02, 0.1, 0.44], look: [0.01, 0.03, 0], fov: 27 },
        { t: 1, pos: [0.0, 0.08, 0.38], look: [0.01, 0.03, 0], fov: 27 },
      ],
      focus: ANCHORS.discFace,
      dofRange: 0.05,
      bokeh: 5,
      handheld: 0.001,
    },
    {
      name: "6 heat pullback",
      from: c("gripDown"),
      to: c("heatUp"),
      fov: 30,
      keys: [orbit(0, 0.34, 0.1, 1.15, 30), orbit(1, 0.62, 0.16, 1.0, 30)],
      dofRange: 0.55,
      bokeh: 3,
      handheld: 0.003,
      drift: 0.35,
    },
    {
      name: "7 friction macro",
      from: c("heatUp"),
      to: c("red"),
      fov: 22,
      keys: [
        { t: 0, pos: [0.1, 0.12, 0.19], look: ANCHORS.discFace, fov: 22 },
        { t: 1, pos: [0.09, 0.11, 0.165], look: ANCHORS.discFace, fov: 22 },
      ],
      focus: ANCHORS.discFace,
      dofRange: 0.01,
      bokeh: 9,
      handheld: 0.0006,
    },
    {
      name: "8 blazing hero",
      from: c("red"),
      to: c("slick"),
      fov: 31,
      keys: [orbit(0, 0.5, 0.06, 2.5, 31), orbit(1, 0.42, 0.05, 2.32, 31)],
      dofRange: 0.6,
      bokeh: 3,
      handheld: 0.002,
    },
    {
      name: "9 glazed pad",
      from: c("slick"),
      to: c("deep"),
      fov: 23,
      keys: [
        { t: 0, pos: add(pad, [0.06, 0.06, 0.13]), look: pad, fov: 23 },
        { t: 1, pos: add(pad, [0.05, 0.05, 0.11]), look: pad, fov: 23 },
      ],
      focus: pad,
      dofRange: 0.012,
      bokeh: 8,
      handheld: 0.0006,
    },
    {
      name: "10 wide fade",
      from: c("deep"),
      to: c("roll"),
      fov: 33,
      keys: [orbit(0, 0.95, 0.26, -0.5, 33), orbit(1, 0.86, 0.23, -0.62, 33)],
      dofRange: 0.95,
      bokeh: 2,
      handheld: 0.003,
      drift: 0.4,
    },
    {
      name: "11 smoke wide",
      from: c("roll"),
      to: c("bite"),
      fov: 30,
      keys: [orbit(0, 0.72, 0.34, 2.9, 30), orbit(1, 0.64, 0.3, 3.05, 30)],
      dofRange: 0.8,
      bokeh: 2,
      handheld: 0.0028,
    },
    {
      name: "12 top down",
      from: c("bite"),
      to: c("engine"),
      fov: 34,
      keys: [
        { t: 0, pos: [0.02, 0.78, 0.2], look: [0, 0, 0], fov: 34 },
        { t: 1, pos: [0.0, 0.7, 0.16], look: [0, 0, 0], fov: 34 },
      ],
      dofRange: 0.9,
      bokeh: 2,
      handheld: 0.002,
    },
    {
      name: "13 side profile",
      from: c("engine"),
      to: c("gear"),
      fov: 28,
      keys: [
        { t: 0, pos: [0.86, 0.05, 0.02], look: [0, 0.01, 0], fov: 28 },
        { t: 1, pos: [0.74, 0.04, 0.04], look: [0, 0.01, 0], fov: 28 },
      ],
      dofRange: 0.35,
      bokeh: 3,
      handheld: 0.0012,
    },
    {
      name: "14 low angle",
      from: c("gear"),
      to: c("noBrake"),
      fov: 32,
      keys: [
        { t: 0, pos: [0.3, -0.16, 0.56], look: [0.02, 0.05, 0], fov: 32 },
        { t: 1, pos: [0.24, -0.13, 0.48], look: [0.02, 0.05, 0], fov: 32 },
      ],
      dofRange: 0.7,
      bokeh: 3,
      handheld: 0.0022,
    },
    {
      name: "15 hero turn",
      from: c("noBrake"),
      to: c("check"),
      fov: 30,
      keys: [orbit(0, 0.62, 0.16, 1.9, 30), orbit(1, 0.56, 0.14, 2.12, 30)],
      dofRange: 0.7,
      bokeh: 2,
      handheld: 0.002,
    },
    {
      name: "16 cta",
      from: c("check"),
      to: c("ctaMacro"),
      fov: 29,
      keys: [orbit(0, 0.78, 0.22, -1.1, 29), orbit(1, 0.7, 0.19, -1.32, 29)],
      dofRange: 0.9,
      bokeh: 2,
      handheld: 0.0024,
      drift: 0.45,
    },
    {
      name: "17 macro loop",
      from: c("ctaMacro"),
      to: c("end"),
      fov: 26,
      keys: [
        { t: 0, pos: [0.06, 0.055, 0.37], look: [0.02, 0.02, 0], fov: 26 },
        { t: 1, pos: [0.07, 0.06, 0.4], look: [0.02, 0.02, 0], fov: 26 },
      ],
      focus: ANCHORS.discFace,
      dofRange: 0.045,
      bokeh: 5,
      handheld: 0.0009,
    },
  ];
};

// World state at a frame. The rotor keeps turning under the pads; heat builds
// from the moment the pads bite and only lets go once the car is off the
// brakes (the "engine brake" beat).
export const brakeStateAt = (cues: CueMap, frame: number): BrakeState => {
  const c = (name: string) => cue(cues, name);
  const padOn = c("padHot");
  const heatPeak = c("red");
  const release = c("noBrake");

  // Spin: slow idle, faster while the pads are clamped, then a slow coast.
  const spinRate = frame >= padOn && frame < release ? 0.055 : 0.012;
  const spin = spinRate * frame;

  const heat = interpolate(frame, [padOn, c("discHot"), heatPeak, release, c("ctaMacro")], [0.04, 0.45, 1, 1, 0.42], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const clamp = interpolate(frame, [padOn - 4, padOn + 2, release, release + 8], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glaze = interpolate(frame, [c("slick") - 4, c("slick") + 8, c("deep")], [0, 0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const smoke = interpolate(
    frame,
    [c("gripDown"), c("red"), c("bite"), c("engine"), c("check")],
    [0, 0.55, 1, 0.7, 0.2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return {
    spin,
    heat,
    clamp,
    glaze,
    smoke: clamp01(smoke),
    key: 1,
    rim: interpolate(frame, [0, heatPeak - 10, heatPeak, c("cta:start")], [0.5, 0.75, 1, 0.6], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    graze: frame >= c("heatUp") && frame < c("red") ? 1 : 0,
  };
};

export const brakeAnchor = (name: string): Vec3 | null => ANCHORS[name] ?? null;

// Point on the rotor face at the pad, used by the callout ring.
export const padFacePoint = (): Vec3 => polar(PAD_RADIUS, BRAKE.caliperAngle, BRAKE.rotorThickness / 2 + 0.004);
