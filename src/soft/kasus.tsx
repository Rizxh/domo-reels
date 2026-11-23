// "kasus" soft world (16:9, 1920x1080): an incident explainer in the
// "Kejadian" series. Calm, flat, professional boards (dark navy for drama,
// warm cream for facts), split layout (visual 60% left, text 40% right) with
// safe margins 96 px left/right and 54 px top/bottom, a cross-dissolve at
// every cut and beats cued on the narration's word timings. All on-screen
// copy comes from the episode (scene.screen), none is written here.
// EP09: BYD Atto 1, Cengkareng (k-*). EP10: Jaecoo J5 EV, Tanah Abang (k2-*,
// no voice over: beats on named scene cues).

import { random } from "remotion";
import { FONTS } from "../lib/brand";
import { c01, k, KitDefs, kio, lerp, pointAt, soft, toD, type Pt } from "./kit";
import { SOFT_WORLD_SHOTS } from "./registry";
import { type Ctx, makeCtx, pop, type Word } from "./scene";

export const W169 = 1920;
export const H169 = 1080;
const ML = 96;
const MR = W169 - 96;
const MT = 54;
const MB = H169 - 54;
const VIS_R = ML + Math.round((MR - ML) * 0.6); // end of the 60% visual column
const TXT_L = VIS_R + 40;

const C = {
  navy: "#13202E",
  navy2: "#1C2E42",
  cream: "#F3EEE5",
  card: "#FFFFFF",
  ink: "#17323C",
  muted: "#6B7C86",
  red: "#E31E24",
  amber: "#F4A259",
  line: "#9CC4E4",
  grid: "#2C4560",
  road: "#D9D2C5",
  car: "#2B3A47",
  carHi: "#41566A",
  glass: "#7E9AB0",
};
const HEAD = FONTS.headline;
const BODY = FONTS.body;

type S = Record<string, string>;
// Named beat time of the scene (episode `cues`), with a fallback.
type Q = (name: string, fallback: number) => number;
type ShotDef169 = { bg: string; draw: (c: Ctx, t: S, still: boolean, q: Q) => React.ReactNode };

// ---------------------------------------------------------------- assets

const Txt: React.FC<{ x: number; y: number; text: string; size: number; font?: string; weight?: number; color?: string; anchor?: "start" | "middle" | "end"; o?: number; spacing?: string }> = ({
  x,
  y,
  text,
  size,
  font = BODY,
  weight = 700,
  color = C.ink,
  anchor = "start",
  o = 1,
  spacing,
}) =>
  o <= 0 ? null : (
    <text x={x} y={y} fontFamily={font} fontWeight={weight} fontSize={size} fill={color} textAnchor={anchor} opacity={o} style={spacing ? { letterSpacing: spacing } : undefined}>
      {text}
    </text>
  );

// Greedy word wrap for SVG text (approximate width by character count).
const wrap = (text: string, maxChars: number) => {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    if ((line + " " + w).trim().length > maxChars && line) {
      out.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
};

const Wheel: React.FC<{ x: number; y: number; r: number; rot: number; o?: number }> = ({ x, y, r, rot, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
    <circle r={r} fill="#1A1F24" />
    <circle r={r * 0.92} fill="none" stroke="#2C343B" strokeWidth={r * 0.08} />
    {Array.from({ length: 18 }, (_, i) => (
      <rect key={i} x={-r * 0.04} y={-r} width={r * 0.08} height={r * 0.12} fill="#2C343B" transform={`rotate(${i * 20})`} />
    ))}
    <circle r={r * 0.62} fill="#B8C4CC" />
    <circle r={r * 0.56} fill="#8E9BA5" />
    {Array.from({ length: 5 }, (_, i) => (
      <path key={i} d={`M0 0 L${-r * 0.1} ${-r * 0.52} L${r * 0.1} ${-r * 0.52} Z`} fill="#C9D3D9" transform={`rotate(${i * 72})`} />
    ))}
    <circle r={r * 0.16} fill="#5F6B74" />
    {Array.from({ length: 5 }, (_, i) => (
      <circle key={i} cx={0} cy={-r * 0.24} r={r * 0.03} fill="#2C343B" transform={`rotate(${i * 72 + 36})`} />
    ))}
  </g>
);

// Generic hatchback silhouette (no brand), facing right. Wheel base at y=0.
// rear: offset of the rear wheel (detaching), tilt: body rotation (deg).
const Hatch: React.FC<{ x: number; y: number; s?: number; spin?: number; crumple?: number; rear?: Pt; tilt?: number; o?: number }> = ({ x, y, s = 1, spin = 0, crumple = 0, rear = [0, 0], tilt = 0, o = 1 }) => {
  const nose = 330 - crumple * 46;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <g transform={`rotate(${tilt} 260 0)`}>
        <path
          d={`M-330 -40 Q-334 -120 -300 -150 L-240 -158 L-150 -250 Q-128 -268 -90 -270 L120 -270 Q160 -270 190 -238 L250 -160 L${nose - 30} -140 Q${nose} -132 ${nose} -96 L${nose} -40 Q${nose} -24 ${nose - 16} -24 L-314 -24 Q-330 -24 -330 -40 Z`}
          fill={C.car}
        />
        <path d={`M-300 -150 L${nose - 30} -140`} stroke={C.carHi} strokeWidth={6} opacity={0.8} />
        <path d="M-138 -160 L-86 -236 L10 -236 L10 -160 Z M34 -160 L34 -236 L120 -236 Q140 -236 156 -214 L196 -160 Z" fill={C.glass} opacity={0.85} />
        <rect x={nose - 26} y={-128} width={22} height={14} rx={6} fill="#F6E7B0" />
        <rect x={-326} y={-136} width={14} height={30} rx={6} fill={C.red} />
      </g>
      <Wheel x={-210 + rear[0]} y={-6 + rear[1]} r={70} rot={spin} />
      <Wheel x={210} y={-6} r={70} rot={spin} />
    </g>
  );
};

const Barrier: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-60 0 L-40 -60 L-26 -170 L26 -170 L40 -60 L60 0 Z" fill="#B9B3A8" />
    <path d="M-26 -170 L26 -170 L30 -140 L-30 -140 Z" fill="#E9E3D8" />
    {[0, 1].map((i) => (
      <rect key={i} x={-34} y={-120 + i * 56} width={68} height={22} fill={i ? C.amber : "#FFFFFF"} opacity={0.9} />
    ))}
  </g>
);

const Card: React.FC<{ x: number; y: number; w: number; h: number; o?: number; dy?: number; children?: React.ReactNode }> = ({ x, y, w, h, o = 1, dy = 0, children }) =>
  o <= 0 ? null : (
    <g transform={`translate(${x} ${y + dy})`} opacity={o}>
      <rect x={0} y={6} width={w} height={h} rx={26} fill="#0D2836" opacity={0.08} />
      <rect x={0} y={0} width={w} height={h} rx={26} fill={C.card} />
      {children}
    </g>
  );

const IconCircle: React.FC<{ x: number; y: number; r?: number; color?: string; children?: React.ReactNode }> = ({ x, y, r = 44, color = C.red, children }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={color} opacity={0.12} />
    <g stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </g>
);

const SourceLine: React.FC<{ text?: string; o: number; dark?: boolean }> = ({ text, o, dark }) =>
  !text || o <= 0 ? null : (
    <g opacity={o}>
      <rect x={ML} y={MB - 44} width={text.length * 13.5 + 150} height={40} rx={20} fill={dark ? "#FFFFFF" : C.ink} opacity={dark ? 0.12 : 0.08} />
      <Txt x={ML + 20} y={MB - 17} text={`Sumber: ${text}`} size={24} weight={600} color={dark ? "#C9D6DF" : C.muted} />
    </g>
  );

// ---------------------------------------------------------------- shots

// ================================================================ EP09
// 1. Hook: dark, a wheel rolls across the frame; glitch title at the bottom.
const hook = (c: Ctx, t: S, still: boolean) => {
  const u = c.sec / c.len;
  const x = lerp(-240, W169 + 240, u);
  const bounce = Math.abs(Math.sin(u * Math.PI * 3)) * 26 * (1 - u * 0.5);
  const r = 150;
  const rot = ((x + 240) / (2 * Math.PI * r)) * 360;
  const tIn = c.w("satu", 0, 2.0) - 0.15;
  const g = c.sec - tIn;
  const glitch = g > 0 && g < 0.55 ? 1 - g / 0.55 : 0;
  const jx = (n: number) => (random(`gx${Math.floor(c.f)}-${n}`) - 0.5) * 34 * glitch;
  const title = t.title ?? "";
  const show = k(c.sec, tIn, 0.12);
  return (
    <g>
      <defs>
        <radialGradient id="kvig" cx="50%" cy="45%" r="70%">
          <stop offset="60%" stopColor={C.navy} stopOpacity={0} />
          <stop offset="100%" stopColor="#060B11" stopOpacity={0.85} />
        </radialGradient>
      </defs>
      <rect x={0} y={790} width={W169} height={6} fill="#2C3E52" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={((i * 260 - c.f * 14) % 2600) - 260} y={850} width={150} height={10} rx={5} fill="#2C3E52" />
      ))}
      {/* Speed lines behind the wheel. */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x - 420 - i * 60} y={560 + i * 56} width={260 - i * 40} height={6} rx={3} fill="#3A536C" opacity={0.6} />
      ))}
      <ellipse cx={x} cy={792} rx={120} ry={14} fill="#000" opacity={0.35} />
      <Wheel x={x} y={790 - r - bounce} r={r} rot={rot} />
      <rect width={W169} height={H169} fill="url(#kvig)" />
      {!still && show > 0 ? (
        <g opacity={show}>
          {glitch > 0 ? (
            <>
              <Txt x={W169 / 2 + jx(1) - 8} y={970} text={title} size={96} font={HEAD} weight={400} color="#00D1FF" anchor="middle" o={0.7} />
              <Txt x={W169 / 2 + jx(2) + 8} y={970} text={title} size={96} font={HEAD} weight={400} color={C.red} anchor="middle" o={0.8} />
            </>
          ) : null}
          <Txt x={W169 / 2 + jx(3) * 0.4} y={970} text={title} size={96} font={HEAD} weight={400} color="#FFFFFF" anchor="middle" spacing="0.02em" />
          {glitch > 0
            ? [0, 1, 2].map((i) => <rect key={i} x={0} y={890 + random(`gs${Math.floor(c.f)}-${i}`) * 100} width={W169} height={6 + random(`gh${Math.floor(c.f)}-${i}`) * 10} fill={C.navy} opacity={0.9} />)
            : null}
        </g>
      ) : null}
    </g>
  );
};

// 2. Series label: a giant "01" slides in on the left, title block on the right.
const label = (c: Ctx, t: S) => {
  const n = kio(c.sec, 0, 0.6);
  const a = (d: number) => k(c.sec, 0.15 + d, 0.45);
  const tx = 860;
  return (
    <g>
      <text x={lerp(-500, 140, n)} y={760} fontFamily={HEAD} fontSize={600} fill="none" stroke={C.red} strokeWidth={4} opacity={0.35 * n}>
        {t.number}
      </text>
      <text x={lerp(-460, 180, n)} y={740} fontFamily={HEAD} fontSize={560} fill={C.red} opacity={n}>
        {t.number}
      </text>
      <g transform={`translate(${(1 - a(0)) * 60} 0)`} opacity={a(0)}>
        <Txt x={tx} y={430} text={t.kicker ?? ""} size={40} weight={800} color={C.amber} spacing="0.22em" />
      </g>
      <g transform={`translate(${(1 - a(0.12)) * 60} 0)`} opacity={a(0.12)}>
        <Txt x={tx} y={575} text={t.title ?? ""} size={150} font={HEAD} weight={400} color="#FFFFFF" />
      </g>
      <rect x={tx} y={612} width={180 * a(0.24)} height={10} rx={5} fill={C.red} />
      <g transform={`translate(${(1 - a(0.3)) * 60} 0)`} opacity={a(0.3)}>
        <Txt x={tx} y={700} text={t.subtitle ?? ""} size={48} weight={600} color="#C9D6DF" />
      </g>
    </g>
  );
};

// 3. When and where: a minimal line map zooms into a pulsing pin; date, time
// (digital clock rolling to 04:00) and place cards stack on the right.
const where = (c: Ctx, t: S) => {
  const tTime = c.w("jam", 0, 2.2);
  const tPlace = c.w("lokasinya", 0, 3.0);
  const zoom = kio(c.sec, 0.2, 3.4);
  const pin: Pt = [640, 560];
  const z = lerp(1, 2.1, zoom);
  const pinDrop = k(c.sec, 0.9, 0.5);
  const roll = kio(c.sec, tTime - 0.1, 1.2) * 4; // 0 -> 4 hours
  const hour = Math.floor(roll);
  const frac = soft(roll - hour);
  const cardW = MR - TXT_L;
  const cards = [
    { at: 0.05, y: 170 },
    { at: tTime - 0.15, y: 420 },
    { at: tPlace - 0.15, y: 670 },
  ];
  const ci = cards.map((cd) => ({ o: k(c.sec, cd.at, 0.4), dy: (1 - k(c.sec, cd.at, 0.5)) * 40 }));
  return (
    <g>
      {/* Map panel. */}
      <rect x={ML} y={110} width={VIS_R - ML} height={860} rx={32} fill={C.card} />
      <defs>
        <clipPath id="kmap">
          <rect x={ML} y={110} width={VIS_R - ML} height={860} rx={32} />
        </clipPath>
      </defs>
      <g clipPath="url(#kmap)">
        <g transform={`translate(${pin[0]} ${pin[1]}) scale(${z}) translate(${-pin[0]} ${-pin[1]})`}>
          {Array.from({ length: 9 }, (_, i) => (
            <path key={`v${i}`} d={`M${130 + i * 120} 100 L${100 + i * 128} 1000`} stroke={C.road} strokeWidth={6} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <path key={`h${i}`} d={`M80 ${170 + i * 130} L1160 ${150 + i * 134}`} stroke={C.road} strokeWidth={6} />
          ))}
          <path d="M80 300 C 340 360, 520 420, 1160 330" stroke="#BFD9E6" strokeWidth={60} fill="none" opacity={0.6} />
          {/* Toll road (diagonal) and its exit ramp. */}
          <path d="M120 960 L1140 170" stroke={C.amber} strokeWidth={22} strokeLinecap="round" />
          <path d="M560 620 Q 600 590 640 560" stroke={C.amber} strokeWidth={12} fill="none" strokeLinecap="round" />
          {/* Ring Road (main street). */}
          <path d="M80 590 C 360 570, 640 560, 1160 548" stroke={C.ink} strokeWidth={16} fill="none" strokeLinecap="round" />
          <Txt x={400} y={540} text={t.road1 ?? ""} size={24 / Math.max(1, z * 0.75)} weight={700} color={C.ink} o={1} />
          <Txt x={300} y={800} text={t.road2 ?? ""} size={24 / Math.max(1, z * 0.75)} weight={700} color="#B9723A" o={1} />
          {/* Pin. */}
          <g transform={`translate(${pin[0]} ${pin[1] - (1 - pinDrop) * 120})`} opacity={pinDrop}>
            {[0, 1].map((i) => {
              const life = ((c.sec * 0.8 + i * 0.5) % 1);
              return <circle key={i} r={(14 + life * 60) / z} fill="none" stroke={C.red} strokeWidth={4 / z} opacity={(1 - life) * pinDrop} />;
            })}
            <g transform={`scale(${1 / z})`}>
              <path d="M0 0 C -26 -34, -34 -52, -34 -66 A34 34 0 1 1 34 -66 C 34 -52, 26 -34, 0 0 Z" fill={C.red} />
              <circle cx={0} cy={-66} r={13} fill="#FFFFFF" />
            </g>
          </g>
        </g>
      </g>
      {/* Date card. */}
      <Card x={TXT_L} y={cards[0].y} w={cardW} h={200} o={ci[0].o} dy={ci[0].dy}>
        <IconCircle x={86} y={100}>
          <rect x={-22} y={-18} width={44} height={40} rx={6} />
          <path d="M-22 -6 L22 -6 M-10 -26 L-10 -14 M10 -26 L10 -14" />
        </IconCircle>
        <Txt x={160} y={86} text="Hari & tanggal" size={28} weight={600} color={C.muted} />
        <Txt x={160} y={140} text={t.date ?? ""} size={46} weight={800} />
      </Card>
      {/* Time card with the rolling digital clock. */}
      <Card x={TXT_L} y={cards[1].y} w={cardW} h={200} o={ci[1].o} dy={ci[1].dy}>
        <IconCircle x={86} y={100}>
          <circle r={24} />
          <path d={`M0 0 L0 -14 M0 0 L${Math.sin(roll * 0.52) * 12} ${-Math.cos(roll * 0.52) * 12 + 2}`} />
        </IconCircle>
        <Txt x={160} y={86} text={t.timeLabel ?? ""} size={28} weight={600} color={C.muted} />
        <defs>
          <clipPath id="kclock">
            <rect x={160} y={100} width={300} height={62} />
          </clipPath>
        </defs>
        <g clipPath="url(#kclock)">
          <Txt x={160} y={152 - frac * 60} text={`0${hour}:00`} size={56} weight={800} font={BODY} />
          {hour < 4 ? <Txt x={160} y={212 - frac * 60} text={`0${hour + 1}:00`} size={56} weight={800} /> : null}
        </g>
        <Txt x={356} y={152} text="WIB" size={30} weight={700} color={C.muted} o={k(c.sec, tTime + 1.1, 0.3)} />
      </Card>
      {/* Place card. */}
      <Card x={TXT_L} y={cards[2].y} w={cardW} h={230} o={ci[2].o} dy={ci[2].dy}>
        <IconCircle x={86} y={115}>
          <path d="M0 22 C -14 4, -20 -6, -20 -14 A20 20 0 1 1 20 -14 C 20 -6, 14 4, 0 22 Z" />
          <circle cx={0} cy={-14} r={6} />
        </IconCircle>
        <Txt x={160} y={90} text="Lokasi" size={28} weight={600} color={C.muted} />
        <Txt x={160} y={144} text={t.place ?? ""} size={42} weight={800} />
        <Txt x={160} y={194} text={t.placeSub ?? ""} size={32} weight={600} color={C.ink} />
      </Card>
    </g>
  );
};

// 4. Impact: side view, the hatchback hits the barrier; shake and flash.
const hit = (c: Ctx, t: S) => {
  const tHit = c.w("menabrak", 0, 3.8) + 0.1;
  const drive = kio(c.sec, 0, tHit);
  const after = c.sec - tHit;
  const impact = after > 0 ? 1 : 0;
  const crumple = k(c.sec, tHit, 0.12);
  const recoil = after > 0 ? Math.sin(Math.min(1, after / 0.5) * Math.PI) * -40 : 0;
  const shake = after > 0 && after < 0.6 ? Math.sin(c.f * 2.6) * 18 * (1 - after / 0.6) : 0;
  const flash = after > 0 && after < 0.2 ? 0.85 * (1 - after / 0.2) : 0;
  const barrierX = 1060;
  const carX = lerp(-500, barrierX - 60 - 330 * 0.9, drive) + recoil;
  return (
    <g>
      <g transform={`translate(${shake} ${shake * 0.4})`}>
        <defs>
          <linearGradient id="kdusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#24364C" />
            <stop offset="1" stopColor={C.navy} />
          </linearGradient>
        </defs>
        <rect width={W169} height={H169} fill="url(#kdusk)" />
        {Array.from({ length: 9 }, (_, i) => {
          const hgt = 120 + random(`kc${i}`) * 220;
          return <rect key={i} x={i * 230 - 40} y={860 - hgt} width={170} height={hgt} fill="#1B2A3B" />;
        })}
        <rect x={0} y={860} width={W169} height={220} fill="#202D3B" />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={((i * 240 - c.f * 16 * (1 - impact)) % 2400) - 240} y={950} width={140} height={10} rx={5} fill="#3A4C5E" />
        ))}
        <Barrier x={barrierX} y={866} s={1.15} />
        <Hatch x={carX} y={866} s={0.9} spin={drive * 900} crumple={crumple} />
        {after > 0 && after < 0.7
          ? Array.from({ length: 12 }, (_, i) => {
              const a = (-90 + (random(`sp${i}`) - 0.5) * 160) * (Math.PI / 180);
              const d = after * (300 + random(`sd${i}`) * 300);
              return <circle key={i} cx={barrierX - 70 + Math.cos(a) * d} cy={770 + Math.sin(a) * d + after * after * 600} r={5} fill={C.amber} opacity={1 - after / 0.7} />;
            })
          : null}
      </g>
      <rect width={W169} height={H169} fill="#FFFFFF" opacity={flash} />
      {/* Driver's account, bottom right. */}
      <g opacity={k(c.sec, 0.4, 0.5)}>
        <rect x={MR - 700} y={MB - 190} width={700} height={150} rx={24} fill="#0B141D" opacity={0.75} />
        <Txt x={MR - 40} y={MB - 118} text={t.quote ?? ""} size={46} weight={800} color="#FFFFFF" anchor="end" />
        <Txt x={MR - 40} y={MB - 66} text={t.by ?? ""} size={30} weight={600} color="#C9D6DF" anchor="end" />
      </g>
    </g>
  );
};

// 5. Timeline: five steps light up with the VO; the car drives along; at the
// last step its rear wheel comes off, ringed in red.
const timeline = (c: Ctx, t: S) => {
  const cues = [c.w("benturan", 0, 0.3), c.w("banting", 0, 1.5), c.w("kilometer", 0, 5.2), c.w("indikator", 0, 6.4), c.w("terlepas", 0, 9.0)];
  const xs = [200, 560, 920, 1280, 1640];
  const lineY = 770;
  const active = cues.filter((q) => c.sec >= q - 0.1).length;
  // Car position glides to the latest active step.
  let carX = xs[0] - 240;
  for (let i = 0; i < cues.length; i++) {
    const p = kio(c.sec, cues[i] - 0.4, i === 2 ? 1.6 : 0.8);
    if (p > 0) carX = lerp(i === 0 ? xs[0] - 240 : xs[i - 1], xs[i], p);
  }
  const detach = c.sec - cues[4];
  const rear: Pt = detach > 0 ? [-Math.min(1, detach / 0.9) * 260, Math.min(1, detach / 0.5) * 6] : [0, 0];
  const tilt = detach > 0 ? -4 * k(c.sec, cues[4], 0.3) : 0;
  const steer = c.sec > cues[1] - 0.2 && c.sec < cues[2] - 0.4 ? -3 : 0;
  const warn = k(c.sec, cues[3] - 0.1, 0.3);
  const labels = [t.s1, t.s2, t.s3, t.s4, t.s5];
  return (
    <g>
      <rect x={ML} y={600} width={MR - ML} height={8} rx={4} fill={C.road} />
      <g transform={`rotate(${steer} ${carX} 600)`}>
        <Hatch x={carX} y={600} s={0.62} spin={carX * 0.9} rear={rear} tilt={tilt} />
      </g>
      {detach > 0 ? (
        <g opacity={k(c.sec, cues[4] + 0.2, 0.3)}>
          <circle cx={carX - 210 * 0.62 + rear[0] * 0.62} cy={600 - 6 * 0.62} r={78 + Math.sin(c.f / 5) * 6} fill="none" stroke={C.red} strokeWidth={8} />
        </g>
      ) : null}
      {warn > 0 ? (
        <g transform={`translate(${carX} ${380 - (1 - warn) * 20}) scale(${0.8 + 0.2 * warn})`} opacity={warn}>
          <rect x={-150} y={-60} width={300} height={100} rx={24} fill={C.card} />
          <path d="M-110 20 L-80 -36 L-50 20 Z" fill={C.amber} />
          <rect x={-82} y={-18} width={4} height={18} fill={C.ink} />
          <circle cx={-80} cy={8} r={3} fill={C.ink} />
          <Txt x={-30} y={4} text="(!)" size={40} weight={800} color={C.amber} />
          <rect x={30} y={-14} width={90} height={14} rx={7} fill="#E6DED0" />
          <rect x={30} y={10} width={60} height={14} rx={7} fill="#E6DED0" />
        </g>
      ) : null}
      {/* The timeline. */}
      <rect x={xs[0]} y={lineY - 4} width={xs[4] - xs[0]} height={8} rx={4} fill="#DCD4C6" />
      <rect x={xs[0]} y={lineY - 4} width={Math.max(0, Math.min(xs[4] - xs[0], carX - xs[0]))} height={8} rx={4} fill={C.red} />
      {xs.map((x, i) => {
        const on = k(c.sec, cues[i] - 0.1, 0.3);
        const pulse = on > 0 && c.sec - cues[i] < 0.6 ? Math.sin(((c.sec - cues[i]) / 0.6) * Math.PI) * 10 : 0;
        return (
          <g key={i}>
            <circle cx={x} cy={lineY} r={40 + pulse} fill={on > 0.5 ? (i === 4 ? C.red : C.ink) : C.card} stroke={on > 0.5 ? "none" : "#CFC6B6"} strokeWidth={5} />
            <g transform={`translate(${x} ${lineY})`} stroke={on > 0.5 ? "#FFFFFF" : "#B9AF9E"} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
              {i === 0 ? <path d="M0 -20 L6 -6 L20 -8 L10 4 L16 18 L0 10 L-16 18 L-10 4 L-20 -8 L-6 -6 Z" /> : null}
              {i === 1 ? (
                <>
                  <circle r={18} />
                  <path d="M-18 0 L18 0 M0 0 L0 18" />
                </>
              ) : null}
              {i === 2 ? <path d="M-20 10 L20 10 M-14 10 L-10 -6 L10 -6 L14 10 M8 -16 L20 -16 L16 -20 M20 -16 L16 -12" /> : null}
              {i === 3 ? (
                <>
                  <path d="M0 -18 L18 14 L-18 14 Z" />
                  <path d="M0 -6 L0 4" />
                </>
              ) : null}
              {i === 4 ? (
                <>
                  <circle r={18} />
                  <circle r={6} />
                </>
              ) : null}
            </g>
            {wrap(labels[i] ?? "", 14).map((ln, j) => (
              <Txt key={j} x={x} y={lineY + 92 + j * 38} text={ln} size={32} weight={on > 0.5 ? 800 : 600} color={on > 0.5 ? C.ink : "#A99F8E"} anchor="middle" />
            ))}
          </g>
        );
      })}
      {active === 0 ? null : null}
    </g>
  );
};

// 6. Official statement: a wide quote card (70% of the width) styled like a
// press release, the quote types in with the VO, a loading bar for the status.
const statement = (c: Ctx, t: S) => {
  const cw = Math.round(W169 * 0.7);
  const cx = (W169 - cw) / 2;
  const card = k(c.sec, 0.05, 0.5);
  const reveal = c01((c.sec - c.w("berdasarkan", 0, 1.1) + 0.1) / Math.max(1, c.w("trotoar", 0, 6.1) - c.w("berdasarkan", 0, 1.1) + 0.6));
  const quote = t.quote ?? "";
  const lines = wrap(quote, 44);
  const total = quote.length;
  let used = 0;
  const statusO = k(c.sec, c.w("tim", 0, 6.8) - 0.1, 0.4);
  const barX = cx + 160;
  const barW = cw - 320;
  const sweep = (c.sec * 0.45) % 1;
  return (
    <g>
      <g transform={`translate(0 ${(1 - card) * 40})`} opacity={card}>
        <rect x={cx} y={186} width={cw} height={560} rx={36} fill="#0D2836" opacity={0.08} />
        <rect x={cx} y={180} width={cw} height={560} rx={36} fill={C.card} />
        <rect x={cx} y={180} width={14} height={560} rx={7} fill={C.red} />
        <IconCircle x={cx + 110} y={290} r={52}>
          <circle cx={-6} cy={-6} r={20} />
          <path d="M8 8 L24 24" strokeWidth={7} />
        </IconCircle>
        <Txt x={cx + 190} y={278} text={t.org ?? ""} size={40} weight={800} color={C.red} spacing="0.14em" />
        <Txt x={cx + 190} y={322} text="Pernyataan resmi" size={28} weight={600} color={C.muted} />
        {lines.map((ln, i) => {
          const start = used;
          used += ln.length + 1;
          const shownChars = Math.max(0, Math.min(ln.length, Math.round(reveal * total) - start));
          return <Txt key={i} x={cx + 110} y={430 + i * 66} text={ln.slice(0, shownChars)} size={48} weight={700} color={C.ink} />;
        })}
        <Txt x={cx + 110} y={430 + lines.length * 66 + 20} text={t.by ?? ""} size={28} weight={600} color={C.muted} o={k(c.sec, c.w("trotoar", 0, 6.1), 0.4)} />
      </g>
      <g opacity={statusO} transform={`translate(0 ${(1 - statusO) * 20})`}>
        <Txt x={W169 / 2} y={850} text={t.status ?? ""} size={40} weight={700} color={C.ink} anchor="middle" />
        <rect x={barX} y={884} width={barW} height={18} rx={9} fill="#E2DACB" />
        <defs>
          <clipPath id="kbar">
            <rect x={barX} y={884} width={barW} height={18} rx={9} />
          </clipPath>
        </defs>
        <g clipPath="url(#kbar)">
          <rect x={barX - barW * 0.35 + sweep * barW * 1.35} y={884} width={barW * 0.35} height={18} rx={9} fill={C.amber} />
        </g>
      </g>
    </g>
  );
};

// 7. Lesson: x-ray of the suspension on the left (points light up red), a
// checklist ticks on the right; then a hold and the fade to black.
const lesson = (c: Ctx, t: S) => {
  const tTitle = c.w("pelajarannya", 0, 0) + 0.2;
  const tAman = c.w("aman", 0, 3.8);
  const cues = [c.w("kaki-kaki", 0, 4.0), c.w("as", 0, 4.6), c.w("dudukan", 0, 5.2)];
  const panelW = VIS_R - ML;
  const pts: { p: Pt; label: string }[] = [
    { p: [420, 690], label: t.c1 ?? "" },
    { p: [620, 560], label: t.c2 ?? "" },
    { p: [820, 560], label: t.c3 ?? "" },
  ];
  const items = [t.c1, t.c2, t.c3];
  return (
    <g>
      <rect x={ML} y={110} width={panelW} height={860} rx={32} fill={C.navy} />
      <defs>
        <pattern id="kgrid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0 L0 0 0 48" fill="none" stroke={C.grid} strokeWidth={2} />
        </pattern>
        <clipPath id="kpanel">
          <rect x={ML} y={110} width={panelW} height={860} rx={32} />
        </clipPath>
      </defs>
      <g clipPath="url(#kpanel)">
        <rect x={ML} y={110} width={panelW} height={860} fill="url(#kgrid)" opacity={0.6} />
        {/* Suspension blueprint: body mount, strut, lower arm, axle shaft, hub, wheel. */}
        <g stroke={C.line} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={k(c.sec, 0, 0.6)}>
          <rect x={200} y={280} width={260} height={80} rx={16} />
          <path d="M330 360 L520 300 L540 330 L350 400 Z" />
          <path d="M520 300 L700 420" strokeWidth={14} />
          <path d="M260 700 L700 620" strokeWidth={14} />
          <circle cx={260} cy={700} r={20} />
          <path d="M360 560 L760 560" strokeWidth={16} />
          <circle cx={820} cy={560} r={70} />
          <circle cx={820} cy={560} r={26} />
          <circle cx={880} cy={560} r={230} strokeWidth={6} />
          <circle cx={880} cy={560} r={170} strokeWidth={4} opacity={0.6} />
          <path d="M700 420 L760 500 L760 620 L700 640" />
        </g>
        {pts.map((pt, i) => {
          const on = k(c.sec, cues[i] - 0.1, 0.3);
          const ring = on > 0 ? ((c.sec - cues[i]) * 0.9) % 1 : 0;
          return on > 0 ? (
            <g key={i}>
              <circle cx={pt.p[0]} cy={pt.p[1]} r={20 + ring * 40} fill="none" stroke={C.red} strokeWidth={4} opacity={(1 - ring) * on} />
              <circle cx={pt.p[0]} cy={pt.p[1]} r={16} fill={C.red} opacity={on} filter="url(#lglow)" />
              <g opacity={on} transform={`translate(${pt.p[0]} ${pt.p[1] + (i === 0 ? 70 : -60)})`}>
                <rect x={-pt.label.length * 9 - 22} y={-26} width={pt.label.length * 18 + 44} height={46} rx={23} fill={C.red} />
                <Txt x={0} y={7} text={pt.label} size={28} weight={700} color="#FFFFFF" anchor="middle" />
              </g>
            </g>
          ) : null;
        })}
      </g>
      {/* Text column. */}
      <Txt x={TXT_L} y={250} text={t.kicker ?? ""} size={36} weight={800} color={C.red} spacing="0.2em" o={k(c.sec, tTitle - 0.1, 0.4)} />
      {wrap(t.title ?? "", 13).map((ln, i) => (
        <g key={i} opacity={k(c.sec, tTitle + i * 0.15, 0.45)} transform={`translate(0 ${(1 - k(c.sec, tTitle + i * 0.15, 0.5)) * 30})`}>
          <text x={TXT_L} y={350 + i * 96} fontFamily={HEAD} fontSize={92} fill={C.ink}>
            {ln.split(" ").map((w, j, arr) => (
              <tspan key={j} fill={w === "≠" && c.sec > tAman - 0.1 ? C.red : C.ink}>
                {w}
                {j < arr.length - 1 ? " " : ""}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      <Txt x={TXT_L} y={600} text={t.checkLabel ?? ""} size={34} weight={600} color={C.muted} o={k(c.sec, cues[0] - 0.4, 0.4)} />
      {items.map((it, i) => {
        const on = k(c.sec, cues[i] - 0.1, 0.3);
        const appear = k(c.sec, cues[0] - 0.4 + i * 0.08, 0.4);
        const y = 680 + i * 92;
        return (
          <g key={i} opacity={appear}>
            <rect x={TXT_L} y={y - 44} width={58} height={58} rx={14} fill={on > 0.5 ? C.red : C.card} stroke={on > 0.5 ? C.red : "#CFC6B6"} strokeWidth={4} />
            {on > 0 ? <path d={`M${TXT_L + 14} ${y - 15} L${TXT_L + 26} ${y - 2} L${TXT_L + 46} ${y - 30}`} stroke="#FFFFFF" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset={60 * (1 - on)} /> : null}
            <Txt x={TXT_L + 88} y={y} text={it ?? ""} size={46} weight={on > 0.5 ? 800 : 600} color={C.ink} />
          </g>
        );
      })}
    </g>
  );
};

// ================================================================ EP10
// Kejadian #2 (Jaecoo J5 EV, Tanah Abang). No voice over: every beat sits on
// a named cue of the scene (episode `cues`), paced for reading.

const STEEL = "#8E9BA5";
const STEEL_HI = "#B8C4CC";
const STEEL_LO = "#5F6B74";

// Generic SUV silhouette (no brand), side view facing right: the visible side
// is the car's right side. Ground at y=0, wheels r=78 at x=+-255.
// tilt: body rotation about the rear hub (+ = nose down). frontOff hides the
// front wheel (drawn separately as a detached Corner).
const SUV_HUB = 255;
const SUV_R = 78;
const SUV: React.FC<{ x: number; y: number; s?: number; spin?: number; tilt?: number; crumple?: number; frontOff?: boolean; o?: number }> = ({
  x,
  y,
  s = 1,
  spin = 0,
  tilt = 0,
  crumple = 0,
  frontOff = false,
  o = 1,
}) => {
  const n = 396 - crumple * 44;
  const arch = (wx: number) => `M${wx - 96} -84 A96 96 0 0 1 ${wx + 96} -84 Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <g transform={`rotate(${tilt} ${-SUV_HUB} ${-SUV_R})`}>
        <path
          d={`M-390 -110 Q-392 -190 -360 -230 L-300 -240 L-232 -340 Q-214 -362 -180 -364 L150 -364 Q192 -364 218 -338 L290 -250 L${n - 36} -232 Q${n - 4} -222 ${n - 2} -180 L${n} -110 Q${n} -84 ${n - 24} -84 L-368 -84 Q-390 -84 -390 -110 Z`}
          fill={C.car}
        />
        <rect x={-170} y={-374} width={300} height={8} rx={4} fill={C.carHi} />
        <rect x={-160} y={-370} width={14} height={8} fill={C.carHi} />
        <rect x={106} y={-370} width={14} height={8} fill={C.carHi} />
        <path d="M-214 -250 L-160 -332 L-30 -332 L-30 -250 Z M-8 -250 L-8 -332 L138 -332 Q166 -332 186 -308 L236 -250 Z" fill={C.glass} opacity={0.85} />
        <path d={`M-360 -228 L${n - 40} -226`} stroke={C.carHi} strokeWidth={5} opacity={0.7} />
        <path d="M-30 -246 L-30 -96 M150 -246 L156 -96" stroke="#1E2B36" strokeWidth={4} />
        <rect x={-6} y={-210} width={34} height={8} rx={4} fill={C.carHi} />
        <rect x={170} y={-210} width={34} height={8} rx={4} fill={C.carHi} />
        <path d={`M-392 -112 L${n} -112 L${n} -100 Q${n} -84 ${n - 24} -84 L-368 -84 Q-392 -84 -392 -100 Z`} fill="#1E2933" />
        <path d={arch(-SUV_HUB)} fill="#151E27" />
        <path d={arch(SUV_HUB)} fill="#151E27" />
        <rect x={n - 40} y={-214} width={36} height={12} rx={6} fill="#F6E7B0" />
        <rect x={-388} y={-224} width={14} height={40} rx={6} fill={C.red} />
        {!frontOff ? <Wheel x={SUV_HUB} y={-SUV_R} r={SUV_R} rot={spin} /> : null}
      </g>
      <Wheel x={-SUV_HUB} y={-SUV_R} r={SUV_R} rot={spin} />
    </g>
  );
};

// World position of the SUV's front hub (for a detached corner to start from).
const suvFrontHub = (x: number, y: number, s: number, tilt: number): Pt => {
  const a = (tilt * Math.PI) / 180;
  const px = 2 * SUV_HUB;
  return [x + s * (-SUV_HUB + px * Math.cos(a)), y + s * (-SUV_R + px * Math.sin(a))];
};

// Wheel with its suspension (strut + coil spring + lower arm), origin = hub.
const Corner: React.FC<{ x: number; y: number; r: number; rot?: number; spin?: number; o?: number }> = ({ x, y, r, rot = 0, spin = 0, o = 1 }) => {
  const coil = Array.from({ length: 7 }, (_, i) => `${i % 2 ? r * 0.3 : -r * 0.3} ${-r * 1.85 + i * r * 0.15}`).join(" L");
  return o <= 0 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
      <rect x={-r * 0.1} y={-r * 2.15} width={r * 0.2} height={r * 1.7} rx={r * 0.06} fill={STEEL_LO} />
      <rect x={-r * 0.16} y={-r * 1.0} width={r * 0.32} height={r * 0.6} rx={r * 0.06} fill={STEEL} />
      <path d={`M${coil}`} stroke={STEEL_HI} strokeWidth={r * 0.08} fill="none" strokeLinejoin="round" />
      <path d={`M${-r * 0.24} ${-r * 2.15} L${r * 0.24} ${-r * 2.15} L${r * 0.14} ${-r * 2.32} L${r * 0.02} ${-r * 2.2} L${-r * 0.12} ${-r * 2.34} Z`} fill={STEEL} />
      <path d={`M0 ${r * 0.22} L${-r * 1.9} ${r * 0.02}`} stroke={STEEL} strokeWidth={r * 0.2} strokeLinecap="round" />
      <circle cx={-r * 1.9} cy={r * 0.02} r={r * 0.17} fill={STEEL_LO} />
      <circle cx={-r * 1.9} cy={r * 0.02} r={r * 0.07} fill="#2C343B" />
      <Wheel x={0} y={0} r={r} rot={spin} />
    </g>
  );
};

// Plain line icon (no tinted circle), stroke in the given colour.
const LineIcon: React.FC<{ x: number; y: number; color?: string; children?: React.ReactNode }> = ({ x, y, color = C.ink, children }) => (
  <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </g>
);

const Pill: React.FC<{ x: number; y: number; text: string; o?: number; size?: number; fill?: string; color?: string }> = ({ x, y, text, o = 1, size = 28, fill = C.red, color = "#FFFFFF" }) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.6 + 44;
  return (
    <g opacity={o} transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.7} rx={size * 0.85} fill={fill} />
      <Txt x={0} y={size * 0.28} text={text} size={size} weight={700} color={color} anchor="middle" />
    </g>
  );
};

// Sparks/fragments flying from a point (seeded, with gravity).
const Debris: React.FC<{ x: number; y: number; age: number; life?: number; n?: number; seed: string; spread?: number; dir?: number; color?: string }> = ({
  x,
  y,
  age,
  life = 0.8,
  n = 14,
  seed,
  spread = 160,
  dir = -90,
  color = C.amber,
}) =>
  age <= 0 || age >= life ? null : (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = ((dir + (random(`${seed}a${i}`) - 0.5) * spread) * Math.PI) / 180;
        const v = 320 + random(`${seed}v${i}`) * 420;
        const px = x + Math.cos(a) * v * age;
        const py = y + Math.sin(a) * v * age + 900 * age * age;
        const sz = 4 + random(`${seed}s${i}`) * 7;
        return i % 3 === 0 ? (
          <rect key={i} x={px - sz} y={py - sz / 2} width={sz * 2} height={sz} fill={STEEL_HI} opacity={1 - age / life} transform={`rotate(${age * 720 * (random(`${seed}r${i}`) - 0.5)} ${px} ${py})`} />
        ) : (
          <circle key={i} cx={px} cy={py} r={sz * 0.6} fill={color} opacity={1 - age / life} />
        );
      })}
    </g>
  );

// Glitch title (same treatment as the EP09 hook).
const GlitchTitle: React.FC<{ c: Ctx; text: string; y: number; tIn: number }> = ({ c, text, y, tIn }) => {
  const g = c.sec - tIn;
  const glitch = g > 0 && g < 0.55 ? 1 - g / 0.55 : 0;
  const jx = (n: number) => (random(`gx${Math.floor(c.f)}-${n}`) - 0.5) * 34 * glitch;
  const show = k(c.sec, tIn, 0.12);
  return show <= 0 ? null : (
    <g opacity={show}>
      {glitch > 0 ? (
        <>
          <Txt x={W169 / 2 + jx(1) - 8} y={y} text={text} size={96} font={HEAD} weight={400} color="#00D1FF" anchor="middle" o={0.7} />
          <Txt x={W169 / 2 + jx(2) + 8} y={y} text={text} size={96} font={HEAD} weight={400} color={C.red} anchor="middle" o={0.8} />
        </>
      ) : null}
      <Txt x={W169 / 2 + jx(3) * 0.4} y={y} text={text} size={96} font={HEAD} weight={400} color="#FFFFFF" anchor="middle" spacing="0.02em" />
      {glitch > 0
        ? [0, 1, 2].map((i) => <rect key={i} x={0} y={y - 80 + random(`gs${Math.floor(c.f)}-${i}`) * 100} width={W169} height={6 + random(`gh${Math.floor(c.f)}-${i}`) * 10} fill={C.navy} opacity={0.9} />)
        : null}
    </g>
  );
};

// 1. Hook: a desk calendar flips 2 -> 3 -> 4 NOV, shrinks to the corner, then
// with a metal crack the front wheel and its suspension fly out of frame.
const hook2 = (c: Ctx, t: S, still: boolean, q: Q) => {
  const tFlip1 = q("flip1", 0.35);
  const tFlip2 = q("flip2", 0.8);
  const tPark = q("park", 1.25);
  const tCrack = q("crack", 1.5);
  const tTitle = q("title", 2.0);
  const from = parseInt(t.dayFrom ?? "2", 10);
  const to = parseInt(t.dayTo ?? "4", 10);
  const days = Array.from({ length: Math.max(1, to - from + 1) }, (_, i) => String(from + i));
  const flips = [tFlip1, tFlip2];
  // Calendar: centre, then parked small in the upper left.
  const park = kio(c.sec, tPark, 0.45);
  const calX = lerp(W169 / 2, 330, park);
  const calY = lerp(430, 300, park);
  const calS = lerp(1, 0.5, park);
  const CW = 340;
  const CH = 380;
  const page = (d: string, key: string, peel = 0) => (
    <g key={key} transform={`translate(0 ${-CH / 2 + 70}) scale(1 ${1 - peel}) translate(0 ${CH / 2 - 70})`} opacity={1 - peel * 0.6}>
      <rect x={-CW / 2} y={-CH / 2 + 70} width={CW} height={CH - 70} rx={0} fill="#FFFFFF" />
      <rect x={-CW / 2} y={CH / 2 - 26} width={CW} height={26} rx={0} fill="#E9E3D8" />
      <text x={0} y={CH / 2 - 70} textAnchor="middle" fontFamily={HEAD} fontSize={210} fill={d === String(to) ? C.red : C.ink}>
        {d}
      </text>
    </g>
  );
  // Pages under the current one are drawn first; the current page peels up.
  let cur = 0;
  flips.forEach((f) => {
    if (c.sec >= f + 0.35) cur++;
  });
  cur = Math.min(cur, days.length - 1);
  const peelNow = cur < days.length - 1 && cur < flips.length ? c01((c.sec - flips[cur]) / 0.35) : 0;
  // Crack: the corner flies right and out of frame.
  const age = c.sec - tCrack;
  const u = c01(age / 0.95);
  const r = 130;
  const ground = 790;
  const cx0 = 1000;
  const cy0 = ground - r;
  const wx = cx0 + 1250 * u;
  const wy = cy0 - 520 * u + 760 * u * u;
  const flash = age > 0 && age < 0.18 ? 0.8 * (1 - age / 0.18) : 0;
  const shake = age > 0 && age < 0.5 ? Math.sin(c.f * 2.7) * 16 * (1 - age / 0.5) : 0;
  return (
    <g>
      <defs>
        <radialGradient id="k2vig" cx="50%" cy="45%" r="70%">
          <stop offset="60%" stopColor={C.navy} stopOpacity={0} />
          <stop offset="100%" stopColor="#060B11" stopOpacity={0.85} />
        </radialGradient>
      </defs>
      <g transform={`translate(${shake} ${shake * 0.4})`}>
        <rect x={0} y={ground} width={W169} height={6} fill="#2C3E52" />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={i * 260 - 100} y={ground + 60} width={150} height={10} rx={5} fill="#2C3E52" />
        ))}
        {/* Calendar. */}
        <g transform={`translate(${calX} ${calY}) scale(${calS})`} opacity={lerp(1, 0.85, park)}>
          <rect x={-CW / 2} y={-CH / 2 + 8} width={CW} height={CH} rx={22} fill="#000" opacity={0.3} />
          <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx={22} fill="#FFFFFF" />
          <defs>
            <clipPath id="k2cal">
              <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx={22} />
            </clipPath>
          </defs>
          <g clipPath="url(#k2cal)">
            {days
              .map((d, i) => ({ d, i }))
              .filter(({ i }) => i >= cur)
              .reverse()
              .map(({ d, i }) => page(d, `p${i}`, i === cur ? peelNow : 0))}
            <rect x={-CW / 2} y={-CH / 2} width={CW} height={70} fill={C.red} />
          </g>
          <Txt x={0} y={-CH / 2 + 50} text={t.month ?? ""} size={38} weight={800} color="#FFFFFF" anchor="middle" spacing="0.2em" />
          {[-90, 90].map((rx) => (
            <rect key={rx} x={rx - 8} y={-CH / 2 - 18} width={16} height={40} rx={8} fill="#C9D6DF" />
          ))}
        </g>
        {/* The corner: sits on the road, then flies out. */}
        {age > -0.25 && u < 1 ? <Corner x={wx} y={wy} r={r} rot={age > 0 ? u * 260 : 0} spin={age > 0 ? u * 540 : 0} o={k(c.sec, tCrack - 0.25, 0.2)} /> : null}
        <Debris x={cx0 - r * 0.8} y={cy0 - r * 0.6} age={age} life={0.9} n={18} seed="k2h" spread={200} dir={-60} />
        {age > 0 && age < 0.3 ? (
          <g opacity={1 - age / 0.3} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round">
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r0 = 40 + age * 300;
              return <path key={i} d={`M${cx0 - 120 + Math.cos(a) * r0} ${cy0 - 60 + Math.sin(a) * r0} L${cx0 - 120 + Math.cos(a) * (r0 + 70)} ${cy0 - 60 + Math.sin(a) * (r0 + 70)}`} />;
            })}
          </g>
        ) : null}
      </g>
      <rect width={W169} height={H169} fill="url(#k2vig)" />
      <rect width={W169} height={H169} fill="#FFFFFF" opacity={flash} />
      {!still ? <GlitchTitle c={c} text={t.title ?? ""} y={975} tIn={tTitle} /> : null}
    </g>
  );
};

// 3. When and where: line map (60%) zooming into a pulsing pin, cards with
// date, time (clock rolling to the given time) and place on the right.
const where2 = (c: Ctx, t: S, _still: boolean, q: Q) => {
  const tDate = q("date", 0.3);
  const tTime = q("time", 1.9);
  const tPlace = q("place", 3.9);
  const zoom = kio(c.sec, 0.2, 3.4);
  const pin: Pt = [620, 540];
  const z = lerp(1, 2.2, zoom);
  const pinDrop = k(c.sec, 0.9, 0.5);
  const [hh, mm] = (t.time ?? "08:20").split(":").map((x) => parseInt(x, 10));
  const STEP = 20;
  const steps = Math.round((hh * 60 + mm) / STEP);
  const roll = kio(c.sec, tTime + 0.1, 1.5) * steps;
  const step = Math.floor(roll);
  const frac = soft(roll - step);
  const fmt = (n: number) => {
    const m = n * STEP;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  };
  const cardW = MR - TXT_L;
  const cards = [
    { at: tDate, y: 170 },
    { at: tTime, y: 420 },
    { at: tPlace, y: 670 },
  ];
  const ci = cards.map((cd) => ({ o: k(c.sec, cd.at, 0.4), dy: (1 - k(c.sec, cd.at, 0.5)) * 40 }));
  const P0: Pt = [140, 960];
  const road = `M${P0[0]} ${P0[1]} C 380 800, 500 640, ${pin[0]} ${pin[1]} S 900 300, 1140 170`;
  return (
    <g>
      <rect x={ML} y={110} width={VIS_R - ML} height={860} rx={32} fill={C.card} />
      <defs>
        <clipPath id="k2map">
          <rect x={ML} y={110} width={VIS_R - ML} height={860} rx={32} />
        </clipPath>
      </defs>
      <g clipPath="url(#k2map)">
        <g transform={`translate(${pin[0]} ${pin[1]}) scale(${z}) translate(${-pin[0]} ${-pin[1]})`}>
          {Array.from({ length: 10 }, (_, i) => (
            <path key={`v${i}`} d={`M${60 + i * 118} 90 L${40 + i * 124} 1000`} stroke={C.road} strokeWidth={6} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <path key={`h${i}`} d={`M60 ${150 + i * 118} L1160 ${120 + i * 124}`} stroke={C.road} strokeWidth={6} />
          ))}
          <path d="M60 760 C 300 700, 420 820, 700 760 S 1000 640, 1180 700" stroke="#BFD9E6" strokeWidth={40} fill="none" opacity={0.7} />
          <path d={road} stroke={C.ink} strokeWidth={18} fill="none" strokeLinecap="round" />
          <g transform={`translate(${pin[0]} ${pin[1] - (1 - pinDrop) * 120})`} opacity={pinDrop}>
            {[0, 1].map((i) => {
              const life = (c.sec * 0.8 + i * 0.5) % 1;
              return <circle key={i} r={(14 + life * 60) / z} fill="none" stroke={C.red} strokeWidth={4 / z} opacity={(1 - life) * pinDrop} />;
            })}
            <g transform={`scale(${1 / z})`}>
              <path d="M0 0 C -26 -34, -34 -52, -34 -66 A34 34 0 1 1 34 -66 C 34 -52, 26 -34, 0 0 Z" fill={C.red} />
              <circle cx={0} cy={-66} r={13} fill="#FFFFFF" />
            </g>
          </g>
        </g>
        {/* Screen-space labels (constant size, never scaled by the zoom). */}
        <Txt x={ML + 40} y={170} text={t.area ?? ""} size={28} weight={800} color={C.muted} spacing="0.2em" o={k(c.sec, 0.4, 0.4)} />
        <Pill x={pin[0] - 200} y={pin[1] - 60} text={t.pinLabel ?? ""} o={k(c.sec, tPlace + 0.2, 0.4)} size={28} fill={C.ink} />
        <g opacity={k(c.sec, 1.2, 0.4)}>
          <rect x={ML + 32} y={890} width={(t.road1 ?? "").length * 17 + 110} height={52} rx={26} fill="#FFFFFF" stroke="#E2DACB" strokeWidth={2} />
          <rect x={ML + 54} y={912} width={40} height={10} rx={5} fill={C.ink} />
          <Txt x={ML + 108} y={926} text={t.road1 ?? ""} size={28} weight={700} color={C.ink} />
        </g>
      </g>
      <Card x={TXT_L} y={cards[0].y} w={cardW} h={200} o={ci[0].o} dy={ci[0].dy}>
        <LineIcon x={78} y={100} color={C.muted}>
          <rect x={-22} y={-18} width={44} height={40} rx={6} />
          <path d="M-22 -6 L22 -6 M-10 -26 L-10 -14 M10 -26 L10 -14" />
        </LineIcon>
        <Txt x={140} y={86} text={t.dateLabel ?? ""} size={28} weight={600} color={C.muted} />
        <Txt x={140} y={142} text={t.date ?? ""} size={46} weight={800} />
      </Card>
      <Card x={TXT_L} y={cards[1].y} w={cardW} h={200} o={ci[1].o} dy={ci[1].dy}>
        <LineIcon x={78} y={100} color={C.muted}>
          <circle r={24} />
          <path d={`M0 0 L0 -14 M0 0 L${Math.sin(roll * 0.3) * 12} ${-Math.cos(roll * 0.3) * 12 + 2}`} />
        </LineIcon>
        <Txt x={140} y={86} text={t.timeLabel ?? ""} size={28} weight={600} color={C.muted} />
        <defs>
          <clipPath id="k2clock">
            <rect x={140} y={100} width={210} height={62} />
          </clipPath>
        </defs>
        <g clipPath="url(#k2clock)">
          <Txt x={140} y={154 - frac * 60} text={fmt(step)} size={56} weight={800} />
          {step < steps ? <Txt x={140} y={214 - frac * 60} text={fmt(step + 1)} size={56} weight={800} /> : null}
        </g>
        <Txt x={340} y={154} text="WIB" size={30} weight={700} color={C.muted} o={k(c.sec, tTime + 1.6, 0.3)} />
      </Card>
      <Card x={TXT_L} y={cards[2].y} w={cardW} h={230} o={ci[2].o} dy={ci[2].dy}>
        <LineIcon x={78} y={112} color={C.muted}>
          <path d="M0 22 C -14 4, -20 -6, -20 -14 A20 20 0 1 1 20 -14 C 20 -6, 14 4, 0 22 Z" />
          <circle cx={0} cy={-14} r={6} />
        </LineIcon>
        <Txt x={140} y={90} text={t.placeLabel ?? ""} size={28} weight={600} color={C.muted} />
        <Txt x={140} y={146} text={t.place ?? ""} size={42} weight={800} />
        <Txt x={140} y={196} text={t.placeSub ?? ""} size={32} weight={600} color={C.ink} />
      </Card>
    </g>
  );
};

// 4. The difference: two panels. Left (incident #1, dimmed): the hatchback
// still drives 1-2 km before the rear wheel comes off. Right (incident #2,
// bright): the SUV's front right wheel and suspension come off on the spot.
const diff2 = (c: Ctx, t: S, _still: boolean, q: Q) => {
  const tRight = q("right", 1.7);
  const tStop = q("stop", 2.5);
  const tRing = q("ring", 3.0);
  const tText2 = q("text2", 3.3);
  const PW = 840;
  const PY = 150;
  const PH = 760;
  const LX = ML;
  const RX = MR - PW;
  // Left panel: in at 0.1, dims as the right one arrives.
  const lIn = k(c.sec, 0.1, 0.4);
  const dim = lerp(1, 0.42, k(c.sec, tRight, 0.5));
  const drive = kio(c.sec, 0.2, 1.1);
  const hx = LX + lerp(170, 250, drive);
  const arrow = k(c.sec, 0.5, 0.7);
  const lost = k(c.sec, 1.1, 0.3);
  // Right panel.
  const rIn = k(c.sec, tRight, 0.4);
  const arrive = kio(c.sec, tRight + 0.1, tStop - tRight - 0.1);
  const sx = RX + lerp(-120, 400, arrive);
  const off = k(c.sec, tStop, 0.45);
  const s = 0.62;
  const tilt = 6 * off;
  const GR = PY + 480;
  const hub = suvFrontHub(sx, GR, s, tilt);
  const ring = k(c.sec, tRing, 0.35);
  const shake = c.sec > tStop && c.sec < tStop + 0.4 ? Math.sin(c.f * 2.6) * 8 * (1 - (c.sec - tStop) / 0.4) : 0;
  return (
    <g>
      <Txt x={W169 / 2} y={110} text={t.kicker ?? ""} size={32} weight={800} color={C.red} anchor="middle" spacing="0.22em" o={k(c.sec, 0.05, 0.4)} />
      <defs>
        <clipPath id="k2pl">
          <rect x={LX} y={PY} width={PW} height={PH} rx={28} />
        </clipPath>
        <clipPath id="k2pr">
          <rect x={RX} y={PY} width={PW} height={PH} rx={28} />
        </clipPath>
      </defs>
      {/* Left: incident #1. */}
      <g opacity={lIn * dim}>
        <rect x={LX} y={PY} width={PW} height={PH} rx={28} fill="#E9E3D8" />
        <Txt x={LX + 48} y={PY + 72} text={t.label1 ?? ""} size={30} weight={800} color={C.muted} spacing="0.14em" />
        <Txt x={LX + 48} y={PY + 118} text={t.car1 ?? ""} size={30} weight={600} color={C.muted} />
        <g clipPath="url(#k2pl)">
          <rect x={LX} y={PY + 470} width={PW} height={6} fill={C.road} />
          <Hatch x={hx} y={PY + 470 - 27} s={0.42} spin={drive * 500} rear={[0, 0]} />
          <g opacity={arrow}>
            <path d={`M${LX + 400} ${PY + 300} L${LX + 400 + 300 * arrow} ${PY + 300}`} stroke={C.ink} strokeWidth={6} strokeDasharray="18 14" strokeLinecap="round" />
            <path d={`M${LX + 700} ${PY + 286} L${LX + 722} ${PY + 300} L${LX + 700} ${PY + 314}`} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={c01(arrow * 4 - 3)} />
            <Txt x={LX + 550} y={PY + 270} text={t.km1 ?? ""} size={40} weight={800} color={C.ink} anchor="middle" />
          </g>
          <g opacity={lost}>
            <Wheel x={LX + 720} y={PY + 446} r={30} rot={40} />
            <circle cx={LX + 720} cy={PY + 446} r={44} fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="8 8" />
          </g>
        </g>
        {wrap(t.text1 ?? "", 30).map((ln, i) => (
          <Txt key={i} x={LX + 48} y={PY + 640 + i * 52} text={ln} size={40} weight={700} color={C.ink} />
        ))}
      </g>
      {/* Right: incident #2. */}
      <g opacity={rIn} transform={`translate(${shake} 0)`}>
        <rect x={RX} y={PY + 8} width={PW} height={PH} rx={28} fill="#0D2836" opacity={0.08} />
        <rect x={RX} y={PY} width={PW} height={PH} rx={28} fill={C.card} />
        <Txt x={RX + 48} y={PY + 72} text={t.label2 ?? ""} size={30} weight={800} color={C.red} spacing="0.14em" />
        <Txt x={RX + 48} y={PY + 118} text={t.car2 ?? ""} size={30} weight={600} color={C.ink} />
        <g clipPath="url(#k2pr)">
          <rect x={RX} y={GR} width={PW} height={6} fill={C.road} />
          <SUV x={sx} y={GR} s={s} spin={arrive * 400} tilt={tilt} frontOff={off > 0} />
          {off > 0 ? <Corner x={hub[0] + 70 * off} y={hub[1] + 14 * off} r={SUV_R * s} rot={28 * off} spin={arrive * 400} /> : null}
          {ring > 0 ? <circle cx={hub[0] + 40} cy={hub[1] - 24} r={(100 + Math.sin(c.sec * 6) * 4) * (0.8 + 0.2 * ring)} fill="none" stroke={C.red} strokeWidth={8} opacity={ring} /> : null}
        </g>
        {wrap(t.text2 ?? "", 30).map((ln, i) => (
          <Txt key={i} x={RX + 48} y={PY + 640 + i * 52} text={ln} size={40} weight={800} color={C.ink} o={k(c.sec, tText2, 0.4)} />
        ))}
      </g>
    </g>
  );
};

// Top view of the SUV (facing right; its right side is the lower edge).
// zones: bumper, front right fender, front right door, each 0..1 lit.
const TopCar: React.FC<{ x: number; y: number; zones: number[]; pulse: number; o?: number }> = ({ x, y, zones, pulse, o = 1 }) => {
  const zoneShapes = [
    <path key="b" d="M352 -138 Q384 -120 388 -80 L388 80 Q384 120 352 138 Z" />,
    <path key="f" d="M190 124 L330 124 Q368 128 378 150 Q350 162 300 163 L190 163 Z" />,
    <rect key="d" x={-20} y={124} width={196} height={39} rx={6} />,
  ];
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      {[-255, 255].map((wx) => (
        <rect key={`t${wx}`} x={wx - 62} y={-182} width={124} height={34} rx={12} fill="#1A1F24" />
      ))}
      <rect x={-317} y={148} width={124} height={34} rx={12} fill="#1A1F24" />
      <rect x={193} y={148} width={124} height={34} rx={12} fill="none" stroke={C.red} strokeWidth={4} strokeDasharray="10 8" />
      <path d="M-380 -135 Q-388 -165 -350 -165 L300 -165 Q382 -160 390 -95 L390 95 Q382 160 300 165 L-350 165 Q-388 165 -380 135 Z" fill={C.car} />
      <rect x={-235} y={-128} width={370} height={256} rx={36} fill={C.carHi} />
      <path d="M140 -126 Q196 -138 228 -112 L228 112 Q196 138 140 126 Z" fill={C.glass} />
      <path d="M-304 -116 L-242 -124 L-242 124 L-304 116 Z" fill={C.glass} opacity={0.8} />
      <path d="M250 -120 Q330 -100 350 -60 M250 120 Q330 100 350 60" stroke="#1E2B36" strokeWidth={4} fill="none" />
      <ellipse cx={150} cy={-180} rx={22} ry={12} fill={C.car} />
      <ellipse cx={150} cy={180} rx={22} ry={12} fill={C.car} />
      {zoneShapes.map((sh, i) =>
        zones[i] > 0 ? (
          <g key={i} fill={C.red} opacity={zones[i] * (0.75 + 0.25 * pulse)}>
            {sh}
          </g>
        ) : null,
      )}
    </g>
  );
};

// 5. Inspection result: a timeline at the bottom lights up step by step while
// the SUV (side view) hits the curb, then the fence, then loses the front
// right wheel with its suspension; then a top view shows the other damage.
const exam2 = (c: Ctx, t: S, _still: boolean, q: Q) => {
  const tCurb = q("curb", 1.0);
  const tFence = q("fence", 2.6);
  const tOff = q("off", 4.2);
  const tTop = q("top", 6.1);
  const zt = [q("z1", 7.0), q("z2", 7.8), q("z3", 8.6)];
  const G = 640;
  const CURB_X = 1180;
  const CURB_H = 24;
  const FENCE_X = 1420;
  const s = 0.6;
  const r = SUV_R * s;
  // Car centre x: fast run to the curb, slow-motion creep to the fence.
  const atCurb = CURB_X - SUV_HUB * s - r * 0.6;
  const atFence = FENCE_X - 396 * s - 6;
  let cx: number;
  if (c.sec < tCurb) cx = lerp(-260, atCurb, c01((c.sec - 0.1) / (tCurb - 0.1)) ** 1.6);
  else cx = lerp(atCurb, atFence, Math.sin((c01((c.sec - tCurb) / (tFence - tCurb)) * Math.PI) / 2));
  const recoil = c.sec > tFence ? Math.sin(c01((c.sec - tFence) / 0.45) * Math.PI) * -14 : 0;
  cx += recoil;
  const climb = k(c.sec, tCurb, 0.25);
  const sag = k(c.sec, tOff, 0.5);
  const tilt = lerp(-Math.atan(CURB_H / (2 * SUV_HUB * s)) * (180 / Math.PI) * climb, 5, sag);
  const crumple = k(c.sec, tFence, 0.12);
  const off = k(c.sec, tOff, 0.55);
  const hub = suvFrontHub(cx, G, s, c.sec >= tOff ? lerp(tilt, -2.6, 1 - sag) : tilt);
  const fenceAge = c.sec - tFence;
  const curbAge = c.sec - tCurb;
  const flash = fenceAge > 0 && fenceAge < 0.16 ? 0.6 * (1 - fenceAge / 0.16) : 0;
  const shakeA = (age: number, amp: number) => (age > 0 && age < 0.5 ? Math.sin(c.f * 2.6) * amp * (1 - age / 0.5) : 0);
  const shake = shakeA(fenceAge, 14) + shakeA(curbAge, 6) + shakeA(c.sec - tOff, 6);
  const side = 1 - k(c.sec, tTop, 0.45);
  const top = k(c.sec, tTop + 0.2, 0.5);
  const ring = k(c.sec, tOff + 0.4, 0.35);
  const pulse = 0.5 + 0.5 * Math.sin(c.sec * 5);
  // Timeline.
  const steps = [tCurb, tFence, tOff];
  const xs = [300, 960, 1620];
  const lineY = 800;
  const labels = [t.s1, t.s2, t.s3];
  const fill = c.sec < tCurb ? 0 : c.sec < tFence ? 0 : c.sec < tOff ? lerp(0, 0.5, k(c.sec, tFence - 0.3, 0.3)) : lerp(0.5, 1, k(c.sec, tOff - 0.3, 0.3));
  const items = [t.d1, t.d2, t.d3];
  return (
    <g>
      <Txt x={ML} y={112} text={t.kicker ?? ""} size={30} weight={800} color={C.red} spacing="0.16em" o={k(c.sec, 0.1, 0.4)} />
      {side > 0 ? (
        <g opacity={side} transform={`translate(${shake} ${shake * 0.3})`}>
          <rect x={ML} y={G} width={MR - ML} height={6} rx={3} fill={C.road} />
          <rect x={CURB_X} y={G - CURB_H} width={MR - CURB_X} height={CURB_H + 3} fill="#CFC6B6" />
          <rect x={CURB_X} y={G - CURB_H} width={MR - CURB_X} height={6} fill="#E6DED0" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={`p${i}`} x={FENCE_X + i * 76} y={G - CURB_H - 160} width={12} height={160} rx={3} fill="#B9B3A8" />
          ))}
          {[0, 1].map((i) => (
            <rect key={`r${i}`} x={FENCE_X - 6} y={G - CURB_H - 140 + i * 60} width={MR - FENCE_X} height={12} rx={4} fill="#B9B3A8" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={`a${i}`} x={FENCE_X + 30 + i * 76} y={G - CURB_H - 136} width={16} height={4} fill={C.amber} />
          ))}
          <SUV x={cx} y={G} s={s} spin={cx * 0.9} tilt={tilt} crumple={crumple} frontOff={off > 0} />
          {off > 0 ? <Corner x={hub[0] - 40 * off} y={hub[1] + 18 * off} r={r} rot={-24 * off} spin={cx * 0.9} /> : null}
          <Debris x={FENCE_X - 6} y={G - 120} age={fenceAge} life={0.7} n={12} seed="k2f" dir={-120} />
          <Debris x={CURB_X} y={G - CURB_H} age={curbAge} life={0.5} n={8} seed="k2c" dir={-140} spread={90} />
          {ring > 0 ? <circle cx={hub[0] - 40} cy={hub[1] - 10} r={(96 + Math.sin(c.sec * 6) * 5) * (0.8 + 0.2 * ring)} fill="none" stroke={C.red} strokeWidth={7} opacity={ring} /> : null}
        </g>
      ) : null}
      {top > 0 ? (
        <g opacity={top}>
          <TopCar x={600} y={450} zones={zt.map((z) => k(c.sec, z - 0.05, 0.3))} pulse={pulse} />
          <Txt x={600 + 300} y={450 - 214} text={t.front ?? ""} size={28} weight={700} color={C.muted} anchor="middle" spacing="0.12em" />
          <path d={`M${600 + 380} ${450 - 224} L${600 + 410} ${450 - 224} L${600 + 400} ${450 - 232} M${600 + 410} ${450 - 224} L${600 + 400} ${450 - 216}`} stroke={C.muted} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Txt x={600 - 330} y={450 + 240} text={t.rightSide ?? ""} size={28} weight={700} color={C.muted} spacing="0.12em" />
          {[
            [600 + 446, 450],
            [600 + 286, 450 + 232],
            [600 + 75, 450 + 232],
          ].map(([mx, my], i) => {
            const on = k(c.sec, zt[i] - 0.05, 0.3);
            return on > 0 ? (
              <g key={i} opacity={on}>
                <circle cx={mx} cy={my} r={24} fill={C.red} />
                <Txt x={mx} y={my + 10} text={String(i + 1)} size={28} weight={800} color="#FFFFFF" anchor="middle" />
              </g>
            ) : null;
          })}
          <Txt x={TXT_L} y={290} text={t.damageLabel ?? ""} size={34} weight={600} color={C.muted} />
          {items.map((it, i) => {
            const on = k(c.sec, zt[i] - 0.05, 0.3);
            const y = 390 + i * 96;
            return (
              <g key={i} opacity={lerp(0.3, 1, on)}>
                <circle cx={TXT_L + 24} cy={y - 15} r={24} fill={on > 0.5 ? C.red : "#E2DACB"} />
                <Txt x={TXT_L + 24} y={y - 5} text={String(i + 1)} size={28} weight={800} color="#FFFFFF" anchor="middle" />
                <Txt x={TXT_L + 72} y={y} text={it ?? ""} size={44} weight={on > 0.5 ? 800 : 600} color={C.ink} />
              </g>
            );
          })}
        </g>
      ) : null}
      <rect width={W169} height={H169} fill="#FFFFFF" opacity={flash} />
      {/* Timeline. */}
      <rect x={xs[0]} y={lineY - 4} width={xs[2] - xs[0]} height={8} rx={4} fill="#DCD4C6" />
      <rect x={xs[0]} y={lineY - 4} width={(xs[2] - xs[0]) * fill} height={8} rx={4} fill={C.red} />
      {xs.map((x, i) => {
        const on = k(c.sec, steps[i] - 0.1, 0.3);
        const pulseN = on > 0 && c.sec - steps[i] < 0.6 ? Math.sin(((c.sec - steps[i]) / 0.6) * Math.PI) * 10 : 0;
        const lit = on > 0.5;
        return (
          <g key={i}>
            <circle cx={x} cy={lineY} r={36 + pulseN} fill={lit ? (i === 2 ? C.red : C.ink) : C.card} stroke={lit ? "none" : "#CFC6B6"} strokeWidth={5} />
            <g transform={`translate(${x} ${lineY})`} stroke={lit ? "#FFFFFF" : "#B9AF9E"} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
              {i === 0 ? <path d="M-20 10 L-4 10 L-4 -4 L20 -4 M-4 10 L20 10" /> : null}
              {i === 1 ? <path d="M-18 14 L-18 -16 M0 14 L0 -16 M18 14 L18 -16 M-22 -8 L22 -8 M-22 4 L22 4" /> : null}
              {i === 2 ? (
                <>
                  <circle cx={4} r={15} />
                  <circle cx={4} r={5} />
                  <path d="M-12 -2 L-24 -10" />
                </>
              ) : null}
            </g>
            {wrap(labels[i] ?? "", 20).map((ln, j) => (
              <Txt key={j} x={x} y={lineY + 84 + j * 40} text={ln} size={34} weight={lit ? 800 : 600} color={lit ? C.ink : "#A99F8E"} anchor="middle" />
            ))}
          </g>
        );
      })}
    </g>
  );
};

// 6. Official statement: wide quote card (70% width) in a press-release
// style: document icon, the quote types in, then a "HASIL PEMERIKSAAN" stamp.
const statement2 = (c: Ctx, t: S, _still: boolean, q: Q) => {
  const tType = q("type", 0.7);
  const tTyped = q("typed", 3.4);
  const tBy = q("by", 3.7);
  const tStamp = q("stamp", 4.6);
  const cw = Math.round(W169 * 0.7);
  const cx = (W169 - cw) / 2;
  const top = 170;
  const ch = 620;
  const card = k(c.sec, 0.05, 0.5);
  const reveal = c01((c.sec - tType) / (tTyped - tType));
  const quote = t.quote ?? "";
  const lines = wrap(quote, 36);
  const total = quote.length;
  let used = 0;
  const st = c01((c.sec - tStamp) / 0.22);
  const stampS = lerp(1.7, 1, soft(st));
  const sx = cx + cw - 330;
  const sy = top + ch - 110;
  return (
    <g>
      <g transform={`translate(0 ${(1 - card) * 40})`} opacity={card}>
        <rect x={cx} y={top + 6} width={cw} height={ch} rx={36} fill="#0D2836" opacity={0.08} />
        <rect x={cx} y={top} width={cw} height={ch} rx={36} fill={C.card} />
        {/* Document icon. */}
        <g transform={`translate(${cx + 110} ${top + 110})`} stroke={C.ink} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d="M-26 -36 L12 -36 L28 -20 L28 36 L-26 36 Z" />
          <path d="M12 -36 L12 -20 L28 -20" />
          <path d="M-14 -8 L16 -8 M-14 6 L16 6 M-14 20 L6 20" />
        </g>
        <Txt x={cx + 170} y={top + 100} text={t.org ?? ""} size={40} weight={800} color={C.red} spacing="0.14em" />
        <Txt x={cx + 170} y={top + 144} text={t.kind ?? ""} size={28} weight={600} color={C.muted} />
        <rect x={cx + 80} y={top + 190} width={cw - 160} height={2} fill="#E6DED0" />
        {lines.map((ln, i) => {
          const start = used;
          used += ln.length + 1;
          const shown = Math.max(0, Math.min(ln.length, Math.round(reveal * total) - start));
          return <Txt key={i} x={cx + 110} y={top + 290 + i * 70} text={ln.slice(0, shown)} size={52} weight={700} color={C.ink} />;
        })}
        <Txt x={cx + 110} y={top + 290 + lines.length * 70 + 16} text={t.by ?? ""} size={30} weight={600} color={C.muted} o={k(c.sec, tBy, 0.4)} />
        {st > 0 ? (
          <g transform={`translate(${sx} ${sy}) rotate(-7) scale(${stampS})`} opacity={c01(st * 1.6) * 0.92}>
            <rect x={-235} y={-50} width={470} height={100} rx={12} fill="none" stroke={C.red} strokeWidth={6} />
            <rect x={-223} y={-38} width={446} height={76} rx={6} fill="none" stroke={C.red} strokeWidth={2} />
            <Txt x={0} y={16} text={t.stamp ?? ""} size={44} font={HEAD} weight={400} color={C.red} anchor="middle" spacing="0.06em" />
          </g>
        ) : null}
      </g>
    </g>
  );
};

// 7. Lesson: x-ray of a front suspension (front view) on the left, points
// light up red with labels; title and a checklist that ticks on the right.
const lesson2 = (c: Ctx, t: S, _still: boolean, q: Q) => {
  const tTitle = q("title", 0.3);
  const tCheck = q("check", 1.6);
  const cues = [q("c1", 2.3), q("c2", 3.1), q("c3", 3.9)];
  const panelW = VIS_R - ML;
  const pts: { p: Pt; lp: Pt; label: string }[] = [
    { p: [600, 752], lp: [560, 690], label: t.c1 ?? "" },
    { p: [800, 764], lp: [700, 846], label: t.c2 ?? "" },
    { p: [872, 640], lp: [930, 914], label: t.c3 ?? "" },
  ];
  const items = [t.c1, t.c2, t.c3];
  const titleLines = (t.title ?? "").split("|");
  return (
    <g>
      <rect x={ML} y={110} width={panelW} height={860} rx={32} fill={C.navy} />
      <defs>
        <pattern id="k2grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0 L0 0 0 48" fill="none" stroke={C.grid} strokeWidth={2} />
        </pattern>
        <clipPath id="k2panel">
          <rect x={ML} y={110} width={panelW} height={860} rx={32} />
        </clipPath>
      </defs>
      <g clipPath="url(#k2panel)">
        <rect x={ML} y={110} width={panelW} height={860} fill="url(#k2grid)" opacity={0.6} />
        <Txt x={ML + 40} y={170} text={t.panelLabel ?? ""} size={28} weight={800} color={C.line} spacing="0.18em" o={k(c.sec, 0.2, 0.5)} />
        {/* Front view, MacPherson strut: body mount, strut + spring, knuckle,
            lower arm to the subframe, drive shaft, hub and tyre. */}
        <g stroke={C.line} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={k(c.sec, 0, 0.6)}>
          <rect x={620} y={228} width={170} height={44} rx={10} />
          <path d="M150 760 L470 760 L470 800 L150 800" />
          <path d="M700 272 L838 560" strokeWidth={16} />
          <path d={`M${720} 330 ${Array.from({ length: 8 }, (_, i) => `L${(i % 2 ? 790 : 690) + i * 7} ${350 + i * 22}`).join(" ")}`} strokeWidth={5} />
          <path d="M838 560 L860 540 L890 600 L880 720 L820 768 L800 764" />
          <path d="M440 740 L800 764" strokeWidth={16} />
          <circle cx={440} cy={740} r={18} />
          <path d="M470 640 L840 640" strokeWidth={12} />
          <circle cx={872} cy={640} r={34} />
          <rect x={900} y={430} width={120} height={420} rx={46} strokeWidth={6} />
          <rect x={920} y={480} width={80} height={320} rx={30} strokeWidth={3} opacity={0.6} />
        </g>
        {pts.map((pt, i) => {
          const on = k(c.sec, cues[i] - 0.1, 0.3);
          const ring = on > 0 ? ((c.sec - cues[i]) * 0.9) % 1 : 0;
          return on > 0 ? (
            <g key={i}>
              <circle cx={pt.p[0]} cy={pt.p[1]} r={20 + ring * 40} fill="none" stroke={C.red} strokeWidth={4} opacity={(1 - ring) * on} />
              <circle cx={pt.p[0]} cy={pt.p[1]} r={15} fill={C.red} opacity={on} filter="url(#lglow)" />
              <path d={`M${pt.p[0]} ${pt.p[1]} L${pt.lp[0]} ${pt.lp[1]}`} stroke={C.red} strokeWidth={3} opacity={on * 0.9} />
              <Pill x={pt.lp[0]} y={pt.lp[1] + 9} text={pt.label} o={on} size={28} />
            </g>
          ) : null;
        })}
      </g>
      <Txt x={TXT_L} y={196} text={t.kicker ?? ""} size={32} weight={800} color={C.red} spacing="0.2em" o={k(c.sec, tTitle - 0.1, 0.4)} />
      {titleLines.map((ln, i) => {
        const a = k(c.sec, tTitle + i * 0.18, 0.45);
        return (
          <g key={i} opacity={a} transform={`translate(0 ${(1 - a) * 30})`}>
            <text x={TXT_L} y={290 + i * 90} fontFamily={HEAD} fontSize={80} fill={i === 0 ? C.red : C.ink}>
              {ln}
            </text>
          </g>
        );
      })}
      <Txt x={TXT_L} y={290 + titleLines.length * 90 + 50} text={t.checkLabel ?? ""} size={34} weight={600} color={C.muted} o={k(c.sec, tCheck, 0.4)} />
      {items.map((it, i) => {
        const on = k(c.sec, cues[i] - 0.1, 0.3);
        const appear = k(c.sec, tCheck + 0.1 + i * 0.1, 0.4);
        const y = 290 + titleLines.length * 90 + 140 + i * 90;
        return (
          <g key={i} opacity={appear}>
            <rect x={TXT_L} y={y - 44} width={58} height={58} rx={14} fill={on > 0.5 ? C.red : C.card} stroke={on > 0.5 ? C.red : "#CFC6B6"} strokeWidth={4} />
            {on > 0 ? <path d={`M${TXT_L + 14} ${y - 15} L${TXT_L + 26} ${y - 2} L${TXT_L + 46} ${y - 30}`} stroke="#FFFFFF" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset={60 * (1 - on)} /> : null}
            <Txt x={TXT_L + 88} y={y} text={it ?? ""} size={46} weight={on > 0.5 ? 800 : 600} color={C.ink} />
          </g>
        );
      })}
    </g>
  );
};


const SHOTS: Record<string, ShotDef169> = {
  "k-hook": { bg: C.navy, draw: hook },
  "k-label": { bg: C.navy, draw: label },
  "k-where": { bg: C.cream, draw: where },
  "k-hit": { bg: C.navy, draw: hit },
  "k-timeline": { bg: C.cream, draw: timeline },
  "k-statement": { bg: C.cream, draw: statement },
  "k-lesson": { bg: C.cream, draw: lesson },
  "k2-hook": { bg: C.navy, draw: hook2 },
  "k2-where": { bg: C.cream, draw: where2 },
  "k2-diff": { bg: C.cream, draw: diff2 },
  "k2-exam": { bg: C.cream, draw: exam2 },
  "k2-statement": { bg: C.cream, draw: statement2 },
  "k2-lesson": { bg: C.cream, draw: lesson2 },
};
if (SOFT_WORLD_SHOTS.kasus.join() !== Object.keys(SHOTS).join()) throw new Error("kasus shots out of sync with src/soft/registry.ts");

// ---------------------------------------------------------------- world

type Cues = Record<string, number>;
export type KasusState = {
  shot: string;
  frame: number;
  local: number;
  len?: number;
  words?: Word[];
  screen?: S;
  cues?: Cues;
  prev?: { shot: string; len: number; words?: Word[]; screen?: S; cues?: Cues };
  still?: boolean;
};

const qOf = (cues?: Cues): Q => (name, fallback) => cues?.[name] ?? fallback;

const Layer: React.FC<{ def: ShotDef169; c: Ctx; t: S; still: boolean; q: Q }> = ({ def, c, t, still, q }) => {
  const push = 1 + 0.018 * c01(c.sec / c.len);
  return <g transform={`translate(${W169 / 2} ${H169 / 2}) scale(${push}) translate(${-W169 / 2} ${-H169 / 2})`}>{def.draw(c, t, still, q)}</g>;
};

export const Kasus169: React.FC<{ s: KasusState }> = ({ s }) => {
  const def = SHOTS[s.shot] ?? SHOTS["k-hook"];
  const c = makeCtx(s.local / 30, s.frame, (s.len ?? 150) / 30, s.words ?? []);
  const prevDef = s.prev ? SHOTS[s.prev.shot] : undefined;
  const pc = s.prev ? makeCtx(s.prev.len / 30 - 1 / 30, s.frame, s.prev.len / 30, s.prev.words ?? []) : undefined;
  const inK = prevDef ? k(c.sec, 0.03, 0.4) : 1;
  const dark = def.bg === C.navy;
  return (
    <svg width={W169} height={H169} style={{ position: "absolute", inset: 0 }}>
      <KitDefs />
      {prevDef ? <rect width={W169} height={H169} fill={prevDef.bg} /> : null}
      <rect width={W169} height={H169} fill={def.bg} opacity={inK} />
      {prevDef && pc && inK < 1 ? (
        <g opacity={1 - inK}>
          <Layer def={prevDef} c={pc} t={s.prev?.screen ?? {}} still={false} q={qOf(s.prev?.cues)} />
        </g>
      ) : null}
      <g opacity={inK}>
        <Layer def={def} c={c} t={s.screen ?? {}} still={Boolean(s.still)} q={qOf(s.cues)} />
      </g>
      {!s.still ? <SourceLine text={s.screen?.source} o={k(c.sec, 0.5, 0.5) * (1 - c01((c.sec - (c.len - 0.35)) / 0.35))} dark={dark} /> : null}
    </svg>
  );
};

export const KASUS_BG = C.navy;
void pointAt;
void toD;
void pop;
void MT;
void ML;
