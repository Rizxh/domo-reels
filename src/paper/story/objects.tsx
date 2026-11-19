// Detailed paper props for the story format: a shaded sedan, the open
// engine bay (with the hose that pops off), the dashboard cluster with the
// check-engine lamp, an OBD scanner, the estimate form, and grown-up
// proportioned figures. Pure drawings: inputs are numbers and flags.

import { random } from "remotion";
import { FONT_WEIGHTS, FONTS, PAPER, STORY } from "../../lib/brand";
import { ease } from "../kit";

// ------------------------------------------------------------ car
export const SedanSide: React.FC<{ wheelTurn: number; tone?: string; shade?: string; dirty?: boolean; bob?: number; speed?: number }> = ({
  wheelTurn,
  tone = PAPER.carRed,
  shade = PAPER.carRedShade,
  dirty = false,
  bob = 0,
  speed = 0,
}) => {
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} 212)`}>
      <circle r={56} fill={STORY.rubber} />
      <circle r={50} fill="#2c2c2c" />
      <g transform={`rotate(${wheelTurn})`}>
        <circle r={32} fill="#d4d8dd" />
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d="M -5 -30 L 5 -30 L 3 -8 L -3 -8 Z" fill="#9097a0" transform={`rotate(${a})`} />
        ))}
        <circle r={8} fill="#7a8089" />
      </g>
      {/* Motion blur on the rim when rolling fast. */}
      {speed > 0.2 ? <circle r={32} fill="#c9ced4" opacity={Math.min(0.75, speed)} /> : null}
    </g>
  );
  return (
    <svg viewBox="0 0 680 280" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id={`body-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
          <stop offset="0.25" stopColor={tone} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d7eefc" />
          <stop offset="1" stopColor="#7fb5d9" />
        </linearGradient>
      </defs>
      <ellipse cx={340} cy={270} rx={300} ry={14} fill="rgba(0,0,0,0.35)" />
      <g transform={`translate(0 ${bob})`}>
      <path d="M 30 200 Q 24 150 72 136 L 178 124 Q 232 62 316 58 L 448 58 Q 498 62 540 124 L 626 136 Q 660 146 656 196 L 648 218 H 40 Z" fill={`url(#body-${tone})`} />
      <path d="M 40 206 H 648 L 640 224 H 48 Z" fill={shade} />
      <path d="M 198 126 Q 242 76 312 74 L 372 74 L 372 126 Z" fill="url(#glassG)" />
      <path d="M 386 74 L 444 74 Q 486 78 518 126 L 386 126 Z" fill="url(#glassG)" />
      <path d="M 220 120 L 268 80" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={8} strokeLinecap="round" />
      <path d="M 378 74 V 206 M 248 128 V 206" stroke={shade} strokeWidth={4} />
      <rect x={318} y={144} width={32} height={8} rx={4} fill="#e8e8e8" />
      <rect x={626} y={150} width={26} height={20} rx={6} fill="#fff1c2" />
      <rect x={32} y={156} width={18} height={20} rx={5} fill="#ff6b5e" />
      <path d="M 62 168 H 640" stroke="#ffffff" strokeOpacity={0.25} strokeWidth={4} />
      {dirty ? <path d="M 60 200 q 80 -20 160 0 t 160 0 t 160 0" stroke="#5b4a33" strokeWidth={10} opacity={0.5} fill="none" /> : null}
      </g>
      {wheel(160)}
      {wheel(528)}
    </svg>
  );
};

// ------------------------------------------------------------ engine bay
// Front view into the open bay, viewBox 0 0 900 700. `hoseOff` 0..1 swings
// the upper radiator hose off its neck; `stickers` are where notes land.
export const ENGINE_SPOTS = {
  airbox: { x: 210, y: 250 },
  radiator: { x: 450, y: 610 },
  plugs: { x: 520, y: 300 },
  hose: { x: 660, y: 470 },
  battery: { x: 760, y: 250 },
} as const;

export const EngineBay: React.FC<{ hoseOff: number; dirt?: number }> = ({ hoseOff, dirt = 0 }) => (
  <svg viewBox="0 0 900 700" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <defs>
      <linearGradient id="cover" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d5d9de" />
        <stop offset="1" stopColor="#8f959d" />
      </linearGradient>
      <radialGradient id="bayDark" cx="0.5" cy="0.5" r="0.7">
        <stop offset="0" stopColor="#2e3136" />
        <stop offset="1" stopColor="#141518" />
      </radialGradient>
    </defs>
    {/* Bay well and fender edges. */}
    <path d="M 20 60 H 880 L 860 690 H 40 Z" fill="url(#bayDark)" />
    <path d="M 0 40 H 900 V 70 H 0 Z" fill={PAPER.carRedShade} />
    {/* Engine block and valve cover. */}
    <rect x={300} y={170} width={360} height={260} rx={30} fill={STORY.engineDark} />
    <rect x={320} y={190} width={320} height={130} rx={26} fill="url(#cover)" />
    {[370, 450, 530, 610].map((x) => (
      <g key={x}>
        <rect x={x - 16} y={232} width={32} height={50} rx={8} fill="#2b2b2e" />
        <circle cx={x} cy={226} r={9} fill={STORY.brandRed} />
      </g>
    ))}
    <circle cx={600} cy={360} r={26} fill="#f2c94c" stroke="#6b5a1c" strokeWidth={6} />
    {/* Air filter box with intake duct. */}
    <rect x={90} y={170} width={230} height={170} rx={24} fill="#2b2b2e" />
    <rect x={110} y={190} width={190} height={130} rx={16} fill="#3a3a3e" />
    {Array.from({ length: 8 }, (_, i) => (
      <path key={i} d={`M ${120 + i * 22} 200 V 310`} stroke="#2b2b2e" strokeWidth={6} />
    ))}
    <path d="M 320 260 Q 330 220 360 210" stroke="#1f1f22" strokeWidth={40} fill="none" strokeLinecap="round" />
    {/* Battery with terminals. */}
    <rect x={680} y={150} width={170} height={190} rx={14} fill="#1c1c1f" />
    <rect x={690} y={160} width={150} height={40} rx={8} fill="#2c2c30" />
    <rect x={705} y={128} width={30} height={30} rx={6} fill={STORY.brandRed} />
    <rect x={795} y={128} width={30} height={30} rx={6} fill="#2a2a2a" />
    {/* Radiator and fan shroud. */}
    <rect x={150} y={470} width={600} height={190} rx={12} fill="#3e434a" />
    {Array.from({ length: 28 }, (_, i) => (
      <path key={i} d={`M ${170 + i * 20.5} 485 V 645`} stroke="#2b2f34" strokeWidth={6} />
    ))}
    {/* Coolant reservoir. */}
    <rect x={90} y={380} width={110} height={130} rx={18} fill="rgba(240,240,240,0.85)" />
    <rect x={100} y={440} width={90} height={60} rx={10} fill={STORY.coolant} />
    {/* Upper radiator hose: from the engine outlet to the radiator neck. */}
    <g transform={`rotate(${-38 * ease(hoseOff)} 660 430)`}>
      <path d="M 660 430 C 700 440, 700 480, 690 470" stroke={STORY.hoseBlack} strokeWidth={36} fill="none" strokeLinecap="round" />
    </g>
    <circle cx={690} cy={486} r={18} fill={STORY.steel} />
    {/* Grime: oily patches when dirty. */}
    {dirt > 0
      ? Array.from({ length: 10 }, (_, i) => (
          <ellipse key={i} cx={120 + random(`bd-x-${i}`) * 680} cy={160 + random(`bd-y-${i}`) * 480} rx={30 + random(`bd-r-${i}`) * 40} ry={14} fill="#120f0b" opacity={0.35 * dirt} />
        ))
      : null}
  </svg>
);

// Coolant spray from the popped hose: deterministic droplets.
export const Spray: React.FC<{ t: number; x: number; y: number; scale?: number }> = ({ t, x, y, scale = 1 }) => {
  if (t < 0) return null;
  return (
    <svg viewBox="-300 -300 600 600" style={{ position: "absolute", left: x - 300 * scale, top: y - 300 * scale, width: 600 * scale, height: 600 * scale, overflow: "visible" }}>
      {Array.from({ length: 46 }, (_, i) => {
        const life = ((t * 0.6 + i * 1.7) % 14) / 14;
        const a = -Math.PI / 2 - 0.8 + random(`sp-a-${i}`) * 1.0;
        const v = 180 + random(`sp-v-${i}`) * 160;
        const px = Math.cos(a) * v * life;
        const py = Math.sin(a) * v * life + 260 * life * life;
        return <circle key={i} cx={px} cy={py} r={4 + 6 * (1 - life)} fill={STORY.coolant} opacity={0.85 * (1 - life)} />;
      })}
    </svg>
  );
};

// Rising smoke puffs.
export const Smoke: React.FC<{ t: number; x: number; y: number; width?: number; dark?: boolean }> = ({ t, x, y, width = 500, dark = false }) => {
  if (t < 0) return null;
  return (
    <svg viewBox="-250 -700 500 760" style={{ position: "absolute", left: x - width / 2, top: y - (width * 700) / 500, width, height: (width * 760) / 500, overflow: "visible" }}>
      {Array.from({ length: 16 }, (_, i) => {
        const life = ((t * 0.9 + i * 6) % 90) / 90;
        const px = Math.sin(i * 2.1 + life * 3) * 60 * life + (random(`sm-${i}`) - 0.5) * 120;
        const py = -life * 640;
        const r = 40 + 120 * life;
        return <circle key={i} cx={px} cy={py} r={r} fill={dark ? "#4a4a4a" : STORY.smoke} opacity={(dark ? 0.55 : 0.45) * (1 - life) * Math.min(1, t / 12)} />;
      })}
    </svg>
  );
};

// ------------------------------------------------------------ dashboard
export const Cluster: React.FC<{ checkOn: number; rpm: number }> = ({ checkOn, rpm }) => (
  <svg viewBox="0 0 900 520" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <defs>
      <radialGradient id="dial" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#1c2129" />
        <stop offset="1" stopColor="#07090c" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={900} height={520} rx={120} fill="#101215" />
    {[240, 660].map((cx, k) => (
      <g key={cx}>
        <circle cx={cx} cy={250} r={190} fill="url(#dial)" stroke="#2c3138" strokeWidth={12} />
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI * (0.8 + 1.4 * (i / 10));
          return <path key={i} d={`M ${cx + Math.cos(a) * 150} ${250 + Math.sin(a) * 150} L ${cx + Math.cos(a) * 172} ${250 + Math.sin(a) * 172}`} stroke="#e9eef5" strokeWidth={i % 5 === 0 ? 8 : 4} />;
        })}
        <g transform={`rotate(${(k === 0 ? rpm : 0.2) * 252 - 216 + 90} ${cx} 250)`}>
          <path d={`M ${cx - 6} 250 L ${cx} ${250 - 160} L ${cx + 6} 250 Z`} fill="#ff4b3a" />
        </g>
        <circle cx={cx} cy={250} r={18} fill="#2c3138" />
      </g>
    ))}
    {/* Check-engine pictogram between the dials. */}
    <g transform="translate(450 400)" opacity={0.18 + 0.82 * checkOn}>
      <path d="M -60 -26 H 30 L 44 -12 H 60 V 26 H -44 L -60 10 Z" fill={checkOn > 0.5 ? STORY.checkAmber : "#5a4a1a"} />
      <rect x={-30} y={-42} width={40} height={16} fill={checkOn > 0.5 ? STORY.checkAmber : "#5a4a1a"} />
    </g>
    {checkOn > 0.5 ? <circle cx={450} cy={400} r={90} fill={STORY.checkAmber} opacity={0.15 * checkOn} /> : null}
  </svg>
);

// ------------------------------------------------------------ scanner
export const ObdScanner: React.FC<{ t: number; ok: number }> = ({ t, ok }) => {
  const bars = Array.from({ length: 24 }, (_, i) => 30 + 50 * Math.abs(Math.sin(i * 0.7 + t * 0.15)));
  return (
    <svg viewBox="0 0 520 760" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <rect x={0} y={0} width={520} height={760} rx={60} fill="#1c1f24" />
      <rect x={20} y={20} width={480} height={720} rx={46} fill={STORY.brandRed} opacity={0.9} />
      <rect x={50} y={60} width={420} height={440} rx={20} fill={STORY.screen} />
      <text x={80} y={120} fontFamily={FONTS.body} fontWeight={700} fontSize={30} fill="#9fb4c8">
        DIAGNOSTIC
      </text>
      {bars.map((h, i) => (
        <rect key={i} x={80 + i * 15} y={360 - h} width={10} height={h} rx={3} fill={STORY.screenGreen} opacity={0.85} />
      ))}
      <path d={`M 80 ${430} ${Array.from({ length: 30 }, (_, i) => `L ${80 + i * 12} ${430 - 30 * Math.sin(i * 0.6 + t * 0.2)}`).join(" ")}`} stroke="#7cc7ff" strokeWidth={4} fill="none" />
      {ok > 0 ? (
        <g opacity={ok}>
          <rect x={300} y={90} width={140} height={56} rx={12} fill={STORY.screenGreen} />
          <text x={370} y={130} textAnchor="middle" fontFamily={FONTS.headline} fontSize={40} fill={STORY.screen}>
            OK
          </text>
        </g>
      ) : null}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={160 + i * 100} cy={600} r={34} fill="#ffffff" opacity={0.9} />
      ))}
      <path d="M 260 740 V 900" stroke="#1c1f24" strokeWidth={30} />
    </svg>
  );
};

// OBD plug and socket under the dashboard; `plug` 0..1 pushes it in.
export const ObdPort: React.FC<{ plug: number }> = ({ plug }) => (
  <svg viewBox="0 0 700 420" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <rect x={0} y={0} width={700} height={160} fill="#1a1b1e" />
    <rect x={0} y={150} width={700} height={270} fill="#232428" />
    <rect x={250} y={170} width={200} height={90} rx={14} fill="#0e0e10" stroke="#3a3b40" strokeWidth={6} />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={272 + i * 21} y={196} width={10} height={14} rx={3} fill="#c9a23a" />
    ))}
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={272 + i * 21} y={226} width={10} height={14} rx={3} fill="#c9a23a" />
    ))}
    <g transform={`translate(0 ${170 * (1 - ease(plug))})`}>
      <rect x={240} y={240} width={220} height={120} rx={20} fill={STORY.brandRed} />
      <rect x={300} y={360} width={100} height={80} fill="#1c1f24" />
    </g>
  </svg>
);

// ------------------------------------------------------------ figures
// Grown-up proportions (head ~1/6.5 of height), viewBox 0 0 240 640.
export type FigureRole = "rogue" | "domo" | "customer";
export const Figure: React.FC<{
  role: FigureRole;
  frame: number;
  armL?: number;
  armR?: number;
  mood?: "neutral" | "smirk" | "smile" | "worried" | "shock";
  silhouette?: boolean;
  nod?: number;
}> = ({ role, frame, armL = 6, armR = -6, mood = "neutral", silhouette = false, nod = 0 }) => {
  const top = role === "domo" ? STORY.brandRed : role === "rogue" ? STORY.greyOverall : "#f2f2f2";
  const legs = role === "domo" ? "#2a2d33" : role === "rogue" ? "#5f6257" : STORY.denim;
  const skin = silhouette ? "#111" : STORY.skin;
  const ink = silhouette ? "#111" : PAPER.ink;
  const c = (col: string) => (silhouette ? "#111" : col);
  const blink = frame % 110 < 4;
  const arm = (side: -1 | 1, angle: number) => (
    <g transform={`translate(${120 + side * 50} 200) rotate(${side * angle})`}>
      <rect x={-17} y={0} width={34} height={150} rx={17} fill={c(top)} />
      <rect x={-14} y={140} width={28} height={70} rx={14} fill={skin} />
    </g>
  );
  const mouth =
    mood === "smile" ? `M 104 132 Q 120 146 136 132` : mood === "smirk" ? `M 106 136 Q 124 140 138 128` : mood === "worried" ? `M 106 140 Q 120 130 134 140` : mood === "shock" ? "" : `M 108 136 H 132`;
  // Idle breathing keeps a standing figure alive.
  const breathe = 1 + 0.014 * Math.sin(frame / 13);
  return (
    <svg viewBox="0 0 240 640" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <ellipse cx={120} cy={632} rx={90} ry={10} fill="rgba(0,0,0,0.25)" />
      <g transform={`translate(120 620) scale(1 ${breathe}) translate(-120 -620)`}>
      <rect x={78} y={380} width={40} height={240} rx={14} fill={c(legs)} />
      <rect x={122} y={380} width={40} height={240} rx={14} fill={c(legs)} />
      <rect x={68} y={606} width={56} height={22} rx={10} fill="#1a1a1a" />
      <rect x={118} y={606} width={56} height={22} rx={10} fill="#1a1a1a" />
      {arm(-1, armL)}
      {arm(1, armR)}
      <path d="M 66 200 Q 66 176 92 172 H 148 Q 174 176 174 200 L 168 400 H 72 Z" fill={c(top)} />
      {role === "domo" && !silhouette ? (
        <g>
          <rect x={100} y={176} width={40} height={30} fill="#ffffff" />
          <rect x={132} y={232} width={30} height={20} rx={4} fill="#ffffff" />
        </g>
      ) : null}
      {role === "rogue" && !silhouette ? <ellipse cx={100} cy={300} rx={22} ry={12} fill="#3a3326" opacity={0.6} /> : null}
      <rect x={106} y={150} width={28} height={30} fill={silhouette ? "#111" : STORY.skinShade} />
      <g transform={`rotate(${nod * 8} 120 150)`}>
        <ellipse cx={120} cy={112} rx={44} ry={52} fill={skin} />
        {role === "domo" ? <path d={`M 74 98 Q 120 30 166 98 L 166 86 Q 120 52 74 86 Z`} fill={c(STORY.brandRed)} /> : null}
        {role === "domo" ? <rect x={110} y={84} width={70} height={12} rx={6} fill={c(STORY.brandRedDark)} /> : null}
        {role === "rogue" ? <path d="M 74 96 Q 120 40 166 96 L 166 84 Q 120 56 74 84 Z" fill={c("#4c4f45")} /> : null}
        {role === "customer" ? <path d="M 74 104 Q 76 54 122 56 Q 166 58 166 102 Q 150 80 120 82 Q 92 82 74 104 Z" fill={c("#2b2220")} /> : null}
        {!silhouette ? (
          <>
            {blink ? (
              <g stroke={ink} strokeWidth={4} strokeLinecap="round">
                <path d="M 98 112 H 110" />
                <path d="M 130 112 H 142" />
              </g>
            ) : (
              <g fill={ink}>
                <circle cx={104} cy={112} r={mood === "shock" ? 7 : 5} />
                <circle cx={136} cy={112} r={mood === "shock" ? 7 : 5} />
              </g>
            )}
            {mood === "shock" ? <ellipse cx={120} cy={138} rx={9} ry={12} fill={ink} /> : <path d={mouth} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />}
            {mood === "smirk" ? <path d="M 96 98 L 112 102 M 128 100 L 144 94" stroke={ink} strokeWidth={4} strokeLinecap="round" /> : null}
          </>
        ) : null}
      </g>
      </g>
    </svg>
  );
};

// ------------------------------------------------------------ estimate form
export const FormSheet: React.FC<{ title: string; rows: { text: string; t: number }[]; titleT: number; signT: number }> = ({ title, rows, titleT, signT }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <div style={{ position: "absolute", inset: 0, background: "#2b2f35", borderRadius: 40 }} />
    <div style={{ position: "absolute", left: 40, top: 40, right: 40, bottom: 40, background: STORY.paperWhite, borderRadius: 18 }} />
    <div style={{ position: "absolute", left: 80, top: 80, right: 80, height: 70, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 22, height: 70, background: STORY.brandRed, borderRadius: 4 }} />
      <div style={{ fontFamily: FONTS.headline, fontSize: 64, color: PAPER.ink, clipPath: `inset(0 ${(1 - ease(titleT / 12)) * 100}% 0 0)` }}>{title}</div>
    </div>
    {rows.map((r, i) => (
      <div key={i} style={{ position: "absolute", left: 80, right: 80, top: 210 + i * 110, height: 80, display: "flex", alignItems: "center", gap: 22, borderBottom: "3px solid #e2e2e2" }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, border: `5px solid ${PAPER.ink}`, position: "relative", flexShrink: 0 }}>
          {r.t >= 0 ? (
            <svg viewBox="0 0 48 48" style={{ position: "absolute", inset: -6, width: 60, height: 60 }}>
              <path d="M 8 26 L 20 38 L 42 10" stroke={PAPER.inkGreen} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(r.t / 7)} />
            </svg>
          ) : null}
        </div>
        <div style={{ fontFamily: FONTS.body, fontWeight: FONT_WEIGHTS.semibold, fontSize: 40, color: PAPER.ink, clipPath: `inset(0 ${(1 - ease(Math.max(0, r.t) / 10)) * 100}% 0 0)` }}>{r.text}</div>
      </div>
    ))}
    {/* Signature line and the customer's signature drawing in. */}
    <div style={{ position: "absolute", left: 80, right: 80, bottom: 150, borderBottom: `4px solid ${PAPER.ink}` }} />
    <svg viewBox="0 0 400 120" style={{ position: "absolute", left: 120, bottom: 150, width: 400, height: 120, overflow: "visible" }}>
      {signT >= 0 ? (
        <path
          d="M 10 90 C 40 10, 60 110, 90 60 S 140 20, 160 80 S 220 100, 240 40 S 300 70, 380 50"
          stroke={PAPER.inkBlue}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(signT / 18)}
        />
      ) : null}
    </svg>
  </div>
);

// ------------------------------------------------------------ extra props (v2.1)
// Empty wallet flapping open, viewBox 0 0 300 220.
export const Wallet: React.FC<{ open: number }> = ({ open }) => (
  <svg viewBox="0 0 300 220" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <rect x={20} y={60} width={260} height={150} rx={22} fill="#6b4a2f" />
    <g transform={`rotate(${-40 * open} 20 60)`}>
      <rect x={20} y={20} width={260} height={70} rx={18} fill="#8a6240" />
    </g>
    <rect x={200} y={110} width={80} height={50} rx={12} fill="#5a3d26" />
    <circle cx={238} cy={135} r={9} fill="#d9b98a" />
    {open > 0.5 ? <path d="M 120 40 q 10 -30 30 0 M 160 30 q 10 -30 30 0" stroke="#bbb" strokeWidth={6} fill="none" opacity={0.8} /> : null}
  </svg>
);

// Clock with hands racing, viewBox 0 0 240 240.
export const Clock: React.FC<{ t: number }> = ({ t }) => (
  <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <circle cx={120} cy={120} r={110} fill="#ffffff" stroke={PAPER.ink} strokeWidth={14} />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={116} y={22} width={8} height={18} fill={PAPER.ink} transform={`rotate(${i * 30} 120 120)`} />
    ))}
    <rect x={114} y={60} width={12} height={64} rx={6} fill={PAPER.ink} transform={`rotate(${t * 6} 120 120)`} />
    <rect x={116} y={36} width={8} height={88} rx={4} fill={STORY.brandRed} transform={`rotate(${t * 40} 120 120)`} />
    <circle cx={120} cy={120} r={12} fill={PAPER.ink} />
  </svg>
);

// Tablet with the findings split into what is needed and what can wait.
export const FindingsTablet: React.FC<{
  needHead: string;
  skipHead: string;
  need: { text: string; t: number }[];
  skip: { text: string; t: number }[];
  needT: number;
  skipT: number;
}> = ({ needHead, skipHead, need, skip, needT, skipT }) => {
  const col = (head: string, items: { text: string; t: number }[], headT: number, color: string, mark: "!" | "ok") => (
    <div style={{ flex: 1, padding: "0 18px", opacity: headT >= 0 ? 1 : 0.15 }}>
      <div style={{ fontFamily: FONTS.headline, fontSize: 52, color, marginBottom: 18, transform: `scale(${headT >= 0 ? 0.9 + 0.1 * ease(headT / 8) : 0.9})`, transformOrigin: "0 50%" }}>{head}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, opacity: it.t >= 0 ? Math.min(1, it.t / 6) : 0, transform: `translateX(${it.t >= 0 ? (1 - ease(it.t / 8)) * -30 : -30}px)` }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: color, color: "#fff", fontFamily: FONTS.headline, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{mark === "!" ? "!" : "✓"}</div>
          <div style={{ fontFamily: FONTS.body, fontWeight: FONT_WEIGHTS.bold, fontSize: 38, color: PAPER.ink, whiteSpace: "nowrap" }}>{it.text}</div>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "#1c1f24", borderRadius: 46 }} />
      <div style={{ position: "absolute", left: 30, top: 30, right: 30, bottom: 30, background: "#ffffff", borderRadius: 28, padding: "40px 10px", display: "flex" }}>
        {col(needHead, need, needT, STORY.brandRed, "!")}
        <div style={{ width: 4, background: "#e5e7ea", borderRadius: 2 }} />
        {col(skipHead, skip, skipT, PAPER.inkGreen, "ok")}
      </div>
    </div>
  );
};

// Paper rain: diagonal drops falling, for the regret beat.
export const Rain: React.FC<{ t: number }> = ({ t }) => (
  <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
    {Array.from({ length: 70 }, (_, i) => {
      const x = (random(`rx-${i}`) * 1300 - 100 + t * 6) % 1300 - 100;
      const y = ((random(`ry-${i}`) * 2100 + t * 38) % 2100) - 150;
      return <path key={i} d={`M ${x} ${y} l -14 44`} stroke="#9fb3c8" strokeWidth={5} strokeLinecap="round" opacity={0.55} />;
    })}
  </svg>
);

// Floating dust in a light beam (rogue shop) or sparkles (clean shop).
export const Motes: React.FC<{ frame: number; kind: "dust" | "sparkle" }> = ({ frame, kind }) => (
  <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
    {Array.from({ length: kind === "dust" ? 40 : 16 }, (_, i) => {
      const bx = random(`mx-${kind}-${i}`) * 1080;
      const by = random(`my-${kind}-${i}`) * 1400 + 200;
      const x = bx + Math.sin(frame / 40 + i) * 30;
      const y = by - ((frame * (kind === "dust" ? 0.4 : 0.8) + i * 40) % 300);
      const a = kind === "dust" ? 0.35 : 0.5 * Math.max(0, Math.sin(frame / 9 + i * 1.3));
      return kind === "dust" ? (
        <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#ffe7b0" opacity={a} />
      ) : (
        <path key={i} d={`M ${x} ${y - 12} L ${x + 3} ${y - 3} L ${x + 12} ${y} L ${x + 3} ${y + 3} L ${x} ${y + 12} L ${x - 3} ${y + 3} L ${x - 12} ${y} L ${x - 3} ${y - 3} Z`} fill="#ffffff" opacity={a} />
      );
    })}
  </svg>
);
