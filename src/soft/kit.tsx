// Soft look ("adem") kit: calm ocean palette, no outlines, soft shadows and
// glows, smooth easing. Shared drawing pieces of the laut2d world.

import { FONTS } from "../lib/brand";

export const FONT = FONTS.body;

export const L = {
  skyTop: "#F7EEDF",
  sky: "#D7ECE7",
  foam: "#E9F6F1",
  surface: "#9ED3CB",
  shallow: "#5FAFB0",
  mid: "#2B6E7A",
  deep: "#163F4E",
  abyss: "#0D2836",
  sand: "#E3CFA6",
  sandDeep: "#9C8A6C",
  cream: "#FBF5EA",
  ink: "#17323C",
  inkSoft: "#4E6B73",
  coral: "#EE9C83",
  coralDeep: "#D9775E",
  glow: "#FFD27A",
  glowSoft: "#FFE9B8",
  sea: "#A9DCCF",
  leaf: "#7FBF9A",
  cable: "#21495A",
  cableHi: "#3C6E80",
  steel: "#9FB3B8",
  copper: "#D99A6C",
};

export const c01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (x: number) => 1 - Math.pow(1 - c01(x), 3);
export const easeInOut = (x: number) => {
  const t = c01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
// Soft overshoot for things that arrive (no bounce on the way out).
export const settle = (x: number) => {
  const t = c01(x);
  return 1 + 1.4 * Math.pow(t - 1, 3) + 0.4 * Math.pow(t - 1, 2);
};

// Smootherstep: zero speed at both ends, so nothing starts or stops with a jolt.
export const soft = (x: number) => {
  const t = c01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
// Progress of an animation that starts at `a` seconds and lasts `d`. All
// three ease in and out; `ks` adds a whisper of overshoot for arrivals.
export const k = (sec: number, a: number, d = 0.6) => soft((sec - a) / d);
export const kio = (sec: number, a: number, d = 0.8) => soft((sec - a) / d);
export const ks = (sec: number, a: number, d = 0.8) => {
  const t = c01((sec - a) / d);
  return soft(t) + 0.06 * Math.sin(Math.PI * t) * t;
};

export type Pt = [number, number];

// Dense polyline from a parametric curve (drawn smooth with round joins).
export const curve = (fn: (u: number) => Pt, n = 48): Pt[] => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
const lengths = (pts: Pt[]) => {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return acc;
};
export const pointAt = (pts: Pt[], u: number): Pt => {
  const acc = lengths(pts);
  const target = c01(u) * acc[acc.length - 1];
  let i = 1;
  while (i < acc.length - 1 && acc[i] < target) i++;
  const seg = acc[i] - acc[i - 1] || 1;
  const f = (target - acc[i - 1]) / seg;
  return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
};
export const partial = (pts: Pt[], u: number): Pt[] => {
  if (u >= 1) return pts;
  if (u <= 0) return [pts[0]];
  const acc = lengths(pts);
  const target = u * acc[acc.length - 1];
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (acc[i] <= target) out.push(pts[i]);
    else {
      const f = (target - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
      out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]);
      break;
    }
  }
  return out;
};
export const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

// Shared <defs>: soft shadow, glow, gradients.
export const KitDefs: React.FC = () => (
  <defs>
    <filter id="lsoft" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#0D2836" floodOpacity="0.22" />
    </filter>
    <filter id="lglow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="lblur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="22" />
    </filter>
    <radialGradient id="lbit" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stopColor="#FFF8E6" />
      <stop offset="55%" stopColor={L.glowSoft} />
      <stop offset="100%" stopColor={L.glow} />
    </radialGradient>
    <radialGradient id="lhalo">
      <stop offset="0%" stopColor={L.glow} stopOpacity="0.55" />
      <stop offset="100%" stopColor={L.glow} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="lglobe" cx="38%" cy="32%" r="75%">
      <stop offset="0%" stopColor="#7EC3BF" />
      <stop offset="70%" stopColor={L.mid} />
      <stop offset="100%" stopColor="#1D5664" />
    </radialGradient>
    <linearGradient id="lray" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
    </linearGradient>
  </defs>
);

// Bit: the channel's guide, a small light pulse with a face. Moods change the
// eyes; it bobs gently and blinks.
export const Bit: React.FC<{ x: number; y: number; s?: number; f: number; mood?: "happy" | "worry" | "wow" | "sad"; o?: number; look?: number }> = ({ x, y, s = 1, f, mood = "happy", o = 1, look = 0 }) => {
  if (o <= 0) return null;
  const bob = Math.sin(f / 14) * 6;
  const bp = f % 97;
  const blink = bp < 6 ? 1 - 0.85 * Math.sin((bp / 6) * Math.PI) : 1;
  const ex = look * 6;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`} opacity={o}>
      <circle r={70} fill="url(#lhalo)" />
      <circle r={34} fill="url(#lbit)" />
      {mood === "wow" ? (
        <>
          <circle cx={-11 + ex} cy={-4} r={5.5} fill={L.ink} />
          <circle cx={11 + ex} cy={-4} r={5.5} fill={L.ink} />
          <ellipse cx={ex} cy={12} rx={5} ry={6} fill={L.ink} />
        </>
      ) : (
        <>
          <ellipse cx={-11 + ex} cy={-4} rx={4.5} ry={5.5 * blink} fill={L.ink} />
          <ellipse cx={11 + ex} cy={-4} rx={4.5} ry={5.5 * blink} fill={L.ink} />
          {mood === "happy" ? <path d={`M${-8 + ex} 9 Q${ex} 16 ${8 + ex} 9`} stroke={L.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" /> : null}
          {mood === "worry" ? <path d={`M${-7 + ex} 13 Q${ex} 9 ${7 + ex} 13`} stroke={L.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" /> : null}
          {mood === "sad" ? <path d={`M${-8 + ex} 14 Q${ex} 7 ${8 + ex} 14`} stroke={L.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" /> : null}
          {mood === "worry" || mood === "sad" ? (
            <>
              <path d={`M${-17 + ex} -15 L${-6 + ex} -12`} stroke={L.ink} strokeWidth={3} strokeLinecap="round" />
              <path d={`M${17 + ex} -15 L${6 + ex} -12`} stroke={L.ink} strokeWidth={3} strokeLinecap="round" />
            </>
          ) : null}
        </>
      )}
      <circle cx={-14} cy={-16} r={5} fill="#FFFFFF" opacity={0.75} />
    </g>
  );
};

// Rounded label. Tones: cream (default), glow, coral, deep.
export const Pill: React.FC<{ x: number; y: number; text: string; size?: number; tone?: "cream" | "glow" | "coral" | "deep" | "brand"; o?: number; sc?: number; weight?: number }> = ({
  x,
  y,
  text,
  size = 40,
  tone = "cream",
  o = 1,
  sc = 1,
  weight = 700,
}) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.6 + size * 1.3;
  const h = size * 1.75;
  const bg = { cream: L.cream, glow: L.glow, coral: L.coral, deep: L.ink, brand: "#E31E24" }[tone];
  const fg = tone === "deep" || tone === "brand" ? "#FFFFFF" : L.ink;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={o} filter="url(#lsoft)">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={bg} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={weight} fontSize={size} fill={fg}>
        {text}
      </text>
    </g>
  );
};

// Light pulses running along a polyline.
export const Pulses: React.FC<{ pts: Pt[]; f: number; n?: number; speed?: number; o?: number; r?: number; from?: number; to?: number }> = ({ pts, f, n = 3, speed = 0.012, o = 1, r = 9, from = 0, to = 1 }) => {
  if (o <= 0) return null;
  return (
    <g opacity={o} filter="url(#lglow)">
      {Array.from({ length: n }, (_, i) => {
        const u = from + (((f * speed + i / n) % 1) * (to - from));
        const [x, y] = pointAt(pts, u);
        return <circle key={i} cx={x} cy={y} r={r} fill={L.glowSoft} />;
      })}
    </g>
  );
};

// A sea cable: dark core with a soft highlight, optionally drawn on.
export const Cable: React.FC<{ pts: Pt[]; w?: number; draw?: number; glow?: number; o?: number }> = ({ pts, w = 16, draw = 1, glow = 0, o = 1 }) => {
  const p = partial(pts, draw);
  const d = toD(p);
  return (
    <g opacity={o}>
      {glow > 0 ? <path d={d} stroke={L.glow} strokeWidth={w + 18} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.28 * glow} filter="url(#lblur)" /> : null}
      <path d={d} stroke={L.cable} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={L.cableHi} strokeWidth={w * 0.28} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${-w * 0.22})`} opacity={0.8} />
    </g>
  );
};

// Soft sand dunes along the bottom of an underwater shot.
export const Seabed: React.FC<{ y?: number; deep?: number; f: number }> = ({ y = 1270, deep = 0.6 }) => {
  const sand = deep > 0.5 ? L.sandDeep : L.sand;
  return (
    <g>
      <path d={`M0 ${y + 40} C 200 ${y - 10}, 380 ${y + 30}, 560 ${y + 10} S 900 ${y - 20}, 1080 ${y + 20} L1080 1920 L0 1920 Z`} fill={sand} opacity={0.75} />
      <path d={`M0 ${y + 110} C 260 ${y + 70}, 520 ${y + 120}, 760 ${y + 90} S 980 ${y + 80}, 1080 ${y + 100} L1080 1920 L0 1920 Z`} fill={sand} />
      {[120, 330, 690, 930].map((x, i) => (
        <g key={i} transform={`translate(${x} ${y + 60 + (i % 2) * 30})`} opacity={0.55}>
          <path d="M0 0 C -6 -40, 8 -70, 0 -110" stroke={L.leaf} strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d="M18 0 C 12 -30, 26 -50, 20 -80" stroke={L.leaf} strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

// Phone with a playing video on screen.
export const Phone: React.FC<{ x: number; y: number; s?: number; f: number; screen?: "video" | "dark" | "nosignal" }> = ({ x, y, s = 1, f, screen = "video" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lsoft)">
    <rect x={-130} y={-250} width={260} height={500} rx={44} fill={L.cream} />
    <rect x={-112} y={-224} width={224} height={448} rx={30} fill={screen === "video" ? L.mid : "#24343A"} />
    {screen === "video" ? (
      <>
        <rect x={-112} y={-224} width={224} height={300} rx={30} fill={L.shallow} />
        <circle cx={-40} cy={-110} r={30} fill={L.glowSoft} opacity={0.9} />
        <path d="M-112 30 C -60 -20, 0 10, 40 -30 S 100 -40, 112 -20 L112 76 L-112 76 Z" fill={L.sea} />
        <circle cx={0} cy={-70} r={42} fill={L.cream} opacity={0.92} />
        <path d="M-12 -92 L22 -70 L-12 -48 Z" fill={L.ink} />
        <rect x={-90} y={110} width={180} height={10} rx={5} fill="#FFFFFF" opacity={0.3} />
        <rect x={-90} y={110} width={180 * ((f / 240) % 1)} height={10} rx={5} fill={L.glow} />
        <rect x={-90} y={146} width={130} height={14} rx={7} fill="#FFFFFF" opacity={0.5} />
        <rect x={-90} y={172} width={90} height={14} rx={7} fill="#FFFFFF" opacity={0.3} />
      </>
    ) : null}
    {screen === "nosignal" ? (
      <g>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-48 + i * 26} y={-10 - i * 18} width={18} height={30 + i * 18} rx={5} fill="#FFFFFF" opacity={0.18} />
        ))}
        <path d="M-50 -60 L50 40 M50 -60 L-50 40" stroke={L.coral} strokeWidth={12} strokeLinecap="round" />
      </g>
    ) : null}
    <rect x={-36} y={-238} width={72} height={8} rx={4} fill={L.ink} opacity={0.25} />
  </g>
);

export const Cloud: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <ellipse cx={0} cy={20} rx={150} ry={50} fill="#FFFFFF" />
    <circle cx={-60} cy={0} r={55} fill="#FFFFFF" />
    <circle cx={20} cy={-20} r={75} fill="#FFFFFF" />
    <circle cx={90} cy={10} r={50} fill="#FFFFFF" />
  </g>
);

export const Satellite: React.FC<{ x: number; y: number; s?: number; rot?: number; o?: number }> = ({ x, y, s = 1, rot = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o} filter="url(#lsoft)">
    <rect x={-150} y={-36} width={100} height={72} rx={10} fill="#7FB2C7" />
    <rect x={50} y={-36} width={100} height={72} rx={10} fill="#7FB2C7" />
    {[-125, -100, -75, 75, 100, 125].map((xx) => (
      <rect key={xx} x={xx - 1.5} y={-36} width={3} height={72} fill={L.cream} opacity={0.6} />
    ))}
    <rect x={-50} y={-6} width={100} height={12} fill={L.steel} />
    <rect x={-40} y={-48} width={80} height={96} rx={18} fill={L.cream} />
    <circle cx={0} cy={0} r={16} fill={L.glow} />
  </g>
);

export const Shark: React.FC<{ x: number; y: number; s?: number; f: number; bite?: number; flip?: boolean; o?: number }> = ({ x, y, s = 1, f, bite = 0, flip = false, o = 1 }) => {
  const tail = Math.sin(f / 7) * 10;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} opacity={o} filter="url(#lsoft)">
      <path d={`M150 -20 L${215 + tail * 0.4} ${-70 + tail} L195 0 L${215 + tail * 0.4} ${70 + tail} L150 20 Z`} fill="#6F97A5" />
      <path d="M-10 -60 C 10 -110, 30 -130, 46 -138 C 44 -110, 52 -80, 64 -58 Z" fill="#6F97A5" />
      <path d="M-175 0 C -130 -72, 60 -84, 160 -18 L160 18 C 60 84, -130 72, -175 0 Z" fill="#86AEBB" />
      <path d="M-160 10 C -100 52, 40 58, 150 14 C 60 30, -80 34, -160 10 Z" fill={L.cream} opacity={0.9} />
      <path d="M-30 30 C -10 70, 20 90, 40 100 C 30 70, 30 50, 30 34 Z" fill="#6F97A5" />
      <circle cx={-118} cy={-16} r={9} fill={L.ink} />
      <circle cx={-121} cy={-19} r={3} fill="#FFFFFF" />
      {bite > 0 ? (
        <path d={`M-170 8 L-112 ${10 + 26 * bite} L-104 12 Z`} fill={L.ink} opacity={0.85} />
      ) : (
        <path d="M-160 12 Q-138 20 -116 14" stroke={L.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};

// A boat on the surface (repair = cable ship with a bow sheave and crane).
export const Ship: React.FC<{ x: number; y: number; s?: number; f: number; kind?: "cargo" | "repair"; o?: number }> = ({ x, y, s = 1, f, kind = "cargo", o = 1 }) => {
  const rock = Math.sin(f / 20) * 2;
  return (
    <g transform={`translate(${x} ${y + Math.sin(f / 16) * 4}) rotate(${rock}) scale(${s})`} opacity={o} filter="url(#lsoft)">
      <path d="M-230 -10 L230 -10 L190 70 L-200 70 Z" fill={kind === "repair" ? L.coral : "#6E8F96"} />
      <rect x={-230} y={-10} width={460} height={16} fill={L.cream} opacity={0.85} />
      {kind === "repair" ? (
        <>
          <rect x={-160} y={-110} width={150} height={100} rx={14} fill={L.cream} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={-145 + i * 46} y={-90} width={32} height={26} rx={6} fill={L.shallow} />
          ))}
          <rect x={-120} y={-150} width={18} height={44} fill={L.coralDeep} />
          <path d="M150 -10 L150 -130 L250 -60" stroke={L.ink} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={230} cy={10} r={26} fill={L.glow} />
          <circle cx={230} cy={10} r={10} fill={L.ink} />
        </>
      ) : (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-150 + i * 70} y={-70} width={60} height={60} rx={8} fill={[L.coral, L.glow, L.sea, L.coral][i]} />
          ))}
          <rect x={130} y={-120} width={70} height={110} rx={10} fill={L.cream} />
        </>
      )}
    </g>
  );
};

export const Anchor: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} filter="url(#lsoft)">
    <circle cx={0} cy={-70} r={16} fill="none" stroke={L.ink} strokeWidth={10} />
    <rect x={-7} y={-56} width={14} height={110} rx={6} fill={L.ink} />
    <rect x={-34} y={-36} width={68} height={12} rx={6} fill={L.ink} />
    <path d="M-60 10 C -50 50, -20 64, 0 64 C 20 64, 50 50, 60 10" stroke={L.ink} strokeWidth={12} fill="none" strokeLinecap="round" />
    <path d="M-72 18 L-60 0 L-48 20 Z M72 18 L60 0 L48 20 Z" fill={L.ink} />
  </g>
);

export const Island: React.FC<{ x: number; y: number; s?: number; f: number; lights?: number; label?: string }> = ({ x, y, s = 1, f, lights = 1, label }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={20} rx={230} ry={46} fill={L.sand} filter="url(#lsoft)" />
    <g transform={`translate(-110 -10) rotate(${Math.sin(f / 30) * 2})`}>
      <path d="M0 10 C 6 -40, 2 -80, 12 -120" stroke="#A9825E" strokeWidth={12} fill="none" strokeLinecap="round" />
      {[-60, -20, 20, 60].map((a, i) => (
        <ellipse key={i} cx={12 + Math.cos((a * Math.PI) / 180) * 40} cy={-124 + Math.sin((a * Math.PI) / 180) * 14} rx={46} ry={14} fill={L.leaf} transform={`rotate(${a} ${12} -124)`} />
      ))}
    </g>
    {[-10, 70, 140].map((hx, i) => (
      <g key={i} transform={`translate(${hx} ${-30 - (i % 2) * 6})`}>
        <path d="M-34 0 L0 -32 L34 0 Z" fill={L.coralDeep} />
        <rect x={-28} y={0} width={56} height={44} rx={4} fill={L.cream} />
        <rect x={-10} y={12} width={20} height={20} rx={3} fill={lights > 0.5 ? L.glow : "#5E6E72"} opacity={lights > 0.5 ? 1 : 0.8} />
        {lights > 0.5 ? <circle cx={0} cy={22} r={22} fill="url(#lhalo)" opacity={lights} /> : null}
      </g>
    ))}
    {label ? <Pill x={0} y={110} text={label} size={36} /> : null}
  </g>
);

// Abstract land mass (soft blob) used on maps.
export const Land: React.FC<{ x: number; y: number; s?: number; seed?: number; o?: number }> = ({ x, y, s = 1, seed = 0, o = 1 }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const r = 100 * (0.75 + 0.3 * Math.abs(Math.sin(i * 2.3 + seed * 1.7)));
    return [Math.cos(a) * r * 1.3, Math.sin(a) * r] as Pt;
  });
  const d =
    pts
      .map((p, i) => {
        const n = pts[(i + 1) % pts.length];
        const m: Pt = [(p[0] + n[0]) / 2, (p[1] + n[1]) / 2];
        return `${i === 0 ? `M${((pts[pts.length - 1][0] + p[0]) / 2).toFixed(1)} ${((pts[pts.length - 1][1] + p[1]) / 2).toFixed(1)} ` : ""}Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
      })
      .join(" ") + " Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#lsoft)">
      <path d={d} fill={L.sand} />
      <path d={d} fill={L.leaf} opacity={0.35} transform="scale(0.6)" />
    </g>
  );
};
