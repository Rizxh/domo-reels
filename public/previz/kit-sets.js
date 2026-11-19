// EP01 sets reused by later episodes: dashboard (gauges, road) and workshop
// (lift, second car, mechanic). Extracted from the EP01 previz on 2026-11-10.
// Load after kit.js. Each set is a THREE.Group already added to `scene`.
'use strict';

// ================= SET: dashboard =================
const dash = new THREE.Group(); scene.add(dash);
const A0 = Math.PI * .75, A1 = Math.PI * .25, needles = {}, roadDashes = [], roadsideTrees = [];
// Full scale of the speedometer, km/h.
const SPEEDO_MAX = 160;
function gaugeTex(kind) {
  return canvasTex(1024, 1024, (g) => {
    g.setTransform(2, 0, 0, 2, 0, 0);
    const cx = 256, cy = 256;
    const rg = g.createRadialGradient(cx, cy, 20, cx, cy, 256); rg.addColorStop(0, '#1d1d22'); rg.addColorStop(1, '#070708');
    g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, 256, 0, Math.PI * 2); g.fill(); g.lineCap = 'round';
    for (let i = 0; i < 17; i++) { const v = i / 16, a = -(A0 + (A1 - A0) * v), big = i % 2 === 0;
      const red = kind === 'fuel' && v < .14; g.strokeStyle = red ? '#ff2a30' : '#f4f4f4'; g.lineWidth = big ? 12 : 5;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * 205, cy + Math.sin(a) * 205); g.lineTo(cx + Math.cos(a) * (big ? 160 : 182), cy + Math.sin(a) * (big ? 160 : 182)); g.stroke(); }
    g.fillStyle = '#f4f4f4'; g.font = '800 62px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kind === 'fuel') { g.fillText('E', cx + Math.cos(-A0) * 118, cy + Math.sin(-A0) * 118 + 8); g.fillText('F', cx + Math.cos(-A1) * 118, cy + Math.sin(-A1) * 118 + 8); }
    else { g.font = '800 40px Poppins, sans-serif'; for (let i = 0; i <= 2; i++) { const a = -(A0 + (A1 - A0) * i / 2); g.fillText(String(i * SPEEDO_MAX / 2), cx + Math.cos(a) * 122, cy + Math.sin(a) * 122 + 6); } }
    g.font = '600 34px Poppins, sans-serif'; g.fillStyle = '#9aa0a6'; g.fillText(kind === 'fuel' ? 'BENSIN' : 'km/h', cx, cy + 120);
    if (kind === 'fuel') { g.fillRect(cx - 22, cy + 30, 34, 50); g.fillRect(cx + 16, cy + 40, 10, 30); }

  });
}
{
  dash.add(photoDome());
  const dashM = textured(SURF.softTouch, .7, .05, .0015), soft = textured(SURF.softTouch, .85, 0, .0015, { color: 0xcfcfd6 });
  // Main dash body, its front face just behind the gauge faces (z .475).
  dash.add(at(rbox(4.2, .55, 1.0, .08, dashM, true, true), 0, .82, -.12));
  const topPad = at(M(new THREE.CylinderGeometry(.5, .5, 4.2, 32, 1, false, 0, Math.PI), soft), 0, 1.08, .1); topPad.rotation.z = Math.PI / 2; topPad.scale.set(1, 1, .5); dash.add(topPad);
  const hood = at(M(new THREE.CylinderGeometry(.62, .62, .4, 48, 1, true, -Math.PI * .1, Math.PI * 1.2), std(0x2a2a2f, .85, 0, { side: THREE.DoubleSide })), 0, 1.0, .42); hood.rotation.x = Math.PI / 2; hood.rotation.z = Math.PI; dash.add(hood);
  dash.add(at(rbox(1.5, .62, .05, .02, std(0x0b0b0c, .5)), 0, 1.0, .44));
  [['fuel', -.36], ['speed', .36]].forEach(([k, x]) => {
    dash.add(at(new THREE.Mesh(new THREE.CircleGeometry(.27, 64), new THREE.MeshBasicMaterial({ map: gaugeTex(k) })), x, 1.0, .475));
    dash.add(at(M(new THREE.TorusGeometry(.28, .022, 16, 64), std(0xc9ccd0, .2, .95)), x, 1.0, .476));
    const ng = new THREE.Group(); ng.position.set(x, 1.0, .487); dash.add(ng);
    ng.add(at(new THREE.Mesh(new THREE.BoxGeometry(.2, .012, .006), new THREE.MeshBasicMaterial({ color: 0xff3b30 })), .1, 0, 0));
    ng.add(at(new THREE.Mesh(new THREE.CircleGeometry(.025, 24), new THREE.MeshBasicMaterial({ color: 0x222222 })), 0, 0, .005));
    needles[k] = ng;
  });
  const screen = at(rbox(.7, .4, .04, .02, std(0x0c1724, .3, .2, { emissive: 0x15385c, emissiveIntensity: .6 })), 1.15, 1.02, .42); screen.rotation.y = -.25; dash.add(screen);
  [-1.6, 1.75].forEach(x => { dash.add(at(rbox(.4, .16, .05, .02, std(0x0a0a0b, .6)), x, .92, .39));
    for (let i = 0; i < 4; i++) dash.add(at(M(new THREE.BoxGeometry(.38, .012, .06), std(0x4a4a50, .35, .7), false), x, .86 + i * .04, .4)); });
  const wheel = new THREE.Group(); wheel.position.set(0, .62, .98); wheel.rotation.x = -.35; dash.add(wheel);
  wheel.add(M(new THREE.TorusGeometry(.4, .045, 20, 64), std(0x141416, .55)));
  [0, 2.2, -2.2].forEach(a => { const sp = at(rbox(.06, .38, .03, .012, std(0x2a2a2e, .45, .4)), Math.sin(a) * .19, -Math.cos(a) * .19, 0); sp.rotation.z = a; wheel.add(sp); });
  wheel.add(cyl(.11, .11, .06, std(0x222226, .45, .4), 'z', 32));
  const pillarM = std(0x121214, .8);
  [-2.0, 2.0].forEach(x => { const p = at(rbox(.12, 1.6, .1, .03, pillarM), x * .98, 1.75, -.35); p.rotation.z = x > 0 ? .45 : -.45; dash.add(p); });
  dash.add(at(rbox(4.4, .1, 1.2, .03, pillarM), 0, 2.45, .3));
  dash.add(at(flat(M(new THREE.PlaneGeometry(9, 140), phSurface('asphalt_02', 3, 46), false, true)), 0, -.2, -70));
  dash.add(at(flat(M(new THREE.PlaneGeometry(160, 140), textured(SURF.grass, .95, 0, .03), false, true)), 0, -.21, -70));
  const lineM = std(0xf2efe6, .6);
  for (let i = 0; i < 14; i++) { const d = at(flat(M(new THREE.PlaneGeometry(.14, 1.6), lineM, false)), 0, -.19, -i * 6); dash.add(d); roadDashes.push(d); }
  for (let i = 0; i < 10; i++) { const tr = tree(i % 2 ? 6.5 : -6.5, -i * 8, 1.2); dash.add(tr); roadsideTrees.push(tr); }
  const key = new THREE.DirectionalLight(0xfff0dd, 1.0); key.position.set(2, 4, 3);
  key.intensity = 1.5; dash.add(key, new THREE.HemisphereLight(0xcfe2ff, 0x3a3a3a, .5));
}

// ================= SET: workshop =================
const workshop = new THREE.Group(); scene.add(workshop);
const carB = makeCar(0x1f1f24), lift = new THREE.Group();
const mech = makePerson({ skin: 0xb98058, shirt: 0xd8222a, pants: 0x232328, hair: 0x15100d, cap: 0xd8222a, stripe: 0xf2f2f2, thumb: true, logo: true });
{
  workshop.add(flat(M(new THREE.PlaneGeometry(40, 40), textured(SURF.epoxy, .3, .3, .004, { envMapIntensity: .3 }), false, true)));
  const lineM = std(0xE31E24, .5);
  [-2.6, 2.6].forEach(x => workshop.add(at(flat(M(new THREE.PlaneGeometry(.12, 7), lineM, false, true)), x, .01, -2)));
  workshop.add(at(rbox(16, 5, .3, .03, std(0x151517, .8), true, true), 0, 2.5, -5.2));
  workshop.add(at(rbox(16, .55, .05, .02, std(0xE31E24, .45, 0, { emissive: 0x5a0a0d, emissiveIntensity: .5 })), 0, 2.5, -5.03));
  [-6, 6].forEach(x => workshop.add(at(rbox(.3, 5, 12, .03, std(0x18181a, .85), true, true), x, 2.5, 0)));
  const stripM = new THREE.MeshBasicMaterial({ color: 0xfff7ec });
  [-2.4, 0, 2.4].forEach(x => workshop.add(at(new THREE.Mesh(new THREE.BoxGeometry(.18, .05, 6), stripM), x, 4.6, -1)));
  const red = phys(0xc81c22, .4, .3, { clearcoat: .5 });
  phModel('metal_tool_chest', m => workshop.add(placeAt(m, -3.5, -4.55, 0, 1.25)));
  phModel('tool_cart', m => workshop.add(placeAt(m, -4.7, -2.6, Math.PI / 2, .95)));
  phModel('tire_pump', m => workshop.add(placeAt(m, 2.7, -3.9, -.5, .7)));
  for (let i = 0; i < 3; i++) { const tt = M(new THREE.TorusGeometry(.34, .14, 20, 40), std(0x121212, .85)); tt.rotation.x = Math.PI / 2; tt.position.set(3.6, .14 + i * .28, -3.8); workshop.add(tt); }
  [-1.75, 1.75].forEach(x => workshop.add(at(rbox(.3, 3.4, .3, .04, red, true, true), x, 1.7, -2.4)));
  workshop.add(lift);
  [-1, 1].forEach(s => lift.add(at(rbox(2.6, .08, .16, .03, std(0x3a3a3e, .4, .7)), 0, 0, -2.4 + s * .55)));
  carB.position.set(0, .04, -2.4); lift.add(carB); carB.userData.headMat.emissiveIntensity = .15;
  mech.g.position.set(0, 0, 1.3); mech.g.rotation.y = -Math.PI / 2; workshop.add(mech.g);
  const spot = new THREE.SpotLight(0xffffff, 2.2, 16, .55, .5, 1); spot.position.set(1.5, 5, 4.5); spot.target.position.set(0, 1, 1); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.0005;
  // Red rim from behind, high enough that its highlight on the glossy floor
  // stays out of frame.
  const rimL = new THREE.PointLight(0xff3a3f, 1.2, 8); rimL.position.set(-2.5, 4.2, -1.2);
  workshop.add(spot, spot.target, rimL, new THREE.HemisphereLight(0xffffff, 0x222226, .35));
}

