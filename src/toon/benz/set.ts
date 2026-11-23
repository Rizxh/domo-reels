// EP11 scenery: seven small sets laid out far apart along x (fog hides one from the next), all built once.
// YARD Mannheim (Benz workshop), ROAD (country road, windmill, telegraph line), PHARM Wiesloch square with the
// pharmacy, HILL (one steep hill: climb west, descent east), VILLAGE Bauschlott with the cobbler, LAB (the night-blue
// friction stage), ARRIVE Pforzheim at sunset.
import * as THREE from "three";
import { Batch, V, boxGeo, lam, house, addVeg, quad, setSight, Ray, VegKind } from "../build";
import { ctex, rng, rep, grassHD, cobbleHD, stoneHD, planksHD } from "../paint";
import { Pen } from "../toon";
import { NOINK } from "../ink";
import type { V3 } from "./rig";

export const X = { YARD: 0, ROAD: 700, PHARM: 1400, HILL: 2100, VILLAGE: 2800, LAB: 3500, ARRIVE: 4200, MODERN: 4900 } as const;

// ---------------- the hill (climb on the west face, descent on the east face) ----------------
const HILL_TOP = 13, HILL_W = 62;
/** ground height on the hill set at world x (road along z = 0) */
export const hillY = (x: number) => {
  const u = (x - X.HILL) / HILL_W;
  return Math.abs(u) >= 1 ? 0 : HILL_TOP * (0.5 + 0.5 * Math.cos(Math.PI * u));
};
export const hillSlope = (x: number) => (hillY(x + 0.5) - hillY(x - 0.5));

// ---------------- the country road (a gentle S along x) ----------------
export const roadZ = (x: number) => 9 * Math.sin((x - X.ROAD) / 46);
export const roadDir = (x: number) => Math.atan2(-(roadZ(x + 0.5) - roadZ(x - 0.5)), 1); // yaw of a car driving +x

// ---------------- painted ground textures ----------------
const dirtTex = () => ctex("dirtHD", 1024, 1024, (g, r) => {
  g.fillStyle = "#c79a62"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) {
    const x = r() * 1024, y = r() * 1024, rad = 20 + r() * 70;
    g.fillStyle = r() < 0.5 ? "rgba(150,104,60,0.16)" : "rgba(226,190,132,0.16)";
    g.beginPath(); g.ellipse(x, y, rad * 1.6, rad, 0, 0, 7); g.fill();
  }
  // two wheel ruts along v
  for (const x0 of [300, 724]) {
    g.strokeStyle = "rgba(120,80,44,0.35)"; g.lineWidth = 46;
    g.beginPath(); g.moveTo(x0, 0); for (let y = 0; y <= 1024; y += 64) g.lineTo(x0 + 10 * Math.sin(y / 90), y); g.stroke();
  }
  for (let i = 0; i < 900; i++) {
    const x = r() * 1024, y = r() * 1024, rad = 2 + r() * 5;
    g.fillStyle = r() < 0.5 ? "#9c7650" : "#e4cba0";
    g.beginPath(); g.ellipse(x, y, rad, rad * 0.75, r() * 3, 0, 7); g.fill();
    g.strokeStyle = "rgba(60,40,30,0.5)"; g.lineWidth = 1.2; g.stroke();
  }
});
const fieldTex = (key: string, a: string, b: string) => ctex(key, 512, 512, (g) => {
  g.fillStyle = a; g.fillRect(0, 0, 512, 512);
  g.fillStyle = b; for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 512, 14);
});

/** a ribbon of width w along points (y from yAt), uv v in metres / vTile */
const ribbon = (pts: [number, number][], w: number, yAt: (x: number, z: number) => number, vTile = 6) => {
  const pos: number[] = [], uv: number[] = [], nrm: number[] = [], idx: number[] = [];
  let len = 0;
  pts.forEach(([x, z], i) => {
    const [x2, z2] = pts[Math.min(pts.length - 1, i + 1)], [x0, z0] = pts[Math.max(0, i - 1)];
    const dx = x2 - x0, dz = z2 - z0, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
    if (i > 0) len += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (const s of [-1, 1]) {
      const px = x + nx * s * w / 2, pz = z + nz * s * w / 2;
      pos.push(px, yAt(px, pz) + 0.03, pz); nrm.push(0, 1, 0); uv.push(s < 0 ? 0 : 1, len / vTile);
    }
    if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};
const flat = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number) => {
  const g = quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
  return g;
};

// ---------------- painted signs (unlit cut-outs on NOINK, lit separately would go grey) ----------------
/** pharmacy: green board, gold rim, a mortar and pestle (no lettering) */
export const pharmacySign = (p: Pen) => {
  p.poly([[20, 20], [380, 20], [380, 300], [20, 300]], "#2f6a43", 10);
  p.poly([[44, 44], [356, 44], [356, 276], [44, 276]], null, 5);
  p.g.strokeStyle = "#e3c25a"; p.g.lineWidth = 6; p.g.strokeRect(44, 44, 312, 232);
  p.poly([[120, 150], [280, 150], [258, 236], [142, 236]], "#f1ead8", 8);
  p.ell(200, 150, 82, 18, "#d9cfb6", 8);
  p.band([[230, 160], [300, 70]], "#c9a24a", 16, 6, "round");
  p.ell(200, 248, 70, 12, "#f1ead8", 6);
};
/** cobbler: a boot on an ochre board */
export const cobblerSign = (p: Pen) => {
  p.poly([[20, 20], [380, 20], [380, 300], [20, 300]], "#d9a441", 10);
  p.poly([[150, 60], [220, 60], [222, 190], [320, 214], [324, 252], [140, 252]], "#5a3420", 9);
  p.stroke([[140, 252], [324, 252]], 14);
  p.stroke([[160, 96], [210, 96]], 6, "#8a5a3a");
  p.stroke([[160, 128], [210, 128]], 6, "#8a5a3a");
};
const signBoard = (root: THREE.Object3D, key: string, draw: (p: Pen) => void, at: V3, yaw: number, w = 1.3) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.8), new THREE.MeshBasicMaterial({ map: ctex(key, 400, 320, (g) => draw(new Pen(g))), alphaTest: 0.5, color: 0xe8e8e8, side: THREE.DoubleSide }));
  m.position.set(...at); m.rotation.y = yaw; m.layers.set(NOINK);
  root.add(m);
};

export type SetDyn = { windmill: THREE.Group; lab: { wheel: THREE.Group; wood: THREE.Mesh; leather: THREE.Mesh } };

export const buildSets = (root: THREE.Object3D, rays: Ray[], makeWheel: (r: number) => THREE.Group): SetDyn => {
  setSight(rays);
  const b = new Batch(), r = rng(1888);
  const M = {
    grass: lam("grassHD", () => ({ map: grassHD() })),
    cobble: lam("cobbleHD", () => ({ map: cobbleHD() })),
    dirt: lam("dirtHD", () => ({ map: dirtTex() })),
    fieldA: lam("fieldA", () => ({ map: fieldTex("fieldA", "#d9b85a", "#c9a64a") })),
    fieldB: lam("fieldB", () => ({ map: fieldTex("fieldB", "#7fb04f", "#6fa043") })),
    wood: lam("fenceWood", () => ({ color: "#9a6a42" })),
    pole: lam("poleWood", () => ({ color: "#7a5236" })),
    stone: lam("stoneSet", () => ({ map: stoneHD("stoneSet") })),
    dark: lam("doorDark", () => ({ color: "#3a2a2a" })),
    doorWood: lam("doorWood", () => ({ color: "#7a4a2c" })),
    labFloor: lam("labFloor", () => ({ map: rep(planksHD(), 3, 3) })),
    iron: lam("setIron", () => ({ color: "#3a3f4c" })),
    white: lam("setWhite", () => ({ color: "#efe6d2" })),
  };
  const veg = (k: VegKind, x: number, y: number, z: number, h: number) => addVeg(b, k, x, y, z, h, x * 92.7 + z * 31.3, Math.hypot(x, z) > 60 ? 1 : 0);
  const kinds: VegKind[] = ["round", "fat", "tall", "round", "cone"];
  const tree = (x: number, z: number, h = 7 + r() * 3, y = 0) => veg(kinds[Math.floor(r() * kinds.length)], x, y, z, h);
  const fence = (x0: number, z0: number, x1: number, z1: number, yAt: (x: number, z: number) => number = () => 0) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.4));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n, y = yAt(x, z);
      b.add(boxGeo(V(x - 0.06, y, z - 0.06), V(x + 0.06, y + 1.1, z + 0.06)), M.wood);
      if (i < n) {
        const xn = x0 + ((x1 - x0) * (i + 1)) / n, zn = z0 + ((z1 - z0) * (i + 1)) / n, yn = yAt(xn, zn);
        for (const h of [0.45, 0.9]) {
          const a = V(x, y + h, z), c = V(xn, yn + h, zn), len = a.distanceTo(c);
          const g = new THREE.BoxGeometry(len, 0.07, 0.05);
          g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(1, 0, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
          b.add(g, M.wood);
        }
      }
    }
  };
  const hills = (cx: number, list: [number, number, number, number, number][]) => {
    const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
    list.forEach(([x, z, sx, sy, sz], i) => b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(cx + x, -2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  };
  const street = (cx: number, len: number, wid: number) => b.add(flat(cx - len / 2, cx + len / 2, -wid / 2, wid / 2, 0.02, 3), M.cobble);
  const row = (cx: number, z: number, yaw: number, xs: number[], seed: number) =>
    xs.forEach((x, i) => house(b, cx + x, z, yaw, [7, 9, 8][(i + seed) % 3], 8, [7, 8.4, 9.8][(i * 2 + seed) % 3], (i * 3 + seed) % 8, 0));

  // ---- ground: one big lawn under everything (the hill and roads sit on top) ----
  b.add(flat(-400, 4600, -500, 500, 0, 4), M.grass);

  // ======== YARD: Mannheim street with the Benz workshop (north side, doors at z = -6) ========
  {
    const cx = X.YARD;
    street(cx, 90, 12);
    house(b, cx, -10, 0, 9, 8, 6.5, 1, 0); // workshop
    b.add(boxGeo(V(cx - 1.5, 0, -6.05), V(cx + 1.5, 2.7, -5.98)), M.dark); // open doorway (dark inside)
    for (const s of [-1, 1]) { // open barn door leaves
      const g = boxGeo(V(0, 0, 0), V(1.5, 2.7, 0.08));
      g.applyMatrix4(new THREE.Matrix4().makeRotationY(s * 1.9).setPosition(cx + s * 1.5, 0, -5.98));
      b.add(g, M.doorWood);
    }
    row(cx, -10, 0, [-11, -20, 10.5, 19.5, 29], 2);
    row(cx, 10, Math.PI, [-22, -13, -4, 5, 14, 23], 5);
    // gate posts + low wall in front of the yard
    for (const s of [-1, 1]) {
      b.add(boxGeo(V(cx + s * 2.2 - 0.25, 0, -5.4), V(cx + s * 2.2 + 0.25, 1.9, -4.9)), M.stone);
      b.add(boxGeo(V(cx + s * 2.2 - 0.32, 1.9, -5.47), V(cx + s * 2.2 + 0.32, 2.05, -4.83)), M.white);
    }
    for (let x = -40; x <= 40; x += 13) tree(cx + x, 16 + r() * 4);
  }

  // ======== ROAD: country road along x with fields, fences, telegraph poles, a windmill ========
  {
    const cx = X.ROAD, pts: [number, number][] = [];
    for (let x = cx - 260; x <= cx + 260; x += 2) pts.push([x, roadZ(x)]);
    b.add(ribbon(pts, 3.4, () => 0, 5), M.dirt);
    b.add(flat(cx - 120, cx - 30, 14, 60, 0.015, 6), M.fieldA);
    b.add(flat(cx + 20, cx + 110, -70, -16, 0.015, 6), M.fieldA);
    b.add(flat(cx - 40, cx + 60, 18, 70, 0.012, 6), M.fieldB);
    for (const side of [-1, 1]) for (let x = cx - 150; x < cx + 150; x += 24) fence(x, roadZ(x) + side * 3.4, x + 22, roadZ(x + 22) + side * 3.4);
    // telegraph poles every 32 m on the north side, wires sag between them
    const poles: THREE.Vector3[] = [];
    for (let x = cx - 240; x <= cx + 240; x += 32) {
      const z = roadZ(x) - 5.2;
      b.add(new THREE.CylinderGeometry(0.11, 0.14, 6.4, 8).translate(x, 3.2, z), M.pole);
      b.add(boxGeo(V(x - 0.06, 5.7, z - 0.6), V(x + 0.06, 5.82, z + 0.6)), M.pole);
      poles.push(V(x, 5.85, z));
    }
    for (let i = 0; i + 1 < poles.length; i++) for (const dz of [-0.45, 0.45]) {
      const a = poles[i].clone().add(V(0, 0, dz)), c = poles[i + 1].clone().add(V(0, 0, dz));
      const mid = a.clone().add(c).multiplyScalar(0.5).add(V(0, -0.7, 0));
      b.add(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, c), 12, 0.012, 4), M.iron);
    }
    for (let i = 0; i < 90; i++) {
      const x = cx + (r() - 0.5) * 420, z = (r() < 0.5 ? -1 : 1) * (9 + r() * 120);
      if (Math.abs(z - roadZ(x)) > 6) tree(x, z);
    }
    for (let x = cx - 200; x < cx + 200; x += 9 + r() * 6) veg("bush", x, 0, roadZ(x) + (r() < 0.5 ? -4.6 : 4.6), 1.1 + r() * 0.5);
    hills(cx, [[-160, -210, 190, 50, 120], [120, -260, 230, 62, 140], [260, 160, 170, 46, 130], [-260, 220, 200, 52, 150], [0, 330, 260, 58, 140]]);
  }

  // ======== PHARM: Wiesloch square, pharmacy on the north side (front z = -5), fountain ========
  {
    const cx = X.PHARM;
    b.add(flat(cx - 30, cx + 30, -6, 22, 0.02, 3), M.cobble);
    house(b, cx, -9, 0, 9, 8, 8.4, 3, 0); // pharmacy: cream timber frame
    row(cx, -9, 0, [-10, -19, 10, 19.5], 1);
    row(cx, 26, Math.PI, [-18, -9, 0, 9, 18], 4);
    house(b, cx - 34, 8, Math.PI / 2, 9, 8, 8.4, 6, 0);
    house(b, cx + 34, 8, -Math.PI / 2, 9, 8, 7, 0, 0);
    // fountain
    b.add(new THREE.CylinderGeometry(2.2, 2.3, 0.7, 24).translate(cx + 9, 0.35, 9), M.stone);
    b.add(new THREE.CylinderGeometry(0.28, 0.34, 2.2, 12).translate(cx + 9, 1.1, 9), M.stone);
    b.add(new THREE.CylinderGeometry(0.7, 0.4, 0.3, 16).translate(cx + 9, 2.3, 9), M.stone);
    // sign bracket
    b.add(boxGeo(V(cx + 2.6, 3.55, -5.0), V(cx + 2.68, 3.62, -3.9)), M.iron);
    signBoard(root, "pharmSign", pharmacySign, [cx + 2.64, 3.0, -4.2], Math.PI / 2, 1.2);
    for (let x = -30; x <= 30; x += 15) tree(cx + x, 32 + r() * 4);
  }

  // ======== HILL: one steep hill along x (road on z = 0), trees on its flanks ========
  {
    const cx = X.HILL, seg = 120, w = 2 * HILL_W + 40;
    const g = new THREE.PlaneGeometry(w, 120, seg, 24); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = cx + p.getX(i), z = p.getZ(i), fall = Math.max(0, 1 - Math.max(0, Math.abs(z) - 6) / 50);
      p.setXYZ(i, x, hillY(x) * (0.25 + 0.75 * fall) + 0.01, z);
      g.attributes.uv.setXY(i, x / 4, z / 4);
    }
    g.computeVertexNormals();
    b.add(g, M.grass);
    const pts: [number, number][] = [];
    for (let x = cx - HILL_W - 20; x <= cx + HILL_W + 20; x += 1) pts.push([x, 0]);
    b.add(ribbon(pts, 3.4, (x) => hillY(x) + 0.01, 5), M.dirt);
    for (let i = 0; i < 70; i++) {
      const x = cx + (r() - 0.5) * 2 * (HILL_W + 15), z = (r() < 0.5 ? -1 : 1) * (5 + r() * 40);
      const fall = Math.max(0, 1 - Math.max(0, Math.abs(z) - 6) / 50);
      tree(x, z, 6 + r() * 3, hillY(x) * (0.25 + 0.75 * fall) - 0.2);
    }
    for (const side of [-1, 1]) fence(cx - HILL_W, side * 3.6, cx + HILL_W, side * 3.6, (x) => hillY(x));
  }

  // ======== VILLAGE: Bauschlott, the cobbler's shop on the north side (front z = -5) ========
  {
    const cx = X.VILLAGE;
    street(cx, 70, 10);
    house(b, cx, -9, 0, 8, 8, 7, 4, 0); // cobbler: straw ochre
    row(cx, -9, 0, [-10, -18.5, 9.5, 18], 6);
    row(cx, 9, Math.PI, [-16, -7, 2, 11, 20], 3);
    b.add(boxGeo(V(cx + 2.4, 3.15, -5.0), V(cx + 2.48, 3.22, -3.95)), M.iron);
    signBoard(root, "cobSign", cobblerSign, [cx + 2.44, 2.62, -4.25], Math.PI / 2, 1.1);
    // workbench outside the shop
    b.add(boxGeo(V(cx - 2.6, 0.75, -4.6), V(cx - 1.0, 0.85, -3.9)), M.doorWood);
    for (const [dx, dz] of [[-2.5, -4.5], [-1.1, -4.5], [-2.5, -4.0], [-1.1, -4.0]]) b.add(boxGeo(V(cx + dx - 0.04, 0, dz - 0.04), V(cx + dx + 0.04, 0.75, dz + 0.04)), M.doorWood);
    for (let x = -34; x <= 34; x += 12) tree(cx + x, 18 + r() * 5);
  }

  // ======== LAB: night-blue stage, a giant wheel with a brake block, room for the shoe ========
  const lab = (() => {
    const cx = X.LAB;
    b.add(new THREE.CircleGeometry(14, 48).rotateX(-Math.PI / 2).translate(cx, 0.03, 0), M.labFloor);
    const wheel = makeWheel(2.0);
    wheel.position.set(cx, 2.05, 0);
    root.add(wheel);
    // stand: two iron posts holding the axle
    for (const s of [-1, 1]) b.add(boxGeo(V(cx - 0.09, 0, s * 0.55 - 0.09), V(cx + 0.09, 2.08, s * 0.55 + 0.09)), M.iron);
    const wood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.42), lam("brakeWood", () => ({ color: "#d6a463" })));
    const leather = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.42), lam("brakeLeatherBig", () => ({ color: "#7a4428" })));
    for (const m of [wood, leather]) { m.castShadow = true; m.receiveShadow = true; root.add(m); }
    return { wheel, wood, leather };
  })();

  // ======== ARRIVE: Pforzheim street at sunset ========
  {
    const cx = X.ARRIVE;
    street(cx, 100, 12);
    row(cx, -10, 0, [-27, -18, -9, 0, 9.5, 18.5, 28], 0);
    row(cx, 10, Math.PI, [-24, -15, -6, 3, 12, 21], 7);
    for (let x = -46; x <= 46; x += 11) tree(cx + x, -17 - r() * 3);
    hills(cx, [[0, -220, 260, 60, 140], [180, 180, 200, 50, 130]]);
  }

  // ---- windmill on the road set (sails turn in update) ----
  const windmill = new THREE.Group();
  {
    const wx = X.ROAD + 48, wz = -38;
    b.add(new THREE.CylinderGeometry(2.0, 3.0, 10, 8).translate(wx, 5, wz), lam("millTower", () => ({ color: "#efe3c8" })));
    const cap = new THREE.ConeGeometry(2.6, 3.0, 8); cap.translate(wx, 11.5, wz);
    b.add(cap, lam("millCap", () => ({ color: "#b8644f" })));
    b.add(boxGeo(V(wx - 0.5, 0, wz + 2.6), V(wx + 0.5, 2.0, wz + 3.0)), M.dark);
    const sb = new Batch();
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.BoxGeometry(0.18, 7.2, 0.14); arm.translate(0, 3.6, 0); arm.rotateZ((i * Math.PI) / 2);
      sb.add(arm, M.pole);
      const sail = new THREE.BoxGeometry(1.2, 5.6, 0.05); sail.translate(0.7, 4.2, 0.08); sail.rotateZ((i * Math.PI) / 2);
      sb.add(sail, lam("millSail", () => ({ color: "#f4ecd8" })));
    }
    sb.add(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 10).rotateX(Math.PI / 2), M.pole);
    sb.build(windmill);
    windmill.position.set(wx, 10.6, wz + 2.9);
    root.add(windmill);
  }

  b.build(root);
  setSight([]);
  return { windmill, lab };
};
