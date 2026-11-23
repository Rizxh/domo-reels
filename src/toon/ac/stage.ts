// EP13 cast and effects per shot: Siska, her date Dimas, the goat (gag), the Doktermobil mechanic; smell waves,
// fresheners and perfume, part labels, airflow, the cleaning wand, bursts and sparkles. Pure function of (shot, frame).
import { Outfit, Expr, FrontOpts, INK, Pen, fxBurst } from "../toon";
import { Place, FxPlace, CamInfo, person, blob, lidAt, q, beginStage } from "../cast";
import type { Light } from "../lights";
import { cue } from "./cues";
import { ID, S, SHOTS, seatAt, ventAt, onCar, hw, CLEAN, GROW, SHOP_X, SHOP_CAR, dateWalk, PARKED } from "./shots";
import { HV } from "./hvac";
import { goat, waves, scope, label, labelSize, airPath, perfume, freshener, wand } from "./fx";
import { sparkle } from "../benz/fx";
import { M_ACBOX } from "../benz/modern";
import { TOON_BRAND } from "../brand";
import type { V3 } from "../benz/rig";

export type CardPlace = Place & { wm?: number; hm?: number };
export type Stage = { places: CardPlace[]; fx: FxPlace[] };

const SISKA: Outfit = { jacket: "#2f9e93", pants: "#2e3350", boots: "#3a2a2a", hat: "hair", hair: "#2a1d1a", dress: "#f0b23a", skin: "#f5c9a0" };
const DIMAS: Outfit = { jacket: "#3b5fa8", pants: "#2b2e38", boots: "#3a2a2a", hat: "hair", hair: "#1d1612", skin: "#e9b98f" };
const MECHANIC: Outfit = { jacket: TOON_BRAND.uniform, pants: "#2a2d36", boots: INK, hat: "cap", cap: "#1b1d24", skin: "#f1c9a0", buttons: "#ffffff" };
const W = { siska: { i: 1, o: SISKA, okey: "siska" }, dimas: { i: 2, o: DIMAS, okey: "dimas" }, mech: { i: 7, o: MECHANIC, okey: "mech" } };
const FRONT = { side: false, mirror: false };
const T = (f: number) => f / 30;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const ex = (f: number, list: [number, Expr][]): Expr => { let e = list[0][1]; for (const [g, x] of list) if (f >= g) e = x; return e; };

export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const sh = SHOTS[id - 1], t = T(f);
  beginStage(sh.light as Light, cam);
  const fx = (key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: Partial<FxPlace> = {}) =>
    out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
  const stand = (who: typeof W.siska, p: V3, fo: FrontOpts, sc = 1) => {
    out.places.push(person(cam, who, p[0], p[1], p[2], FRONT, { blink: lidAt(t, who.i), ...fo }, {}, sc));
    blob(out, p[0], p[1], p[2], sc);
  };
  const seated = (who: typeof W.siska, p: V3, fo: FrontOpts) => out.places.push(person(cam, who, p[0], p[1], p[2], FRONT, { mode: "sit", blink: lidAt(t, who.i), ...fo }, {}));
  /** the goat card: seated in the car (head + shoulders) or standing */
  const goatAt = (p: V3, seatedG: boolean, eyes: "smug" | "happy" | "shut" = "smug", sc = 1, mirror = false) => {
    const chew = q((t * 2.2) % 1, 8), y = seatedG ? p[1] + 0.5 : p[1];
    out.places.push({ key: `goat3|${chew}|${eyes}|${seatedG ? 1 : 0}`, x: p[0], y, z: p[2], size: [440, 440, 1], draw: (pp) => goat(pp, chew, eyes, seatedG), wm: 1.05 * sc, hm: 1.05 * sc, mirror });
    if (!seatedG) blob(out, p[0], p[1], p[2], 0.85 * sc);
  };
  const stink = (p: V3, size: number, col = "#8fbf4a") => { const u = q((t * 0.8) % 1, 24); fx(`wave${col}${u}`, 300, 400, (pp) => waves(pp, u, col), p, size * 0.75, size, { soft: true }); };
  const burst = (at0: number, p: V3, size: number) => { if (f >= at0 && f < at0 + 6) { const u = (f - at0) / 6; fx(`burst${q(u, 30)}`, 500, 500, (pp) => fxBurst(pp, q(u, 30)), p, size, size); } };
  const sparkles = (at0: number, p: V3, size: number, len = 20) => { if (f >= at0 && f < at0 + len) { const u = (f - at0) / len; fx(`spk${q(u, 30)}`, 300, 300, (pp) => sparkle(pp, q(u, 30)), p, size, size); } };
  /** a part label above a point (world height h m), popping in from frame `from` */
  const tag = (title: string, sub: string, p: V3, from: number, h = 0.55) => {
    if (f < from) return;
    const k = q(Math.min(1, (f - from) / 6) ** 0.6, 12), [cw, ch] = labelSize(title, sub), hh = h * ch / 146;
    fx(`tag|${title}|${sub}|${k}`, cw, ch, (pp) => label(pp, title, sub, k), [p[0], p[1] + hh / 2, p[2]], hh * cw / ch, hh);
  };
  const inCar = (siskaExpr: Expr, goatOn: boolean, goatEyes: "smug" | "happy" | "shut" = "smug") => {
    seated(W.siska, seatAt(id, f, "driver"), { expr: siskaExpr, look: 0 });
    if (goatOn) goatAt(add(seatAt(id, f, "passenger"), [0, 0, 0.05]), true, goatEyes, 1, false);
  };
  const C = HV.core, Fl = HV.filter;

  switch (id) {
    case ID.hookOut: {
      // Dimas steps away from the passenger side holding his nose; Siska frozen at the wheel
      seated(W.siska, seatAt(id, f, "driver"), { expr: ex(f, [[0, "smile"], [cue(1, "turun") + 4, "shock"]]), look: 1 });
      stand(W.dimas, dateWalk(f - S.hookOut), { mode: "stroll", phase: (t * 1.4) % 1, expr: "pained", facing: 1 });
      stink(onCar(id, f, [-0.2, 1.55, 0.95]), 0.75);
      break;
    }
    case ID.hookGoat: {
      const g0 = cue(1, "kambing") - 2;
      inCar(ex(f, [[0, "shock"], [g0 + 4, "nervous"]]), f >= g0);
      burst(g0, add(seatAt(id, f, "passenger"), [0, 1.0, 0.1]), 0.7);
      stink(add(ventAt(id, f), [0.1, 0.3, 0.0]), 0.38);
      break;
    }
    case ID.problem: {
      inCar(ex(f, [[0, "nervous"], [cue(2, "apek"), "pained"]]), true, "smug");
      if (f >= cue(2, "nyala") - 4) stink(add(ventAt(id, f), [0.1, 0.3, 0.0]), 0.42);
      break;
    }
    case ID.falsehope: {
      const back = cue(3, "balik");
      inCar(ex(f, [[0, "nervous"], [cue(3, "parfum"), "grin"], [cue(3, "wanginya") + 6, "nervous"], [back, "pained"]]), true, f >= back ? "happy" : "smug");
      // three fresheners clip onto the vents one after another
      const fr: [number, string, number][] = [[cue(3, "pengharum"), "#f2c94c", -0.3], [cue(3, "ganti"), "#7fc8a9", 0.0], [cue(3, "tiga"), "#f08fb6", 0.3]];
      for (const [at0, hue, z] of fr) if (f >= at0) { fx(`fresh${hue}`, 160, 160, (pp) => freshener(pp, hue), onCar(id, f, [0.36, 0.86, z]), 0.13, 0.13); burst(at0, onCar(id, f, [0.36, 0.95, z]), 0.2); }
      // perfume puffs
      const p0 = cue(3, "disemprot") - 4;
      if (f >= p0 - 6 && f < cue(3, "wanginya")) { const k = q(((f - p0 + 30) % 14) / 14, 14); fx(`perf${k}`, 400, 300, (pp) => perfume(pp, k), onCar(id, f, [0.15, 1.2, -0.72]), 0.4, 0.3); }
      if (f >= back - 2) stink(add(ventAt(id, f), [0.1, 0.3, 0.0]), 0.4);
      break;
    }
    case ID.where: {
      tag("AC ada di sini", "di balik dasbor", add(onCar(id, f, M_ACBOX), [0, 0.34, 0]), S.where + 8, 0.22);
      break;
    }
    case ID.airflow: {
      const k = q(Math.min(1, (f - S.airflow) / 24), 15), u = q(t % 10, 60);
      fx(`air|${k}|${u}`, 1600, 900, (pp) => airPath(pp, u, k), hw([0, 2.2, 0.75]), 6.4, 3.6);
      tag("KIPAS", "", hw([HV.blower[0], HV.blower[1] + 0.85, 0.6]), S.airflow + 2, 0.5);
      tag("FILTER KABIN", "", hw([(Fl.x0 + Fl.x1) / 2, Fl.y1 + 0.35, 0.4]), S.airflow + 8, 0.5);
      tag("EVAPORATOR", "", hw([(C.x0 + C.x1) / 2, C.y1 + 0.45, 0.2]), S.airflow + 14, 0.5);
      break;
    }
    case ID.grow: {
      tag("EVAPORATOR", "bagian paling dingin di AC", hw([(C.x0 + C.x1) / 2, C.y1 + 0.3, C.z1 + 0.2]), S.grow + 2, 0.3);
      if (f >= GROW.mold0) tag("JAMUR", "tumbuh karena lembap", hw([(C.x0 + C.x1) / 2 + 0.1, C.y0 + 0.65, C.z1 + 0.25]), GROW.mold0 + 6, 0.24);
      for (let k = 0; k < 3; k++) { const u = ((t * 0.5 + k / 3) % 1); if (f < GROW.mold0) fx(`mistw${q(u, 24)}`, 300, 400, (pp) => waves(pp, q(u, 24), "#cfe8ff", 2), hw([C.x0 + 0.4 + k * 0.5, C.y1 - 0.2 + 0.3 * u, C.z1 + 0.4]), 0.35, 0.46, { soft: true }); }
      break;
    }
    case ID.filter: tag("FILTER KABIN", "kotor, udara jadi apek", hw([(Fl.x0 + Fl.x1) / 2, Fl.y1 + 0.35, Fl.z + 0.2]), S.filter + 2, 0.3); break;
    case ID.drain: tag("SALURAN AIR", "mampet, embun tertahan", hw(add(HV.outlet, [0.0, 0.55, -0.3])), S.drain + 2, 0.18); break;
    case ID.inspect: {
      const m: V3 = [SHOP_CAR.x + 2.7, 0, -0.2];
      stand(W.mech, m, { mode: "stand", expr: ex(f, [[0, "neutral"], [cue(6, "kamera"), "stern"]]), facing: -1 });
      const live = q(Math.min(1, Math.max(0, (f - cue(6, "kamera")) / 10)), 10);
      fx(`scope${live}`, 400, 300, (pp) => scope(pp, live), [m[0] + cam.right.x * 0.45, 1.3, m[2] + cam.right.z * 0.45 + 0.2], 0.5, 0.38);
      stand(W.siska, [SHOP_CAR.x + 3.7, 0, 0.5], { mode: "stand", expr: "nervous", look: -1, facing: -1 });
      break;
    }
    case ID.cleanEvap: {
      // the wand sweeps across the fins spraying foam, then the rinse carries foam and mould down
      const sweep = Math.min(1, Math.max(0, (f - CLEAN.foam0) / (CLEAN.foam1 - CLEAN.foam0)));
      if (f < CLEAN.rinse1) {
        const on = f < CLEAN.foam1 + 2, u = q(t % 10, 60);
        const wx = C.x0 - 0.2 + (C.x1 - C.x0 + 0.2) * sweep, wy = C.y1 - 0.3 - 0.9 * Math.abs(Math.sin(sweep * 6));
        fx(`wand|${on ? 1 : 0}|${u}`, 500, 300, (pp) => wand(pp, on, u), hw([wx - 0.55, wy, C.z1 + 0.7]), 1.2, 0.72);
      }
      tag("EVAPORATOR", "dicuci busa + dibilas", hw([(C.x0 + C.x1) / 2, C.y1 + 0.3, C.z1 + 0.2]), S.cleanEvap + 2, 0.3);
      sparkles(CLEAN.rinse1 - 8, hw([C.x1 - 0.3, C.y1 - 0.4, C.z1 + 0.4]), 0.6);
      break;
    }
    case ID.cleanFilter: {
      tag(f >= CLEAN.drop0 ? "FILTER BARU" : "FILTER LAMA", "", hw([(Fl.x0 + Fl.x1) / 2, Fl.y1 + 0.5, Fl.z + 0.4]), S.cleanFilter + 2, 0.32);
      sparkles(CLEAN.drop1 - 2, hw([Fl.x1 - 0.2, Fl.y1 - 0.4, Fl.z + 0.4]), 0.6);
      break;
    }
    case ID.cleanDrain: {
      tag("SALURAN AIR", "lancar lagi", hw(add(HV.outlet, [0.0, 0.55, -0.3])), S.cleanDrain + 2, 0.18);
      sparkles(CLEAN.flush1 - 2, hw(add(HV.outlet, [0.2, 0.15, 0.1])), 0.35);
      break;
    }
    case ID.result: {
      seated(W.siska, seatAt(id, f, "driver"), { expr: "laugh", look: 1 });
      seated(W.dimas, seatAt(id, f, "passenger"), { expr: ex(f, [[0, "smile"], [cue(8, "gebetannya"), "grin"]]), look: -1 });
      stink(onCar(id, f, [-0.9, 2.0, -0.6]), 0.5, "#bfe3ff");
      sparkles(cue(8, "wangi"), onCar(id, f, [-0.2, 1.8, -0.9]), 0.45);
      break;
    }
    case ID.shop: {
      stand(W.mech, [SHOP_X + 1.3, 0.17, -5.0], { mode: "stand", expr: ex(f, [[0, "smile"], [cue(9, "doktermobil"), "grin"]]), wave: q(0.5 + 0.5 * Math.sin(t * 6), 10), facing: 0 });
      stand(W.siska, [SHOP_X - 0.25, 0.17, -4.8], { mode: "stand", expr: "grin", facing: 0 });
      stand(W.dimas, [SHOP_X - 1.5, 0.17, -4.9], { mode: "stand", expr: "smile", facing: 0 });
      void PARKED;
      break;
    }
    default: break;
  }
  return out;
};
