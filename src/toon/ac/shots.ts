// EP13 shot list (ad structure: hook, problem, false hope, reveal + explain, Doktermobil, cleaning, result, CTA):
// sets, light, the car's state, the AC box state and camera keys, all cut on the voice's words.
import { cue, sceneFrame, TOTAL } from "./cues";
import { ModernState, modernPoint, M_SEATS, M_VENT, M_ACBOX } from "../benz/modern";
import { HvacState, HV } from "./hvac";
import { V3, Key, Shot, dolly, pushK, run, kickAt, applyKick, Cam, clamp01, smooth } from "../benz/rig";
import type { Light } from "../lights";

export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
const B = (n: number) => sceneFrame(n - 1);

const S = {
  hookOut: 0, hookGoat: cue(1, "katanya") - 3, problem: B(2), falsehope: B(3),
  where: B(4), airflow: cue(4, "evaporator") - 3, grow: B(5), filter: cue(5, "filter") - 3, drain: cue(5, "saluran") - 3,
  inspect: B(6), cleanEvap: B(7), cleanFilter: cue(7, "filter") - 3, cleanDrain: cue(7, "saluran") - 3,
  result: B(8), shop: B(9),
};
const order: [keyof typeof S, Light, number?, number?][] = [
  ["hookOut", "day", 125, 40], ["hookGoat", "day", 120, 40], ["problem", "day", 120, 40], ["falsehope", "day", 120, 40],
  ["where", "day", 120, 40], ["airflow", "day", 60, 50], ["grow", "day", 60, 50], ["filter", "day", 60, 50], ["drain", "day", 60, 50],
  ["inspect", "day", 140, 42], ["cleanEvap", "day", 60, 50], ["cleanFilter", "day", 60, 50], ["cleanDrain", "day", 60, 50],
  ["result", "day", 125, 35], ["shop", "day", 140, 42],
];
export const SHOTS: ShotDef[] = order.map(([k, light, sunAz, sunEl], i) => ({
  id: i + 1, a: S[k], b: i + 1 < order.length ? S[order[i + 1][0]] : TOTAL, light, sunAz, sunEl,
}));
export const ID = Object.fromEntries(order.map(([k], i) => [k, i + 1])) as Record<keyof typeof S, number>;
export const FLASH_AT = -100;
export const XFADE: Record<number, number> = {};
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

const T = (f: number) => f / 30;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- places ----------------
export const MX = 0, LANE = 1.8, CURB = 2.55;
export const HX: V3 = [600, 0, 0];
export const SHOP_X = MX + 8;
export const SHOP_CAR = { x: SHOP_X + 2.4, z: -1.7 };
export const PARKED = { x: MX - 20, z: CURB };
/** the date (Dimas) walking off along the pavement, holding his nose */
export const dateWalk = (f: number): V3 => [PARKED.x + 0.6 + 0.9 * T(f), 0.16, 4.0 + 0.2 * T(f)];

// ---------------- the car ----------------
export const carAt = (id: number, f: number): ModernState | null => {
  const t = T(f);
  if (id === ID.hookOut || id === ID.hookGoat || id === ID.problem || id === ID.falsehope) return { x: PARKED.x, z: PARKED.z, yaw: 0, dist: 0, t };
  if (id === ID.where) return { x: PARKED.x, z: PARKED.z, yaw: 0, dist: 0, t, xrayBody: smooth(clamp01((f - S.where - 2) / 10)) };
  if (id === ID.result) { const x = MX - 30 + (7.5 * (f - S.result)) / 30; return { x, z: LANE, yaw: 0, dist: x * 0.6, t }; }
  if (id === ID.inspect || id === ID.shop) return { x: SHOP_CAR.x, z: SHOP_CAR.z, yaw: 0, dist: 0, t };
  return null;
};
export const onCar = (id: number, f: number, p: V3): V3 => modernPoint(carAt(id, f)!, p);
export const seatAt = (id: number, f: number, who: "driver" | "passenger"): V3 => onCar(id, f, M_SEATS[who]);
export const ventAt = (id: number, f: number): V3 => onCar(id, f, M_VENT);

// ---------------- the AC box ----------------
const ramp = (f: number, a: number, b: number) => smooth(clamp01((f - a) / Math.max(1, b - a)));
export const CLEAN = {
  foam0: S.cleanEvap + 1, foam1: cue(7, "dibersihkan") - 2, rinse0: cue(7, "dibersihkan") + 2, rinse1: S.cleanFilter - 2,
  lift0: cue(7, "diganti") - 18, lift1: cue(7, "diganti") - 6, drop0: cue(7, "diganti") - 4, drop1: cue(7, "diganti") + 10,
  flush0: cue(7, "dilancarkan") - 14, flush1: cue(7, "dilancarkan") + 6,
};
export const GROW = { damp0: cue(5, "dingin") - 6, damp1: cue(5, "lembap") + 4, mold0: cue(5, "jamur") - 4, mold1: cue(5, "tumbuh") + 10 };
export const hvacAt = (id: number, f: number): HvacState | null => {
  const t = T(f);
  const dirty = { t, fan: t * 4, clog: true, mold: 1, slime: 1, damp: 0.2, dirty: 1 };
  if (id === ID.airflow) return { ...dirty, mold: 0.6, slime: 0.3 };
  if (id === ID.grow) return { ...dirty, damp: ramp(f, GROW.damp0, GROW.damp1), mold: ramp(f, GROW.mold0, GROW.mold1), slime: ramp(f, GROW.mold0 + 10, GROW.mold1 + 10) };
  if (id === ID.filter || id === ID.drain) return dirty;
  if (id === ID.cleanEvap) {
    const r = ramp(f, CLEAN.rinse0, CLEAN.rinse1);
    return { ...dirty, foam: ramp(f, CLEAN.foam0, CLEAN.foam1), rinse: r, mold: 1 - r, slime: 1 - r, damp: 0.3 };
  }
  if (id === ID.cleanFilter) {
    const up = ramp(f, CLEAN.lift0, CLEAN.lift1), down = 1 - ramp(f, CLEAN.drop0, CLEAN.drop1), fresh = f >= CLEAN.drop0;
    return { ...dirty, mold: 0, slime: 0, dirty: fresh ? 0 : 1, fresh, lift: fresh ? down : up };
  }
  if (id === ID.cleanDrain) return { ...dirty, mold: 0, slime: 0, dirty: 0, fresh: true, clog: f < CLEAN.flush0, flush: 1.6 * ramp(f, CLEAN.flush0, CLEAN.flush1) };
  return null;
};
export const hw = (p: V3): V3 => add(HX, p);

// ---------------- cameras ----------------
const at = (pos: V3, look: V3, rest: Partial<Cam> = {}, f0 = 0, rate = 0.0022, punch = 0) => (f: number): Shot => dolly(pos, look, pushK(f, f0, rate, punch), rest);
const rideCar = (id: number, local: V3, lookLocal: V3, rest: Partial<Cam> = {}, rate = 0.0015) => (f: number): Shot =>
  dolly(onCar(id, f, local), onCar(id, f, lookLocal), pushK(f, SHOTS[id - 1].a, rate), rest);
const C = HV.core, F = HV.filter;
const coreMid: V3 = [(C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, C.z1];
const filtMid: V3 = [(F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, F.z];
/** the whole car front through its windscreen: both seats, the dashboard, a bit of street around */
/** inside the car, from just in front of the windscreen: dashboard, both front seats, the people, the cabin */
const frontWide = (id: number, side = 0, rate = 0.0018) => rideCar(id, [2.6, 1.6, side * 0.3], [-0.4, 0.98, side * 0.1], { fov: 42 }, rate);
const CAMS: Record<number, Key[]> = {};
CAMS[ID.hookOut] = [{ f: 0, s: at([PARKED.x + 2.6, 1.45, 10.5], [PARKED.x + 0.6, 1.0, 2.6], { fov: 38, roll: 0.01 }, 0, 0.0025) }];
CAMS[ID.hookGoat] = [{ f: S.hookGoat, s: frontWide(ID.hookGoat, 0, 0.003) }];
CAMS[ID.problem] = [{ f: S.problem, s: frontWide(ID.problem, -0.3, 0.002) }];
CAMS[ID.falsehope] = [
  { f: S.falsehope, s: frontWide(ID.falsehope, -0.4, 0.0022) },
  { f: cue(3, "wanginya") - 4, cut: true, s: frontWide(ID.falsehope, 0, 0.0025) },
];
CAMS[ID.where] = [{ f: S.where, s: rideCar(ID.where, [4.6, 2.1, 3.6], [M_ACBOX[0], M_ACBOX[1] + 0.05, M_ACBOX[2]], { fov: 36 }, 0.003) }];
CAMS[ID.airflow] = [{ f: S.airflow, s: at(hw([0.0, 2.3, 15.5]), hw([0.0, 2.15, 0]), { fov: 44 }, S.airflow, 0.0015) }];
CAMS[ID.grow] = [{ f: S.grow, s: at(hw(add(coreMid, [0.9, 0.25, 6.2])), hw(add(coreMid, [0.3, 0.05, 0])), { fov: 40 }, S.grow, 0.002) }];
CAMS[ID.filter] = [{ f: S.filter, s: at(hw(add(filtMid, [0.2, 0.3, 5.6])), hw(add(filtMid, [0, 0.15, 0])), { fov: 40 }, S.filter, 0.002) }];
CAMS[ID.drain] = [{ f: S.drain, s: at(hw(add(HV.outlet, [1.4, 0.7, 2.6])), hw(add(HV.outlet, [-0.2, 0.05, -0.5])), { fov: 40 }, S.drain, 0.002) }];
CAMS[ID.inspect] = [
  { f: S.inspect, s: at([SHOP_CAR.x + 4.6, 1.6, 6.6], [SHOP_CAR.x + 2.6, 1.15, -0.4], { fov: 42 }, S.inspect, 0.0018) },
  { f: cue(6, "kamera") - 6, cut: true, s: at([SHOP_CAR.x + 3.4, 1.5, 3.2], [SHOP_CAR.x + 2.9, 1.25, -0.2], { fov: 38 }, cue(6, "kamera") - 6, 0.002) },
];
CAMS[ID.cleanEvap] = [{ f: S.cleanEvap, s: at(hw(add(coreMid, [0.6, 0.2, 5.8])), hw(add(coreMid, [0.2, 0, 0])), { fov: 40 }, S.cleanEvap, 0.0018) }];
CAMS[ID.cleanFilter] = [{ f: S.cleanFilter, s: at(hw(add(filtMid, [0.2, 0.9, 6.4])), hw(add(filtMid, [0, 0.7, 0])), { fov: 42 }, S.cleanFilter, 0.0015) }];
CAMS[ID.cleanDrain] = [{ f: S.cleanDrain, s: at(hw(add(HV.outlet, [1.4, 0.7, 2.6])), hw(add(HV.outlet, [-0.2, 0.0, -0.5])), { fov: 40 }, S.cleanDrain, 0.002) }];
CAMS[ID.result] = [{ f: S.result, s: rideCar(ID.result, [7.6, 2.05, -1.6], [-0.2, 1.1, 0], { fov: 34 }, 0.0012) }];
CAMS[ID.shop] = [
  { f: S.shop, s: at([SHOP_X + 0.3, 1.6, 2.2], [SHOP_X + 0.1, 1.35, -5.0], { fov: 44 }, S.shop, 0.0018) },
  { f: cue(9, "langsung") - 6, cut: true, s: at([SHOP_X, 3.2, 4.0], [SHOP_X, 4.05, -8.0], { fov: 44 }, cue(9, "langsung") - 6, 0.0012) },
];

const KICKS: [number, number][] = [[cue(1, "kambing"), 0.7], [cue(2, "kambing"), 0.5], [cue(3, "balik"), 0.5]];
export const camAt = (id: number, f: number): Cam => applyKick(run(CAMS[id], f), kickAt(KICKS, f));

export type Dof = { cInf: number; focus?: (f: number) => V3 };
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature shared with the other stories
export const dofAt = (id: number, _f: number): Dof => {
  switch (id) {
    case ID.hookOut: return { cInf: 6, focus: () => [PARKED.x + 0.4, 1.1, CURB] };
    case ID.hookGoat: case ID.problem: case ID.falsehope: return { cInf: 6, focus: (g) => seatAt(id, g, "driver") };
    case ID.where: return { cInf: 5, focus: (g) => onCar(id, g, M_ACBOX) };
    case ID.airflow: return { cInf: 0 };
    case ID.grow: case ID.filter: case ID.cleanEvap: case ID.cleanFilter: return { cInf: 6 };
    case ID.drain: case ID.cleanDrain: return { cInf: 8 };
    case ID.inspect: return { cInf: 6 };
    case ID.result: return { cInf: 6, focus: (g) => onCar(id, g, [0, 1, 0]) };
    case ID.shop: return { cInf: 4 };
    default: return { cInf: 0 };
  }
};
export { S };
