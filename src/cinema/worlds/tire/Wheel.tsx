// The hero wheel: 205/55 R16 tire (carcass, instanced tread blocks with
// grooves and sipes, lettered sidewall, growing cracks) on a five-spoke
// alloy with brake disc and caliper. Pose and ageing come from props only.

import { useMemo } from "react";
import {
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  type InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  Shape,
  TorusGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { carcassGeometry, CRACKS, TIRE, TREAD_BASE, wallGeometry, type WheelPose } from "./geometry";
import { CRACK_LEVEL, crackMap, rubberGrain, sidewallMaps, type SidewallCopy } from "./textures";
import { WHEEL_LOOK } from "./look";

// Tread layout across the width: [center a, width, gap between blocks (m),
// pitch offset (share of a pitch)].
const RIBS = [
  { a: 0, w: 0.043, gap: 0.0013, offset: 0, slant: 0.18 },
  { a: 0.0435, w: 0.0215, gap: 0.0024, offset: 0.5, slant: -0.25 },
  { a: -0.0435, w: 0.0215, gap: 0.0024, offset: 0.25, slant: 0.25 },
  { a: 0.0735, w: 0.021, gap: 0.0062, offset: 0, slant: 0.1 },
  { a: -0.0735, w: 0.021, gap: 0.0062, offset: 0.5, slant: -0.1 },
] as const;

const TreadRib: React.FC<{ rib: (typeof RIBS)[number]; material: MeshStandardMaterial }> = ({ rib, material }) => {
  const { geometry, matrices } = useMemo(() => {
    const pitch = (Math.PI * 2) / TIRE.pitches;
    const len = TIRE.outerRadius * pitch - rib.gap;
    const depth = TIRE.treadDepth + 0.0015;
    const geo = new RoundedBoxGeometry(depth, rib.w, len, 2, 0.0011);
    const o = new Object3D();
    const ms: Matrix4[] = [];
    const rc = TREAD_BASE - 0.0015 + depth / 2;
    for (let i = 0; i < TIRE.pitches; i++) {
      const th = (i + rib.offset) * pitch;
      o.position.set(rc * Math.cos(th), rib.a, rc * Math.sin(th));
      o.rotation.set(0, -th, 0);
      // Slanted sipes: shear-like yaw about the radial axis.
      o.rotateX(rib.slant * 0.25);
      o.updateMatrix();
      ms.push(o.matrix.clone());
    }
    return { geometry: geo, matrices: ms };
  }, [rib]);
  return (
    <instancedMesh
      args={[geometry, material, matrices.length]}
      castShadow
      receiveShadow
      ref={(m: InstancedMesh | null) => {
        if (m) {
          matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
          m.instanceMatrix.needsUpdate = true;
        }
      }}
    />
  );
};

// One slim arm of a twin spoke, in (radial, tangential) metres: tapered,
// leaning `side` toward its twin at the hub and apart at the rim.
const armShape = (side: 1 | -1) => {
  const s = new Shape();
  const hub = { r: 0.062, c: side * 0.008, w: 0.0105 };
  const rim = { r: 0.191, c: side * 0.021, w: 0.0068 };
  s.moveTo(hub.r, hub.c - hub.w);
  s.lineTo(rim.r, rim.c - rim.w);
  s.lineTo(rim.r, rim.c + rim.w);
  s.lineTo(hub.r, hub.c + hub.w);
  s.closePath();
  return s;
};

export const Wheel: React.FC<{
  pose: WheelPose;
  // 0 = fresh rubber, 1 = old (greyer, oxidised).
  age: number;
  // Share of the cracks grown (0..1).
  cracks: number;
  copy: SidewallCopy;
}> = ({ pose, age, cracks, copy }) => {
  const mats = useMemo(() => {
    const maps = sidewallMaps(copy);
    const grain = rubberGrain();
    const rubber = new MeshStandardMaterial({
      color: WHEEL_LOOK.rubber,
      roughness: 0.84,
      metalness: 0,
      bumpMap: grain,
      bumpScale: WHEEL_LOOK.grainBump,
    });
    const tread = rubber.clone();
    const wall = new MeshStandardMaterial({
      color: WHEEL_LOOK.rubber,
      roughness: 1,
      roughnessMap: maps.rough,
      bumpMap: maps.bump,
      bumpScale: WHEEL_LOOK.letterBump,
      metalness: 0,
    });
    const crack = new MeshStandardMaterial({
      color: WHEEL_LOOK.crack,
      roughness: 1,
      alphaMap: crackMap(),
      alphaTest: 1.01,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const alloy = new MeshStandardMaterial({ color: WHEEL_LOOK.alloy, metalness: 1, roughness: 0.24 });
    const alloyDark = new MeshStandardMaterial({ color: WHEEL_LOOK.alloyDark, metalness: 1, roughness: 0.4, side: DoubleSide });
    const disc = new MeshStandardMaterial({ color: WHEEL_LOOK.disc, metalness: 0.9, roughness: 0.42 });
    const caliper = new MeshStandardMaterial({ color: WHEEL_LOOK.caliper, metalness: 0.2, roughness: 0.35 });
    const nut = new MeshStandardMaterial({ color: WHEEL_LOOK.nut, metalness: 1, roughness: 0.18 });
    return { rubber, tread, wall, crack, alloy, alloyDark, disc, caliper, nut };
  }, [copy]);

  const geos = useMemo(
    () => ({
      carcass: carcassGeometry(),
      wall: wallGeometry(),
      crack: wallGeometry({ r0: CRACKS.r0, r1: CRACKS.r1, theta0: CRACKS.theta0, theta1: CRACKS.theta1, lift: 0.0004, radial: 24, angular: 160 }),
      barrel: new CylinderGeometry(TIRE.rimRadius - 0.002, TIRE.rimRadius - 0.002, 0.172, 96, 1, true),
      flange: new TorusGeometry(TIRE.rimRadius + 0.002, 0.0062, 16, 160),
      lip: new TorusGeometry(TIRE.rimRadius - 0.012, 0.009, 16, 160),
      armL: new ExtrudeGeometry(armShape(-1), { depth: 0.016, bevelEnabled: true, bevelThickness: 0.0035, bevelSize: 0.0028, bevelSegments: 4, curveSegments: 4 }),
      armR: new ExtrudeGeometry(armShape(1), { depth: 0.016, bevelEnabled: true, bevelThickness: 0.0035, bevelSize: 0.0028, bevelSegments: 4, curveSegments: 4 }),
      caliper: new TorusGeometry(0.142, 0.021, 18, 32, 0.62),
      hub: new CylinderGeometry(0.064, 0.068, 0.03, 64),
      cap: new CylinderGeometry(0.03, 0.032, 0.012, 48),
      nut: new CylinderGeometry(0.0085, 0.0085, 0.016, 6),
      disc: new CylinderGeometry(0.152, 0.152, 0.024, 96),
      hat: new CylinderGeometry(0.085, 0.085, 0.05, 64),
    }),
    [],
  );

  // Ageing: rubber turns from deep black to a dull, oxidised grey-brown.
  const rubberColor = useMemo(() => new Color(), []);
  rubberColor.copy(new Color(WHEEL_LOOK.rubber)).lerp(new Color(WHEEL_LOOK.rubberOld), age);
  for (const m of [mats.rubber, mats.tread, mats.wall]) {
    m.color.copy(rubberColor);
  }
  mats.crack.alphaTest = CRACK_LEVEL.first + 0.01 - (CRACK_LEVEL.first - CRACK_LEVEL.last + 0.02) * cracks;
  mats.crack.visible = cracks > 0;

  const spokes = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);
  return (
    <group rotation={[0, pose.yaw, 0]}>
      <group position={[0, TIRE.outerRadius, pose.z]} rotation={[0, 0, -Math.PI / 2]}>
        <group rotation={[0, pose.spin, 0]}>
          {/* Tire */}
          <mesh geometry={geos.carcass} material={mats.rubber} castShadow receiveShadow />
          <mesh geometry={geos.wall} material={mats.wall} castShadow receiveShadow />
          <mesh geometry={geos.crack} material={mats.crack} />
          {RIBS.map((rib, i) => (
            <TreadRib key={i} rib={rib} material={mats.tread} />
          ))}
          {/* Alloy */}
          <mesh geometry={geos.barrel} material={mats.alloyDark} />
          <mesh geometry={geos.flange} material={mats.alloy} position={[0, 0.087, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
          <mesh geometry={geos.flange} material={mats.alloy} position={[0, -0.087, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={geos.lip} material={mats.alloy} position={[0, 0.079, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
          {spokes.map((th, i) => (
            <group key={i} rotation={[0, -th, 0]}>
              {/* Concave face: the spoke dips toward the hub. */}
              <group position={[0, 0.05, 0]} rotation={[0, 0, 0.13]}>
                <mesh geometry={geos.armL} material={mats.alloy} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow />
                <mesh geometry={geos.armR} material={mats.alloy} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow />
              </group>
            </group>
          ))}
          <mesh geometry={geos.hub} material={mats.alloy} position={[0, 0.058, 0]} castShadow />
          <mesh geometry={geos.cap} material={mats.nut} position={[0, 0.077, 0]} />
          {spokes.map((th, i) => (
            <mesh key={i} geometry={geos.nut} material={mats.nut} position={[0.046 * Math.cos(th + 0.63), 0.078, 0.046 * Math.sin(th + 0.63)]} />
          ))}
          <mesh geometry={geos.disc} material={mats.disc} position={[0, 0.0, 0]} />
          <mesh geometry={geos.hat} material={mats.alloyDark} position={[0, 0.03, 0]} />
        </group>
        {/* Caliper does not spin: clamps the disc behind the spokes. */}
        <mesh geometry={geos.caliper} material={mats.caliper} position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 3.55]} scale={[1, 1, 1.6]} castShadow />
      </group>
    </group>
  );
};
