// The five engine parts Tune Up Express cleans, each with a `dirt` amount
// (0 = clean metal, 1 = carbon crusted), plus the combustion flame. Built
// from primitives at real size; soot is a colour/roughness blend of the base
// material and overlay meshes whose opacity follows the dirt.

import { useMemo } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  LatheGeometry,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { random } from "remotion";
import { ENGINE_COLORS as C, PARTS } from "./layout";

// ---------------------------------------------------------------- materials
const blendMat = (clean: string, metalness: number, roughness: number) =>
  new MeshStandardMaterial({ color: clean, metalness, roughness });

const applyDirt = (m: MeshStandardMaterial, clean: string, metalness: number, roughness: number, dirt: number, soot: string = C.soot) => {
  m.color.copy(new Color(clean)).lerp(new Color(soot), dirt);
  m.metalness = metalness * (1 - 0.85 * dirt);
  m.roughness = roughness + (0.95 - roughness) * dirt;
};

let sootTex: CanvasTexture | null = null;
// Blotchy soot alpha: dark crust with uneven edges (seeded).
const sootAlpha = (): CanvasTexture => {
  if (sootTex) return sootTex;
  const N = 512;
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.fillStyle = "#000";
  g.fillRect(0, 0, N, N);
  for (let i = 0; i < 2600; i++) {
    const v = Math.round(120 + random(`sa-v-${i}`) * 135);
    g.fillStyle = `rgba(${v},${v},${v},0.35)`;
    g.beginPath();
    g.arc(random(`sa-x-${i}`) * N, random(`sa-y-${i}`) * N, 2 + random(`sa-r-${i}`) * 14, 0, Math.PI * 2);
    g.fill();
  }
  sootTex = new CanvasTexture(c);
  sootTex.wrapS = RepeatWrapping;
  sootTex.wrapT = RepeatWrapping;
  return sootTex;
};

const useSoot = () =>
  useMemo(
    () =>
      new MeshStandardMaterial({
        color: C.soot,
        roughness: 1,
        metalness: 0,
        transparent: true,
        alphaMap: sootAlpha(),
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        side: DoubleSide,
      }),
    [],
  );

// ---------------------------------------------------------------- intake
export const Intake: React.FC<{ dirt: number }> = ({ dirt }) => {
  const x = PARTS.intake.x;
  const mat = useMemo(() => blendMat(C.aluminium, 0.85, 0.38), []);
  applyDirt(mat, C.aluminium, 0.85, 0.38, dirt * 0.35, C.sootBrown);
  const soot = useSoot();
  soot.opacity = dirt;
  const geos = useMemo(() => {
    const runners = [-0.12, -0.04, 0.04, 0.12].map(
      (dx) =>
        new TubeGeometry(
          new CatmullRomCurve3([new Vector3(dx, 0.14, -0.1), new Vector3(dx, 0.17, 0.0), new Vector3(dx, 0.11, 0.1), new Vector3(dx, 0.062, 0.15)]),
          48,
          0.021,
          24,
        ),
    );
    return {
      plenum: new RoundedBoxGeometry(0.36, 0.1, 0.13, 4, 0.025),
      flange: new RoundedBoxGeometry(0.36, 0.075, 0.014, 3, 0.004),
      runners,
    };
  }, []);
  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={geos.plenum} material={mat} position={[0, 0.14, -0.15]} castShadow receiveShadow />
      {geos.runners.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} castShadow receiveShadow />
      ))}
      <mesh geometry={geos.flange} material={mat} position={[0, 0.062, 0.153]} castShadow receiveShadow />
      {[-0.12, -0.04, 0.04, 0.12].map((dx) => (
        <group key={dx} position={[dx, 0.062, 0.1605]}>
          {/* Port: dark throat, machined lip, soot ring around it. */}
          <mesh>
            <circleGeometry args={[0.019, 40]} />
            <meshStandardMaterial color="#050505" roughness={1} />
          </mesh>
          <mesh position={[0, 0, 0.0004]}>
            <ringGeometry args={[0.019, 0.023, 48]} />
            <meshStandardMaterial color={C.steel} metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.0009]} material={soot} scale={1 + 0.15 * dirt}>
            <ringGeometry args={[0.016, 0.031, 48]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- throttle
export const Throttle: React.FC<{ dirt: number }> = ({ dirt }) => {
  const x = PARTS.throttle.x;
  const body = useMemo(() => blendMat(C.aluminium, 0.9, 0.3), []);
  const disc = useMemo(() => blendMat(C.steel, 1, 0.22), []);
  applyDirt(disc, C.steel, 1, 0.22, dirt);
  const soot = useSoot();
  soot.opacity = dirt;
  return (
    <group position={[x, 0.07, 0]}>
      <mesh material={body} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.048, 0.048, 0.06, 64, 1, true]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.06, 64, 1, true]} />
        <meshStandardMaterial color={C.aluminium} metalness={0.9} roughness={0.25} side={DoubleSide} />
      </mesh>
      {/* Front and back faces of the body. */}
      {[0.03, -0.03].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, z < 0 ? Math.PI : 0, 0]} material={body}>
          <ringGeometry args={[0.035, 0.062, 64]} />
        </mesh>
      ))}
      {/* Butterfly valve, almost closed, on its shaft. */}
      <mesh material={disc} rotation={[Math.PI / 2 - 0.32, 0, 0]}>
        <cylinderGeometry args={[0.0345, 0.0345, 0.0022, 64]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.003, 0.003, 0.11, 16]} />
        <meshStandardMaterial color={C.steel} metalness={1} roughness={0.2} />
      </mesh>
      {/* Carbon ring around the valve edge and the bore. */}
      <mesh material={soot} position={[0, 0, 0.004]}>
        <ringGeometry args={[0.024, 0.0349, 64]} />
      </mesh>
      <mesh material={soot} position={[0, 0, 0.0295]}>
        <ringGeometry args={[0.03, 0.037, 64]} />
      </mesh>
      {/* Cable drum on the side. */}
      <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={body} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.012, 48]} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- plug
const plugInsulator = () => {
  const pts: Vector2[] = [];
  // Ribbed upper insulator (y along the plug axis).
  for (let i = 0; i <= 10; i++) {
    const y = 0.006 + i * 0.0029;
    pts.push(new Vector2(0.0052 + (i % 2 === 0 ? 0 : 0.0006), y));
  }
  return new LatheGeometry(pts, 48);
};

export const Plug: React.FC<{ dirt: number }> = ({ dirt }) => {
  const x = PARTS.plug.x;
  const tip = useMemo(() => blendMat(C.ceramic, 0, 0.35), []);
  const electrode = useMemo(() => blendMat(C.steel, 1, 0.3), []);
  applyDirt(tip, C.ceramic, 0, 0.35, dirt, C.sootBrown);
  applyDirt(electrode, C.steel, 1, 0.3, dirt);
  const geos = useMemo(
    () => ({
      insulator: plugInsulator(),
      nose: new LatheGeometry([new Vector2(0.0042, 0.0), new Vector2(0.0036, 0.004), new Vector2(0.0026, 0.0075), new Vector2(0.0013, 0.0078)], 48),
    }),
    [],
  );
  return (
    // Lying on a cradle, tip toward the camera (+Z).
    <group position={[x, 0.016, -0.004]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.003, 0]}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.006, 24]} />
        <meshStandardMaterial color={C.steel} metalness={1} roughness={0.25} />
      </mesh>
      <mesh geometry={geos.insulator} castShadow>
        <meshStandardMaterial color={C.ceramic} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.041, 0]} castShadow>
        <cylinderGeometry args={[0.0095, 0.0095, 0.012, 6]} />
        <meshStandardMaterial color={C.steel} metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.0565, 0]} castShadow>
        <cylinderGeometry args={[0.0069, 0.0069, 0.019, 32]} />
        <meshStandardMaterial color={C.castIron} metalness={1} roughness={0.35} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[0, 0.048 + i * 0.0015, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.0069, 0.0007, 6, 32]} />
          <meshStandardMaterial color={C.steel} metalness={1} roughness={0.3} />
        </mesh>
      ))}
      <mesh geometry={geos.nose} material={tip} position={[0, 0.066, 0]} />
      <mesh material={electrode} position={[0, 0.0755, 0]}>
        <cylinderGeometry args={[0.0011, 0.0011, 0.004, 16]} />
      </mesh>
      {/* Ground electrode: up from the shell, bent over the centre. */}
      <mesh material={electrode} position={[0.0058, 0.0705, 0]}>
        <boxGeometry args={[0.0018, 0.009, 0.0026]} />
      </mesh>
      <mesh material={electrode} position={[0.003, 0.0788, 0]}>
        <boxGeometry args={[0.0074, 0.0016, 0.0026]} />
      </mesh>
      {/* Cradle. */}
      <mesh position={[0, 0.04, 0.01]} receiveShadow castShadow>
        <boxGeometry args={[0.03, 0.008, 0.012]} />
        <meshStandardMaterial color="#1a1b1d" roughness={0.6} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- piston + flame
// Soft sprites drawn once: a teardrop flame tongue and a round glow.
let flameTex: CanvasTexture | null = null;
const flameSprite = (): CanvasTexture => {
  if (flameTex) return flameTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const grad = g.createRadialGradient(64, 190, 4, 64, 170, 120);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.65)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(64, 6);
  g.bezierCurveTo(100, 90, 118, 170, 64, 250);
  g.bezierCurveTo(10, 170, 28, 90, 64, 6);
  g.fill();
  flameTex = new CanvasTexture(c);
  return flameTex;
};
let glowTex: CanvasTexture | null = null;
const glowSprite = (): CanvasTexture => {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glowTex = new CanvasTexture(c);
  return glowTex;
};

export const Piston: React.FC<{ dirt: number; flame: number; clean: number; frame: number }> = ({ dirt, flame, clean, frame }) => {
  const x = PARTS.piston.x;
  const crown = useMemo(() => blendMat(C.aluminium, 0.9, 0.3), []);
  applyDirt(crown, C.aluminium, 0.9, 0.3, dirt);
  const soot = useSoot();
  soot.opacity = dirt;
  // Colours go to the materials as fresh hex strings: R3F does not see a
  // mutated Color object as a change (a chunk kept the dirty orange).
  const flameColor = useMemo(() => new Color(), []);
  flameColor.set(C.flameDirty).lerp(new Color(C.flameClean), clean);
  const coreColor = useMemo(() => new Color(), []);
  coreColor.set(C.flameDirtyCore).lerp(new Color(C.flameCleanCore), clean);
  const flicker = 0.85 + 0.15 * Math.sin(frame * 1.7) * Math.sin(frame * 0.63 + 1);
  const f = flame * flicker;
  return (
    <group position={[x, 0, 0]}>
      {/* Cutaway liner and head: back half only, open toward the camera. */}
      <mesh position={[0, 0.085, 0]} receiveShadow>
        <cylinderGeometry args={[0.043, 0.043, 0.17, 64, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={C.castIron} metalness={0.8} roughness={0.45} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.125, 0]} rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[0.043, 48, 24, 0, Math.PI, 0, Math.PI / 2]} />
        <meshStandardMaterial color={C.castIron} metalness={0.8} roughness={0.45} side={DoubleSide} />
      </mesh>
      {/* Piston with ring grooves. */}
      <mesh material={crown} position={[0, 0.0525, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.0405, 0.0405, 0.05, 64]} />
      </mesh>
      {[0.068, 0.062, 0.056].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.0405, 0.0011, 8, 64]} />
          <meshStandardMaterial color="#202124" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      <mesh material={soot} position={[0, 0.0778, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.039, 48]} />
      </mesh>
      {/* Flame in the chamber. */}
      {f > 0.01 ? (
        <group position={[0, 0.104, 0]}>
          <pointLight color={`#${flameColor.getHexString()}`} intensity={0.12 * f} distance={0.2} decay={2} />
          {/* Flame front: soft additive tongues facing the camera side,
              flickering per frame, over a glow at the spark. */}
          {Array.from({ length: 11 }, (_, i) => {
            const u = i / 10 - 0.5;
            const h = 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.9 + i * 1.7)) * (1 - Math.abs(u));
            return (
              <mesh key={i} position={[u * 0.06, -0.006 + 0.008 * h, -0.004 + 0.008 * Math.cos(i * 2.1)]} scale={[0.012 * f, 0.026 * f * h, 1]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={flameSprite()} color={`#${flameColor.getHexString()}`} transparent opacity={0.85} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
              </mesh>
            );
          })}
          <mesh position={[0, -0.002, 0.004]} scale={[0.03 * f, 0.016 * f, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={glowSprite()} color={`#${coreColor.getHexString()}`} transparent opacity={0.9} blending={AdditiveBlending} toneMapped={false} depthWrite={false} />
          </mesh>
          {/* Dirty burn: dark smoke curls up from the flame. */}
          {clean < 0.5
            ? Array.from({ length: 10 }, (_, i) => {
                const life = ((frame * 0.03 + i * 0.1) % 1 + 1) % 1;
                return (
                  <mesh key={i} position={[Math.sin(i * 2.4 + frame * 0.05) * 0.012, life * 0.03, Math.cos(i * 1.7) * 0.01]} scale={0.006 + life * 0.012}>
                    <sphereGeometry args={[1, 12, 8]} />
                    <meshStandardMaterial color={C.smoke} transparent opacity={0.5 * (1 - life) * f * (1 - clean * 2)} depthWrite={false} />
                  </mesh>
                );
              })
            : null}
        </group>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- catalyst
let honeyTex: { map: CanvasTexture; bump: CanvasTexture } | null = null;
const honeycomb = () => {
  if (honeyTex) return honeyTex;
  const N = 1024;
  const mk = (bg: string, wall: string) => {
    const c = document.createElement("canvas");
    c.width = N;
    c.height = N;
    const g = c.getContext("2d") as CanvasRenderingContext2D;
    g.fillStyle = bg;
    g.fillRect(0, 0, N, N);
    g.strokeStyle = wall;
    g.lineWidth = 3;
    const step = 16;
    for (let p = 0; p <= N; p += step) {
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, N);
      g.stroke();
      g.beginPath();
      g.moveTo(0, p);
      g.lineTo(N, p);
      g.stroke();
    }
    return c;
  };
  const map = new CanvasTexture(mk("#2a2520", C.ceramicHoney));
  map.colorSpace = SRGBColorSpace;
  const bump = new CanvasTexture(mk("#000000", "#ffffff"));
  honeyTex = { map, bump };
  return honeyTex;
};

export const Catalyst: React.FC<{ dirt: number }> = ({ dirt }) => {
  const x = PARTS.catalyst.x;
  const shell = useMemo(() => blendMat(C.steel, 1, 0.32), []);
  const face = useMemo(() => {
    const t = honeycomb();
    return new MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 1.5, roughness: 0.8 });
  }, []);
  face.color.set("#ffffff").lerp(new Color("#3a3530"), dirt * 0.8);
  const soot = useSoot();
  soot.opacity = Math.min(1, dirt * 1.1);
  return (
    <group position={[x, 0.075, -0.08]}>
      <mesh material={shell} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.072, 0.072, 0.24, 64, 1, true]} />
      </mesh>
      <mesh material={shell} position={[0, 0, 0.122]}>
        <torusGeometry args={[0.072, 0.004, 12, 64]} />
      </mesh>
      <mesh material={face} position={[0, 0, 0.12]}>
        <circleGeometry args={[0.07, 64]} />
      </mesh>
      <mesh material={soot} position={[0, 0, 0.1215]} rotation={[0, 0, 0.7]}>
        <circleGeometry args={[0.07, 64]} />
      </mesh>
      {/* Inlet cone and pipe at the back. */}
      <mesh material={shell} position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.072, 0.028, 0.06, 48, 1, true]} />
      </mesh>
      <mesh material={shell} position={[0, 0, -0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.12, 32, 1, true]} />
      </mesh>
    </group>
  );
};
