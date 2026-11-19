// The engine world: dark product table with the five parts, the fuel gauge
// and the pump display. The key light follows the subject of each shot; a
// white sweep bar travels along the parts during the Tune Up Express clean.

import { useMemo, useRef } from "react";
import { Object3D, type SpotLight } from "three";
import type { Vec3 } from "../../rig";
import { ENGINE_COLORS as C, ENGINE_LIGHTS as L } from "./layout";
import { FuelGauge, PumpDisplay } from "./Panels";
import { Catalyst, Intake, Piston, Plug, Throttle } from "./Parts";
import type { EngineState } from "./shots";

const add = (a: Vec3, b: readonly [number, number, number]): [number, number, number] => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const KeyLight: React.FC<{ target: Vec3 }> = ({ target }) => {
  const ref = useRef<SpotLight>(null);
  const aim = useMemo(() => new Object3D(), []);
  aim.position.set(target[0], target[1], target[2]);
  aim.updateMatrixWorld();
  if (ref.current) {
    ref.current.target = aim;
  }
  return (
    <>
      <primitive object={aim} />
      <spotLight
        ref={ref}
        target={aim}
        position={add(target, L.key.offset)}
        color={L.key.color}
        intensity={L.key.intensity}
        angle={L.key.angle}
        penumbra={L.key.penumbra}
        decay={2}
        castShadow
        shadow-mapSize={[L.shadowMapSize, L.shadowMapSize]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.002}
      />
    </>
  );
};

export const EngineWorld: React.FC<{ state: EngineState; frame: number; pumpLabels: readonly [string, string] }> = ({ state, frame, pumpLabels }) => {
  const d = state.dirt;
  return (
    <>
      <fog attach="fog" args={["#050506", 2.5, 9]} />
      <hemisphereLight args={[L.fill.color, "#000000", L.fill.intensity]} />
      <KeyLight target={state.target} />
      <pointLight position={add(state.target, L.rim.offset)} color={L.rim.color} intensity={L.rim.intensity * state.rim} decay={2} distance={3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={C.table} roughness={0.3} metalness={0.1} />
      </mesh>
      <Intake dirt={d.intake} />
      <Throttle dirt={d.throttle} />
      <Plug dirt={d.plug} />
      <Piston dirt={d.piston} flame={state.flame} clean={state.clean} frame={frame} />
      <Catalyst dirt={d.catalyst} />
      <FuelGauge level={state.gauge} lamp={state.lamp} />
      <PumpDisplay litres={state.litres} total={state.total} labels={pumpLabels} />
      {state.sweepX !== null ? (
        // Behind the parts: it back-lights each one as it passes.
        <group position={[state.sweepX, 0.12, -0.2]}>
          <mesh>
            <boxGeometry args={[0.004, 0.26, 0.36]} />
            <meshBasicMaterial color={C.sweep} transparent opacity={0.5} toneMapped={false} depthWrite={false} />
          </mesh>
          <pointLight color={C.sweep} intensity={L.sweep.intensity} distance={0.8} decay={2} />
        </group>
      ) : null}
    </>
  );
};
