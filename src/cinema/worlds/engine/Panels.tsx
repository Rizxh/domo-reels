// The two hook props: a fuel gauge whose needle falls toward E with the
// low-fuel lamp blinking, and a fuel pump display whose counters roll. The
// gauge face and the pump LCD are canvases; the LCD is redrawn per frame
// from the frame number only (no clock), so renders stay deterministic.

import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { ANCHORS, ENGINE_COLORS as C } from "./layout";

// Needle angle (radians from +X, counter-clockwise): F at the right, E at the left.
export const GAUGE = { full: 0.55, empty: Math.PI - 0.55, radius: 0.05 } as const;

const gaugeFace = (): CanvasTexture => {
  const N = 1024;
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const cx = N / 2;
  const cy = N / 2;
  const grad = g.createRadialGradient(cx, cy, 40, cx, cy, N / 2);
  grad.addColorStop(0, "#1b1c20");
  grad.addColorStop(1, "#08080a");
  g.fillStyle = grad;
  g.fillRect(0, 0, N, N);
  // Ticks along the arc (canvas y points down, so angles flip sign).
  for (let i = 0; i <= 8; i++) {
    const a = GAUGE.full + ((GAUGE.empty - GAUGE.full) * i) / 8;
    const major = i % 4 === 0;
    const r0 = major ? 330 : 360;
    g.strokeStyle = i === 8 ? C.needle : "#f2f2f2";
    g.lineWidth = major ? 16 : 8;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r0, cy - Math.sin(a) * r0);
    g.lineTo(cx + Math.cos(a) * 420, cy - Math.sin(a) * 420);
    g.stroke();
  }
  g.fillStyle = "#f2f2f2";
  g.font = "bold 110px Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("F", cx + Math.cos(GAUGE.full) * 250, cy - Math.sin(GAUGE.full) * 250);
  g.fillStyle = C.needle;
  g.fillText("E", cx + Math.cos(GAUGE.empty) * 250, cy - Math.sin(GAUGE.empty) * 250);
  g.fillStyle = "#f2f2f2";
  g.font = "bold 70px Arial, sans-serif";
  g.fillText("½", cx, cy - 270);
  // Fuel pump pictogram under the hub.
  g.fillStyle = "#cfcfcf";
  g.fillRect(cx - 45, cy + 150, 70, 110);
  g.fillRect(cx - 55, cy + 250, 90, 18);
  g.fillStyle = "#111";
  g.fillRect(cx - 32, cy + 168, 44, 30);
  g.strokeStyle = "#cfcfcf";
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(cx + 25, cy + 175);
  g.lineTo(cx + 60, cy + 195);
  g.lineTo(cx + 60, cy + 240);
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 16;
  return t;
};

export const FuelGauge: React.FC<{ level: number; lamp: boolean }> = ({ level, lamp }) => {
  const face = useMemo(gaugeFace, []);
  const [x, y] = ANCHORS.gauge;
  const angle = GAUGE.empty + (GAUGE.full - GAUGE.empty) * level;
  return (
    <group position={[x, y, 0]}>
      {/* Cluster body. */}
      <mesh position={[0, 0, -0.03]} receiveShadow>
        <boxGeometry args={[0.32, 0.18, 0.04]} />
        <meshStandardMaterial color="#0b0b0c" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[GAUGE.radius + 0.002, 96]} />
        <meshStandardMaterial map={face} roughness={0.6} emissiveMap={face} emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.004]} rotation={[0, 0, 0]}>
        <torusGeometry args={[GAUGE.radius + 0.004, 0.0035, 16, 96]} />
        <meshStandardMaterial color={C.steel} metalness={1} roughness={0.15} />
      </mesh>
      {/* Needle on its hub. */}
      <group position={[0, 0, 0.007]} rotation={[0, 0, angle]}>
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.042, 0.0026, 0.0012]} />
          <meshBasicMaterial color={C.needle} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.004, 32]} />
        <meshStandardMaterial color="#151515" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Low-fuel lamp. */}
      <mesh position={[0.1, -0.035, 0.002]}>
        <circleGeometry args={[0.009, 32]} />
        <meshBasicMaterial color={lamp ? C.amber : "#2a1d08"} toneMapped={false} />
      </mesh>
      {lamp ? <pointLight position={[0.1, -0.035, 0.02]} color={C.amber} intensity={0.25} distance={0.25} decay={2} /> : null}
      {/* Cover glass. */}
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[GAUGE.radius + 0.004, 96]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} metalness={0.2} />
      </mesh>
    </group>
  );
};

// Pump display: two LCD counters (litres and total) rolling up.
const LCD_W = 1024;
const LCD_H = 512;

export const PumpDisplay: React.FC<{ litres: number; total: number; labels: readonly [string, string] }> = ({ litres, total, labels }) => {
  const { canvas, tex } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = LCD_W;
    c.height = LCD_H;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas: c, tex: t };
  }, []);
  const g = canvas.getContext("2d") as CanvasRenderingContext2D;
  g.fillStyle = "#0b120b";
  g.fillRect(0, 0, LCD_W, LCD_H);
  g.textAlign = "right";
  g.textBaseline = "alphabetic";
  const row = (label: string, value: string, y: number) => {
    g.fillStyle = "#16301a";
    g.font = "bold 150px 'Courier New', monospace";
    g.fillText("88888888", LCD_W - 60, y);
    g.fillStyle = C.lcd;
    g.fillText(value, LCD_W - 60, y);
    g.font = "bold 46px Arial, sans-serif";
    g.textAlign = "left";
    g.fillText(label, 50, y - 100);
    g.textAlign = "right";
  };
  row(labels[0], String(Math.floor(total)).padStart(8, " "), 220);
  row(labels[1], litres.toFixed(2).padStart(8, " "), 440);
  tex.needsUpdate = true;
  const [x, y] = ANCHORS.pump;
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0, -0.04]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.36, 0.08]} />
        <meshStandardMaterial color="#cfd2d6" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[0.4, 0.2]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[0.42, 0.22]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.07} roughness={0.05} />
      </mesh>
    </group>
  );
};
