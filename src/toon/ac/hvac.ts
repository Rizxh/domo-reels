// EP13 "x-ray behind the dashboard": the car's AC box cut open and blown up to stage size (toon look). Left to right:
// blower in its scroll housing, cabin filter (real pleats) in its slot, evaporator core (alu fins, U-bends, insulated
// lines, expansion valve) with the drain hose under it. Per frame: mould and slime on the fins, condensation drops,
// filter dirt, foam + rinse while cleaning, the old filter lifting out and the new one dropping in, the drain gunk
// flushed out, the blower turning.
import * as THREE from "three";
import { Batch, V, boxGeo, lam } from "../build";
import { ctex, rng } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import type { V3 } from "../benz/rig";

export type HvacState = {
  /** mould + dust on the fins 0..1 */ mold: number; /** slime drips 0..1 */ slime: number;
  /** condensation drops 0..1 */ damp: number; /** filter dirt 0..1 (the filter in the slot) */ dirty: number;
  /** drain: clogged (drop hangs) or flowing (drops fall); t for the drip cycle */ clog: boolean; t: number;
  /** blower turn (rad) */ fan: number;
  /** cleaning foam on the fins 0..1 (cover), and how far the rinse has slid it down 0..1 */ foam?: number; rinse?: number;
  /** filter swap: 0 in place .. 1 lifted out; `fresh` = the slot holds the new (white) filter */ lift?: number; fresh?: boolean;
  /** drain flush 0..1.6: the gunk travels down the hose and drops out */ flush?: number;
};

const finTex = () => ctex("acFins2", 1024, 1024, (g) => {
  g.fillStyle = "#d3dbe4"; g.fillRect(0, 0, 1024, 1024);
  for (let x = 0; x < 1024; x += 10) { g.fillStyle = x % 20 ? "#b4bfcb" : "#eef3f8"; g.fillRect(x, 0, 4, 1024); }
  for (let y = 70; y < 1024; y += 128) { g.fillStyle = "rgba(170,110,70,0.9)"; g.fillRect(0, y, 1024, 16); g.fillStyle = "rgba(255,220,190,0.6)"; g.fillRect(0, y + 2, 1024, 4); }
});
const moldTex = () => ctex("acMold2", 1024, 1024, (g) => {
  const r = rng(1313);
  g.clearRect(0, 0, 1024, 1024);
  const blob = (x: number, y: number, rad: number, c: string, a: number) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, c); gr.addColorStop(0.6, c); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  };
  for (let i = 0; i < 70; i++) { const y = 380 + Math.pow(r(), 0.6) * 640; blob(r() * 1024, y, 40 + r() * 90, ["#3f5a2e", "#55703a", "#2c3a25"][i % 3], 0.75); }
  for (let i = 0; i < 90; i++) { const y = 420 + Math.pow(r(), 0.5) * 600; blob(r() * 1024, y, 12 + r() * 26, ["#1f2a1a", "#6d8a43"][i % 2], 0.85); }
  g.globalAlpha = 0.9; g.fillStyle = "#cfd9a0";
  for (let i = 0; i < 260; i++) { g.beginPath(); g.arc(r() * 1024, 420 + Math.pow(r(), 0.5) * 600, 2 + r() * 3.5, 0, 7); g.fill(); }
  g.globalAlpha = 0.45; g.fillStyle = "#3a4a2a";
  for (let i = 0; i < 40; i++) { const x = r() * 1024; g.fillRect(x, 600 + r() * 200, 5, 200 + r() * 220); }
  g.globalAlpha = 1;
});
const foamTex = () => ctex("acFoam", 1024, 1024, (g) => {
  const r = rng(99);
  g.clearRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) {
    const x = r() * 1024, y = r() * 1024, rad = 10 + r() * 34;
    g.fillStyle = r() < 0.7 ? "#ffffff" : "#e3f1ff"; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    g.strokeStyle = "rgba(150,180,210,0.7)"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.25, 0, 7); g.fill();
  }
});
const dirtTex = () => ctex("acFilterDirt2", 512, 512, (g) => {
  const r = rng(77);
  g.clearRect(0, 0, 512, 512);
  const gr = g.createRadialGradient(256, 256, 40, 256, 256, 380); gr.addColorStop(0, "rgba(40,32,24,0.95)"); gr.addColorStop(1, "rgba(80,66,46,0.75)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,96,60,0.6)" : "rgba(10,8,6,0.6)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 8, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.strokeStyle = "rgba(190,170,130,0.5)"; g.lineWidth = 2; g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 10, x + 40 * r(), y + 30 * r()); g.stroke(); }
});

/** stage layout (relative to the stage origin) */
export const HV = {
  core: { x0: 0.9, x1: 2.6, y0: 0.95, y1: 2.95, z0: -0.6, z1: -0.18 },
  filter: { x0: -1.15, x1: 0.35, y0: 1.0, y1: 2.85, z: -0.28 },
  blower: [-2.15, 1.95, -0.45] as V3,
  outlet: [1.75, 0.38, 0.75] as V3,
  vent: [0, 3.5, 0.6] as V3,
};

/** a pleated filter element (zig-zag paper in a frame with a pull tab), facing +z, centred on its own origin */
const filterElement = (paper: THREE.Material, frame: THREE.Material, w: number, h: number) => {
  const g = new THREE.Group(), b = new Batch(), n = 16, pitch = h / n, depth = 0.12;
  for (let i = 0; i < n; i++) {
    const y = -h / 2 + i * pitch;
    for (const [y0, y1, z0, z1] of [[y, y + pitch / 2, 0, -depth], [y + pitch / 2, y + pitch, -depth, 0]]) {
      const q = new THREE.PlaneGeometry(w, Math.hypot(y1 - y0, z1 - z0));
      q.rotateX(Math.atan2(z1 - z0, y1 - y0));
      q.translate(0, (y0 + y1) / 2, (z0 + z1) / 2);
      b.add(q, paper);
    }
  }
  b.add(boxGeo(V(-w / 2 - 0.06, -h / 2 - 0.06, -depth - 0.02), V(-w / 2, h / 2 + 0.06, 0.02)), frame);
  b.add(boxGeo(V(w / 2, -h / 2 - 0.06, -depth - 0.02), V(w / 2 + 0.06, h / 2 + 0.06, 0.02)), frame);
  b.add(boxGeo(V(-w / 2 - 0.06, h / 2, -depth - 0.02), V(w / 2 + 0.06, h / 2 + 0.06, 0.02)), frame);
  b.add(boxGeo(V(-w / 2 - 0.06, -h / 2 - 0.06, -depth - 0.02), V(w / 2 + 0.06, -h / 2, 0.02)), frame);
  b.add(boxGeo(V(-0.18, h / 2 + 0.06, -0.08), V(0.18, h / 2 + 0.2, -0.04)), frame); // pull tab
  b.build(g);
  return g;
};

export class HvacRig {
  root = new THREE.Group();
  private moldMat: THREE.MeshLambertMaterial;
  private foamMat: THREE.MeshLambertMaterial;
  private foam: THREE.Mesh;
  private dirtMat: THREE.MeshLambertMaterial;
  private dirt: THREE.Mesh;
  private oldF: THREE.Group;
  private newF: THREE.Group;
  private slime: THREE.Mesh[] = [];
  private drops: THREE.Mesh[] = [];
  private fan = new THREE.Group();
  private drip: THREE.Mesh[] = [];
  private gunk: THREE.Mesh;

  constructor(at: V3) {
    this.root.position.set(...at);
    const b = new Batch();
    const shell = lam("acShell", () => ({ color: "#3a4152" })), shellD = lam("acShellD", () => ({ color: "#2b303d" }));
    const tank = lam("acTank", () => ({ color: "#a9b4c1" })), alu = lam("acAlu", () => ({ color: "#c7d0da" }));
    const copper = lam("acCopper", () => ({ color: "#c97a45" })), insul = lam("acInsul", () => ({ color: "#1f2126" }));
    const brass = lam("acBrass", () => ({ color: "#d6a540" })), rim = lam("acRim", () => ({ color: "#ffcf4a" }));
    // ---- the housing, cut open toward the camera (+z) ----
    b.add(boxGeo(V(-3.4, 0.3, -1.05), V(3.4, 4.0, -0.95)), shellD);
    b.add(boxGeo(V(-3.4, 0.2, -1.05), V(3.4, 0.36, 0.55)), shell);
    b.add(boxGeo(V(-3.4, 3.8, -1.05), V(3.4, 4.0, 0.7)), shell);
    for (const s of [-1, 1]) b.add(boxGeo(V(s * 3.4 - 0.1, 0.2, -1.05), V(s * 3.4 + 0.1, 4.0, 0.7)), shell);
    for (const x of [-2.9, -0.55, 0.62, 2.95]) b.add(boxGeo(V(x - 0.05, 0.36, -0.95), V(x + 0.05, 3.8, -0.88)), shell); // ribs
    for (const [x, y] of [[-3.1, 3.55], [3.1, 3.55], [-3.1, 0.55], [3.1, 0.55]]) b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12).rotateX(Math.PI / 2).translate(x, y, -0.88), lam("acScrew", () => ({ color: "#8d95a3" })));
    b.add(boxGeo(V(-3.5, 3.78, 0.66), V(3.5, 3.84, 0.74)), rim);
    for (const s of [-1, 1]) b.add(boxGeo(V(s * 3.4 - 0.12, 0.2, 0.66), V(s * 3.4 + 0.12, 3.84, 0.74)), rim);
    b.add(boxGeo(V(-3.6, 4.0, -1.1), V(3.6, 4.6, 1.0)), lam("acDash", () => ({ color: "#23262e" })));
    for (const x of [-1.6, 0, 1.6]) {
      b.add(boxGeo(V(x - 0.45, 4.12, 1.0), V(x + 0.45, 4.42, 1.04)), lam("acVent", () => ({ color: "#111216" })));
      for (let k = 0; k < 4; k++) b.add(boxGeo(V(x - 0.42, 4.16 + k * 0.065, 1.03), V(x + 0.42, 4.18 + k * 0.065, 1.07)), lam("acSlat", () => ({ color: "#3a3d46" })));
    }
    // ---- evaporator core: fins, tanks, end plates, U-bends, insulated lines + expansion valve ----
    const C = HV.core;
    b.add(boxGeo(V(C.x0, C.y0, C.z0), V(C.x1, C.y1, C.z1)), lam("acFinsM2", () => ({ map: finTex() })));
    b.add(boxGeo(V(C.x0 - 0.06, C.y1, C.z0 - 0.04), V(C.x1 + 0.06, C.y1 + 0.2, C.z1 + 0.04)), tank);
    b.add(boxGeo(V(C.x0 - 0.06, C.y0 - 0.2, C.z0 - 0.04), V(C.x1 + 0.06, C.y0, C.z1 + 0.04)), tank);
    b.add(boxGeo(V(C.x0 - 0.1, C.y0 - 0.2, C.z0 - 0.04), V(C.x0, C.y1 + 0.2, C.z1 + 0.04)), alu);
    b.add(boxGeo(V(C.x1, C.y0 - 0.2, C.z0 - 0.04), V(C.x1 + 0.1, C.y1 + 0.2, C.z1 + 0.04)), alu);
    for (let k = 0; k < 7; k++) {
      const y = C.y0 + 0.15 + k * 0.26, u = new THREE.TorusGeometry(0.12, 0.035, 8, 16, Math.PI);
      u.rotateZ(Math.PI / 2); u.translate(C.x0 - 0.12, y + 0.12, C.z1 - 0.1);
      b.add(u, copper);
    }
    for (const [y, r] of [[2.55, 0.1], [2.1, 0.08]] as const) {
      b.add(new THREE.CylinderGeometry(r, r, 0.9, 14).rotateZ(Math.PI / 2).translate(C.x1 + 0.55, y, -0.4), insul);
      b.add(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.2, 12).rotateZ(Math.PI / 2).translate(C.x1 + 0.15, y, -0.4), alu);
    }
    b.add(boxGeo(V(C.x1 + 0.12, 1.95, -0.6), V(C.x1 + 0.42, 2.7, -0.2)), brass); // expansion valve
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12).rotateX(Math.PI / 2).translate(C.x1 + 0.27, 2.32, -0.15), brass);
    // ---- filter slot rails ----
    const F = HV.filter;
    b.add(boxGeo(V(F.x0 - 0.16, F.y0 - 0.12, F.z - 0.24), V(F.x0 - 0.06, F.y1 + 0.3, F.z + 0.04)), lam("acRail", () => ({ color: "#59606e" })));
    b.add(boxGeo(V(F.x1 + 0.06, F.y0 - 0.12, F.z - 0.24), V(F.x1 + 0.16, F.y1 + 0.3, F.z + 0.04)), lam("acRail", () => ({ color: "#59606e" })));
    // ---- blower scroll housing ----
    const sc = new THREE.TorusGeometry(0.82, 0.12, 10, 40, Math.PI * 1.6); sc.rotateZ(0.9); sc.translate(HV.blower[0], HV.blower[1], -0.55);
    b.add(sc, shell);
    // ---- drain hose (see-through) with a clamp, down to a tray ----
    const drainM = twoTone(new THREE.MeshLambertMaterial({ color: "#9fdcff", transparent: true, opacity: 0.6, depthWrite: false }), 0.15);
    const o = HV.outlet;
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.42, 14).translate(o[0], 0.55, -0.4), drainM);
    b.add(new THREE.CylinderGeometry(0.08, 0.08, 1.15, 14).rotateX(Math.PI / 2).translate(o[0], 0.38, 0.15), drainM);
    b.add(new THREE.TorusGeometry(0.095, 0.025, 8, 20).rotateX(Math.PI / 2).translate(o[0], 0.68, -0.4), lam("acClamp", () => ({ color: "#b9c3cd" })));
    b.add(boxGeo(V(o[0] - 0.5, -0.4, o[2] - 0.25), V(o[0] + 0.5, -0.32, o[2] + 0.35)), lam("acTray", () => ({ color: "#5a6170" })));
    b.add(boxGeo(V(-3.4, -0.45, -1.05), V(3.4, -0.4, 1.4)), lam("acBase", () => ({ color: "#20232b" })));
    b.build(this.root);
    // ---- blower wheel ----
    const fb = new Batch(), blade = lam("acBlade", () => ({ color: "#d7dbe2" }));
    fb.add(new THREE.TorusGeometry(0.62, 0.04, 8, 40), blade);
    fb.add(new THREE.TorusGeometry(0.62, 0.04, 8, 40).translate(0, 0, -0.5), blade);
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, g = new THREE.BoxGeometry(0.05, 0.16, 0.5); g.translate(0, 0.56, -0.25); g.rotateZ(a); fb.add(g, blade); }
    fb.add(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 18).rotateX(Math.PI / 2).translate(0, 0, -0.25), lam("acMotor", () => ({ color: "#4a5060" })));
    fb.build(this.fan);
    this.fan.position.set(...HV.blower); this.fan.position.z += 0.2;
    this.root.add(this.fan);
    // ---- filters: the old one (gets dirt) and the new white one with a blue frame ----
    const fw = F.x1 - F.x0, fh = F.y1 - F.y0, fc: V3 = [(F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, F.z];
    this.oldF = filterElement(lam("acPaper", () => ({ color: "#f3efe4", side: THREE.DoubleSide })), lam("acFrame2", () => ({ color: "#59606e" })), fw, fh);
    this.oldF.position.set(...fc);
    this.newF = filterElement(lam("acPaperNew", () => ({ color: "#ffffff", side: THREE.DoubleSide })), lam("acFrameNew", () => ({ color: "#2f8fd8" })), fw, fh);
    this.newF.position.set(...fc);
    this.dirtMat = twoTone(new THREE.MeshLambertMaterial({ map: dirtTex(), transparent: true, opacity: 0, depthWrite: false }), 0.15);
    this.dirt = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), this.dirtMat);
    this.dirt.position.set(0, 0, 0.03); this.dirt.layers.set(NOINK);
    this.oldF.add(this.dirt);
    this.root.add(this.oldF, this.newF);
    // ---- fins: mould sheet, foam sheet, slime, drops ----
    this.moldMat = twoTone(new THREE.MeshLambertMaterial({ map: moldTex(), transparent: true, opacity: 0, depthWrite: false }), 0.15);
    const mold = new THREE.Mesh(new THREE.PlaneGeometry(C.x1 - C.x0, C.y1 - C.y0), this.moldMat);
    mold.position.set((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, C.z1 + 0.01); mold.layers.set(NOINK);
    this.foamMat = twoTone(new THREE.MeshLambertMaterial({ map: foamTex(), transparent: true, opacity: 1, depthWrite: false }), 0.15);
    const fg = new THREE.PlaneGeometry(C.x1 - C.x0 + 0.2, C.y1 - C.y0 + 0.2); fg.translate(0, -(C.y1 - C.y0 + 0.2) / 2, 0);
    this.foam = new THREE.Mesh(fg, this.foamMat);
    this.foam.position.set((C.x0 + C.x1) / 2, C.y1 + 0.1, C.z1 + 0.03); this.foam.layers.set(NOINK);
    this.root.add(mold, this.foam);
    const slimeM = twoTone(new THREE.MeshPhongMaterial({ color: "#8f9b45", specular: "#ffffff", shininess: 80 }), 0.15);
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.3, 4, 8), slimeM);
      m.geometry.translate(0, -0.18, 0);
      m.position.set(C.x0 + 0.15 + i * ((C.x1 - C.x0 - 0.3) / 7), C.y0 - 0.2, C.z1 + 0.02);
      this.slime.push(m); this.root.add(m);
    }
    const dropM = twoTone(new THREE.MeshPhongMaterial({ color: "#d8efff", specular: "#ffffff", shininess: 120 }), 0.15);
    const r = rng(42);
    for (let i = 0; i < 30; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.045 + 0.03 * r(), 12, 8), dropM);
      m.position.set(C.x0 + 0.1 + r() * (C.x1 - C.x0 - 0.2), C.y0 + 0.1 + r() * (C.y1 - C.y0 - 0.2), C.z1 + 0.05);
      this.drops.push(m); this.root.add(m);
    }
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), dropM); this.drip.push(m); this.root.add(m); }
    this.gunk = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), lam("acGunk", () => ({ color: "#3e4a22" })));
    this.gunk.scale.set(1.6, 0.75, 0.75);
    this.root.add(this.gunk);
    this.root.traverse((x) => { const m = x as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    mold.castShadow = this.dirt.castShadow = this.foam.castShadow = false;
  }

  pose(s: HvacState) {
    const C = HV.core, F = HV.filter;
    this.moldMat.opacity = Math.min(1, s.mold);
    const cover = s.foam ?? 0, rinse = s.rinse ?? 0;
    this.foam.visible = cover > 0.01 && rinse < 0.99;
    this.foam.scale.set(1, Math.max(0.01, cover * (1 - rinse)), 1);
    this.foam.position.y = C.y1 + 0.1 - rinse * (C.y1 - C.y0) * 0.9;
    this.foamMat.opacity = 1 - 0.6 * rinse;
    const lift = s.lift ?? 0, fc = (F.y0 + F.y1) / 2;
    this.oldF.visible = !s.fresh; this.newF.visible = !!s.fresh;
    this.oldF.position.y = fc + 2.6 * lift; this.newF.position.y = fc + 2.6 * lift;
    this.dirtMat.opacity = Math.min(1, s.dirty);
    this.slime.forEach((m, i) => { const k = Math.max(0, Math.min(1, s.slime * 1.4 - (i % 3) * 0.2)); m.visible = k > 0.02; m.scale.set(1, 0.3 + 0.9 * k + 0.08 * Math.sin(s.t * 3 + i), 1); });
    this.drops.forEach((m, i) => { const k = Math.max(0, Math.min(1, s.damp * 1.6 - (i % 5) * 0.15)); m.visible = k > 0.02; m.scale.setScalar(k); });
    this.fan.rotation.z = s.fan;
    const o = HV.outlet, fl = s.flush ?? 0;
    const along = (u: number): V3 => (u < 0.4 ? [o[0], 0.7 - (u / 0.4) * 0.32, -0.4] : [o[0], 0.38, -0.4 + ((u - 0.4) / 0.6) * 1.15]);
    if (s.clog) this.gunk.position.set(...along(0.62));
    else if (fl < 1) this.gunk.position.set(...along(0.62 + 0.38 * fl));
    else if (fl < 1.6) this.gunk.position.set(o[0], o[1] - 0.1 - 1.2 * ((fl - 1) / 0.6) ** 2, o[2]);
    else this.gunk.position.set(o[0], -10, 0);
    this.drip.forEach((m, i) => {
      if (s.clog) { m.visible = i === 0; const w = 1 + 0.12 * Math.sin(s.t * 5); m.position.set(o[0], o[1] - 0.1, o[2] - 0.05); m.scale.set(1 / w, 1.25 * w, 1 / w); return; }
      m.visible = fl >= 1;
      const u = (s.t * 2.2 + i / 3) % 1; m.position.set(o[0], o[1] - 0.1 - 0.6 * u * u, o[2] - 0.05); m.scale.set(0.8, 1.1, 0.8);
    });
  }
  /** a stage-local point in world space */
  world(p: V3): V3 { const r = this.root.position; return [r.x + p[0], r.y + p[1], r.z + p[2]]; }
}
