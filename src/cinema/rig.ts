// Camera rig of the cinema format. A reel is a list of shots on the global
// timeline; each shot owns [from, to) and moves the camera through its keys
// on a monotone cubic (velocity stays continuous, no overshoot), with a soft
// drift warp so a shot never starts or ends dead still. Shots meet with a
// hard cut, which lands on a spoken word. Everything is a pure function of
// the frame, so 2D annotations projected with the same camera stay glued to
// the 3D picture. Interpolation adapted from ../shifupo-reels core rig.

import { noise2D } from "@remotion/noise";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

export type Vec3 = readonly [number, number, number];

export type CamKey = {
  t: number;
  pos: Vec3;
  look: Vec3;
  fov?: number;
  roll?: number; // degrees
};

export type Shot = {
  name: string;
  from: number;
  to: number;
  keys: readonly CamKey[];
  fov: number;
  // Handheld idle amplitude in world units (0 = locked off).
  handheld?: number;
  // Depth of field: focus point (defaults to the look point), range of the
  // sharp zone in world units and bokeh size.
  focus?: Vec3;
  dofRange: number;
  bokeh: number;
  // Share of the shot spent as constant drift (rest eases in and out).
  drift?: number;
};

export type CamState = {
  pos: Vec3;
  look: Vec3;
  fov: number;
  roll: number;
  focus: Vec3;
};

const monotone = (xs: readonly number[], ys: readonly number[], x: number): number => {
  const n = xs.length;
  if (n === 1 || x <= xs[0]) {
    return ys[0];
  }
  if (x >= xs[n - 1]) {
    return ys[n - 1];
  }
  const d = xs.slice(1).map((xi, i) => (ys[i + 1] - ys[i]) / (xi - xs[i]));
  const m = xs.map((_, i) =>
    i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2,
  );
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const r = a * a + b * b;
    if (r > 9) {
      const k = 3 / Math.sqrt(r);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  let i = 0;
  while (x > xs[i + 1]) {
    i++;
  }
  const h = xs[i + 1] - xs[i];
  const t = (x - xs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * ys[i] +
    (t3 - 2 * t2 + t) * h * m[i] +
    (-2 * t3 + 3 * t2) * ys[i + 1] +
    (t3 - t2) * h * m[i + 1]
  );
};

const sineInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
const DEFAULT_DRIFT = 0.55;
const HANDHELD_PERIOD_FRAMES = 70;

export const shotIndexAt = (shots: readonly Shot[], frame: number): number => {
  const i = shots.findIndex((s) => frame < s.to);
  return i < 0 ? shots.length - 1 : i;
};

export const shotProgress = (shot: Shot, frame: number): number =>
  Math.min(1, Math.max(0, (frame - shot.from) / Math.max(1, shot.to - shot.from)));

export const cameraAt = (shots: readonly Shot[], frame: number): CamState => {
  const shot = shots[shotIndexAt(shots, frame)];
  const drift = shot.drift ?? DEFAULT_DRIFT;
  const raw = shotProgress(shot, frame);
  const p = drift * raw + (1 - drift) * sineInOut(raw);
  const xs = shot.keys.map((k) => k.t);
  const v = (pick: (k: CamKey) => number) => monotone(xs, shot.keys.map(pick), p);
  const h = shot.handheld ?? 0;
  const wob = (seed: string) => noise2D(seed, frame / HANDHELD_PERIOD_FRAMES, 0) * h;
  const look: Vec3 = [v((k) => k.look[0]), v((k) => k.look[1]), v((k) => k.look[2])];
  return {
    pos: [v((k) => k.pos[0]) + wob("hx"), v((k) => k.pos[1]) + wob("hy") * 0.6, v((k) => k.pos[2]) + wob("hz") * 0.4],
    look,
    fov: v((k) => k.fov ?? shot.fov),
    roll: v((k) => k.roll ?? 0) + noise2D("hr", frame / 90, 0) * h * 8,
    focus: shot.focus ?? look,
  };
};

export const NEAR_FAR = { near: 0.004, far: 60 } as const;

export const applyCamera = (cam: PerspectiveCamera, s: CamState, aspect: number): void => {
  cam.fov = s.fov;
  cam.aspect = aspect;
  cam.near = NEAR_FAR.near;
  cam.far = NEAR_FAR.far;
  cam.position.set(s.pos[0], s.pos[1], s.pos[2]);
  cam.up.set(0, 1, 0);
  cam.lookAt(s.look[0], s.look[1], s.look[2]);
  cam.rotateZ(MathUtils.degToRad(s.roll));
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
};

const scratch = new PerspectiveCamera();

// Screen position (px) of a world point; null when behind the camera.
export const projectToScreen = (
  s: CamState,
  point: Vec3,
  width: number,
  height: number,
): { x: number; y: number } | null => {
  applyCamera(scratch, s, width / height);
  const v = new Vector3(point[0], point[1], point[2]).project(scratch);
  if (v.z > 1) {
    return null;
  }
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
};
