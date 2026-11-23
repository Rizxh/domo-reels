// EP11 cast and effects per shot: Bertha, Eugen and Richard, Karl, the pharmacist, the cobbler and townsfolk as lit
// flat cards in the 3D world (template cast.ts helpers), plus unlit effect cards. Pure function of (shot, frame).
import * as THREE from "three";
import { Outfit, Expr, FrontOpts, SideOpts, townsfolk, INK, Pen, fxBurst } from "../toon";
import { Place, FxPlace, CamInfo, person, blob, lidAt, viewOf, q, beginStage } from "../cast";
import type { Light } from "../lights";
import { cue } from "./cues";
import {
  ID, S, SHOTS, carAt, onCar, seatAt, cobblerSpot, brakeWorld, PARK, HITS_HOOK, HITS_PAD, FIXES, KARL_WIN, BERTHA_STAND,
  COBBLER_DOOR, clamp01, smooth, onModern, WEAR_PULSES,
  SHOP_X,
} from "./shots";
import { M_PAD } from "./modern";
import { FUEL_LINE, IGN_WIRE } from "./car";
import { X } from "./set";
import { puff, zzz, hatpinHand, garter, spark, chips, sparkle, karlWindow, hammerHand } from "./fx";
import type { V3 } from "./rig";

export type CardPlace = Place & { wm?: number; hm?: number };
export type Stage = { places: CardPlace[]; fx: FxPlace[] };

// ---------------- the cast ----------------
const BERTHA: Outfit = { jacket: "#6b3550", pants: "#7d3a5c", boots: "#3a2418", dress: "#7d3a5c", hat: "ladyhat", hair: "#5a3b2a", cap: "#3b2a3a", skin: "#ffe2c2" };
const EUGEN: Outfit = { jacket: "#8a5a34", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#3d5a80", build: "kid", skin: "#ffe2c2" };
const RICHARD: Outfit = { jacket: "#2f6a43", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#b5653f", build: "kid", skin: "#f5c9a0" };
const KARL: Outfit = { jacket: "#3b3f52", pants: "#2e3040", boots: INK, hat: "hair", hair: "#6b5040", moustache: "#5a4030", build: "stout", skin: "#f5c9a0" };
const PHARMACIST: Outfit = { jacket: "#f1ede2", pants: "#3b3f52", boots: INK, hat: "hair", hair: "#bdbdbd", moustache: "#9a9a9a", skin: "#ffe2c2" };
const MECHANIC: Outfit = { jacket: "#E31E24", pants: "#2a2d36", boots: INK, hat: "cap", cap: "#1b1d24", skin: "#f1c9a0", buttons: "#ffffff" };
const COBBLER: Outfit = { jacket: "#7a5236", pants: "#4a4a52", boots: "#3a2418", hat: "cap", cap: "#5a4a3a", moustache: "#3a2a1e", build: "stout", skin: "#ecd0b6" };
const W = {
  bertha: { i: 1, o: BERTHA, okey: "bertha" }, eugen: { i: 2, o: EUGEN, okey: "eugen" }, richard: { i: 3, o: RICHARD, okey: "richard" },
  karl: { i: 4, o: KARL, okey: "karl" }, pharm: { i: 5, o: PHARMACIST, okey: "pharm" }, cob: { i: 6, o: COBBLER, okey: "cob" },
  mech: { i: 7, o: MECHANIC, okey: "mech" },
};
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => ({ i: 20 + v, o: townsfolk(v), okey: `folk${v}` }));
const FRONT = { side: false, mirror: false };

const T = (f: number) => f / 30;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** expression timeline: [fromFrame, expr] pairs, last one wins */
const ex = (f: number, list: [number, Expr][]): Expr => { let e = list[0][1]; for (const [g, x] of list) if (f >= g) e = x; return e; };
/** hammer swing 0 raised .. 1 struck, landing exactly on each hit frame */
const hammerK = (f: number, hits: number[]) => {
  let k = 0;
  for (const h of hits) {
    if (f >= h - 7 && f <= h) k = Math.max(k, smooth((f - (h - 7)) / 7));
    if (f > h && f < h + 6) k = Math.max(k, 1 - smooth((f - h) / 6));
  }
  return k;
};

export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const sh = SHOTS[id - 1], t = T(f);
  beginStage(sh.light as Light, cam);
  const car = carAt(id, f);
  const R = cam.right;
  /** pull a point a fraction k of the way toward the camera (keeps on-screen position, clears occluders) */
  const near = (p: V3, k: number): V3 => [p[0] + (cam.pos.x - p[0]) * k, p[1] + (cam.pos.y - p[1]) * k, p[2] + (cam.pos.z - p[2]) * k];
  const fx = (key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: Partial<FxPlace> = {}) =>
    out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
  const stand = (who: typeof W.bertha, p: V3, fo: FrontOpts, sc = 1, shadow = true) => {
    out.places.push(person(cam, who, p[0], p[1], p[2], FRONT, { blink: lidAt(t, who.i), ...fo }, {}, sc));
    if (shadow) blob(out, p[0], p[1], p[2], sc);
  };
  const side = (who: typeof W.bertha, p: V3, dir: [number, number], so: SideOpts) => {
    const v = viewOf(cam, p[0], p[2], dir[0], dir[1]);
    out.places.push(person(cam, who, p[0], p[1], p[2], { side: true, mirror: v.mirror }, {}, { blink: lidAt(t, who.i), ...so }));
    blob(out, p[0], p[1], p[2]);
  };
  const seated = (exprs: [Expr, Expr, Expr], looks: [number, number, number] = [0, 0, 0]) => {
    (["bertha", "eugen", "richard"] as const).forEach((k, i) => {
      const p = seatAt(id, f, k);
      out.places.push(person(cam, W[k], p[0], p[1], p[2], FRONT, { mode: "sit", expr: exprs[i], blink: lidAt(t, W[k].i), look: looks[i] }, {}));
    });
  };
  const exhaust = (dark = false, every = 7, life = 26) => {
    if (!car?.run) return;
    for (let k = 0; k < 4; k++) {
      const born = Math.floor(f / every) * every - k * every, u = (f - born) / life;
      if (u < 0 || u >= 1) continue;
      const p = onCar(id, born, [-1.18 - 0.6 * u, 0.55 + 0.5 * u, 0.12]);
      fx(`puff${dark ? "d" : ""}${q(u, 24)}`, 300, 300, (pp) => puff(pp, q(u, 24), dark ? "#6f6a74" : "#d8d5dc"), p, 0.45 + 0.6 * u, 0.45 + 0.6 * u, { soft: true });
    }
  };
  const burstAt = (hits: number[], p: V3, size = 0.5) => {
    for (const h of hits) if (f >= h && f < h + 5) { const u = (f - h) / 5; fx(`burst${q(u, 30)}`, 500, 500, (pp) => fxBurst(pp, q(u, 30)), p, size, size); }
  };

  switch (id) {
    case ID.hook: case ID.hammer: {
      const hits = id === ID.hook ? HITS_HOOK : HITS_PAD, c = cobblerSpot(), bk = brakeWorld(id, f, 1);
      const close = false; // (the old fist close-up opening is retired: the hook opens on the cobbler himself)
      const hk = q(hammerK(f, hits), 30);
      if (close) {
        // hammer head lands on the block: card centre sits right of the block, toward the camera
        fx(`hamhand${hk}`, 700, 500, (p) => hammerHand(p, hk), [bk[0] + R.x * 0.2 + 0.0, bk[1] + 0.09, bk[2] + R.z * 0.2 + 0.1], 0.5, 0.36);
      } else {
        const fo: FrontOpts = { mode: "stand", expr: id === ID.hook ? "grin" : ex(f, [[0, "stern"], [cue(8, "pertama"), "grin"]]), prop: ["hammer", hk], facing: -1 };
        const pl = person(cam, W.cob, c[0], 0, c[2], FRONT, { blink: lidAt(t, 6), ...fo }, {});
        out.places.push({ ...pl, mirror: true });
        blob(out, c[0], 0, c[2], 1.1);
      }
      burstAt(hits, [bk[0] + R.x * 0.03, bk[1] + 0.06, bk[2] + 0.1], close ? 0.3 : 0.4);
      if (id === ID.hammer) {
        stand(W.bertha, onCar(id, f, [1.7, 0, 1.55]), { mode: "stand", expr: ex(f, [[0, "nervous"], [cue(8, "lahirlah"), "grin"]]), look: -1 });
      }
      break;
    }
    case ID.escape: {
      // Bertha at the tiller on the near side, grinning to us; the boys push at the back
      const bp = onCar(id, f, [0.55, 0, -0.95]);
      stand(W.bertha, bp, { mode: "stroll", phase: (t * 0.9) % 1, expr: ex(f, [[0, "smile"], [cue(2, "ibu"), "grin"]]), look: 0, facing: 0 });
      for (const [k, dz, i] of [["eugen", 0.32, 0], ["richard", -0.3, 1]] as const) {
        const p = onCar(id, f, [-1.55, 0, dz]);
        side(W[k], p, [0, 1], { mode: "push", pose: 0.7 + 0.15 * Math.sin(t * 3 + i), expr: "grin" });
      }
      break;
    }
    case ID.karl: {
      out.places.push({ key: `karlwin|${lidAt(t, 4) > 0 ? 1 : 1}`, x: KARL_WIN[0], y: KARL_WIN[1] - 1.26, z: KARL_WIN[2], yaw: 0, size: [500, 600, 1],
        draw: (p) => karlWindow(p, KARL, 1), wm: 2.1, hm: 2.52 });
      const u = (t * 0.6) % 1;
      fx(`zzz${q(u, 30)}`, 300, 300, (p) => zzz(p, q(u, 30)), add(KARL_WIN, [0.75, 0.75, 0.15]), 0.8, 0.8);
      break;
    }
    case ID.roadA: seated([ex(f, [[0, "smile"], [cue(3, "bertha"), "grin"]]), "laugh", "smile"]); exhaust(); break;
    case ID.roadB: seated(["grin", ex(f, [[0, "laugh"], [cue(3, "rumah"), "grin"]]), ex(f, [[0, "grin"], [cue(3, "menyetir"), "laugh"]])], [0, 1, 1]); exhaust(); break;
    case ID.roadC: seated(["grin", "laugh", "laugh"]); exhaust(); break;
    case ID.stop: {
      const sputter = cue(4, "habis");
      seated([ex(f, [[0, "grin"], [sputter, "shock"], [cue(4, "pom"), "nervous"]]), ex(f, [[0, "laugh"], [sputter, "shock"]]), ex(f, [[0, "grin"], [sputter, "shock"], [cue(4, "ada"), "nervous"]])],
        [f > cue(4, "pom") ? (Math.floor(t * 2) % 2 ? 1 : -1) : 0, 0, f > cue(4, "ada") ? 1 : 0]);
      if (f < sputter) exhaust(false, 6);
      for (let k = 0; k < 3; k++) {
        const u = (f - sputter - k * 5) / 24;
        if (u >= 0 && u < 1) fx(`puffd${q(u, 24)}`, 300, 300, (p) => puff(p, q(u, 24), "#5f5a66"), onCar(id, f, [-1.25 - 0.4 * u, 0.7 + 0.6 * u + 0.2 * k, 0.1]), 0.7 + 0.8 * u, 0.7 + 0.8 * u, { soft: true });
      }
      break;
    }
    case ID.door: {
      const u = smooth((f - S.door) / (S.pour - S.door));
      stand(W.pharm, [X.PHARM - 0.2, 0, -4.7], { mode: "stand", expr: "smile", wave: q(0.5 + 0.5 * Math.sin(t * 7), 10), facing: 1 });
      stand(W.bertha, [X.PHARM + 0.4, 0, -4.2 + 1.3 * u], { mode: "stroll", phase: (t * 1.6) % 1, expr: "grin", prop: "bottle", facing: 0 });
      break;
    }
    case ID.pour: {
      const k = q(0.55 + 0.45 * smooth((f - S.pour) / 14) + 0.05 * Math.sin(t * 5), 30);
      const bp = onCar(id, f, [0.05, 0, -0.95]);
      out.places.push({ ...person(cam, W.bertha, bp[0], 0, bp[2], FRONT, { mode: "stand", expr: "smile_closed", prop: ["pour", k], blink: lidAt(t, 1), facing: -1 }, {}), mirror: true });
      blob(out, bp[0], 0, bp[2]);
      stand(W.eugen, onCar(id, f, [-1.3, 0, -1.05]), { mode: "stand", expr: "grin", look: 1 });
      stand(W.richard, onCar(id, f, [-1.9, 0, -0.75]), { mode: "stand", expr: "smile", look: 1 });
      stand(W.pharm, [X.PHARM - 0.2, 0, -4.7], { mode: "stand", expr: "smile", wave: q(0.5 + 0.5 * Math.sin(t * 6), 10), facing: -1 });
      exhaust(false, 8);
      break;
    }
    case ID.fuel: {
      const [p0, p1] = FIXES.poke, k = smooth((f - p0) / 10), pt = onCar(id, f, FUEL_LINE[0]);
      const hand: V3 = [pt[0] - R.x * (0.36 - 0.12 * k), pt[1] + 0.02, pt[2] - R.z * (0.36 - 0.12 * k)];
      if (f >= p0 - 6) fx(`pin${q(k, 20)}`, 600, 300, (p) => hatpinHand(p, q(k, 20)), add(near(hand, 0.45), [R.x * 0.19, -0.025, R.z * 0.19]), 0.5 * 0.55, 0.25 * 0.55);
      const sp = cue(5, "mampet");
      for (let j = 0; j < 2; j++) { const u = (f - sp - j * 6) / 20; if (u >= 0 && u < 1) fx(`puffd${q(u, 24)}`, 300, 300, (p) => puff(p, q(u, 24), "#5f5a66"), onCar(id, f, [-1.2 - 0.3 * u, 0.62 + 0.4 * u, 0.1]), 0.5 + 0.5 * u, 0.5 + 0.5 * u, { soft: true }); }
      if (f >= p1 && f < p1 + 16) { const u = (f - p1) / 16; fx(`spk${q(u, 30)}`, 300, 300, (p) => sparkle(p, q(u, 30)), near(add(pt, [0, 0.06, 0]), 0.4), 0.22 * 0.6, 0.22 * 0.6); }
      exhaust(false, 6);
      break;
    }
    case ID.ign: {
      const [w0, w1] = FIXES.wrap, plug = onCar(id, f, [-0.9, 0.8, 0.2]), pt = onCar(id, f, IGN_WIRE[1]);
      const good = f >= w1, u = (t * 3) % 1;
      if (f >= cue(5, "rusak") - 4 || good) fx(`sp${good ? "g" : "b"}${q(u, 15)}`, 300, 300, (p) => spark(p, q(u, 15), good), near(add(plug, [0, 0.04, 0]), 0.45), (good ? 0.22 : 0.3) * 0.55, (good ? 0.22 : 0.3) * 0.55);
      if (f >= w0 - 4) { const k = clamp01((f - w0) / (w1 - w0)); fx(`garter${q(k, 10)}`, 600, 400, (p) => garter(p, q(k, 10)), near(add(pt, [0, 0.02, 0]), 0.5), 0.42 * 0.5, 0.28 * 0.5); }
      exhaust(false, 6);
      break;
    }
    case ID.climb: seated(["nervous", "nervous", "pained"]); exhaust(); break;
    case ID.push: {
      const bp = seatAt(id, f, "bertha");
      out.places.push(person(cam, W.bertha, bp[0], bp[1], bp[2], FRONT, { mode: "sit", expr: "grin", blink: lidAt(t, 1) }, {}));
      for (const [k, dz, i] of [["eugen", 0.3, 0], ["richard", -0.28, 1]] as const) {
        const p = onCar(id, f, [-1.62, 0, dz]);
        side(W[k], p, [1, 0], { mode: "push", pose: 0.8 + 0.12 * Math.sin(t * 4 + i * 1.7), expr: i ? "pained" : "grin" });
      }
      exhaust(true, 6);
      break;
    }
    case ID.down: seated([ex(f, [[0, "grin"], [cue(6, "turunan"), "shock"]]), "shock", "laugh"]); exhaust(); break;
    case ID.brake: {
      const k0 = S.brake, gone = cue(6, "habis"), bk = brakeWorld(id, f, 1);
      for (let j = 0; j < 5; j++) {
        const born = Math.floor(f / 4) * 4 - j * 4, u = (f - born) / 20, grow = clamp01((born - k0) / (gone - k0));
        if (u < 0 || u >= 1 || born < k0) continue;
        const p = add(brakeWorld(id, born, 1), [-0.15 - 0.5 * u, 0.1 + 0.5 * u, 0.06]);
        fx(`puffb${q(u, 24)}`, 300, 300, (pp) => puff(pp, q(u, 24), f >= gone ? "#4f4a56" : "#bdb8c4"), p, (0.25 + 0.4 * grow) * (1 + u), (0.25 + 0.4 * grow) * (1 + u), { soft: true });
      }
      if (f >= gone && f < gone + 14) { const u = (f - gone) / 14; fx(`chips${q(u, 30)}`, 400, 400, (p) => chips(p, q(u, 30)), add(bk, [0, 0.05, 0.1]), 0.7, 0.7); }
      break;
    }
    case ID.village: {
      seated([ex(f, [[0, "nervous"], [cue(7, "untungnya"), "relief"]]), "dazed", ex(f, [[0, "nervous"], [cue(7, "sepatu"), "relief_open"]])]);
      exhaust(true, 6);
      stand(FOLK[1], [X.VILLAGE + 5.5, 0, -3.8], { mode: "stand", expr: "smile", look: -1 });
      break;
    }
    case ID.deadpan: {
      stand(W.cob, COBBLER_DOOR, { mode: "stand", expr: "neutral", prop: "shoe", blink: Math.max(0.5, lidAt(t, 6)), facing: 0 });
      stand(W.bertha, [X.VILLAGE - 1.25, 0, -3.65], { mode: "stand", expr: ex(f, [[0, "relief"], [cue(7, "cuma"), "nervous"]]), look: 1, facing: 1 });
      stand(W.eugen, [X.VILLAGE - 2.0, 0, -3.8], { mode: "stand", expr: ex(f, [[0, "grin"], [cue(7, "cuma"), "dazed"]]), look: 1 });
      break;
    }
    case ID.pad: {
      const s = cue(8, "kampas");
      if (f >= s && f < s + 22) { const u = (f - s) / 22; fx(`spk${q(u, 30)}`, 300, 300, (p) => sparkle(p, q(u, 30)), add(brakeWorld(id, f, 1), [0.06, 0.08, 0.1]), 0.16, 0.16); }
      break;
    }
    case ID.arrive: {
      seated([ex(f, [[0, "grin"], [cue(9, "sampai"), "relief"]]), "laugh", "relief_open"]);
      exhaust(false, 7);
      stand(FOLK[0], [X.ARRIVE + 3.2, 0, -2.6], { mode: "stand", expr: "shock", look: -1 });
      stand(FOLK[3], [X.ARRIVE + 4.6, 0, -3.1], { mode: "stand", expr: "smile", look: -1 });
      break;
    }
    case ID.crowd: case ID.twist: {
      const twist = id === ID.twist;
      stand(W.bertha, BERTHA_STAND, twist
        ? { mode: "stand", expr: ex(f, [[0, "grin"], [cue(9, "ibu"), "smile_closed"]]), prop: "hatpin", facing: 0 }
        : { mode: "stand", expr: ex(f, [[0, "relief"], [cue(9, "selamat"), "grin"]]), facing: 0 });
      stand(W.eugen, onCar(id, f, [1.6, 0, 1.0]), { mode: "stand", expr: "laugh", wave: q(0.5 + 0.5 * Math.sin(t * 8), 10) });
      stand(W.richard, onCar(id, f, [-1.7, 0, 1.15]), { mode: "stand", expr: "grin" });
      const ring: [number, number, number][] = [[-3.6, -1.6, 0], [-2.6, -2.9, 1], [-1.0, -3.4, 2], [0.8, -3.2, 3], [2.4, -2.8, 4], [3.4, -1.3, 5], [-4.2, 0.6, 1], [4.0, 0.9, 3], [-3.0, 2.2, 0], [3.3, 2.6, 2]];
      ring.forEach(([dx, dz, v], i) => {
        const p: V3 = [X.ARRIVE + dx, 0, PARK.arrive.z + dz];
        const cheer = twist ? "smile" : (["grin", "laugh", "shock", "relief_open"] as Expr[])[i % 4];
        stand(FOLK[v], p, { mode: "stand", expr: cheer, wave: !twist && i % 3 === 0 ? q(0.5 + 0.5 * Math.sin(t * 7 + i), 10) : undefined, look: dx > 0 ? -1 : 1 });
      });
      if (twist) {
        const s = cue(9, "jarum");
        if (f >= s && f < s + 24) {
          const u = (f - s) / 24;
          fx(`spk${q(u, 30)}`, 300, 300, (p) => sparkle(p, q(u, 30)), [BERTHA_STAND[0] + R.x * 0.3, 1.94, BERTHA_STAND[2] + R.z * 0.3 + 0.05], 0.3, 0.3);
        }
      }
      break;
    }
    case ID.disc: {
      // the pads bite: a burst of sparkle and a small heat shimmer at the pad, held a moment
      const c0 = cue(10, "menjepit") - 3, pad = onModern(id, f, M_PAD);
      if (f >= c0 && f < c0 + 20) { const u = (f - c0) / 20; fx(`spk${q(u, 30)}`, 300, 300, (p) => sparkle(p, q(u, 30)), near(add(pad, [0.03, 0.06, 0]), 0.35), 0.16, 0.16); }
      break;
    }
    case ID.wear: {
      // each braking puffs a little dust off the lining
      const pad = onModern(id, f, M_PAD);
      for (const h of WEAR_PULSES) {
        const u = (f - h) / 18;
        if (u >= 0 && u < 1) fx(`dust${q(u, 24)}`, 300, 300, (p) => puff(p, q(u, 24), "#8d8780"), near(add(pad, [0.05 + 0.08 * u, 0.02 + 0.05 * u, 0.03]), 0.3), 0.04 + 0.05 * u, 0.04 + 0.05 * u, { soft: true });
      }
      break;
    }
    case ID.shop: {
      // today, outside the Doktermobil workshop: the mechanic waves, Bertha (cameo) shows off her hatpin
      stand(W.mech, [SHOP_X + 0.75, 0.17, -5.0], { mode: "stand", expr: ex(f, [[0, "smile"], [cue(11, "doktermobil"), "grin"]]), wave: q(0.5 + 0.5 * Math.sin(t * 6), 10), facing: 0 });
      stand(W.bertha, [SHOP_X - 0.85, 0.17, -4.8], { mode: "stand", expr: ex(f, [[0, "smile"], [cue(11, "sepatu"), "laugh"]]), prop: "hatpin", facing: 0 });
      break;
    }
    default: break;
  }
  return out;
};
export { THREE };
