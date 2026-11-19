// Layout and look of the engine world (EP04): five engine parts on a long
// dark table, a fuel gauge and a fuel pump display. World units are metres;
// every part keeps its real size and faces the camera side (+Z).

import type { LookConfig } from "../../Stage3D";
import type { Vec3 } from "../../rig";

export const PARTS = {
  intake: { x: 0, label: "intake" },
  throttle: { x: 0.34, label: "throttle" },
  plug: { x: 0.56, label: "plug" },
  piston: { x: 0.78, label: "piston" },
  catalyst: { x: 1.1, label: "catalyst" },
} as const;
export type PartName = keyof typeof PARTS;
export const PART_ORDER: readonly PartName[] = ["intake", "throttle", "plug", "piston", "catalyst"];

// Points texts and lights aim at.
export const ANCHORS: Record<string, Vec3> = {
  intake: [PARTS.intake.x - 0.04, 0.062, 0.162],
  throttle: [PARTS.throttle.x, 0.07, 0.034],
  plug: [PARTS.plug.x, 0.016, 0.083],
  piston: [PARTS.piston.x, 0.078, 0.012],
  flame: [PARTS.piston.x, 0.104, 0.0],
  catalyst: [PARTS.catalyst.x, 0.075, 0.046],
  gauge: [-8, 0.3, 0.012],
  pump: [-12, 0.35, 0.012],
};

export const LINEUP_CENTER: Vec3 = [(PARTS.intake.x + PARTS.catalyst.x) / 2, 0.06, 0];

export const ENGINE_LOOK: LookConfig = {
  background: "#111720",
  ao: { radius: 0.03, intensity: 1.05 },
  bloom: { intensity: 0.52, threshold: 0.72, smoothing: 0.22 },
  vignette: { offset: 0.34, darkness: 0.32 },
  envIntensity: 1.35,
  panels: [
    { color: "#ffffff", intensity: 3.8, position: [0, 6, 1], scale: [6, 3] },
    { color: "#dfe8ff", intensity: 4.1, position: [5, 1.5, 3], scale: [0.5, 5] },
    { color: "#ffffff", intensity: 3.2, position: [-5, 1.8, -2], scale: [0.5, 5] },
    { color: "#ffe2c4", intensity: 2.5, position: [3, 0.5, 4], scale: [3, 1.5] },
    { color: "#ffffff", intensity: 2.6, position: [-2.5, 2.2, 4], scale: [3.5, 3] },
  ],
};

export const ENGINE_COLORS = {
  table: "#1d242d",
  aluminium: "#b9bcc2",
  castIron: "#5b5e63",
  steel: "#d7dadf",
  ceramic: "#f1efe9",
  ceramicHoney: "#d9cfbd",
  soot: "#0a0907",
  sootBrown: "#1e1712",
  copper: "#c98552",
  flameDirty: "#ff6a1a",
  flameDirtyCore: "#ffc061",
  flameClean: "#3d8bff",
  flameCleanCore: "#cfe6ff",
  smoke: "#1b1a19",
  amber: "#ffa31a",
  lcd: "#9dff7a",
  needle: "#ff3b2f",
  sweep: "#ffffff",
  red: "#e31e24",
} as const;

export const ENGINE_LIGHTS = {
  key: { color: "#fff8ef", intensity: 15, offset: [0.55, 1.1, 0.8] as const, angle: 0.56, penumbra: 0.72 },
  rim: { color: "#ff2b30", intensity: 2.6, offset: [-0.5, 0.3, -0.75] as const },
  fill: { color: "#b8d0ff", intensity: 0.7 },
  flame: { distance: 0.6 },
  sweep: { intensity: 0.8 },
  shadowMapSize: 2048,
} as const;
