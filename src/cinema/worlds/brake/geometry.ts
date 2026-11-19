// Dimensions (metres) and anchor points of the brake world. The rotor stands in
// the XY plane facing +Z and its axis is +Z, so the lettered face is readable
// from the camera and the caliper straddles the rim at `caliperAngle`.

import type { Vec3 } from "../../rig";

export const BRAKE = {
  // Friction ring (the part that glows).
  rotorRadius: 0.16,
  rotorInner: 0.096,
  rotorThickness: 0.028,
  // Bell/hat that carries the rotor on the hub.
  hatRadius: 0.078,
  hatDepth: 0.05,
  // Wheel hub face behind the rotor.
  hubRadius: 0.058,
  hubDepth: 0.03,
  // Pads: radial width, arc span, thickness.
  padRadial: 0.052,
  padArc: 0.3,
  padThickness: 0.013,
  // Caliper: angular position, arc span and depth along Z.
  caliperAngle: 2.28,
  caliperSpan: 0.44,
  caliperDepth: 0.07,
  caliperThickness: 0.026,
  // Venting and fasteners.
  vaneCount: 28,
  boltCount: 5,
  boltCircle: 0.07,
  boltRadius: 0.0085,
} as const;

// Radius the pads ride on (middle of the friction band).
export const PAD_RADIUS = (BRAKE.rotorInner + BRAKE.rotorRadius) / 2;

export const polar = (radius: number, angle: number, z = 0): Vec3 => [
  Math.cos(angle) * radius,
  Math.sin(angle) * radius,
  z,
];

const HALF = BRAKE.rotorThickness / 2;

// Static anchors: the assembly never leaves the origin, only the camera moves.
export const ANCHORS: Record<string, Vec3> = {
  disc: [0, 0, 0],
  discFace: polar(PAD_RADIUS, 0.42, HALF + 0.002),
  discTop: polar(BRAKE.rotorRadius * 0.9, Math.PI / 2, HALF),
  discRim: polar(BRAKE.rotorRadius * 0.99, 0.42, 0),
  pad: polar(PAD_RADIUS, BRAKE.caliperAngle, HALF + BRAKE.padThickness),
  padOuter: polar(BRAKE.rotorRadius - 0.012, BRAKE.caliperAngle, HALF + BRAKE.padThickness),
  caliper: polar(PAD_RADIUS, BRAKE.caliperAngle, 0),
  hub: [0, 0, -BRAKE.hatDepth - BRAKE.hubDepth * 0.5],
  glow: polar(PAD_RADIUS * 0.75, 0.95, HALF + 0.004),
  vent: polar(BRAKE.rotorInner + 0.012, 0.9, 0),
};
