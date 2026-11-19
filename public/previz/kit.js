// Shared 3D kit for the Doktermobil previz pages (three.js r128).
// Extracted from the EP01 previz on 2026-11-10: math helpers, renderer,
// materials, procedural textures, Poly Haven loaders, people, car and tree
// builders. EP01 (ep01-3d.html) still carries its own inline copy.
//
// The page must provide <canvas id="gl">, <canvas id="glOut"> and
// <div id="stage"> and load three.min.js, GLTFLoader.js and RGBELoader.js
// before this file. Everything here is a global of the page.
'use strict';

// ================= math =================
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const inOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const sine = k => -(Math.cos(Math.PI * k) - 1) / 2;
const outCubic = k => 1 - Math.pow(1 - k, 3);
const outBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

// ================= renderer =================
const canvas = document.getElementById('gl'), stage = document.getElementById('stage');
const outCanvas = document.getElementById('glOut'), outCtx = outCanvas.getContext('2d');
// Render quality (render mode only): supersampling factor, motion-blur
// sub-frames per output frame, and shutter as a share of one frame (180 deg).
// A page may set window.PREVIZ_QUALITY before loading this file.
const QUALITY = Object.assign({ pixelRatio: 2, samples: 8, shutter: .5 }, window.PREVIZ_QUALITY || {});
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.physicallyCorrectLights = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 9 / 16, .05, 220);

// Hex colours are authored in sRGB; materials work in linear space.
const lin = c => new THREE.Color(c).convertSRGBToLinear();
const linExtra = e => { const o = Object.assign({}, e); ['emissive', 'sheenColor'].forEach(k => { if (o[k] !== undefined) o[k] = lin(o[k]); }); return o; };
const std = (color, rough = .7, metal = 0, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: lin(color), roughness: rough, metalness: metal }, linExtra(extra), extra.color !== undefined ? { color: lin(extra.color) } : {}));
const phys = (color, rough = .35, metal = .4, extra = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: lin(color), roughness: rough, metalness: metal, clearcoat: 1, clearcoatRoughness: .08 }, linExtra(extra), extra.color !== undefined ? { color: lin(extra.color) } : {}));
const M = (geo, mat, cast = true, recv = false) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; };
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const flat = m => { m.rotation.x = -Math.PI / 2; return m; };
function rbox(w, h, d, r, mat, cast = true, recv = false) {
  r = Math.max(.002, Math.min(r, w / 2 - .002, h / 2 - .002, d / 2 - .002));
  const s = new THREE.Shape(); const x = w / 2 - r, y = h / 2 - r;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3, curveSegments: 3 });
  g.translate(0, 0, -(d - 2 * r) / 2);
  return M(g, mat, cast, recv);
}
function tube(pts, r, mat, closed = false, seg = 64, radial = 12) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), closed, 'catmullrom', .5);
  const m = M(new THREE.TubeGeometry(c, seg, r, radial, closed), mat); m.userData.curve = c; return m;
}
function cyl(rt, rb, h, mat, axis = 'y', seg = 24) {
  const m = M(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2; if (axis === 'z') m.rotation.x = Math.PI / 2; return m;
}
const TEX_REDRAW = [];
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 16;
  const redraw = () => { draw(c.getContext('2d'), w, h); tex.needsUpdate = true; };
  redraw(); TEX_REDRAW.push(redraw); return tex;
}
const gradient = (top, bottom) => canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
// ================= procedural textures (deterministic, tileable) =================
// Value noise on a wrapped lattice so textures tile; fbm sums octaves.
function vnoise(x, y, seed, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const w = (a, p) => ((a % p) + p) % p;
  const h = (a, b) => hash(w(a, px) * 157.31 + w(b, py) * 311.7 + seed * 17.13);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
function fbm(x, y, oct, seed, px, py) {
  let a = .5, f = 1, sum = 0, norm = 0;
  for (let o = 0; o < oct; o++) { sum += a * vnoise(x * f, y * f, seed + o * 7, px * f, py * f); norm += a; a *= .5; f *= 2; }
  return sum / norm;
}
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
// Paints a texture pixel by pixel. paint(u, v) returns [r, g, b] in 0..255.
function procTex(w, h, paint, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, gg, b] = paint(x / w, y / h), i = (y * w + x) * 4;
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); if (srgb) tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat[0], repeat[1]); tex.anisotropy = 16;
  return tex;
}
const hex3 = hx => [(hx >> 16) & 255, (hx >> 8) & 255, hx & 255];
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const shade3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
// Surface = colour map + matching bump map from the same height field.
function surface(size, period, height, colour, repeat) {
  const H = (u, v) => height(u * period, v * period, period);
  return {
    map: procTex(size, size, (u, v) => colour(H(u, v), u, v), repeat),
    bump: procTex(size, size, (u, v) => { const k = H(u, v) * 255; return [k, k, k]; }, repeat, false),
  };
}
const SURF = {
  grass: surface(512, 16, (x, y, p) => .55 * fbm(x, y, 4, 3, p, p) + .45 * vnoise(x * 9, y * 9, 4, p * 9, p * 9),
    (k, u, v) => mix3(hex3(0x46602f), hex3(0x89a058), smooth(.25, .85, k)), [60, 60]),
  concrete: surface(512, 8, (x, y, p) => .7 * fbm(x, y, 5, 11, p, p) + .3 * vnoise(x * 14, y * 14, 12, p * 14, p * 14),
    (k, u, v) => { const joint = Math.min(Math.abs(u - .5), Math.abs(v - .5)) < .004 ? .72 : 1; return shade3(mix3(hex3(0xa9a39a), hex3(0xd6d0c6), k), joint); }, [2, 1.4]),
  asphalt: surface(512, 12, (x, y, p) => .5 * fbm(x, y, 3, 21, p, p) + .5 * vnoise(x * 18, y * 18, 22, p * 18, p * 18),
    (k) => { const sp = k > .78 ? 1.35 : 1; return shade3(mix3(hex3(0x26262a), hex3(0x46464b), k), sp); }, [20, 2]),
  stucco: surface(512, 10, (x, y, p) => .6 * fbm(x, y, 5, 31, p, p) + .4 * vnoise(x * 20, y * 20, 32, p * 20, p * 20),
    (k) => mix3(hex3(0xe2d6c4), hex3(0xf4ece0), k), [3, 1.2]),
  metal: surface(256, 8, (x, y, p) => .5 * vnoise(x * .5, y * 6, 41, p * .5, p * 6) + .5 * fbm(x, y, 4, 42, p, p),
    (k) => mix3(hex3(0xb4b9bf), hex3(0xd2d6da), k), [1, 1]),
  iron: surface(256, 8, (x, y, p) => .6 * fbm(x, y, 4, 51, p, p) + .4 * vnoise(x * 16, y * 16, 52, p * 16, p * 16),
    (k) => mix3(hex3(0x4a4038), hex3(0x7a6a5a), k), [2, 2]),
  softTouch: surface(256, 8, (x, y, p) => .7 * fbm(x * 2, y * 2, 3, 61, p * 2, p * 2) + .3 * vnoise(x * 6, y * 6, 62, p * 6, p * 6),
    (k) => mix3(hex3(0x1d1d21), hex3(0x232328), k), [2, 2]),
  fabric: surface(256, 32, (x, y, p) => .5 + .25 * Math.sin(x * Math.PI * 2) * Math.sin(y * Math.PI * 2) + .25 * (vnoise(x * 2, y * 2, 63, p * 2, p * 2) - .5),
    (k) => mix3(hex3(0xd8d8d8), hex3(0xffffff), k), [6, 6]),
  epoxy: surface(512, 8, (x, y, p) => fbm(x, y, 5, 71, p, p),
    (k) => mix3(hex3(0x17171a), hex3(0x2a2a2f), k), [6, 6]),
  leaves: surface(256, 8, (x, y, p) => .5 * fbm(x, y, 3, 81, p, p) + .5 * vnoise(x * 10, y * 10, 82, p * 10, p * 10),
    (k) => mix3(hex3(0x2f5e27), hex3(0x6f9e45), smooth(.2, .9, k)), [2, 2]),
  bark: surface(128, 8, (x, y, p) => .7 * vnoise(x * 6, y * .6, 91, p * 6, p * .6) + .3 * fbm(x, y, 3, 92, p, p),
    (k) => mix3(hex3(0x3e2c20), hex3(0x6e5440), k), [1, 2]),
};
const textured = (s, rough = .9, metal = 0, bumpScale = .02, extra = {}) =>
  std(0xffffff, rough, metal, Object.assign({ map: s.map, bumpMap: s.bump, bumpScale }, extra));

// Sky dome: deep zenith to hazy horizon with fbm cumulus in a band above it.
// The texture's top row is the zenith (SphereGeometry, flipY canvas).
function skyTex(zenith, horizon, ground, seed) {
  const Z = hex3(zenith), Hz = hex3(horizon), G = hex3(ground), W = [255, 255, 255], S = hex3(0x9aa7b8);
  return procTex(2048, 1024, (u, v) => {
    if (v > .5) return mix3(Hz, G, smooth(.5, .56, v));
    const e = 1 - v * 2; // 1 at zenith, 0 at horizon
    const sky = mix3(Hz, Z, Math.pow(e, .55));
    const band = smooth(.0, .12, e) * (1 - smooth(.55, .95, e));
    const sx = u * 10, sy = v * 26;
    const d = fbm(sx, sy, 6, seed, 10, 1e6) * band;
    const below = fbm(sx, sy + .35, 6, seed, 10, 1e6) * band;
    const c = smooth(.34, .6, d);
    if (c <= 0) return sky;
    const lit = clamp(.55 + (d - below) * 5.5);
    return mix3(sky, mix3(S, W, lit), c * .96);
  }, [1, 1]);
}
function skyDome(tex) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(180, 64, 32), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -1; m.userData.followCamera = true; return m;
}

// Organic blob: icosphere pushed out by noise (foliage, bushes).
function blob(r, seed, mat, detail = 3, rough = .35) {
  const g = new THREE.IcosahedronGeometry(r, detail), pos = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); const n = v.clone().normalize();
    const k = 1 + rough * (fbm(n.x * 2 + 5, n.y * 2 + n.z * 1.7 + 5, 3, seed, 1e6, 1e6) - .5);
    v.multiplyScalar(k); pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return M(g, mat);
}


// environment maps for reflections (built once with PMREM)
const pmrem = new THREE.PMREMGenerator(renderer);
function makeEnv(top, bottom, panels) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ map: gradient(top, bottom), side: THREE.BackSide })));
  panels.forEach(([x, y, z, w, h, c, k]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); });
  return pmrem.fromScene(s, .02).texture;
}
function makeSkyEnv(tex, panels) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(20, 64, 32), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
  panels.forEach(([x, y, z, w, h, c, k]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); });
  return pmrem.fromScene(s, .01).texture;
}
const ENV = {
  outdoor: makeEnv('#9cc6e8', '#b59a7c', [[6, 8, -6, 6, 6, 0xfff0d8, 4]]), // replaced by the HDRI once loaded
  vintage: makeEnv('#2a1d12', '#140e09', [[-4, 6, 4, 5, 3, 0xffc98a, 3]]),
  clean:   makeEnv('#dfe5ec', '#5d636b', [[0, 8, 0, 10, 2, 0xffffff, 3], [6, 3, 4, 3, 5, 0xffffff, 1.6]]),
  shop:    makeEnv('#141416', '#0a0a0b', [[-3, 7, 0, 1, 9, 0xffffff, 4], [3, 7, 0, 1, 9, 0xffffff, 4], [0, 2, -8, 10, 1, 0xff2a30, 1.5]]),
};


// ================= Poly Haven CC0 assets (public/assets/polyhaven) =================
// Photo textures, HDRI lighting and scanned props. Everything is tracked in
// ASSET_LOADS so window.__previz.ready waits for it before the first frame.
const PH = '../assets/polyhaven/';
const ASSET_LOADS = [];
const track = (label, executor) => ASSET_LOADS.push(new Promise((res, rej) => executor(res, () => rej(new Error(`Failed to load ${label}`)))));
const texLoader = new THREE.TextureLoader(), gltfLoader = new THREE.GLTFLoader(), rgbeLoader = new THREE.RGBELoader();
function phTexture(url, srgb, rx = 1, ry = 1, wrap = THREE.RepeatWrapping) {
  let tex;
  track(url, (res, rej) => { tex = texLoader.load(url, res, undefined, rej); });
  if (srgb) tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = tex.wrapT = wrap; tex.repeat.set(rx, ry); tex.anisotropy = 16;
  return tex;
}
// PBR material from a Poly Haven texture set (diffuse, GL normal, roughness).
function phSurface(id, rx, ry, extra = {}) {
  const f = m => `${PH}${id}/${id}_${m}_2k.jpg`;
  return new THREE.MeshStandardMaterial(Object.assign({
    map: phTexture(f('diff'), true, rx, ry), normalMap: phTexture(f('nor'), false, rx, ry),
    roughnessMap: phTexture(f('rough'), false, rx, ry), roughness: 1, metalness: 0,
  }, extra));
}
// HDRI -> prefiltered environment map, handed to `use` once loaded.
function phEnv(id, use) {
  const url = `${PH}${id}/${id}_2k.hdr`;
  track(url, (res, rej) => rgbeLoader.load(url, tex => { use(pmrem.fromEquirectangular(tex).texture); tex.dispose(); res(); }, undefined, rej));
}
// Scanned prop scaled to a real-world height, shadows on.
function phModel(id, place) {
  const url = `${PH}${id}/${id}_1k.gltf`;
  track(url, (res, rej) => gltfLoader.load(url, g => {
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    place(g.scene); res();
  }, undefined, rej));
}
function fitHeight(obj, h) {
  const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3());
  const k = h / Math.max(size.y, 1e-3); obj.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(obj); obj.position.y -= b2.min.y;
  return obj;
}
function placeAt(obj, x, z, rotY = 0, h = null) {
  const g = new THREE.Group(); g.add(obj); if (h) fitHeight(obj, h); g.position.set(x, 0, z); g.rotation.y = rotY; return g;
}
// Photo sky (Kloofendal, partly cloudy). The sun in the image is turned to
// match the scene's key light; the dome rides with the camera.
const SKY_ID = 'kloofendal_48d_partly_cloudy_puresky';
const SKY_ROT_Y = -1.925;
const SKY_PHOTO = phTexture(`${PH}${SKY_ID}/sky_8k.jpg`, true, 1, 1, THREE.ClampToEdgeWrapping);
function photoDome() {
  const geo = new THREE.SphereGeometry(180, 96, 48); geo.scale(-1, 1, 1);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: SKY_PHOTO, fog: false, depthWrite: false, toneMapped: false }));
  m.rotation.y = SKY_ROT_Y; m.renderOrder = -1; m.userData.followCamera = true; return m;
}

// ================= people =================
function makePerson(o) {
  const g = new THREE.Group();
  const skin = phys(o.skin, .5, 0, { clearcoat: .15, clearcoatRoughness: .6 }),
    shirt = std(o.shirt, .8, 0, { map: SURF.fabric.map, bumpMap: SURF.fabric.bump, bumpScale: .004 }),
    pants = std(o.pants, .85, 0, { map: SURF.fabric.map, bumpMap: SURF.fabric.bump, bumpScale: .005 }), shoe = std(0x18181a, .45), hairM = std(o.hair, .85);
  const hipY = .9, P = { g };
  P.legs = [-1, 1].map(s => {
    const hip = new THREE.Group(); hip.position.set(0, hipY, s * .1); g.add(hip);
    hip.add(at(M(new THREE.CylinderGeometry(.08, .066, .44, 16), pants), 0, -.22, 0));
    const knee = new THREE.Group(); knee.position.y = -.44; hip.add(knee);
    knee.add(M(new THREE.SphereGeometry(.066, 12, 10), pants));
    knee.add(at(M(new THREE.CylinderGeometry(.064, .054, .42, 16), pants), 0, -.21, 0));
    knee.add(at(rbox(.26, .085, .115, .035, shoe), .05, -.43, 0));
    return { hip, knee };
  });
  const pelvis = at(M(new THREE.SphereGeometry(.17, 20, 14), pants), 0, hipY + .03, 0); pelvis.scale.set(.8, .55, 1.05); g.add(pelvis);
  const belt = at(M(new THREE.CylinderGeometry(.172, .172, .05, 20), std(0x1c1a18, .4, .4)), 0, hipY + .08, 0); belt.scale.set(.78, 1, 1); g.add(belt);
  const torso = at(M(new THREE.CylinderGeometry(.21, .17, .56, 24), shirt), 0, hipY + .34, 0); torso.scale.set(.72, 1, 1); g.add(torso);
  const chest = at(M(new THREE.SphereGeometry(.21, 24, 14), shirt), 0, hipY + .6, 0); chest.scale.set(.72, .45, 1); g.add(chest);
  if (o.stripe) { const st = at(M(new THREE.CylinderGeometry(.19, .182, .05, 24), std(o.stripe, .6)), 0, hipY + .44, 0); st.scale.set(.74, 1, 1.01); g.add(st); }
  const collar = at(M(new THREE.TorusGeometry(.065, .022, 8, 20), shirt), 0, hipY + .69, 0); collar.rotation.x = Math.PI / 2; g.add(collar);
  g.add(at(M(new THREE.CylinderGeometry(.05, .055, .1, 12), skin), 0, hipY + .71, 0));
  const head = new THREE.Group(); head.position.y = hipY + .76; g.add(head);
  const skull = at(M(new THREE.SphereGeometry(.125, 28, 20), skin), 0, .12, 0); skull.scale.set(1, 1.12, .95); head.add(skull);
  head.add(at(M(new THREE.SphereGeometry(.133, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), hairM), -.014, .15, 0));
  head.add(at(M(new THREE.SphereGeometry(.025, 10, 8), skin), .122, .1, 0));
  const eyeW = std(0xf4f1ee, .3), eyeP = std(0x161212, .2), brow = std(o.hair, .9);
  [-1, 1].forEach(s => {
    head.add(at(M(new THREE.SphereGeometry(.018, 10, 8), eyeW, false), .108, .145, s * .045));
    head.add(at(M(new THREE.SphereGeometry(.01, 8, 8), eyeP, false), .124, .145, s * .045));
    head.add(at(M(new THREE.BoxGeometry(.012, .01, .04), brow, false), .118, .175, s * .046));
    head.add(at(M(new THREE.SphereGeometry(.03, 10, 8), skin), 0, .12, s * .118));
  });
  head.add(at(M(new THREE.BoxGeometry(.01, .008, .045), std(0x7a3b30, .6), false), .118, .055, 0));
  const nose = at(M(new THREE.SphereGeometry(.02, 12, 10), skin), .124, .1, 0); nose.scale.set(1.1, 1.25, .8); head.add(nose);
  if (o.cap) {
    const capM = std(o.cap, .65);
    head.add(at(M(new THREE.SphereGeometry(.138, 24, 10, 0, Math.PI * 2, 0, Math.PI * .5), capM), 0, .16, 0));
    head.add(at(rbox(.17, .018, .2, .008, capM), .16, .17, 0));
  }
  P.head = head;
  P.arms = [-1, 1].map(s => {
    const sh = new THREE.Group(); sh.position.set(0, hipY + .56, s * .235); g.add(sh);
    sh.add(M(new THREE.SphereGeometry(.07, 16, 12), shirt));
    sh.add(at(M(new THREE.CylinderGeometry(.062, .055, .3, 14), shirt), 0, -.15, 0));
    const el = new THREE.Group(); el.position.y = -.3; sh.add(el);
    const fm = o.longSleeve ? shirt : skin;
    el.add(M(new THREE.SphereGeometry(.054, 12, 10), fm));
    el.add(at(M(new THREE.CylinderGeometry(.05, .042, .27, 14), fm), 0, -.135, 0));
    // Palm with four slightly curled fingers.
    const hand = new THREE.Group(); hand.position.y = -.285; el.add(hand);
    hand.add(at(rbox(.075, .085, .034, .016, skin), 0, -.02, 0));
    [-.026, -.009, .009, .026].forEach((z, i) => { const f = at(rbox(.016, .06 - Math.abs(i - 1.5) * .006, .016, .007, skin), .006, -.09, z); f.rotation.z = .25; hand.add(f); });
    return { sh, el, hand };
  });
  if (o.watch) {
    P.arms[0].el.add(at(M(new THREE.CylinderGeometry(.054, .054, .04, 16), std(0x222222, .3, .7)), 0, -.24, 0));
    const face = at(M(new THREE.CylinderGeometry(.03, .03, .012, 16), std(0xdfe8ee, .2, .2, { emissive: 0x334455 })), 0, -.24, -.056); face.rotation.x = Math.PI / 2; P.arms[0].el.add(face);
  }
  if (o.logo) {
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(.11, .045), new THREE.MeshBasicMaterial({ map: canvasTex(256, 104, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e31e24'; g.font = '800 34px Poppins, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DOKTER', w / 2, h * .32); g.fillText('MOBIL', w / 2, h * .72); }) }));
    patch.position.set(.166, hipY + .46, -.07); patch.rotation.y = Math.PI / 2; g.add(patch);
  }
  if (o.thumb) { const th = at(rbox(.09, .032, .034, .014, skin), .06, -.29, 0); th.visible = false; P.arms[1].el.add(th); P.thumb = th; }
  return P;
}
function resetPose(P) {
  P.legs.forEach(l => { l.hip.rotation.set(0, 0, 0); l.knee.rotation.set(0, 0, 0); });
  P.arms.forEach(a => { a.sh.rotation.set(0, 0, 0); a.el.rotation.set(0, 0, 0); });
  P.head.rotation.set(0, 0, 0); if (P.thumb) P.thumb.visible = false;
}
function walkPose(P, phase, amt) {
  const s = Math.sin(phase);
  P.legs[0].hip.rotation.z = s * .45 * amt; P.legs[1].hip.rotation.z = -s * .45 * amt;
  P.legs[0].knee.rotation.z = -Math.max(0, -Math.sin(phase - .6)) * .75 * amt; P.legs[1].knee.rotation.z = -Math.max(0, Math.sin(phase - .6)) * .75 * amt;
  P.arms[0].sh.rotation.z = -s * .35 * amt; P.arms[1].sh.rotation.z = s * .35 * amt;
  P.arms[0].el.rotation.z = .25 * amt; P.arms[1].el.rotation.z = .25 * amt;
  P.g.position.y += Math.abs(Math.cos(phase)) * .025 * amt;
}

// ================= car =================
function plateTex(text) {
  return canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#141414'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2f2f2'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#f2f2f2'; g.font = '800 36px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2); });
}
function makeWheel(outSign, rimM) {
  const w = new THREE.Group();
  const tp = [[.215, -.13], [.3, -.136], [.345, -.118], [.364, -.065], [.368, 0], [.364, .065], [.345, .118], [.3, .136], [.215, .13]].map(([r, y]) => new THREE.Vector2(r, y));
  const tire = M(new THREE.LatheGeometry(tp, 48), std(0x141414, .85, 0, { side: THREE.DoubleSide })); tire.rotation.x = Math.PI / 2; w.add(tire);
  const barrel = M(new THREE.CylinderGeometry(.218, .218, .24, 36, 1, true), rimM); barrel.rotation.x = Math.PI / 2; w.add(barrel);
  const disc = M(new THREE.CylinderGeometry(.17, .17, .025, 32), std(0x8a8a8e, .35, .85)); disc.rotation.x = Math.PI / 2; disc.position.z = -outSign * .02; w.add(disc);
  const spin = new THREE.Group(); w.add(spin);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const sp = at(rbox(.045, .2, .03, .012, rimM), Math.sin(a) * .11, Math.cos(a) * .11, outSign * .1); sp.rotation.z = -a; spin.add(sp); }
  spin.add(at(cyl(.055, .055, .04, rimM, 'z', 20), 0, 0, outSign * .1));
  const cal = at(rbox(.1, .14, .06, .02, std(0xd2161c, .4, .3)), -.12, .1, 0); cal.rotation.z = .6; w.add(cal);
  return { w, spin: [tire, spin] };
}
function makeCar(color) {
  const car = new THREE.Group(), body = new THREE.Group(); car.add(body);
  const paint = phys(color, .34, .22, { clearcoatRoughness: .05, envMapIntensity: .75 }), trim = std(0x1c1c1f, .55, .1), chrome = std(0xdadde0, .12, 1);
  const glass = std(0x0b1015, .04, .85, { transparent: true, opacity: .82, side: THREE.DoubleSide, envMapIntensity: 1.1 });
  const wr = .48, rearX = -1.4, frontX = 1.45, base = .36;
  const s = new THREE.Shape();
  s.moveTo(-2.2, base); s.lineTo(rearX - wr, base); s.absarc(rearX, base, wr, Math.PI, 0, true);
  s.lineTo(frontX - wr, base); s.absarc(frontX, base, wr, Math.PI, 0, true); s.lineTo(2.18, base);
  s.quadraticCurveTo(2.32, base + .05, 2.3, .72); s.quadraticCurveTo(2.28, .95, 2.0, 1.0); s.lineTo(1.22, 1.08); s.lineTo(.62, 1.62);
  s.quadraticCurveTo(.5, 1.72, .3, 1.72); s.lineTo(-1.85, 1.72); s.quadraticCurveTo(-2.12, 1.71, -2.18, 1.5); s.lineTo(-2.26, .95);
  s.quadraticCurveTo(-2.3, base + .05, -2.2, base);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.56, bevelEnabled: true, bevelThickness: .08, bevelSize: .07, bevelSegments: 6, curveSegments: 24 });
  geo.translate(0, 0, -.78); body.add(M(geo, paint));
  const shapeGeo = pts => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => sh.lineTo(p[0], p[1])); return new THREE.ShapeGeometry(sh); };
  body.add(at(M(shapeGeo([[-1.88, 1.08], [1.02, 1.08], [.56, 1.58], [.32, 1.63], [-1.82, 1.63]]), glass, false), 0, 0, .871));
  body.add(at(M(shapeGeo([[-1.88, 1.08], [-.12, 1.08], [-.12, 1.63], [-1.82, 1.63]]), glass, false), 0, 0, -.871));
  const ws = at(M(new THREE.BoxGeometry(.025, .8, 1.5), glass, false), .965, 1.39, 0); ws.rotation.z = .838; body.add(ws);
  const rw = at(M(new THREE.BoxGeometry(.025, .5, 1.4), glass, false), -2.28, 1.24, 0); rw.rotation.z = -.17; body.add(rw);
  [.872, -.872].forEach(z => {
    body.add(at(M(new THREE.BoxGeometry(.08, .55, .012), trim, false), -.16, 1.35, z));
    body.add(at(M(new THREE.BoxGeometry(2.9, .025, .012), chrome, false), -.43, 1.075, z));
    [-.14, -1.32].forEach(x => body.add(at(M(new THREE.BoxGeometry(.012, .62, .01), trim, false), x, .74, z * 1.001)));
    body.add(at(M(new THREE.BoxGeometry(1.5, .1, .02), trim, false), .02, .42, z * 1.01));
  });
  body.add(at(cyl(.08, .08, .01, std(color, .4, .4), 'z', 24), -1.75, 1.0, .872));
  [.6, -.6].forEach(z => { body.add(at(rbox(2.0, .035, .05, .015, std(0x2a2a2e, .4, .5)), -.75, 1.8, z));
    [-1.7, .2].forEach(x => body.add(at(rbox(.08, .07, .05, .02, std(0x2a2a2e, .4, .5)), x, 1.765, z))); });
  [.3, -.35].forEach(z => { const wp = at(M(new THREE.BoxGeometry(.03, .02, .6), trim, false), 1.2, 1.12, z); wp.rotation.y = .15; body.add(wp); });
  const door = new THREE.Group(); door.position.set(.98, 0, -.876); body.add(door);
  door.add(at(rbox(1.1, .7, .04, .015, paint), -.56, .72, 0));
  const dsh = new THREE.Shape(); dsh.moveTo(-1.1, 1.08); dsh.lineTo(.04, 1.08); dsh.lineTo(-.42, 1.58); dsh.lineTo(-.66, 1.63); dsh.lineTo(-1.1, 1.63);
  door.add(at(M(new THREE.ShapeGeometry(dsh), glass, false), 0, 0, -.012));
  door.add(at(rbox(.16, .035, .03, .012, chrome), -.86, .92, -.03));
  body.add(at(rbox(.06, .22, 1.0, .02, trim), 2.34, .6, 0));
  for (let i = 0; i < 4; i++) body.add(at(M(new THREE.BoxGeometry(.065, .012, .94), chrome, false), 2.345, .53 + i * .05, 0));
  body.add(at(rbox(.12, .13, 1.64, .05, trim), 2.33, .4, 0));
  body.add(at(rbox(.12, .13, 1.64, .05, trim), -2.31, .4, 0));
  const pf = at(M(new THREE.PlaneGeometry(.42, .105), new THREE.MeshBasicMaterial({ map: plateTex('B 2026 DM') })), 2.395, .42, 0); pf.rotation.y = Math.PI / 2; body.add(pf);
  const pr = at(M(new THREE.PlaneGeometry(.42, .105), new THREE.MeshBasicMaterial({ map: plateTex('B 2026 DM') })), -2.375, .7, 0); pr.rotation.y = -Math.PI / 2; body.add(pr);
  const headMat = std(0xffffff, .15, 0, { emissive: 0xfff3d6, emissiveIntensity: .9 });
  const tailMat = std(0x6a0000, .25, 0, { emissive: 0xff1a1a, emissiveIntensity: .6 });
  [.55, -.55].forEach(z => {
    body.add(at(rbox(.07, .14, .38, .03, headMat, false), 2.3, .84, z));
    body.add(at(rbox(.06, .32, .15, .03, tailMat, false), -2.3, 1.02, z * 1.13));
    body.add(at(rbox(.13, .1, .15, .04, paint), 1.12, 1.14, z > 0 ? .98 : -.98));
  });
  body.add(at(cyl(.045, .045, .22, chrome, 'x', 16), -2.3, .3, -.45));
  const spinners = [], rimM = std(0xc9cdd1, .2, .95);
  [rearX, frontX].forEach(x => [.72, -.72].forEach(z => { const wh = makeWheel(Math.sign(z), rimM); wh.w.position.set(x, .36, z); car.add(wh.w); spinners.push(...wh.spin); }));
  const driver = new THREE.Group();
  const dh = M(new THREE.SphereGeometry(.12, 20, 14), std(0xc58c63, .6)); dh.scale.y = 1.1; driver.add(dh);
  driver.add(at(M(new THREE.SphereGeometry(.127, 20, 10, 0, Math.PI * 2, 0, Math.PI * .5), std(0x1b1410, .9)), 0, .02, 0));
  driver.add(at(M(new THREE.CylinderGeometry(.17, .2, .4, 16), std(0x2f5d8a, .8)), 0, -.33, 0));
  driver.position.set(.2, 1.36, -.4); driver.visible = false; body.add(driver);
  car.userData = { body, spinners, door, driver, headMat };
  return car;
}
const TREE_BARK = textured(SURF.bark, .95, 0, .03);
const TREE_LEAVES = [0xffffff, 0xe3efd2, 0xd2e2bd].map(c => textured(SURF.leaves, .9, 0, .04, { color: c }));
function tree(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  g.add(at(M(new THREE.CylinderGeometry(.1, .18, 1.8, 14), TREE_BARK), 0, .9, 0));
  const seed = Math.abs(Math.floor(x * 13 + z * 7));
  [[0, 2.15, 0, 1.05], [.55, 2.6, .25, .72], [-.55, 2.45, -.3, .66], [.1, 2.95, -.2, .6], [-.3, 1.75, .45, .55]].forEach(([cx, cy, cz, r], i) => {
    g.add(at(blob(r, (seed + i * 3) % 50, TREE_LEAVES[(seed + i) % 3]), cx, cy, cz)); });
  return g;
}

