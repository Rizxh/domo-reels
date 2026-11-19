// The brake assembly: a vented rotor on the hub, a red caliper straddling the
// rim, two pads that bite, heat that turns the rotor cherry red, and smoke off
// the pads. Everything is procedural (no downloads) and driven only by props,
// so nothing animates by itself (Remotion rule).

import { useMemo } from "react";
import { Color, DoubleSide, type SpotLight } from "three";
import { ANCHORS, BRAKE, PAD_RADIUS, polar } from "./geometry";
import { FLOOR, HEAT_RAMP, LIGHTS } from "./look";
import type { BrakeState } from "./shots";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const HALF = BRAKE.rotorThickness / 2;
const DISC_T = 0.008;
const tmp = new Color();

// Four-stop ramp: cold steel -> dull cherry -> red -> orange. It deliberately
// stops at orange: a white-hot core clips the whole frame once bloom runs.
const rampColor = (out: Color, h: number): Color => {
  const stops = [HEAT_RAMP.cold, HEAT_RAMP.warm, HEAT_RAMP.hot, HEAT_RAMP.blazing];
  const x = clamp01(h) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return out.set(stops[i]).lerp(tmp.set(stops[i + 1]), x - i);
};

const Rotor: React.FC<{ state: BrakeState }> = ({ state }) => {
  const R = BRAKE.rotorRadius;
  const Ri = BRAKE.rotorInner;
  const heat = state.heat;
  const heatColor = useMemo(() => new Color(HEAT_RAMP.cold), []);
  rampColor(heatColor, heat);
  const emissive = 0.12 + heat * 1.9;

  const vanes = useMemo(
    () =>
      Array.from({ length: BRAKE.vaneCount }, (_, i) => {
        const a = (i / BRAKE.vaneCount) * Math.PI * 2;
        return { key: i, pos: polar(Ri + 0.012, a, 0), rot: a };
      }),
    [Ri],
  );

  return (
    <group rotation={[0, 0, state.spin]}>
      {/* Two friction discs with a vent gap between them. */}
      {[HALF - DISC_T / 2, -HALF + DISC_T / 2].map((z, i) => (
        <mesh key={`d${i}`} position={[0, 0, z]} castShadow receiveShadow>
          <cylinderGeometry args={[R, R, DISC_T, 96, 1]} />
          <meshStandardMaterial
            color="#6e7176"
            metalness={1}
            roughness={0.34}
            emissive={heatColor}
            emissiveIntensity={emissive}
          />
        </mesh>
      ))}
      {/* Friction band face: the part that actually glows. */}
      <mesh position={[0, 0, HALF + 0.0008]}>
        <ringGeometry args={[Ri, R - 0.002, 96, 1]} />
        <meshStandardMaterial
          color="#8a8e94"
          metalness={1}
          roughness={0.26}
          emissive={heatColor}
          emissiveIntensity={emissive * 1.15}
          side={DoubleSide}
        />
      </mesh>
      {/* Vent vanes between the discs. */}
      {vanes.map((v) => (
        <mesh key={`v${v.key}`} position={v.pos as [number, number, number]} rotation={[0, 0, v.rot]}>
          <boxGeometry args={[0.014, 0.006, BRAKE.rotorThickness - DISC_T * 2 - 0.002]} />
          <meshStandardMaterial
            color="#4a4d51"
            metalness={1}
            roughness={0.5}
            emissive={heatColor}
            emissiveIntensity={emissive * 0.35}
          />
        </mesh>
      ))}
      {/* Bell / hat carrying the rotor on the hub. */}
      <mesh position={[0, 0, -HALF - BRAKE.hatDepth / 2]} castShadow>
        <cylinderGeometry args={[BRAKE.hatRadius, BRAKE.hatRadius * 1.06, BRAKE.hatDepth, 64, 1, true]} />
        <meshStandardMaterial
          color="#33363b"
          metalness={0.9}
          roughness={0.45}
          side={DoubleSide}
          emissive={heatColor}
          emissiveIntensity={emissive * 0.18}
        />
      </mesh>
      <mesh position={[0, 0, -HALF - BRAKE.hatDepth]}>
        <ringGeometry args={[BRAKE.hatRadius * 0.55, BRAKE.hatRadius, 64, 1]} />
        <meshStandardMaterial color="#2b2e32" metalness={0.9} roughness={0.5} side={DoubleSide} />
      </mesh>
    </group>
  );
};

const Hub: React.FC = () => {
  const bolts = useMemo(
    () =>
      Array.from({ length: BRAKE.boltCount }, (_, i) => {
        const a = (i / BRAKE.boltCount) * Math.PI * 2 + 0.3;
        return { key: i, pos: polar(BRAKE.boltCircle, a, -HALF - BRAKE.hatDepth - 0.004) };
      }),
    [],
  );
  return (
    <group>
      <mesh position={[0, 0, -HALF - BRAKE.hatDepth - BRAKE.hubDepth / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[BRAKE.hubRadius, BRAKE.hubRadius, BRAKE.hubDepth, 48, 1]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.85} roughness={0.55} />
      </mesh>
      {bolts.map((b) => (
        <mesh key={b.key} position={b.pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[BRAKE.boltRadius, BRAKE.boltRadius, 0.012, 6]} />
          <meshStandardMaterial color="#c8ccd2" metalness={1} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

const Caliper: React.FC<{ state: BrakeState }> = ({ state }) => {
  const angle = BRAKE.caliperAngle;
  const span = BRAKE.caliperSpan;
  // Pads pinch the rotor: the gap closes as `clamp` rises.
  const gap = 0.0016 + (1 - state.clamp) * 0.004;
  const padZ = HALF + BRAKE.padThickness / 2 + gap;
  const padColor = useMemo(() => new Color("#2a2a2c"), []);
  // Glazing: the friction face polishes to a glassy, reflective grey.
  padColor.set("#2a2a2c").lerp(tmp.set("#6b6f74"), state.glaze);
  const padRough = 0.86 - state.glaze * 0.62;
  return (
    <group>
      {/* Caliper body: a curved bar over the rim, brand red. */}
      <mesh rotation={[0, 0, angle - span / 2]} castShadow>
        <torusGeometry args={[PAD_RADIUS, BRAKE.caliperThickness, 16, 48, span]} />
        <meshStandardMaterial color="#c41a1f" metalness={0.55} roughness={0.3} emissive="#3a0507" emissiveIntensity={0.5} />
      </mesh>
      {/* Outer bridge and inner finger. */}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[0, 0, side * (HALF + BRAKE.padThickness + gap + 0.008)]}
          rotation={[0, 0, angle - span / 2]}
          castShadow
        >
          <torusGeometry args={[PAD_RADIUS, 0.009, 12, 40, span * 0.92]} />
          <meshStandardMaterial color="#a8151a" metalness={0.6} roughness={0.32} />
        </mesh>
      ))}
      {/* Pads: one each side of the rotor. */}
      {[padZ, -padZ].map((z, i) => (
        <mesh key={`p${i}`} position={[0, 0, z]} rotation={[0, 0, angle - BRAKE.padArc / 2]} castShadow>
          <torusGeometry args={[PAD_RADIUS, 0.0075, 10, 32, BRAKE.padArc]} />
          <meshStandardMaterial color={padColor} metalness={state.glaze * 0.35} roughness={padRough} />
        </mesh>
      ))}
    </group>
  );
};

const SMOKE_COUNT = 26;
const Smoke: React.FC<{ state: BrakeState; frame: number }> = ({ state, frame }) => {
  if (state.smoke <= 0.01) {
    return null;
  }
  const origin = polar(PAD_RADIUS, BRAKE.caliperAngle, 0);
  return (
    <group>
      {Array.from({ length: SMOKE_COUNT }, (_, i) => {
        // Deterministic, seeded by the index (no Math.random).
        const life = (frame / 78 + i * 0.137) % 1;
        const spread = ((i * 7919) % 100) / 100 - 0.5;
        const lift = ((i * 104729) % 100) / 100;
        const x = origin[0] + spread * 0.09 * life + lift * 0.02;
        const y = origin[1] + 0.02 + life * (0.16 + lift * 0.12);
        const z = origin[2] + 0.02 + spread * 0.03;
        const size = 0.012 + lift * 0.016 + life * 0.03;
        const fade = (1 - life) * state.smoke;
        return (
          <mesh key={i} position={[x, y, z]} scale={size}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial
              color="#d8d8dc"
              roughness={1}
              metalness={0}
              transparent
              opacity={0.16 * fade}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const KeyLight: React.FC = () => (
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
        l.target.position.set(0, 0, 0);
        l.target.updateMatrixWorld();
        l.shadow.camera.near = 0.4;
        l.shadow.camera.far = 8;
      }
    }}
  />
);

const GrazeLight: React.FC<{ strength: number }> = ({ strength }) => (
  <spotLight
    position={LIGHTS.graze.position as unknown as [number, number, number]}
    color={LIGHTS.graze.color}
    intensity={LIGHTS.graze.intensity * strength}
    angle={0.4}
    penumbra={0.7}
    decay={2}
    ref={(l: SpotLight | null) => {
      if (l) {
        l.target.position.set(0.02, 0.03, 0);
        l.target.updateMatrixWorld();
      }
    }}
  />
);

// Soft fill near the assembly. The macros sit 15-40 cm from the friction face,
// so the far key light alone leaves them too dark to read.
const MacroFill: React.FC = () => (
  <pointLight
    position={LIGHTS.macro.position as unknown as [number, number, number]}
    color={LIGHTS.macro.color}
    intensity={LIGHTS.macro.intensity}
    distance={1.6}
    decay={2}
  />
);

const HeatLight: React.FC<{ heat: number }> = ({ heat }) => {  const color = useMemo(() => new Color(HEAT_RAMP.cold), []);
  rampColor(color, heat);
  return (
    <pointLight
      position={ANCHORS.discFace as unknown as [number, number, number]}
      color={`#${color.getHexString()}`}
      intensity={heat * 1.8}
      distance={2.4}
      decay={2}
    />
  );
};

export const BrakeWorld: React.FC<{ state: BrakeState; frame: number }> = ({ state, frame }) => {
  return (
    <>
      <fog attach="fog" args={["#060607", 1.6, 8]} />
      <hemisphereLight args={[LIGHTS.fill.color, "#000000", LIGHTS.fill.intensity]} />
      {state.key > 0 ? <KeyLight /> : null}
      <MacroFill />
      {state.graze > 0 ? <GrazeLight strength={state.graze} /> : null}
      <pointLight
        position={LIGHTS.rim.position as unknown as [number, number, number]}
        color={LIGHTS.rim.color}
        intensity={LIGHTS.rim.intensity * state.rim}
        decay={2}
        distance={6}
      />
      <HeatLight heat={state.heat} />
      {/* Studio floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[FLOOR.size, FLOOR.size]} />
        <meshStandardMaterial color={FLOOR.color} roughness={FLOOR.roughness} metalness={0.1} />
      </mesh>
      <Hub />
      <Rotor state={state} />
      <Caliper state={state} />
      <Smoke state={state} frame={frame} />
    </>
  );
};
