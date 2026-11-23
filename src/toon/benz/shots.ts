// EP11 shot list: every shot = a set, a light, the car's state, camera keys and lens blur, all cut and timed on the
// words of the voice (cues.ts). Pure functions of the frame: world.ts poses everything from these.
import { cue, sceneFrame, TOTAL } from "./cues";
import { X, roadZ, roadDir, hillY, hillSlope } from "./set";
import { brakeAt, carPoint, CarState, SEATS, SEAT_TOP, REAR_X } from "./car";
import { ModernState, modernPoint, M_HUB, M_CAL, M_RADIAL } from "./modern";
import { V3, Key, Shot, dolly, zoom, pushK, run, kickAt, applyKick, Cam, clamp01, smooth, glide, lerp, rolled } from "./rig";
import type { Light } from "../lights";

export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
const B = (n: number) => sceneFrame(n - 1); // first frame of script scene n (1-based)

// ---------------- shot boundaries (frames) ----------------
const S = {
  hook: 0, escape: B(2), karl: cue(2, "suaminya"), roadA: B(3), roadB: cue(3, "istri"), roadC: cue(3, "seratus"),
  stop: B(4), door: cue(4, "jadi"), pour: cue(4, "mercedes-benz"), fuel: B(5), ign: cue(5, "pengapian"), climb: cue(5, "tanjakan"),
  push: cue(5, "anak-anaknya"), down: B(6), brake: cue(6, "rem"), village: B(7), deadpan: cue(7, "sialnya"), hammer: B(8),
  pad: cue(8, "lahirlah"), arrive: B(9), crowd: cue(9, "selamat") - 4, twist: cue(9, "jadi") - 4,
  modern: B(10), disc: cue(10, "tapi") - 4, wear: cue(10, "tapi", 2) - 4, shop: B(11),
};
const order: [keyof typeof S, Light, number?, number?][] = [
  ["hook", "golden", 140, 24], ["escape", "dawn", 125, 24], ["karl", "dawn", 140, 14], ["roadA", "day"], ["roadB", "day"], ["roadC", "day", 110, 40],
  ["stop", "day"], ["door", "day", 60, 40], ["pour", "day", 70, 40], ["fuel", "day", 80, 45], ["ign", "day", 80, 45], ["climb", "day", 100, 35],
  ["push", "day"], ["down", "day", 120, 35], ["brake", "day", 80, 40], ["village", "golden", 145, 24], ["deadpan", "golden", 150, 24],
  ["hammer", "golden", 140, 24], ["pad", "golden", 120, 26], ["arrive", "golden", 110, 13],
  ["crowd", "golden", 115, 15], ["twist", "golden", 100, 16], ["modern", "day", 120, 40], ["disc", "day", 70, 45], ["wear", "day", 70, 45],
  ["shop", "day", 140, 42],
];
export const SHOTS: ShotDef[] = order.map(([k, light, sunAz, sunEl], i) => ({
  id: i + 1, a: S[k], b: i + 1 < order.length ? S[order[i + 1][0]] : TOTAL, light, sunAz, sunEl,
}));
export const ID = Object.fromEntries(order.map(([k], i) => [k, i + 1])) as Record<keyof typeof S, number>;
export const FLASH_AT = S.escape;
/** crossfades (frames) into these shots: the jump from 1888 to today */
export const XFADE: Record<number, number> = { [ID.modern]: 14 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- the car per set ----------------
const T = (f: number) => f / 30;
/** park spots */
export const PARK = {
  pharm: { x: X.PHARM - 2.4, z: -2.2, yaw: Math.PI },
  road: { x: X.ROAD + 92, z: roadZ(X.ROAD + 92), yaw: roadDir(X.ROAD + 92) },
  village: { x: X.VILLAGE - 1, z: -2.4, yaw: 0 },
  arrive: { x: X.ARRIVE, z: 1.6, yaw: 0 },
};
/** decelerate into a stop over [f0, f1]: distance still to go */
const toStop = (f: number, f0: number, f1: number, d0: number) => d0 * (1 - smooth(clamp01((f - f0) / (f1 - f0)))) ** 1.6;
const STOP_PHARM = cue(4, "habis") + 8, STOP_VILLAGE = cue(7, "desa"), STOP_ARRIVE = cue(9, "sampai") + 6;
export const HITS_HOOK = [4, cue(1, "dunia"), cue(1, "sepatu")];
export const HITS_PAD = [cue(8, "memaku"), cue(8, "kulit"), cue(8, "balok"), cue(8, "rem")];
const FIX_POKE = [cue(5, "ditusuk"), cue(5, "topi")], FIX_WRAP = [cue(5, "diikat"), cue(5, "stoking")];
export const FIXES = { poke: FIX_POKE, wrap: FIX_WRAP };

export const carAt = (id: number, f: number): CarState | null => {
  const t = T(f);
  if (id === ID.hook || id === ID.hammer || id === ID.pad || id === ID.deadpan) {
    const p = PARK.village, block = id === ID.deadpan ? "gone" : id === ID.hook || id === ID.hammer ? (id === ID.hammer && f < HITS_PAD[0] ? "gone" : "leather") : "leather";
    return { x: p.x, z: p.z, yaw: p.yaw, dist: 40, t, block };
  }
  if (id === ID.escape) {
    const z = -6.6 + (1.5 * (f - S.escape)) / 30;
    return { x: X.YARD, z, yaw: -Math.PI / 2, dist: z, t, tiller: 0 };
  }
  if (id === ID.karl) return null;
  if (id === ID.roadA || id === ID.roadB || id === ID.roadC) {
    const d = (4.2 * (f - S.roadA)) / 30, x = X.ROAD - 20 + d;
    return { x, z: roadZ(x), yaw: roadDir(x), dist: d, run: true, t, tiller: 0.05 * Math.sin(t * 0.8), spinK: 0.6 };
  }
  if (id === ID.stop || id === ID.door || id === ID.pour) {
    const p = PARK.pharm, go = toStop(f, S.stop - 6, STOP_PHARM, 9);
    return { x: p.x + go, z: p.z, yaw: p.yaw, dist: -go, run: f < STOP_PHARM - 6 || f > cue(4, "dunia"), t };
  }
  if (id === ID.fuel || id === ID.ign) {
    const p = PARK.road, running = id === ID.fuel ? f >= FIX_POKE[1] + 6 : f >= FIX_WRAP[1] + 4;
    return { x: p.x, z: p.z, yaw: p.yaw, dist: 3, run: running, t };
  }
  if (id === ID.climb || id === ID.push) {
    const x = X.HILL - 47 + (1.0 * (f - S.climb)) / 30;
    return { x, y: hillY(x), z: 0, yaw: 0, pitch: Math.atan(hillSlope(x)), dist: x, run: true, t };
  }
  if (id === ID.down || id === ID.brake) {
    const x = X.HILL + 8 + (7.5 * (f - S.down)) / 30;
    return { x, y: hillY(x), z: 0, yaw: 0, pitch: Math.atan(hillSlope(x)), dist: x, run: true, t, spinK: 0.3, block: f >= cue(6, "habis") ? "gone" : f >= S.brake ? "smoke" : "wood" };
  }
  if (id === ID.village) {
    const p = PARK.village, go = toStop(f, S.village - 10, STOP_VILLAGE, 13);
    return { x: p.x - go, z: p.z, yaw: p.yaw, dist: -go, run: f < STOP_VILLAGE, t, block: "gone" };
  }
  if (id === ID.arrive || id === ID.crowd || id === ID.twist) {
    const p = PARK.arrive, go = id === ID.arrive ? toStop(f, S.arrive - 12, STOP_ARRIVE, 10) : 0;
    return { x: p.x - go, z: p.z, yaw: p.yaw, dist: -go, run: id === ID.arrive && f < STOP_ARRIVE, t, block: "leather" };
  }
  return null; // the modern act
};
/** world point of a car-local point in shot id at frame f */
export const onCar = (id: number, f: number, p: V3): V3 => carPoint(carAt(id, f)!, p);

// ---------------- today: the hatchback on the city street ----------------
export const MX = X.MODERN, LANE_Z = 1.8;
const STOP_X = MX + 4.6, STOP_MOD = cue(10, "tapi") - 10;
/** clamp pulses in the wear shot: one per braking, the lining thins a step each time */
const WEAR_HITS = [cue(10, "habis"), cue(10, "sedikit"), cue(10, "kali"), cue(10, "ngerem")];
const pulse = (f: number, h: number) => (f < h - 3 ? 0 : f < h ? (f - (h - 3)) / 3 : f < h + 8 ? 1 : f < h + 14 ? 1 - (f - h - 8) / 6 : 0);
export const SHOP_X = MX + 8;
export const SHOP_CAR = { x: SHOP_X + 3.9, z: -1.7 };
export const modernAt = (id: number, f: number): ModernState | null => {
  const t = T(f);
  if (id === ID.modern) {
    const go = toStop(f, S.modern - 14, STOP_MOD, 16), k = clamp01((f - (STOP_MOD - 30)) / 30);
    return { x: STOP_X - go, z: LANE_Z, yaw: 0, dist: -go, t, dip: 0.022 * Math.sin(Math.PI * k) * (f < STOP_MOD + 8 ? 1 : 0) };
  }
  if (id === ID.disc) {
    const c0 = cue(10, "menjepit") - 3, clamp = smooth(clamp01((f - c0) / 6));
    // rotor turns slowly (readable, no strobing), stops within ~0.7 s of the clamp
    const w = 0.75, tc = T(c0), tt = T(f), stopT = 0.7, u = Math.max(0, Math.min(stopT, tt - tc));
    const turn = tt < tc ? w * tt : w * tc + w * u - (w / (2 * stopT)) * u * u;
    return { x: STOP_X, z: LANE_Z, yaw: 0, dist: turn * 0.33, t, clamp, xray: true };
  }
  if (id === ID.wear) {
    let clamp = 0, wear = 0;
    WEAR_HITS.forEach((h, i) => { clamp = Math.max(clamp, pulse(f, h)); if (f >= h) wear = Math.max(wear, (i + smooth(clamp01((f - h) / 8))) / WEAR_HITS.length); });
    return { x: STOP_X, z: LANE_Z, yaw: 0, dist: 0.2 * t, t, clamp, wear: 0.1 + 0.85 * wear, xray: true };
  }
  if (id === ID.shop) return { x: SHOP_CAR.x, z: SHOP_CAR.z, yaw: 0, dist: 0, t };
  return null;
};
export const WEAR_PULSES = WEAR_HITS;
export const onModern = (id: number, f: number, p: V3): V3 => modernPoint(modernAt(id, f)!, p);

// ---------------- characters' anchor spots ----------------
export const seatAt = (id: number, f: number, who: keyof typeof SEATS): V3 => onCar(id, f, [SEATS[who][0], SEAT_TOP - 0.13, SEATS[who][1]]);
export const COBBLER_DOOR: V3 = [X.VILLAGE, 0, -4.55];
/** where the cobbler stands to hammer the near (left, +z) rear wheel of the parked car */
export const cobblerSpot = (): V3 => { const p = carPoint({ ...PARK.village, dist: 0, t: 0 }, [REAR_X + 0.78, 0, 0.84]); return p; };
export const brakeWorld = (id: number, f: number, side = 1): V3 => onCar(id, f, brakeAt(side));

// ---------------- cameras ----------------
const W = (id: number) => (f: number) => onCar(id, f, [0, 0, 0]);
const rideCar = (id: number, local: V3, lookLocal: V3, rest: Partial<Cam> = {}, rate = 0.002, f0 = 0) => (f: number): Shot => {
  const p = onCar(id, f, local), l = onCar(id, f, lookLocal);
  return dolly(p, l, pushK(f, f0 || SHOTS[id - 1].a, rate), rest);
};
const at = (pos: V3, look: V3, rest: Partial<Cam> = {}, f0 = 0, rate = 0.0022, punch = 0) => (f: number): Shot => dolly(pos, look, pushK(f, f0, rate, punch), rest);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const brakeV = () => brakeWorld(ID.hook, 0);
const cobS = cobblerSpot();
const CAMS: Record<number, Key[]> = {};
{
  const bk0 = brakeV();
  void bk0;
  CAMS[ID.hook] = [
    { f: 0, s: at(add(cobS, [1.9, 1.15, 3.0]), add(cobS, [-0.3, 1.05, -0.4]), { fov: 40, roll: 0.02 }, 0, 0.0035) },
    { f: cue(1, "tukang") - 8, dur: 26, s: at(add(cobS, [1.3, 1.25, 2.4]), add(cobS, [-0.3, 1.2, -0.4]), { fov: 38, roll: -0.03 }, cue(1, "tukang") - 6, 0.003) },
  ];
}
// escape (dawn): from the street past the right gate post, Bertha walks at the tiller grinning, the boys push behind
CAMS[ID.escape] = [
  { f: S.escape, s: at([6.4, 1.5, -2.6], [0.2, 1.0, -4.6], { fov: 44 }, S.escape, 0.0022) },
  { f: cue(2, "ibu") - 6, dur: 26, s: (f) => { const c = onCar(ID.escape, f, [0.6, 1.5, -1.0]); return dolly(add(c, [3.2, 0.1, 1.6]), c, pushK(f, cue(2, "ibu"), 0.0025), { fov: 38, roll: 0.04 }); } },
];
// Karl asleep at the upper window across the street
export const KARL_WIN: V3 = [X.YARD + 9.375, 4.32, -5.84];
CAMS[ID.karl] = [{ f: S.karl, s: at([KARL_WIN[0] - 0.8, 2.6, 0.2], [KARL_WIN[0], KARL_WIN[1] + 0.1, KARL_WIN[2]], { fov: 34 }, S.karl, 0.004) }];
// road: low front 3/4, push to Bertha; side tracking with the boys; crane up to the aerial
CAMS[ID.roadA] = [
  { f: S.roadA, s: rideCar(ID.roadA, [5.6, 0.8, -2.4], [0, 1.0, 0], { fov: 42 }, 0.0015) },
  { f: cue(3, "bertha") - 10, dur: 28, s: rideCar(ID.roadA, [1.8, 1.5, -2.2], [SEATS.bertha[0], 1.55, SEATS.bertha[1]], { fov: 36, roll: -0.03 }, 0.002, cue(3, "bertha")) },
];
CAMS[ID.roadB] = [
  { f: S.roadB, s: rideCar(ID.roadB, [0.6, 1.45, 4.4], [-0.05, 1.3, 0.1], { fov: 40 }, 0.0012) },
  { f: cue(3, "menyetir") - 8, dur: 30, s: rideCar(ID.roadB, [1.9, 1.3, 3.7], [0.0, 1.3, 0.1], { fov: 40, roll: 0.035 }, 0.0012, cue(3, "menyetir")) },
];
CAMS[ID.roadC] = [
  { f: S.roadC, s: rideCar(ID.roadC, [-4.5, 2.6, 5.5], [0.5, 1.0, 0], { fov: 42 }, 0.001) },
  { f: S.roadC + 4, dur: 46, s: (f) => { const c = W(ID.roadC)(f); return { pos: [c[0] - 26, 30, c[2] + 34], look: [c[0] + 18, 0, c[2] - 10], fov: 44, roll: 0 }; } },
];
// pharmacy: the car coughs to a stop; Bertha out of the door with a bottle; pouring in front of the pharmacy
CAMS[ID.stop] = [{ f: S.stop, s: at([X.PHARM + 0.4, 1.45, 5.0], [X.PHARM - 2.4, 1.15, -2.2], { fov: 40 }, S.stop, 0.0022, 0.006) }];
CAMS[ID.door] = [{ f: S.door, s: at([X.PHARM + 1.4, 1.5, 1.6], [X.PHARM, 1.55, -4.5], { fov: 40 }, S.door, 0.0025) }];
CAMS[ID.pour] = [{ f: S.pour, s: at([X.PHARM - 1.9, 1.5, 4.4], [X.PHARM - 1.6, 1.9, -3.6], { fov: 44 }, S.pour, 0.002) }];
// roadside fixes, macro on the fuel line (right side) and the ignition wire (left side)
{
  CAMS[ID.fuel] = [{ f: S.fuel, s: rideCar(ID.fuel, [0.62, 0.5, -1.05], [-0.08, 0.46, -0.42], { fov: 34, roll: 0.04 }, 0.003) }];
  CAMS[ID.ign] = [{ f: S.ign, s: rideCar(ID.ign, [0.5, 0.92, 1.2], [-0.2, 0.68, 0.56], { fov: 34, roll: -0.04 }, 0.003) }];
}
// the hill: wide up the slope, then side-on with the boys pushing
CAMS[ID.climb] = [{ f: S.climb, s: (f) => zoom([X.HILL - 64, 1.4, 10], [X.HILL - 36, 6.5, 0], 46, pushK(f, S.climb, 0.003)) }];
CAMS[ID.push] = [{ f: S.push, s: (f) => { const c = W(ID.push)(f); return dolly([c[0] - 0.6, c[1] + 1.4, 6.2], [c[0] - 0.7, c[1] + 0.95, 0], pushK(f, S.push, 0.0025), { fov: 42 }); } }];
// downhill: low ahead, then riding beside the smoking brake block
CAMS[ID.down] = [{ f: S.down, s: (f) => { const c = W(ID.down)(f); return { pos: [X.HILL + 28, hillY(X.HILL + 28) + 0.9, 2.4], look: [c[0], c[1] + 0.9, 0], fov: 40, roll: 0.07 }; } }];
CAMS[ID.brake] = [{ f: S.brake, s: (f) => { const k = brakeWorld(ID.brake, f, 1); return dolly(add(k, [0.85, 0.18, 1.25]), add(k, [-0.05, 0, 0]), pushK(f, S.brake, 0.002), { fov: 38, roll: -0.05 }); } }];
// village: wide arrival, push to the cobbler's sign; deadpan cobbler in his door
CAMS[ID.village] = [
  { f: S.village, s: at([X.VILLAGE + 6.5, 1.7, 7.5], [X.VILLAGE - 1.5, 1.9, -4], { fov: 44 }, S.village, 0.0015) },
  { f: cue(7, "tukang") - 10, dur: 26, s: at([X.VILLAGE + 5.2, 2.5, 0.8], [X.VILLAGE + 2.44, 2.62, -4.25], { fov: 36 }, cue(7, "tukang"), 0.002) },
];
CAMS[ID.deadpan] = [{ f: S.deadpan, s: at([X.VILLAGE + 0.5, 1.6, -0.6], [X.VILLAGE, 1.5, -4.55], { fov: 38 }, S.deadpan, 0.0028) }];
// hammering, then the hero close-up of the first brake lining
{
  const bk = brakeV();
  CAMS[ID.hammer] = [{ f: S.hammer, s: at(add(cobS, [2.2, 1.05, 1.9]), add(cobS, [-0.35, 0.95, -0.45]), { fov: 40 }, S.hammer, 0.0025) }];
  CAMS[ID.pad] = [
    { f: S.pad, s: at(add(bk, [0.22, 0.12, 0.5]), add(bk, [0, 0, 0]), { fov: 34 }, S.pad, 0.0022) },
    { f: cue(8, "kampas") - 4, dur: 30, s: rolled(at(add(bk, [0.18, 0.08, 0.42]), add(bk, [0, 0, 0]), { fov: 34 }, cue(8, "kampas"), 0.0022), 0.06) },
  ];
}
// arrival, Karl's telegram, the crowd, the hero shot, the end card
CAMS[ID.arrive] = [{ f: S.arrive - 6, s: at([X.ARRIVE + 7, 1.5, 8.0], [X.ARRIVE - 1.5, 1.6, 0.5], { fov: 42 }, S.arrive - 6, 0.0018) }];
export const BERTHA_STAND: V3 = [X.ARRIVE + 1.1, 0, 3.1];
CAMS[ID.crowd] = [
  { f: S.crowd, s: at([X.ARRIVE + 3.5, 5.0, 10.5], [X.ARRIVE + 0.3, 1.0, 1.8], { fov: 44 }, S.crowd, 0.001) },
  { f: S.crowd + 6, dur: 40, s: at([X.ARRIVE + 2.4, 1.55, 7.6], [X.ARRIVE + 0.4, 1.35, 2.0], { fov: 42 }, S.crowd + 30, 0.0018) },
];
CAMS[ID.twist] = [
  { f: S.twist, s: at(add(BERTHA_STAND, [0.9, 0.5, 3.3]), add(BERTHA_STAND, [-0.1, 1.5, 0]), { fov: 40 }, S.twist, 0.0015) },
  { f: cue(9, "montir") - 6, dur: 30, s: rolled(at(add(BERTHA_STAND, [0.7, 0.55, 2.6]), add(BERTHA_STAND, [-0.1, 1.55, 0]), { fov: 38 }, cue(9, "montir"), 0.0018), 0.07) },
];
// today: the hatchback brakes to the stop line (low, ahead), glide down to its front wheel; the brake in x-ray
{
  const M = (id: number) => (f: number) => onModern(id, f, [0, 0, 0]);
  CAMS[ID.modern] = [
    { f: S.modern - 8, s: (f) => { const c = M(ID.modern)(f); return dolly([MX + 12.5, 0.75, LANE_Z + 3.4], [c[0] + 0.6, 0.85, c[2]], pushK(f, S.modern, 0.0012), { fov: 40, roll: 0.02 }); } },
    { f: cue(10, "kulit") - 6, dur: 26, s: (f) => { const h = onModern(ID.modern, f, M_HUB); return dolly(add(h, [1.35, 0.32, 1.55]), add(h, [0, 0.05, 0]), pushK(f, cue(10, "kulit"), 0.0015), { fov: 38, roll: -0.03 }); } },
  ];
  // brake: 3/4 from above the caliper, so the pads close on the disc across the frame
  const calView = (id: number, d: number, side: number, fov: number, rate: number) => (f: number): Shot => {
    const c = onModern(id, f, M_CAL), h = onModern(id, f, M_HUB);
    const pos = add(c, [M_RADIAL[0] * d + 0.1 * d, M_RADIAL[1] * d, side * d]);
    return dolly(pos, [c[0] * 0.75 + h[0] * 0.25, c[1] * 0.75 + h[1] * 0.25, c[2]], pushK(f, SHOTS[id - 1].a, rate), { fov });
  };
  CAMS[ID.disc] = [{ f: S.disc, s: calView(ID.disc, 0.62, 0.62, 36, 0.0025) }];
  // wear: side-on along the rotor rim, so the sandwich backing plate / lining / disc reads in profile and the lining thins
  CAMS[ID.wear] = [{ f: S.wear, s: (f) => {
    const c = onModern(ID.wear, f, M_CAL), tx = -M_RADIAL[1], ty = M_RADIAL[0];
    return dolly(add(c, [tx * 0.42 + M_RADIAL[0] * 0.08, ty * 0.42 + M_RADIAL[1] * 0.08, 0.16]), add(c, [0, 0, 0.01]), pushK(f, S.wear, 0.002), { fov: 30 });
  } }];
  // workshop: medium on the mechanic and Bertha, then up to the sign as the end card rises below it
  CAMS[ID.shop] = [
    { f: S.shop, s: at([SHOP_X + 0.2, 1.55, 0.8], [SHOP_X - 0.05, 1.45, -5.0], { fov: 44 }, S.shop, 0.0018) },
    { f: cue(11, "cek") - 10, dur: 26, s: at([SHOP_X, 2.9, 4.8], [SHOP_X, 4.25, -8.0], { fov: 44 }, cue(11, "cek"), 0.0012) },
  ];
}

const KICKS: [number, number][] = [
  ...HITS_HOOK.map((h) => [h, 0.8] as [number, number]),
  ...HITS_PAD.map((h) => [h, 0.7] as [number, number]),
  [cue(6, "habis"), 1.4], [cue(4, "habis"), 0.6], [cue(10, "menjepit"), 0.5],
];
export const camAt = (id: number, f: number): Cam => applyKick(run(CAMS[id], f), kickAt(KICKS, f));

// ---------------- lens blur per shot (cInf px at 1080 for things at infinity; 0 = all sharp) ----------------
export type Dof = { cInf: number; focus?: (f: number) => V3 };
export const dofAt = (id: number, f: number): Dof => {
  switch (id) {
    case ID.hook: return { cInf: f < cue(1, "tukang") ? 15 : 10 };
    case ID.escape: return { cInf: 8, focus: (g) => onCar(ID.escape, g, [0.6, 1.4, -1.0]) };
    case ID.karl: return { cInf: 6 };
    case ID.roadA: return f < cue(3, "bertha") ? { cInf: 0 } : { cInf: 11 };
    case ID.roadB: return { cInf: 8 };
    case ID.stop: return { cInf: 6 };
    case ID.door: return { cInf: 10, focus: () => [X.PHARM + 0.2, 1.6, -3.6] };
    case ID.pour: return { cInf: 5 };
    case ID.fuel: case ID.ign: return { cInf: 16 };
    case ID.push: return { cInf: 8 };
    case ID.brake: return { cInf: 14 };
    case ID.village: return f < cue(7, "tukang") ? { cInf: 0 } : { cInf: 8 };
    case ID.deadpan: return { cInf: 12 };
    case ID.hammer: return { cInf: 10 };
    case ID.pad: return { cInf: 15 };
    case ID.modern: return f < cue(10, "kulit") ? { cInf: 6, focus: (g) => onModern(ID.modern, g, [0, 0.8, 0]) } : { cInf: 12 };
    case ID.disc: return { cInf: 16 };
    case ID.wear: return { cInf: 18 };
    case ID.shop: return { cInf: 4 };
    case ID.crowd: return { cInf: 4 };
    case ID.twist: return { cInf: 10, focus: () => [BERTHA_STAND[0], 1.6, BERTHA_STAND[2]] };
    default: return { cInf: 0 };
  }
};

export { clamp01, smooth, glide, lerp, S };
