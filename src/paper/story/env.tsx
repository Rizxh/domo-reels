// Layered paper dioramas for the story format. A scene is a stack of
// <Layer>s; each layer moves with the 2D camera by its own depth factor
// (far layers move less), which gives the cut-paper set real depth. Two
// sets: the rogue shop (dim, grimy) and the Doktermobil shop (bright, tidy).

import { Img, random } from "remotion";
import { PAPER, STORY } from "../../lib/brand";
import { paperFilter } from "../kit";

export type Cam = { x: number; y: number; zoom: number; rot: number };

// Layers are drawn in a 1400 x 2400 box centred on the 1080 x 1920 frame so
// camera moves never reveal an edge.
export const LAYER_BOX = { w: 1400, h: 2400, x: -160, y: -240 } as const;

export const Layer: React.FC<{ cam: Cam; depth: number; blur?: number; children: React.ReactNode; z?: number }> = ({ cam, depth, blur = 0, children, z }) => {
  const zoom = 1 + (cam.zoom - 1) * depth;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: z,
        transformOrigin: "540px 960px",
        transform: `translate(${-cam.x * depth}px, ${-cam.y * depth}px) scale(${zoom}) rotate(${cam.rot * depth}deg)`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

// Full-size SVG in layer space.
export const LayerSvg: React.FC<{ children: React.ReactNode; filter?: number }> = ({ children, filter }) => (
  <svg
    viewBox={`0 0 ${LAYER_BOX.w} ${LAYER_BOX.h}`}
    style={{ position: "absolute", left: LAYER_BOX.x, top: LAYER_BOX.y, width: LAYER_BOX.w, height: LAYER_BOX.h, overflow: "visible", filter: filter === undefined ? undefined : paperFilter(filter) }}
  >
    {children}
  </svg>
);

// Layer-space x/y of a frame point (frame 0..1080, 0..1920).
export const L = (x: number, y: number) => ({ x: x - LAYER_BOX.x, y: y - LAYER_BOX.y });

// ------------------------------------------------------------ rogue shop
export const GrimeBack: React.FC<{ flicker: number }> = ({ flicker }) => {
  const stains = Array.from({ length: 22 }, (_, i) => ({
    x: random(`gs-x-${i}`) * 1400,
    y: random(`gs-y-${i}`) * 1500,
    r: 40 + random(`gs-r-${i}`) * 160,
  }));
  return (
    <LayerSvg>
      <defs>
        <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={STORY.grimeWallDark} />
          <stop offset="0.6" stopColor={STORY.grimeWall} />
          <stop offset="1" stopColor={STORY.grimeWallDark} />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.3" r="0.6">
          <stop offset="0" stopColor={STORY.grimeLamp} stopOpacity={0.45 * flicker} />
          <stop offset="1" stopColor={STORY.grimeLamp} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1400} height={2400} fill="url(#gw)" />
      {stains.map((s, i) => (
        <ellipse key={i} cx={s.x} cy={s.y} rx={s.r} ry={s.r * 0.6} fill={STORY.grimeStain} />
      ))}
      {/* Concrete block joints. */}
      {Array.from({ length: 16 }, (_, r) => (
        <path key={r} d={`M 0 ${r * 110} H 1400`} stroke="rgba(0,0,0,0.12)" strokeWidth={4} />
      ))}
      {/* Roll-up door frame, half open, darkness behind. */}
      <rect x={840} y={420} width={480} height={1180} fill="#1b1e1b" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={840} y={420 + i * 46} width={480} height={40} fill="#6f746c" stroke="#4a4f48" strokeWidth={4} />
      ))}
      <rect x={820} y={400} width={520} height={30} fill="#3a3f3a" />
      {/* Floor. */}
      <rect x={0} y={1560} width={1400} height={840} fill={STORY.grimeFloor} />
      <ellipse cx={420} cy={1760} rx={260} ry={46} fill="rgba(10,10,8,0.5)" />
      <ellipse cx={980} cy={1900} rx={180} ry={30} fill="rgba(10,10,8,0.45)" />
      <rect width={1400} height={2400} fill="url(#glow)" />
    </LayerSvg>
  );
};

// Messy pegboard, shelf with oil cans, a drum.
export const GrimeMid: React.FC = () => (
  <LayerSvg filter={0}>
    <rect x={70} y={560} width={560} height={420} rx={10} fill="#9a8a6a" />
    {Array.from({ length: 70 }, (_, i) => (
      <circle key={i} cx={100 + (i % 10) * 54} cy={590 + Math.floor(i / 10) * 56} r={5} fill="#6b5e46" />
    ))}
    {/* Tools hanging crooked. */}
    {[
      [140, 640, 30],
      [230, 620, -18],
      [330, 660, 52],
      [450, 640, -40],
      [540, 700, 15],
    ].map(([x, y, r], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
        <rect x={-8} y={0} width={16} height={150} rx={6} fill={STORY.steelDark} />
        <circle cx={0} cy={-6} r={22} fill="none" stroke={STORY.steelDark} strokeWidth={12} />
      </g>
    ))}
    <rect x={70} y={1060} width={560} height={22} fill="#5b4a33" />
    {[110, 190, 270, 350, 450].map((x, i) => (
      <g key={x}>
        <rect x={x} y={960 - (i % 2) * 20} width={62} height={100 + (i % 2) * 20} rx={8} fill={i % 2 ? "#b8442c" : "#c9a23a"} />
        <rect x={x + 10} y={950 - (i % 2) * 20} width={42} height={18} rx={4} fill="#333" />
      </g>
    ))}
    {/* Oil drum with a drip. */}
    <rect x={620} y={1360} width={200} height={260} rx={18} fill="#2f5d7c" />
    <rect x={620} y={1420} width={200} height={14} fill="#25485f" />
    <rect x={620} y={1520} width={200} height={14} fill="#25485f" />
    <path d="M 700 1360 q 6 40 0 70" stroke="#1a1410" strokeWidth={12} strokeLinecap="round" />
  </LayerSvg>
);

// Bare bulb on a cord; `swing` in degrees, `on` 0..1 brightness.
export const HangingLamp: React.FC<{ x: number; swing: number; on: number; cord?: number; warm?: boolean }> = ({ x, swing, on, cord = 520, warm = true }) => (
  <LayerSvg>
    <g transform={`translate(${x} 0) rotate(${swing})`}>
      <path d={`M 0 0 V ${cord}`} stroke="#111" strokeWidth={6} />
      <path d={`M -70 ${cord + 70} Q 0 ${cord - 20} 70 ${cord + 70} Z`} fill={warm ? "#3d443f" : "#d7dbe0"} />
      <circle cx={0} cy={cord + 76} r={26} fill={warm ? STORY.grimeLamp : "#ffffff"} opacity={0.35 + 0.65 * on} />
      <path d={`M -60 ${cord + 80} L -320 ${cord + 1400} H 320 L 60 ${cord + 80} Z`} fill={warm ? STORY.grimeLamp : "#ffffff"} opacity={0.08 * on} />
    </g>
  </LayerSvg>
);

// ------------------------------------------------------------ Doktermobil shop
export const CleanBack: React.FC = () => (
  <LayerSvg>
    <defs>
      <linearGradient id="cw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor={STORY.cleanWallShade} />
      </linearGradient>
      <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={STORY.cleanFloor} />
        <stop offset="1" stopColor="#c6ccd3" />
      </linearGradient>
    </defs>
    <rect width={1400} height={2400} fill="url(#cw)" />
    {/* Wall panels and a brand band at eye level, like a real branded bay. */}
    {Array.from({ length: 7 }, (_, i) => (
      <path key={i} d={`M ${i * 220} 0 V 1560`} stroke="rgba(0,0,0,0.05)" strokeWidth={4} />
    ))}
    <rect x={0} y={1180} width={1400} height={70} fill={STORY.brandRed} />
    <rect x={0} y={1250} width={1400} height={10} fill={STORY.brandRedDark} />
    {/* Ceiling light strips. */}
    {[260, 700, 1140].map((x) => (
      <g key={x}>
        <rect x={x - 150} y={240} width={300} height={22} rx={11} fill="#ffffff" stroke="#d8dce1" strokeWidth={4} />
        <path d={`M ${x - 150} 262 L ${x - 330} 1100 H ${x + 330} L ${x + 150} 262 Z`} fill="#ffffff" opacity={0.25} />
      </g>
    ))}
    <rect x={0} y={1560} width={1400} height={840} fill="url(#cf)" />
    {/* Floor reflections. */}
    <rect x={0} y={1560} width={1400} height={10} fill="#bfc5cc" />
    {[200, 560, 920, 1280].map((x) => (
      <rect key={x} x={x - 90} y={1600} width={180} height={500} fill={STORY.cleanFloorShine} opacity={0.35} />
    ))}
  </LayerSvg>
);

// Tidy tool wall: shadow-board outlines with every tool in its place.
export const CleanMid: React.FC = () => (
  <LayerSvg filter={1}>
    <rect x={80} y={520} width={620} height={560} rx={14} fill="#2b2f35" />
    {Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => {
        const x = 130 + c * 95;
        const y = 580 + r * 125;
        return (
          <g key={`${r}-${c}`}>
            <rect x={x - 4} y={y - 4} width={28} height={108} rx={8} fill="#3d434b" />
            <rect x={x} y={y} width={20} height={100} rx={7} fill={r % 2 ? STORY.steel : STORY.brandRed} />
          </g>
        );
      }),
    )}
    {/* Rolling tool cabinet. */}
    <rect x={820} y={1180} width={360} height={420} rx={16} fill={STORY.brandRed} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={840} y={1200 + i * 96} width={320} height={80} rx={8} fill={STORY.brandRedDark} />
        <rect x={960} y={1232 + i * 96} width={80} height={14} rx={7} fill="#e9e9e9" />
      </g>
    ))}
    <circle cx={860} cy={1620} r={22} fill="#222" />
    <circle cx={1140} cy={1620} r={22} fill="#222" />
  </LayerSvg>
);

// Two-post lift; `rise` 0..1 lifts the arms.
export const Lift: React.FC<{ rise: number; x?: number }> = ({ rise, x = 700 }) => {
  const armY = 1520 - 300 * rise;
  return (
    <LayerSvg>
      {[-480, 480].map((dx) => (
        <g key={dx}>
          <rect x={x + dx - 40} y={700} width={80} height={900} rx={10} fill={STORY.steel} />
          <rect x={x + dx - 40} y={700} width={80} height={60} fill={STORY.brandRed} />
          <rect x={x + dx - 10} y={760} width={20} height={830} fill={STORY.steelDark} />
          <rect x={x + dx + (dx < 0 ? 0 : -150)} y={armY} width={150} height={26} rx={8} fill={STORY.steelDark} />
        </g>
      ))}
      <rect x={x - 560} y={1590} width={1120} height={20} rx={8} fill="#9aa1aa" />
    </LayerSvg>
  );
};

// Soft vignette/grade over a whole scene (dark for rogue, airy for clean).
export const Grade: React.FC<{ kind: "grime" | "clean"; strength?: number }> = ({ kind, strength = 1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        kind === "grime"
          ? `radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 35%, ${STORY.grimeShadow} 100%)`
          : "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.0) 50%, rgba(170,180,195,0.35) 100%)",
      opacity: strength,
      mixBlendMode: kind === "grime" ? "multiply" : "normal",
    }}
  />
);

// Thin paper grain over everything, keeps it reading as paper craft.
export const Grain: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: PAPER.board, opacity: 0.06, mixBlendMode: "multiply" }} />
);

// Doktermobil storefront: white facade, red sign band with the official
// logo on a white plate, glass doors, pavement. HTML so the logo stays crisp.
export const Facade: React.FC<{ logo: string }> = ({ logo }) => (
  <div style={{ position: "absolute", left: LAYER_BOX.x, top: LAYER_BOX.y, width: LAYER_BOX.w, height: LAYER_BOX.h }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #bfe3ff 0%, #e9f5ff 40%, #f5f6f8 41%)" }} />
    {/* Building. */}
    <div style={{ position: "absolute", left: 60, top: 640, width: 1280, height: 940, background: "#ffffff", boxShadow: "0 20px 50px rgba(30,40,60,0.15)" }} />
    <div style={{ position: "absolute", left: 60, top: 640, width: 1280, height: 200, background: STORY.brandRed, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#ffffff", borderRadius: 22, padding: "16px 36px" }}>
        <Img src={logo} style={{ height: 120, display: "block" }} />
      </div>
    </div>
    {/* Glass bays. */}
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ position: "absolute", left: 120 + i * 400, top: 900, width: 360, height: 660, background: "linear-gradient(160deg, #cfe7f7 0%, #9fc6e0 60%, #b9d9ee 100%)", border: "14px solid #d9dde2" }}>
        <div style={{ position: "absolute", left: 30, top: 40, width: 60, height: 560, background: "rgba(255,255,255,0.5)", transform: "skewX(-12deg)" }} />
      </div>
    ))}
    {/* Pavement and kerb. */}
    <div style={{ position: "absolute", left: 0, top: 1580, width: 1400, height: 820, background: "#cfd4da" }} />
    <div style={{ position: "absolute", left: 0, top: 1580, width: 1400, height: 24, background: "#b5bcc4" }} />
    {Array.from({ length: 7 }, (_, i) => (
      <div key={i} style={{ position: "absolute", left: i * 220, top: 1700, width: 120, height: 14, background: "#ffffff", opacity: 0.7 }} />
    ))}
  </div>
);
