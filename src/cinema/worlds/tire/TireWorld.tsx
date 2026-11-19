// The sets of the tire world: a black product studio, the same studio with a
// sun sweeping across it (time lapse), and a wet night road. Only what the
// current set needs is lit; the wheel is shared by all of them.

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { staticFile } from "remotion";
import { Color, type DirectionalLight, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type SpotLight, type Texture, Vector2 } from "three";
import { FLOOR, LIGHTS } from "./look";
import { TIRE } from "./geometry";
import type { TireState } from "./shots";
import type { SidewallCopy } from "./textures";
import { Wheel } from "./Wheel";

const ASPHALT = {
  diff: "assets/polyhaven/asphalt_02/asphalt_02_diff_2k.jpg",
  nor: "assets/polyhaven/asphalt_02/asphalt_02_nor_2k.jpg",
  rough: "assets/polyhaven/asphalt_02/asphalt_02_rough_2k.jpg",
  tile: 1.6,
} as const;
const CONCRETE_NOR = "assets/polyhaven/concrete_floor_02/concrete_floor_02_nor_2k.jpg";

const tile = (t: Texture, repeat: number, color = false) => {
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 16;
  if (color) {
    t.colorSpace = SRGBColorSpace;
  }
  t.needsUpdate = true;
  return t;
};

const Floors: React.FC<{ state: TireState }> = ({ state }) => {
  const [diff, nor, rough, concrete] = useTexture([staticFile(ASPHALT.diff), staticFile(ASPHALT.nor), staticFile(ASPHALT.rough), staticFile(CONCRETE_NOR)]);
  const mats = useMemo(() => {
    const reps = FLOOR.size / ASPHALT.tile;
    const road = new MeshStandardMaterial({
      map: tile(diff.clone(), reps, true),
      normalMap: tile(nor.clone(), reps),
      roughnessMap: tile(rough.clone(), reps),
      color: FLOOR.road,
      roughness: FLOOR.roadRoughness,
      normalScale: new Vector2(0.8, 0.8),
    });
    const studio = new MeshStandardMaterial({
      color: FLOOR.studio,
      roughness: FLOOR.studioRoughness,
      normalMap: tile(concrete.clone(), FLOOR.size / 2),
      normalScale: new Vector2(0.35, 0.35),
    });
    return { road, studio };
  }, [diff, nor, rough, concrete]);
  // The road slides under the wheel (the wheel stays at the origin).
  const shift = state.road / ASPHALT.tile;
  for (const t of [mats.road.map, mats.road.normalMap, mats.road.roughnessMap]) {
    t?.offset.set(0, shift % 1);
  }
  const road = state.set === "road";
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={road ? mats.road : mats.studio}>
      <planeGeometry args={[FLOOR.size, FLOOR.size]} />
    </mesh>
  );
};

const KeyLight: React.FC = () => {
  return (
    <spotLight
      position={LIGHTS.key.position as unknown as [number, number, number]}
      color={LIGHTS.key.color}
      intensity={LIGHTS.key.intensity}
      angle={LIGHTS.key.angle}
      penumbra={LIGHTS.key.penumbra}
      decay={2}
      castShadow
      shadow-mapSize={[LIGHTS.shadowMapSize, LIGHTS.shadowMapSize]}
      shadow-bias={-0.0002}
      shadow-normalBias={0.002}
      ref={(l: SpotLight | null) => {
        if (l) {
          l.target.position.set(0, TIRE.outerRadius, 0);
          l.target.updateMatrixWorld();
          l.shadow.camera.near = 0.5;
          l.shadow.camera.far = 8;
        }
      }}
    />
  );
};

// Sun of the time lapse: rises low and warm at the front, crosses overhead,
// sets warm at the back; the floor shadow sweeps around the wheel.
const Sun: React.FC<{ t: number }> = ({ t }) => {
  const a = -Math.PI / 2 + t * Math.PI;
  const elev = Math.sin(t * Math.PI);
  const pos: [number, number, number] = [LIGHTS.sun.radius * 0.35, 0.25 + LIGHTS.sun.height * elev, LIGHTS.sun.radius * Math.sin(-a)];
  const color = useMemo(() => new Color(), []);
  color.set(LIGHTS.sun.warm).lerp(new Color(LIGHTS.sun.noon), elev);
  return (
    <directionalLight
      position={pos}
      color={`#${color.getHexString()}`}
      intensity={LIGHTS.sun.intensity * (0.35 + 0.65 * elev)}
      castShadow
      shadow-mapSize={[LIGHTS.shadowMapSize, LIGHTS.shadowMapSize]}
      shadow-bias={-0.0003}
      ref={(l: DirectionalLight | null) => {
        if (l) {
          const cam = l.shadow.camera;
          cam.left = -1.5;
          cam.right = 1.5;
          cam.top = 1.5;
          cam.bottom = -1.5;
          cam.near = 0.1;
          cam.far = 10;
          cam.updateProjectionMatrix();
          l.target.position.set(0, 0.2, 0);
          l.target.updateMatrixWorld();
        }
      }}
    />
  );
};

// Night road: sodium street lights pass overhead, far lights glow as bokeh,
// and spray kicks up behind the contact patch.
const Street: React.FC<{ state: TireState }> = ({ state }) => {
  const s = LIGHTS.street;
  const phase = (state.road * 6) % s.spacing;
  return (
    <>
      {[0, 1].map((i) => {
        const z = s.spacing * (1 - i) - phase - s.spacing * 0.3;
        return <pointLight key={i} position={[s.side, s.height, z]} color={s.color} intensity={s.intensity} decay={2} distance={8} />;
      })}
      <directionalLight position={[-2, 3, -3]} color={LIGHTS.moon.color} intensity={LIGHTS.moon.intensity} />
      {Array.from({ length: 14 }, (_, i) => {
        const z = -4 - (i % 7) * 2.2 + ((state.road * 6) % 2.2);
        const x = (i < 7 ? -1 : 1) * (2.2 + (i % 3) * 0.6);
        return (
          <mesh key={i} position={[x, 1.2 + (i % 4) * 0.35, z]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color={i % 3 === 0 ? "#ffd7a1" : i % 3 === 1 ? "#ff3b30" : "#ffffff"} toneMapped={false} />
          </mesh>
        );
      })}
      <Spray state={state} />
    </>
  );
};

const SPRAY_COUNT = 90;
const Spray: React.FC<{ state: TireState }> = ({ state }) => {
  const t = state.road * 40;
  return (
    <>
      {Array.from({ length: SPRAY_COUNT }, (_, i) => {
        const life = ((t + i * 0.37) % 9) / 9;
        const side = ((i * 7919) % 100) / 100 - 0.5;
        const up = ((i * 104729) % 100) / 100;
        const x = 0.06 * Math.sign(side) + side * 0.5 * life;
        const z = -0.04 - life * (0.3 + up * 0.25);
        const y = 0.01 + life * (0.12 + up * 0.2) - life * life * 0.12;
        const size = 0.004 + up * 0.004;
        return (
          <mesh key={i} position={[x, Math.max(0.003, y), z]} scale={size * (1 - life * 0.5)}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color="#dfe9ff" roughness={0.05} metalness={0} transparent opacity={0.55 * (1 - life)} />
          </mesh>
        );
      })}
    </>
  );
};

export const TireWorld: React.FC<{ state: TireState; copy: SidewallCopy }> = ({ state, copy }) => {
  const studio = state.set === "studio";
  return (
    <>
      <fog attach="fog" args={["#060607", 3, 14]} />
      <hemisphereLight args={[LIGHTS.fill.color, "#000000", LIGHTS.fill.intensity]} />
      {studio && state.key > 0 ? <KeyLight /> : null}
      {state.set === "timelapse" ? <Sun t={state.sun} /> : null}
      {state.set === "road" ? <Street state={state} /> : null}
      <pointLight position={LIGHTS.rim.position as unknown as [number, number, number]} color={LIGHTS.rim.color} intensity={LIGHTS.rim.intensity * state.rim} decay={2} distance={6} />
      {state.graze > 0 ? (
        <spotLight
          position={LIGHTS.graze.position as unknown as [number, number, number]}
          color={LIGHTS.graze.color}
          intensity={LIGHTS.graze.intensity * state.graze}
          angle={0.35}
          penumbra={0.6}
          decay={2}
          castShadow
          shadow-mapSize={[LIGHTS.shadowMapSize, LIGHTS.shadowMapSize]}
          shadow-bias={-0.00005}
          ref={(l: SpotLight | null) => {
            if (l) {
              l.target.position.set(0, 2 * TIRE.outerRadius, 0.05);
              l.target.updateMatrixWorld();
              l.shadow.camera.near = 0.3;
              l.shadow.camera.far = 2;
            }
          }}
        />
      ) : null}
      {state.wall > 0 ? (
        <spotLight
          position={LIGHTS.wall.position as unknown as [number, number, number]}
          color={LIGHTS.wall.color}
          intensity={LIGHTS.wall.intensity * state.wall}
          angle={0.4}
          penumbra={0.7}
          decay={2}
          ref={(l: SpotLight | null) => {
            if (l) {
              l.target.position.set(0.1, 0.5, 0.1);
              l.target.updateMatrixWorld();
            }
          }}
        />
      ) : null}
      <Floors state={state} />
      <Wheel pose={state.pose} age={state.age} cracks={state.cracks} copy={copy} />
    </>
  );
};
