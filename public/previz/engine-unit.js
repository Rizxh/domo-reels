// Detailed four-stroke engine parts for the Doktermobil previz pages: one
// cylinder unit (piston, rings, connecting rod, crank throw, four valves with
// springs, cam lobes, spark plug, flame) and a four-cylinder engine built
// from it. Load after kit.js.
//
// Local units: crank axis along X at y = 0, piston travels along Y. Phase is
// counted in strokes: 0 intake, 1 compression, 2 power (spark), 3 exhaust.
'use strict';

const GEO = { r: .42, l: 1.55, R: .48, crown: .3, clearance: .1, linerBottom: .95, spacing: 1.15, valveTilt: .38, valveLift: .15 };
const TDC = GEO.r + GEO.l + GEO.crown, DECK = TDC + GEO.clearance;
// Firing order 1-3-4-2 as phase offsets for cylinders 1..4.
const FIRING_OFFSET = [0, -3, -1, -2];

const lathe = (pts, mat, seg = 64) => M(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), mat);

// ---------- textures ----------
// Piston crown seen from above: machining rings and valve pockets, or carbon.
function crownTexture(dirty) {
  return canvasTex(512, 512, (g, w, h) => {
    const c = w / 2;
    g.fillStyle = dirty ? '#1a1410' : '#b9bfc6'; g.fillRect(0, 0, w, h);
    if (!dirty) {
      for (let i = 0; i < 46; i++) { g.strokeStyle = `rgba(${i % 2 ? 255 : 40},${i % 2 ? 255 : 46},${i % 2 ? 255 : 54},${.05 + hash(i) * .07})`; g.lineWidth = 1 + hash(i + 9) * 2; g.beginPath(); g.arc(c, c, 8 + i * 5.4, 0, Math.PI * 2); g.stroke(); }
    } else {
      for (let i = 0; i < 260; i++) {
        const a = hash(i) * Math.PI * 2, d = Math.sqrt(hash(i + 400)) * c * .96, r = 6 + hash(i + 800) * 34, k = hash(i + 1200);
        g.fillStyle = k > .7 ? `rgba(74,52,34,${.25 + k * .3})` : `rgba(6,5,4,${.3 + k * .5})`;
        g.beginPath(); g.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, r, 0, Math.PI * 2); g.fill();
      }
    }
    // Four valve pockets (two intake, two exhaust).
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const x = c + sx * c * .44, y = c + sz * c * .4, gr = g.createRadialGradient(x, y, 4, x, y, c * .33);
      gr.addColorStop(0, dirty ? 'rgba(0,0,0,.55)' : 'rgba(30,34,40,.42)'); gr.addColorStop(.8, dirty ? 'rgba(0,0,0,.35)' : 'rgba(30,34,40,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, c * .33, 0, Math.PI * 2); g.fill();
    });
  });
}

// ---------- materials ----------
const EM = {
  alu: std(0xa9b0b8, .38, .9, { envMapIntensity: .55, map: SURF.metal.map, bumpMap: SURF.metal.bump, bumpScale: .003 }),
  aluDark: std(0x8b939c, .42, .85, { envMapIntensity: .6 }),
  forged: std(0x5a6068, .46, .88, { envMapIntensity: .65, bumpMap: SURF.iron.bump, bumpScale: .006 }),
  polished: std(0xc9ced3, .18, 1, { envMapIntensity: .65 }),
  ring: std(0x23262a, .38, .8),
  valve: std(0xa7adb4, .26, .95, { envMapIntensity: .6 }),
  valveHot: std(0x9a8f7c, .3, .9, { envMapIntensity: .7 }),
  spring: std(0x3a4a5c, .35, .8),
  cam: std(0xaab1b9, .2, .95, { envMapIntensity: .8 }),
  nickel: std(0xcfd3d6, .2, 1, { envMapIntensity: .9 }),
  ceramic: phys(0xf4f1ea, .28, 0, { clearcoat: .6, clearcoatRoughness: .2 }),
  ceramicFouled: std(0x2a221c, .9, 0),
  copper: std(0xc98a4b, .28, 1),
  carbon: std(0x14100d, .97, 0),
  glass: new THREE.MeshPhysicalMaterial({ color: lin(0xa8d4ff), roughness: .06, metalness: 0, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1 }),
  ghost: new THREE.MeshPhysicalMaterial({ color: lin(0xb9c8d8), roughness: .2, metalness: 0, transparent: true, opacity: .045, depthWrite: false }),
  edge: new THREE.LineBasicMaterial({ color: lin(0x9fd0ff), transparent: true, opacity: .32 }),
};

// ---------- flame ----------
// Additive shell with animated noise; edges fall off toward the silhouette so
// stacked shells read as a soft volume. Values above 1 feed the bloom pass.
const FLAME_VERT = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main() { vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FLAME_FRAG = `
uniform float uT; uniform float uStrength; uniform float uSeed; uniform vec3 uHot; uniform vec3 uMid; uniform vec3 uCool;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * n3(p); p *= 2.03; a *= 0.5; } return s; }
void main() {
  float rim = clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
  float n = fbm(vP * 2.6 + vec3(uSeed, -uT * 1.7, uT * 0.9));
  float body = smoothstep(0.02, 0.85, rim);
  float heat = body * (0.45 + 1.1 * n);
  vec3 col = mix(uCool, uMid, smoothstep(0.25, 0.75, heat));
  col = mix(col, uHot, smoothstep(0.75, 1.25, heat));
  gl_FragColor = vec4(col * (0.6 + heat), clamp(body * (0.35 + 0.9 * n), 0.0, 1.0) * uStrength);
}`;
function makeFlame(dirty, seed, scale) {
  const g = new THREE.Group();
  const shells = [1, .72, .44].map((s, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uT: { value: 0 }, uStrength: { value: 0 }, uSeed: { value: seed * 7.3 + i * 3.1 },
        uHot: { value: new THREE.Color(dirty ? 1.6 : 2.6, dirty ? 1.0 : 2.2, dirty ? .5 : 1.5) },
        uMid: { value: new THREE.Color(dirty ? 1.5 : 2.2, dirty ? .55 : 1.05, dirty ? .08 : .16) },
        uCool: { value: new THREE.Color(dirty ? .7 : 1.2, dirty ? .12 : .22, .02) } },
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 48, 32), mat); m.renderOrder = 5 + i; g.add(m); return m;
  });
  // Embers thrown from the plug.
  const N = 36, pos = new Float32Array(N * 3), embers = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: new THREE.Color(3, 1.6, .5), size: .035 * scale, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  embers.frustumCulled = false; embers.renderOrder = 9;
  return { g, shells, embers, N, pos };
}

// ---------- spark plug ----------
// Origin at the seat (where the shell meets the chamber roof); electrodes
// hang below it. worn: eroded electrodes, wide gap, fouled insulator nose.
function makeSparkPlug(o = {}) {
  const worn = !!o.worn, g = new THREE.Group();
  const nose = worn ? EM.ceramicFouled : EM.ceramic;
  // Insulator nose and centre electrode inside the chamber.
  g.add(lathe([[0, -.06], [.03, -.06], [.05, -.02], [.062, .02], [0, .02]], nose, 24));
  g.add(at(cyl(worn ? .015 : .011, .016, worn ? .03 : .05, EM.nickel, 'y', 12), 0, worn ? -.07 : -.078, 0));
  // Ground strap: down the side, then across under the tip.
  const drop = worn ? .15 : .135;
  g.add(tube([[.066, 0, 0], [.066, -drop + .03, 0], [.05, -drop, 0], [worn ? .02 : -.012, -drop, 0]], .013, worn ? EM.forged : EM.nickel, false, 24, 8));
  // Threaded shell, gasket, hex, upper shell.
  const thread = [[.07, 0]]; for (let i = 0; i < 9; i++) { thread.push([.084, .012 + i * .024], [.07, .024 + i * .024]); }
  thread.push([.07, .23]); g.add(lathe(thread, worn ? EM.forged : EM.nickel, 32));
  g.add(at(cyl(.118, .118, .022, EM.copper, 'y', 32), 0, .24, 0));
  g.add(lathe([[.1, .25], [.125, .262], [.125, .34], [.1, .352]], EM.nickel, 6));
  g.add(lathe([[.085, .352], [.09, .4], [.07, .43]], EM.nickel, 32));
  // Ribbed ceramic insulator and terminal.
  const ribs = [[.062, .43]]; for (let i = 0; i < 5; i++) { ribs.push([.07, .45 + i * .05], [.058, .475 + i * .05]); }
  ribs.push([.05, .72], [.042, .78]); g.add(lathe(ribs, EM.ceramic, 32));
  g.add(lathe([[.022, .78], [.03, .8], [.03, .84], [.022, .86], [.022, .9], [.03, .91], [0, .92]], EM.copper, 20));
  // Centre and height of the spark gap, relative to the seat.
  g.userData.gapY = worn ? -.111 : -.1125; g.userData.gap = worn ? .052 : .019;
  return g;
}

// ---------- cylinder unit ----------
function makeUnit(o = {}) {
  const power = o.power === undefined ? 1 : o.power, dirty = !!o.dirty, lightRange = o.lightRange || 4, seed = o.seed || 0;
  const g = new THREE.Group(), { r, l, R } = GEO;

  // Glass liner, chamber roof and the deck between block and head.
  const liner = new THREE.Mesh(new THREE.CylinderGeometry(R + .028, R + .028, DECK - GEO.linerBottom, 96, 1, true), EM.glass);
  liner.position.y = (DECK + GEO.linerBottom) / 2; liner.renderOrder = 2; g.add(liner);
  const roof = new THREE.Mesh(new THREE.SphereGeometry(R + .028, 96, 24, 0, Math.PI * 2, 0, Math.PI / 2), EM.glass);
  roof.scale.y = .5; roof.position.y = DECK; roof.renderOrder = 2; g.add(roof);
  const roofTop = DECK + (R + .028) * .5;
  [DECK, GEO.linerBottom].forEach(y => { const ring = at(M(new THREE.TorusGeometry(R + .04, .016, 12, 96), EM.polished), 0, y, 0); ring.rotation.x = Math.PI / 2; g.add(ring); });

  // Spark plug, seated at the roof apex.
  const plug = makeSparkPlug({ worn: dirty }); plug.position.y = roofTop + .02; g.add(plug);
  const sparkY = plug.position.y + plug.userData.gapY;

  // Four valves (two intake at -z, two exhaust at +z), springs and cam lobes.
  const valves = [];
  [-1, 1].forEach(side => {
    const mat = side < 0 ? EM.valve : EM.valveHot;
    const camY = DECK + .13 + 1.0 * Math.cos(GEO.valveTilt), camZ = side * (.2 + 1.0 * Math.sin(GEO.valveTilt));
    g.add(at(cyl(.075, .075, GEO.spacing, EM.cam, 'x', 24), 0, camY, camZ));
    [-.215, .215].forEach(x => {
      const frame = new THREE.Group(); frame.position.set(x, DECK + .13, side * .2); frame.rotation.x = side * GEO.valveTilt; g.add(frame);
      const moving = new THREE.Group(); frame.add(moving);
      moving.add(lathe([[0, -.012], [.165, -.012], [.172, .004], [.06, .07], [.03, .13], [.028, .82], [0, .82]], mat, 40));
      moving.add(at(cyl(.095, .08, .035, EM.aluDark, 'y', 24), 0, .7, 0));
      moving.add(at(cyl(.1, .1, .1, EM.polished, 'y', 28), 0, .83, 0));
      // Coil spring between the head and the retainer.
      const turns = 5.5, pts = []; for (let i = 0; i <= 88; i++) { const a = i / 88 * turns * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * .078, i / 88, Math.sin(a) * .078)); }
      const spring = M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 132, .013, 6, false), EM.spring); spring.position.y = .3; frame.add(spring);
      // Cam lobe: base circle with a nose, pointing at the tappet when open.
      const s = new THREE.Shape(); s.absarc(0, 0, .11, Math.PI * .22, Math.PI * .78, true); s.quadraticCurveTo(-.05, .2, 0, .205); s.quadraticCurveTo(.05, .2, .11 * Math.cos(Math.PI * .22), .11 * Math.sin(Math.PI * .22));
      const lobeGeo = new THREE.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 2, curveSegments: 24 });
      lobeGeo.translate(0, 0, -.06); lobeGeo.rotateY(Math.PI / 2);
      const lobe = new THREE.Group(); lobe.position.set(x, camY, camZ); lobe.add(M(lobeGeo, EM.cam)); g.add(lobe);
      valves.push({ moving, spring, lobe, side });
    });
  });

  // Piston: crown, ring lands and grooves, skirt, rings, wrist pin.
  const piston = new THREE.Group(); g.add(piston);
  const c = GEO.crown, pr = R - .012, land = [];
  [.075, .14, .215].forEach(d => land.push([pr, c - d + .014], [pr - .03, c - d + .014], [pr - .03, c - d - .014], [pr, c - d - .014]));
  piston.add(lathe([[pr - .012, c], [pr, c - .014], ...land, [pr, -.02], [pr - .006, -.2], [pr - .03, -.23], [pr - .06, -.23], [pr - .06, c - .26], [0, c - .26]], EM.alu, 96));
  const top = new THREE.Mesh(new THREE.CircleGeometry(pr - .012, 96), std(0xffffff, dirty ? .96 : .36, dirty ? 0 : .85, { map: crownTexture(dirty), envMapIntensity: dirty ? .1 : .7 }));
  top.rotation.x = -Math.PI / 2; top.position.y = c + .001; top.receiveShadow = true; piston.add(top);
  [.075, .14].forEach(d => piston.add(at(cyl(R - .004, R - .004, .02, EM.ring, 'y', 96), 0, c - d, 0)));
  piston.add(at(cyl(R - .004, R - .004, .024, EM.aluDark, 'y', 96), 0, c - .215, 0));
  piston.add(cyl(.068, .068, 2 * (pr - .05), EM.polished, 'x', 28));
  if (dirty) for (let i = 0; i < 22; i++) {
    const a = hash(i + 3) * Math.PI * 2, d = Math.sqrt(hash(i + 31)) * (R - .09);
    const b = at(M(new THREE.SphereGeometry(.045 + hash(i + 7) * .055, 12, 8), EM.carbon), Math.cos(a) * d, c + .006, Math.sin(a) * d); b.scale.y = .28 + hash(i + 51) * .2; piston.add(b);
  }

  // Connecting rod: I-beam, small end, split big end with cap bolts.
  const rod = new THREE.Group(); g.add(rod);
  rod.add(rbox(.05, l - .32, .11, .012, EM.forged)); [-.05, .05].forEach(z => rod.add(at(rbox(.13, l - .32, .028, .01, EM.forged), 0, -.02, z)));
  rod.add(at(cyl(.125, .125, .13, EM.forged, 'x', 32), 0, l / 2, 0));
  rod.add(at(cyl(.215, .215, .13, EM.forged, 'x', 40), 0, -l / 2, 0));
  rod.add(at(rbox(.14, .1, .52, .02, EM.forged), 0, -l / 2 - .05, 0));
  [-.22, .22].forEach(z => { rod.add(at(cyl(.03, .03, .22, EM.polished, 'y', 12), 0, -l / 2 - .05, z)); rod.add(at(cyl(.045, .045, .04, EM.polished, 'y', 6), 0, -l / 2 - .17, z)); });

  // Crank throw: two webs with counterweights, crank pin, main journals.
  const crank = new THREE.Group(); g.add(crank);
  const web = new THREE.Shape(); web.moveTo(-.2, r); web.absarc(0, r, .2, Math.PI, 0, true); web.lineTo(.26, 0);
  web.lineTo(.62 * Math.cos(-.42), .62 * Math.sin(-.42)); web.absarc(0, 0, .62, -.42, -Math.PI + .42, true); web.lineTo(-.26, 0); web.lineTo(-.2, r);
  const webGeo = new THREE.ExtrudeGeometry(web, { depth: .1, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2, curveSegments: 32 });
  webGeo.translate(0, 0, -.05); webGeo.rotateY(Math.PI / 2);
  [-.2, .2].forEach(x => crank.add(at(M(webGeo, EM.forged), x, 0, 0)));
  crank.add(at(cyl(.15, .15, .3, EM.polished, 'x', 32), 0, r, 0));
  [-1, 1].forEach(s => crank.add(at(cyl(.17, .17, GEO.spacing / 2 - .25, EM.polished, 'x', 32), s * (GEO.spacing / 4 + .125), 0, 0)));

  // Combustion: flame, plug spark and the light they throw.
  const flame = makeFlame(dirty, seed, o.scale || 1); g.add(flame.g, flame.embers); if (dirty) flame.g.position.x = .12;
  const arc = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(15), 3)),
    new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 3, 4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  arc.frustumCulled = false; arc.renderOrder = 10; g.add(arc);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 3.2, 4.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.y = sparkY; glow.renderOrder = 10; g.add(glow);
  const light = new THREE.PointLight(0xff8a3a, 0, lightRange, 1.6); light.position.y = DECK - .12; g.add(light);

  function update(phi) {
    const ph = ((phi % 4) + 4) % 4, th = phi * Math.PI;
    const cy = r * Math.cos(th), cz = r * Math.sin(th), pinY = cy + Math.sqrt(l * l - cz * cz);
    piston.position.y = pinY; crank.rotation.x = th;
    rod.position.set(0, (pinY + cy) / 2, cz / 2); rod.rotation.x = Math.atan2(-cz, pinY - cy);
    // Valve lift follows a sine over its stroke; the cam turns once per cycle.
    valves.forEach(v => {
      const open = v.side < 0 ? (ph < 1 ? Math.sin(Math.PI * ph) : 0) : (ph >= 3 ? Math.sin(Math.PI * (ph - 3)) : 0);
      v.moving.position.y = -open * GEO.valveLift; v.spring.scale.y = .4 - open * GEO.valveLift;
      v.lobe.rotation.x = v.side * GEO.valveTilt + Math.PI + (phi - (v.side < 0 ? .5 : 3.5)) * Math.PI / 2;
    });
    // Combustion: the flame front grows from the plug, fills the chamber and
    // follows the piston down while it fades.
    const k = ph - 2, burning = k >= 0 && k < 1;
    const grow = burning ? outCubic(clamp(k / .2)) : 0, fade = burning ? 1 - smooth01(k, .3, .95) : 0;
    const strength = grow * fade * power, crownY = pinY + c, topY = DECK + .2;
    flame.g.visible = strength > .002;
    flame.g.position.y = (crownY + topY) / 2;
    const fx = (R - .03) * (.2 + .8 * grow) * (dirty ? .6 : 1);
    flame.g.scale.set(fx, Math.max(.05, (topY - crownY) / 2 * (.3 + .7 * grow)) * (dirty ? .78 : 1), fx);
    flame.shells.forEach(s => { s.material.uniforms.uT.value = phi * 1.3; s.material.uniforms.uStrength.value = strength; });
    // Embers arc outward from the spark and die with the flame.
    flame.embers.visible = burning && k < .7;
    if (flame.embers.visible) {
      for (let i = 0; i < flame.N; i++) {
        const a = hash(i + seed * 13) * Math.PI * 2, e = hash(i + 77 + seed * 5), sp = .25 + hash(i + 191) * .5, t = k / .7;
        flame.pos[i * 3] = Math.cos(a) * sp * outCubic(t) * (R - .06); flame.pos[i * 3 + 1] = sparkY - (.1 + e * .9) * t * (sparkY - crownY); flame.pos[i * 3 + 2] = Math.sin(a) * sp * outCubic(t) * (R - .06);
      }
      flame.embers.geometry.attributes.position.needsUpdate = true;
      flame.embers.material.opacity = (1 - k / .7) * power;
    }
    // Spark: a jagged arc across the gap just before and after ignition.
    const s = ph > 1.92 && ph < 2.07 ? 1 : 0, p = arc.geometry.attributes.position.array, step = Math.floor(phi * 120);
    arc.visible = glow.visible = s > 0;
    if (s) {
      for (let i = 0; i < 5; i++) { const u = i / 4, j = i === 0 || i === 4 ? 0 : 1;
        p[i * 3] = (hash(step + i) - .5) * .03 * j; p[i * 3 + 1] = sparkY + plug.userData.gap * (.5 - u); p[i * 3 + 2] = (hash(step + i + 40) - .5) * .03 * j; }
      arc.geometry.attributes.position.needsUpdate = true;
      glow.scale.setScalar(.7 + hash(step) * .8);
    }
    light.intensity = 1.7 * strength + 1.1 * s;
  }
  // Points callouts can aim at, in the unit's local space, for the current pose.
  const points = {
    plug: () => new THREE.Vector3(0, plug.position.y + .06, 0),
    crown: () => new THREE.Vector3(0, piston.position.y + c, 0),
  };
  return { g, update, points };
}

// ---------- four-cylinder engine ----------
// Units in a row along X, a see-through block with blueprint edges, flywheel
// and front pulley. update(phi) takes the phase of cylinder 1.
function makeEngine(o = {}) {
  const g = new THREE.Group(), n = FIRING_OFFSET.length, len = GEO.spacing * n;
  const units = FIRING_OFFSET.map((_, i) => { const u = makeUnit({ lightRange: o.lightRange, scale: o.scale, seed: i + 1 }); u.g.position.x = (i - (n - 1) / 2) * GEO.spacing; g.add(u.g); return u; });
  const ghostBox = (w, h, d, x, y, z) => {
    const geo = new THREE.BoxGeometry(w, h, d), m = new THREE.Mesh(geo, EM.ghost); m.position.set(x, y, z); m.renderOrder = 1; g.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), EM.edge); e.position.copy(m.position); g.add(e);
  };
  ghostBox(len + .2, DECK - GEO.linerBottom + .1, 1.34, 0, (DECK + GEO.linerBottom) / 2, 0);   // block
  ghostBox(len + .2, 1.5, 1.5, 0, .15, 0);                                                      // crankcase
  ghostBox(len + .2, 1.25, 1.75, 0, DECK + .7, 0);                                              // head
  ghostBox(len, .5, 1.2, 0, -.85, 0);                                                           // sump
  const spin = new THREE.Group(); g.add(spin);
  const fly = at(cyl(.92, .92, .12, EM.forged, 'x', 96), len / 2 + .22, 0, 0); spin.add(fly);
  for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, tooth = at(rbox(.1, .05, .04, .008, EM.aluDark), len / 2 + .22, Math.cos(a) * .94, Math.sin(a) * .94); tooth.rotation.x = a; spin.add(tooth); }
  spin.add(at(cyl(.3, .3, .18, EM.aluDark, 'x', 48), -len / 2 - .2, 0, 0));
  for (let i = 0; i < 6; i++) spin.add(at(cyl(.305, .305, .012, EM.ring, 'x', 48), -len / 2 - .27 + i * .028, 0, 0));
  function update(phi) { units.forEach((u, i) => u.update(phi + FIRING_OFFSET[i])); spin.rotation.x = phi * Math.PI; }
  return { g, units, update };
}

const smooth01 = (t, a, b) => { const k = clamp((t - a) / (b - a)); return k * k * (3 - 2 * k); };
