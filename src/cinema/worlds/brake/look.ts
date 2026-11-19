// Look of the brake world: a dark studio, a cool metal rig, and a bloom
// threshold low enough that the glowing rotor bleeds into the frame.

import type { LookConfig } from "../../Stage3D";

export const BRAKE_LOOK: LookConfig = {
  background: "#060607",
  ao: { radius: 0.03, intensity: 1.8 },
  // The hot rotor is the only bright thing in the shot. The threshold sits
  // high and the intensity low so the glow reads as heat, not a white flood.
  bloom: { intensity: 0.55, threshold: 0.88, smoothing: 0.25 },
  vignette: { offset: 0.3, darkness: 0.6 },
  envIntensity: 1.05,
  panels: [
    // Big overhead soft box.
    { color: "#ffffff", intensity: 3.2, position: [0, 5, 2], scale: [6, 3] },
    // Two long strips for the machined highlights on the rotor face.
    { color: "#dfe8ff", intensity: 4, position: [4, 1.2, 3], scale: [0.45, 5] },
    { color: "#ffffff", intensity: 2.8, position: [-4.5, 1.6, -1.5], scale: [0.45, 5] },
    // Warm kicker from behind, cool fill from below.
    { color: "#ffb37a", intensity: 1.4, position: [2.5, 0.5, -4], scale: [3, 1] },
    { color: "#9db7ff", intensity: 1.1, position: [-2, -2, 3], scale: [3, 2] },
    // Brand-red rim so the assembly reads as Doktermobil.
    { color: "#ff2a2f", intensity: 1.5, position: [-3.5, 1, 3.5], scale: [1, 4] },
  ],
};

export const FLOOR = {
  // Lifted a little so the wide shot never crushes to black.
  color: "#141416",
  roughness: 0.32,
  size: 24,
} as const;

// Direct lights (three.js physical units). Only the ones the shot needs burn.
export const LIGHTS = {
  key: {
    color: "#fff4ea",
    intensity: 72,
    position: [1.9, 2.4, 1.7] as const,
    angle: 0.5,
    penumbra: 0.85,
  },
  rim: { color: "#ff2b30", intensity: 16, position: [-1.5, 1.0, -1.7] as const },
  fill: { color: "#9db7ff", intensity: 0.32 },
  // Soft fill close to the assembly: the macros put the camera 15-40 cm away,
  // so the far key light alone leaves the friction face too dark.
  macro: { color: "#fff6ee", intensity: 2.6, position: [0.34, 0.42, 0.5] as const },
  // Grazing light along the rotor face for the friction macro.
  graze: { color: "#ffe6c8", intensity: 8, position: [0.22, 0.34, 0.5] as const },
  // The heat itself: a red point light at the rotor.
  heat: { color: "#ff3a12", intensity: 0, distance: 3 } as const,
  shadowMapSize: 2048,
} as const;

// Rotor emissive ramp: cold steel, dull cherry, then bright orange-white.
export const HEAT_RAMP = {
  cold: "#121316",
  warm: "#5a1b0e",
  hot: "#c8280f",
  blazing: "#ff6a1e",
  core: "#ffd9a0",
} as const;
