// Dimensions and surface math of the hero wheel: a 205/55 R16 tire on a
// five-spoke alloy. Local frame: the wheel axis is +Y (lathe axis), a point
// on the wheel is (r cos θ, a, r sin θ). The world group stands the wheel on
// the floor with its axis along world X, the lettered sidewall facing +X.

import {
  BufferAttribute,
  BufferGeometry,
  LatheGeometry,
  Vector2,
} from "three";
import type { Vec3 } from "../../rig";

const INCH = 0.0254;

export const TIRE = {
  // 205 mm section, 55 % aspect, 16 inch rim.
  rimRadius: (16 * INCH) / 2,
  sectionHalf: 0.205 / 2,
  outerRadius: (16 * INCH) / 2 + 0.205 * 0.55,
  // "Masih tebal": close to new tread depth.
  treadDepth: 0.0082,
  treadHalf: 0.084,
  // Lettered sidewall band (radius range) and its bulge.
  wallInner: 0.212,
  wallOuter: 0.3,
  wallA: 0.09,
  wallBulge: 0.013,
  // Blocks around the circumference.
  pitches: 72,
} as const;

export const TREAD_BASE = TIRE.outerRadius - TIRE.treadDepth;

// Axial position of the sidewall surface at radius r (positive side).
export const wallA = (r: number): number => {
  const s = (r - TIRE.wallInner) / (TIRE.wallOuter - TIRE.wallInner);
  return TIRE.wallA + TIRE.wallBulge * Math.sin(Math.PI * Math.min(1, Math.max(0, s)));
};

// Carcass: plain sidewall on the -a side, shoulders and the tread base. The
// +a sidewall is its own mesh (lettering), so the profile stops at its edge.
export const carcassGeometry = (): LatheGeometry => {
  const pts: Vector2[] = [];
  const steps = 14;
  // +a shoulder from the lettered wall edge up to the tread base.
  pts.push(new Vector2(TIRE.wallOuter, TIRE.wallA));
  pts.push(new Vector2(0.3042, TIRE.wallA - 0.0012));
  pts.push(new Vector2(0.3066, TIRE.treadHalf + 0.0018));
  pts.push(new Vector2(TREAD_BASE, TIRE.treadHalf));
  pts.push(new Vector2(TREAD_BASE, -TIRE.treadHalf));
  pts.push(new Vector2(0.3066, -TIRE.treadHalf - 0.0018));
  pts.push(new Vector2(0.3042, -TIRE.wallA + 0.0012));
  for (let i = 0; i <= steps; i++) {
    const r = TIRE.wallOuter - ((TIRE.wallOuter - TIRE.wallInner) * i) / steps;
    pts.push(new Vector2(r, -wallA(r)));
  }
  // LatheGeometry revolves (x, y) points as (x sin φ, y, x cos φ); the
  // resulting angle convention is irrelevant for a surface of revolution.
  return new LatheGeometry(pts, 256);
};

// Lettered sidewall (+a side) with polar UVs: u = θ / 2π, v = radial share
// (0 at the bead, 1 at the shoulder), so its canvas holds straight rows of
// text. An optional θ window builds a partial ring (crack overlay).
export const wallGeometry = (
  opts: { r0?: number; r1?: number; theta0?: number; theta1?: number; lift?: number; radial?: number; angular?: number } = {},
): BufferGeometry => {
  const r0 = opts.r0 ?? TIRE.wallInner;
  const r1 = opts.r1 ?? TIRE.wallOuter;
  const t0 = opts.theta0 ?? 0;
  const t1 = opts.theta1 ?? Math.PI * 2;
  const lift = opts.lift ?? 0;
  const nr = opts.radial ?? 28;
  const nt = opts.angular ?? 384;
  const pos = new Float32Array((nr + 1) * (nt + 1) * 3);
  const uv = new Float32Array((nr + 1) * (nt + 1) * 2);
  let k = 0;
  for (let j = 0; j <= nr; j++) {
    const r = r0 + ((r1 - r0) * j) / nr;
    for (let i = 0; i <= nt; i++) {
      const th = t0 + ((t1 - t0) * i) / nt;
      pos[k * 3] = r * Math.cos(th);
      pos[k * 3 + 1] = wallA(r) + lift;
      pos[k * 3 + 2] = r * Math.sin(th);
      uv[k * 2] = i / nt;
      uv[k * 2 + 1] = j / nr;
      k++;
    }
  }
  const idx: number[] = [];
  const row = nt + 1;
  for (let j = 0; j < nr; j++) {
    for (let i = 0; i < nt; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      // Winding chosen so the normals face +a (out of the sidewall).
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

// Where the production date sits on the sidewall: radius and angle (local).
// θ = π is the top of the wheel at spin 0; smaller θ moves toward the front.
export const DATE_CODE = {
  radius: 0.2365,
  theta: Math.PI - 0.5,
  // Spacing of the four date digits along the arc (m).
  digitPitch: 0.0105,
  // Angle from the code center to the center of each digit pair.
  get pairOffset(): number {
    return this.digitPitch / this.radius;
  },
} as const;

// Window of the crack overlay around the date code.
export const CRACKS = {
  r0: 0.226,
  r1: 0.299,
  theta0: DATE_CODE.theta - 0.75,
  theta1: DATE_CODE.theta + 0.75,
} as const;

// Pose of the wheel in the world for one frame.
export type WheelPose = {
  // Spin about the axle (rad).
  spin: number;
  // Turntable yaw of the whole wheel about world Y (rad).
  yaw: number;
  // Offset of the wheel along world Z (rolling on the road set).
  z: number;
};

// World position of a local wheel point (r, θ, axial a).
export const wheelPointToWorld = (r: number, theta: number, a: number, pose: WheelPose): Vec3 => {
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  // Spin about local Y (three.js convention).
  const xs = x * Math.cos(pose.spin) + z * Math.sin(pose.spin);
  const zs = -x * Math.sin(pose.spin) + z * Math.cos(pose.spin);
  // Stand the wheel: rotation about Z by -90° maps (x, y, z) to (y, -x, z).
  const wx = a;
  const wy = -xs + TIRE.outerRadius;
  const wz = zs + pose.z;
  // Turntable yaw about world Y.
  const c = Math.cos(pose.yaw);
  const s = Math.sin(pose.yaw);
  return [wx * c + wz * s, wy, -wx * s + wz * c];
};

// Named points texts can point at.
export const wheelAnchor = (name: string, pose: WheelPose): Vec3 | null => {
  const r = DATE_CODE.radius;
  const lift = 0.002;
  const surf = (th: number) => wheelPointToWorld(r, th, wallA(r) + lift, pose);
  switch (name) {
    case "dateCode":
      return surf(DATE_CODE.theta);
    case "weekDigits":
      return surf(DATE_CODE.theta - DATE_CODE.pairOffset);
    case "yearDigits":
      return surf(DATE_CODE.theta + DATE_CODE.pairOffset);
    default:
      return null;
  }
};
