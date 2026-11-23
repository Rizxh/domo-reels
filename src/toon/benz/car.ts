// Benz Patent-Motorwagen No. 3 (1888), built from primitives in the toon look: dark tube frame, two big rear wheels
// and one front wheel with wooden spokes and iron tyres, a wooden tub with a tufted red bench, the single-cylinder
// engine at the back with its horizontal flywheel and brass cooling tank, a tiller on a vertical column, wooden brake
// blocks on the rear tyres. Local frame: forward +x, up +y, left +z; origin on the ground midway between the axles.
import * as THREE from "three";
import { Batch, V, boxGeo, lam } from "../build";
import { beam, ctex } from "../paint";
import { twoTone } from "../shade";
import type { V3 } from "./rig";

export const REAR_X = -0.62, FRONT_X = 0.98, REAR_R = 0.56, FRONT_R = 0.4, TRACK = 1.28;
export const SEAT_TOP = 1.02;
/** seats on the bench (local x, z): Bertha on the right at the tiller, the boys on her left */
export const SEATS: Record<"bertha" | "eugen" | "richard", [number, number]> = { bertha: [-0.12, -0.2], eugen: [-0.14, 0.2], richard: [-0.16, 0.5] };
/** macro targets (local): the copper fuel line and the ignition wire (start, end) */
export const FUEL_LINE: V3[] = [[-0.02, 0.47, -0.4], [-0.2, 0.44, -0.43], [-0.45, 0.46, -0.36], [-0.72, 0.56, -0.3]];
export const IGN_WIRE: V3[] = [[0.0, 0.72, 0.56], [-0.3, 0.66, 0.56], [-0.56, 0.72, 0.42], [-0.88, 0.8, 0.2]];
/** brake block contact on the rear tyre, angle from +x toward +y */
const BRAKE_A = 0.95;
export const brakeAt = (side: number): V3 => [REAR_X + (REAR_R + 0.06) * Math.cos(BRAKE_A), REAR_R + (REAR_R + 0.06) * Math.sin(BRAKE_A), side * (TRACK / 2)];

export type CarState = {
  x: number; y?: number; z: number; yaw: number; pitch?: number;
  /** distance travelled (m): turns the wheels */ dist: number;
  /** engine running: flywheel spin + body shudder */ run?: boolean; t: number;
  tiller?: number;
  /** wheel turn per metre (1 = rolling); below 1 on fast shots so spokes never strobe */ spinK?: number;
  /** brake blocks: whole wood, smoking, worn away, or relined with leather */ block?: "wood" | "smoke" | "gone" | "leather";
};

const brass = () => twoTone(new THREE.MeshPhongMaterial({ color: "#d9a640", specular: "#fff1c4", shininess: 55 }), 0.15);
const copper = () => twoTone(new THREE.MeshPhongMaterial({ color: "#c8703e", specular: "#ffd2b0", shininess: 50 }), 0.15);
const iron = () => twoTone(new THREE.MeshPhongMaterial({ color: "#2e3240", specular: "#7c8090", shininess: 40 }), 0.15);
/** tufted leather: deep red with darker diamond tufts and buttons */
const tuftTex = () => ctex("tuft", 256, 256, (g) => {
  g.fillStyle = "#9a3434"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(60,10,16,0.55)"; g.lineWidth = 4;
  for (let k = -256; k < 512; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 256, 256); g.stroke(); g.beginPath(); g.moveTo(k + 256, 0); g.lineTo(k, 256); g.stroke(); }
  g.fillStyle = "#4a0f16";
  for (let y = 0; y <= 256; y += 64) for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.beginPath(); g.arc(x + 32, y + 32, 6, 0, 7); g.fill(); }
});

const tubeBetween = (a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 8) => {
  const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), seg);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1));
  return g.applyMatrix4(m);
};
const curveTube = (pts: V3[], r: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V(...p))), 32, r, 8, false);

/** one wheel in its own group (spins about local z), plane XY */
const wheel = (r: number, n: number, mats: Record<string, THREE.Material>) => {
  const b = new Batch(), grp = new THREE.Group();
  b.add(new THREE.TorusGeometry(r, 0.03, 10, 56), mats.iron);
  b.add(new THREE.TorusGeometry(r - 0.05, 0.034, 8, 56), mats.wood);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, L = r - 0.11;
    const s = new THREE.BoxGeometry(0.034, L, 0.04);
    s.translate(0, 0.07 + L / 2, 0); s.rotateZ(a);
    b.add(s, mats.wood);
  }
  b.add(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 14).rotateX(Math.PI / 2), mats.wood);
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10).rotateX(Math.PI / 2), mats.brass);
  b.build(grp);
  return grp;
};

/** a car wheel scaled up to radius r (the night-stage demo wheel), same materials as the car */
let shared: Record<string, THREE.Material> | null = null;
export const bigWheel = (r: number) => {
  const g = new THREE.Group(), w = wheel(REAR_R, 12, shared!);
  w.scale.setScalar(r / REAR_R);
  g.add(w);
  g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return g;
};

export class Motorwagen {
  root = new THREE.Group();
  private body = new THREE.Group();
  private wheels: { g: THREE.Group; r: number }[] = [];
  private fly = new THREE.Group();
  private tiller = new THREE.Group();
  private blocks: THREE.Mesh[] = [];
  private pads: THREE.Mesh[] = [];

  constructor() {
    const M: Record<string, THREE.Material> = {
      iron: iron(), brass: brass(), copper: copper(),
      wood: lam("carWood", () => ({ map: beam() })),
      woodDark: lam("carWoodDark", () => ({ color: "#8a5a34" })),
      seat: lam("carSeat", () => ({ map: tuftTex() })),
      engine: twoTone(new THREE.MeshPhongMaterial({ color: "#3b4a44", specular: "#80908a", shininess: 30 }), 0.15),
      wire: lam("carWire", () => ({ color: "#7a1f22" })),
      belt: lam("carBelt", () => ({ color: "#5a3a26" })),
      block: lam("brakeWood", () => ({ color: "#d6a463" })),
      leather: lam("brakeLeather", () => ({ color: "#6b3a22" })),
    };
    shared = M;
    this.root.add(this.body);
    const b = new Batch();
    const T = (a: V3, c: V3, r = 0.028) => b.add(tubeBetween(V(...a), V(...c), r), M.iron);
    // ---- frame: two side rails rising to the steering head, cross tubes, rear axle, front fork ----
    for (const s of [-1, 1]) {
      const z = s * 0.42;
      T([REAR_X - 0.35, 0.5, z], [REAR_X + 0.2, 0.5, z]);
      T([REAR_X + 0.2, 0.5, z], [0.55, 0.62, z * 0.7]);
      T([0.55, 0.62, z * 0.7], [FRONT_X - 0.12, 0.92, s * 0.06]);
      T([REAR_X, REAR_R, s * (TRACK / 2 - 0.04)], [REAR_X, 0.5, z], 0.024); // axle hanger
    }
    T([REAR_X, REAR_R, -TRACK / 2], [REAR_X, REAR_R, TRACK / 2], 0.03); // rear axle
    for (const x of [REAR_X - 0.35, 0.1, 0.55]) T([x, 0.52, -0.42], [x, 0.52, 0.42], 0.022);
    // steering head + fork to the front hub
    T([FRONT_X - 0.12, 0.84, 0], [FRONT_X - 0.12, 1.0, 0], 0.045);
    for (const s of [-1, 1]) T([FRONT_X - 0.12, 0.86, s * 0.07], [FRONT_X, FRONT_R, s * 0.07], 0.022);
    // full-elliptic leaf springs under the tub (brass-banded)
    for (const s of [-1, 1]) {
      const sp = new THREE.TorusGeometry(0.28, 0.018, 6, 28, Math.PI); sp.scale(1, 0.18, 1); sp.translate(-0.25, 0.6, s * 0.42);
      b.add(sp, M.iron);
    }
    // ---- wooden tub + footboard + dash ----
    b.add(boxGeo(V(-0.48, 0.6, -0.5), V(0.42, 0.86, 0.5), 0, true), M.wood);
    b.add(boxGeo(V(0.42, 0.56, -0.44), V(0.82, 0.6, 0.44), 0, true), M.woodDark); // footboard
    b.add(boxGeo(V(0.78, 0.6, -0.44), V(0.84, 0.82, 0.44), 0, true), M.wood); // dash board
    // brass edge on the tub
    b.add(boxGeo(V(-0.49, 0.85, -0.51), V(0.43, 0.88, 0.51), 0, false), M.brass);
    // ---- bench: cushion + backrest, tufted leather ----
    b.add(boxGeo(V(-0.44, 0.88, -0.48), V(0.1, SEAT_TOP, 0.48), 0, true), M.seat);
    b.add(boxGeo(V(-0.5, 0.92, -0.48), V(-0.4, 1.4, 0.48), 0, true), M.seat);
    for (const s of [-1, 1]) b.add(boxGeo(V(-0.5, 0.88, s * 0.48 - 0.03), V(0.06, 1.16, s * 0.48 + 0.03), 0, true), M.woodDark); // armrests
    // ---- engine at the back: crankcase, horizontal cylinder, cooling tank, fuel tank ----
    b.add(boxGeo(V(-1.12, 0.42, -0.26), V(-0.62, 0.74, 0.26), 0, true), M.engine);
    b.add(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 18).rotateZ(Math.PI / 2).translate(-0.86, 0.82, 0.12), M.engine);
    for (let i = 0; i < 6; i++) b.add(new THREE.CylinderGeometry(0.155, 0.155, 0.018, 18).rotateZ(Math.PI / 2).translate(-1.02 + i * 0.06, 0.82, 0.12), M.engine); // fins
    b.add(new THREE.CylinderGeometry(0.12, 0.12, 0.42, 20).translate(-0.86, 1.12, -0.18), M.brass); // cooling water tank
    b.add(new THREE.CylinderGeometry(0.125, 0.125, 0.02, 20).translate(-0.86, 1.34, -0.18), M.iron);
    b.add(new THREE.CylinderGeometry(0.085, 0.085, 0.3, 16).rotateZ(Math.PI / 2).translate(0.13, 0.47, -0.4), M.brass); // fuel tank (slung under the tub)
    b.add(curveTube(FUEL_LINE, 0.014), M.copper);
    b.add(curveTube(IGN_WIRE, 0.012), M.wire);
    b.add(boxGeo(V(0.0, 0.64, 0.5), V(0.16, 0.8, 0.6)), M.woodDark); // ignition coil box on the outside of the tub
    b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10).rotateZ(Math.PI / 2).translate(-0.9, 0.8, 0.14), M.brass); // spark plug boss
    // belt from the engine pulley to the countershaft, chains to the rear wheels
    b.add(boxGeo(V(-0.64, 0.5, 0.34), V(-0.1, 0.54, 0.38)), M.belt);
    for (const s of [-1, 1]) b.add(tubeBetween(V(-0.3, 0.52, s * 0.52), V(REAR_X, REAR_R, s * 0.56), 0.02, 6), M.iron);
    // brake lever on the right side
    b.add(tubeBetween(V(0.0, 0.62, -0.53), V(0.18, 1.18, -0.56), 0.016), M.iron);
    b.add(new THREE.SphereGeometry(0.035, 10, 8).translate(0.18, 1.2, -0.56), M.woodDark);
    b.build(this.body);
    // ---- moving parts ----
    for (const [x, r, z, n] of [[REAR_X, REAR_R, TRACK / 2, 12], [REAR_X, REAR_R, -TRACK / 2, 12], [FRONT_X, FRONT_R, 0, 10]] as const) {
      const g = wheel(r, n, M);
      g.position.set(x, r, z);
      this.root.add(g);
      this.wheels.push({ g, r });
    }
    const fb = new Batch();
    fb.add(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 40), M.iron);
    for (let i = 0; i < 4; i++) fb.add(new THREE.BoxGeometry(0.56, 0.06, 0.05).rotateY((i * Math.PI) / 4).translate(0, 0.03, 0), M.engine);
    fb.add(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), M.brass);
    fb.build(this.fly);
    this.fly.position.set(-0.92, 0.4, -0.06);
    this.body.add(this.fly);
    const tb = new Batch();
    tb.add(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 10).translate(0, 0.25, 0), M.iron);
    tb.add(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10).rotateZ(Math.PI / 2).translate(-0.17, 0.5, 0), M.iron);
    tb.add(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 10).translate(-0.34, 0.5, 0), M.woodDark);
    tb.build(this.tiller);
    this.tiller.position.set(0.62, 0.86, -0.12);
    this.body.add(this.tiller);
    for (const s of [-1, 1]) {
      const at = brakeAt(s);
      const blk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.1), M.block);
      blk.position.set(...at); blk.rotation.z = BRAKE_A - Math.PI / 2;
      blk.castShadow = true; blk.receiveShadow = true;
      this.body.add(blk); this.blocks.push(blk);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.025, 0.105), M.leather);
      pad.position.set(at[0] - 0.045 * Math.cos(BRAKE_A), at[1] - 0.045 * Math.sin(BRAKE_A), at[2]); pad.rotation.z = BRAKE_A - Math.PI / 2;
      pad.castShadow = true; pad.visible = false;
      this.body.add(pad); this.pads.push(pad);
    }
    this.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  }

  pose(s: CarState) {
    this.root.position.set(s.x, s.y ?? 0, s.z);
    this.root.rotation.set(0, s.yaw, s.pitch ?? 0, "YXZ");
    const shake = s.run ? 0.007 * Math.sin(s.t * 2 * Math.PI * 9) : 0;
    this.body.position.y = shake;
    this.body.rotation.z = s.run ? 0.004 * Math.sin(s.t * 2 * Math.PI * 4.5) : 0;
    for (const w of this.wheels) w.g.rotation.z = (-s.dist / w.r) * (s.spinK ?? 1);
    this.fly.rotation.y = s.run ? s.t * 2 * Math.PI * 4 : 0;
    this.tiller.rotation.y = s.tiller ?? 0;
    const bl = s.block ?? "wood";
    for (const k of this.blocks) { k.visible = bl !== "gone"; k.scale.set(1, bl === "smoke" ? 0.75 : 1, 1); }
    for (const p of this.pads) p.visible = bl === "leather";
  }

  /** local point -> world, after pose() */
  world(p: V3): V3 {
    this.root.updateMatrixWorld(true);
    const v = V(...p).applyMatrix4(this.root.matrixWorld);
    return [v.x, v.y, v.z];
  }
}

/** world position of a car-local point for a car state (pure: for cameras and staging) */
export const carPoint = (s: CarState, p: V3): V3 => {
  const c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
  // rotation about y by yaw: local x -> (cos, -sin) in x/z, local z -> (sin, cos)
  return [s.x + p[0] * c + p[2] * sn, (s.y ?? 0) + p[1], s.z - p[0] * sn + p[2] * c];
};
