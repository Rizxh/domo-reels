// Look of the tire world: materials, light rig and post settings. Colours are
// sRGB hex (three.js converts them to linear).

import type { LookConfig } from "../../Stage3D";

export const WHEEL_LOOK = {
  rubber: "#161616",
  rubberOld: "#2f2c29",
  crack: "#050505",
  alloy: "#c9ccd2",
  alloyDark: "#3a3d42",
  disc: "#5d5f63",
  caliper: "#c41a1f",
  nut: "#e4e6ea",
  grainBump: 0.6,
  letterBump: 2.4,
} as const;

// Image-based light: a big soft box overhead, two strip boxes for long
// highlights on the rubber and alloy, a warm kicker and a brand-red rim.
export const STAGE_LOOK: LookConfig = {
  background: "#060607",
  ao: { radius: 0.05, intensity: 1.6 },
  bloom: { intensity: 0.55, threshold: 0.82, smoothing: 0.2 },
  vignette: { offset: 0.28, darkness: 0.62 },
  envIntensity: 0.9,
  panels: [
    { color: "#ffffff", intensity: 2.2, position: [0, 6, 1], scale: [6, 3] },
    { color: "#dfe8ff", intensity: 3, position: [5, 1.5, 3], scale: [0.5, 5] },
    { color: "#ffffff", intensity: 2, position: [-5, 1.8, -2], scale: [0.5, 5] },
    { color: "#ffb37a", intensity: 1.2, position: [3, 0.6, -5], scale: [3, 1] },
    { color: "#ff2a2f", intensity: 1.2, position: [-4, 1, 4], scale: [1, 4] },
    { color: "#ffffff", intensity: 1.6, position: [-2.5, 2.2, 4], scale: [3.5, 3] },
    { color: "#ffe2c4", intensity: 1.4, position: [4, 0.4, 1.5], scale: [2.5, 1.2] },
  ],
};

export const FLOOR = {
  studio: "#0c0c0d",
  studioRoughness: 0.32,
  road: "#4a4a4c",
  roadRoughness: 0.2,
  size: 40,
} as const;

// Direct lights per set (intensity in three.js physical units).
export const LIGHTS = {
  key: { color: "#fff4ea", intensity: 55, position: [2.2, 2.6, 1.6] as const, angle: 0.45, penumbra: 0.8 },
  rim: { color: "#ff2b30", intensity: 14, position: [-1.6, 1.1, -1.9] as const },
  fill: { color: "#9db7ff", intensity: 0.25 },
  // Time lapse: the sun swings from morning (warm, low) over noon to dusk.
  sun: { radius: 3.2, height: 2.4, warm: "#ffc58a", noon: "#fff8ee", intensity: 3.2 },
  // Night road: sodium street lights passing over the wheel.
  street: { color: "#ffb35c", intensity: 22, spacing: 3.4, height: 2.2, side: 1.4 },
  moon: { color: "#7fa2ff", intensity: 0.6 },
  // Grazing back light over the top of the tread for the macro canyon.
  graze: { color: "#ffd9b0", intensity: 9, position: [0.05, 0.7, -0.75] as const },
  // Raking light along the lettered sidewall (cracks and digits).
  wall: { color: "#fff1e0", intensity: 7, position: [0.32, 0.95, -0.9] as const },
  shadowMapSize: 2048,
} as const;
