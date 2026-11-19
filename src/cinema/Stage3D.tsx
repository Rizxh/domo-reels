// Live 3D stage of the cinema format: a Remotion ThreeCanvas with the camera
// driven by the shot list, image-based light from procedural light panels
// (no HDR download at render time), soft shadows and a filmic post stack
// (ambient occlusion, depth of field, bloom, AgX tone mapping, vignette).
// Adapted from the shared core in ../shifupo-reels (src/core/three/Stage3D).
//
// Remotion rules: nothing animates by itself. No useFrame animations, no
// self-animating helpers; every change comes from useCurrentFrame().

import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import { type DepthOfFieldEffect, ToneMappingMode } from "postprocessing";
import {
  NoToneMapping,
  PCFSoftShadowMap,
  type PerspectiveCamera,
  Vector3,
} from "three";
import { applyCamera, NEAR_FAR, type CamState, type Vec3 } from "./rig";

export type LookConfig = {
  background: string;
  ao: { radius: number; intensity: number };
  bloom: { intensity: number; threshold: number; smoothing: number };
  vignette: { offset: number; darkness: number };
  envIntensity: number;
  panels: readonly {
    color: string;
    intensity: number;
    position: Vec3;
    scale: readonly [number, number];
  }[];
};

// The post stack initializes asynchronously and ThreeCanvas advances before
// the composer, so the first frame of a mount came out black. This advance
// sits after the composer and holds the first frame for a few warm-up draws.
const WARMUP_DRAWS = 4;
const LateAdvance: React.FC = () => {
  const { advance } = useThree();
  const frame = useCurrentFrame();
  const warmed = useRef(false);
  useEffect(() => {
    if (warmed.current) {
      advance(performance.now());
      return;
    }
    const handle = delayRender("Warming up the 3D post stack");
    let n = 0;
    let raf = 0;
    const step = () => {
      advance(performance.now());
      n += 1;
      if (n < WARMUP_DRAWS) {
        raf = requestAnimationFrame(step);
      } else {
        warmed.current = true;
        continueRender(handle);
      }
    };
    step();
    return () => {
      cancelAnimationFrame(raf);
      if (!warmed.current) {
        continueRender(handle);
      }
    };
  }, [frame, advance]);
  return null;
};

const CameraDriver: React.FC<{ state: CamState }> = ({ state }) => {
  const { camera, size } = useThree();
  applyCamera(camera as PerspectiveCamera, state, size.width / size.height);
  return null;
};

// Depth of field changes per shot (macro vs wide). The effect is created once
// and mutated: new props would rebuild the pass every frame (GPU leak).
export type DofState = { focus: Vector3; range: number; bokeh: number };

const PostStack: React.FC<{
  look: LookConfig;
  dof: DofState;
  dofRef: React.RefObject<DepthOfFieldEffect | null>;
}> = memo(({ look, dof, dofRef }) => (
  <>
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO
        aoRadius={look.ao.radius}
        intensity={look.ao.intensity}
        distanceFalloff={1}
        halfRes
      />
      <DepthOfField
        ref={dofRef}
        target={dof.focus}
        worldFocusRange={dof.range}
        bokehScale={dof.bokeh}
      />
      <Bloom
        mipmapBlur
        intensity={look.bloom.intensity}
        luminanceThreshold={look.bloom.threshold}
        luminanceSmoothing={look.bloom.smoothing}
      />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={look.vignette.offset} darkness={look.vignette.darkness} />
      <SMAA />
    </EffectComposer>
    <LateAdvance />
  </>
));
PostStack.displayName = "PostStack";

const DofDriver: React.FC<{
  dofRef: React.RefObject<DepthOfFieldEffect | null>;
  range: number;
  bokeh: number;
}> = ({ dofRef, range, bokeh }) => {
  const effect = dofRef.current;
  if (effect) {
    effect.cocMaterial.worldFocusRange = range;
    effect.bokehScale = bokeh;
  }
  return null;
};

const EnvLight: React.FC<{ look: LookConfig }> = memo(({ look }) => (
  <Environment resolution={256} frames={1} environmentIntensity={look.envIntensity}>
    {look.panels.map((p, i) => (
      <Lightformer
        key={i}
        form="rect"
        color={p.color}
        intensity={p.intensity}
        position={p.position as [number, number, number]}
        scale={[p.scale[0], p.scale[1], 1]}
        target={[0, 0, 0]}
      />
    ))}
  </Environment>
));
EnvLight.displayName = "EnvLight";

const GL = {
  antialias: false,
  toneMapping: NoToneMapping,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
} as const;
const SHADOWS = { type: PCFSoftShadowMap } as const;

export const Stage3D: React.FC<{
  width: number;
  height: number;
  cam: CamState;
  look: LookConfig;
  dof: { range: number; bokeh: number };
  children: React.ReactNode;
}> = ({ width, height, cam, look, dof, children }) => {
  const focus = useMemo(() => new Vector3(), []);
  focus.set(cam.focus[0], cam.focus[1], cam.focus[2]);
  const dofRef = useRef<DepthOfFieldEffect | null>(null);
  // Stable object: PostStack must never see new props during a render.
  const dofInit = useMemo<DofState>(
    () => ({ focus, range: dof.range, bokeh: dof.bokeh }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const initialCamera = useMemo(
    () => ({ fov: cam.fov, near: NEAR_FAR.near, far: NEAR_FAR.far }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1}
      shadows={SHADOWS}
      gl={GL}
      camera={initialCamera}
    >
      <color attach="background" args={[look.background]} />
      <CameraDriver state={cam} />
      <EnvLight look={look} />
      {children}
      <DofDriver dofRef={dofRef} range={dof.range} bokeh={dof.bokeh} />
      <PostStack look={look} dof={dofInit} dofRef={dofRef} />
    </ThreeCanvas>
  );
};
