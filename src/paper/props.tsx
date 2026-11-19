// Paper cut-out characters and props for the whiteboard format. Each is an
// SVG drawing in its own viewBox; place it with <Cutout> (kit.tsx) so it
// gets the ragged paper edge and shadow. Animation inputs are plain numbers.

import { FONTS, PAPER } from "../lib/brand";
import { ease } from "./kit";

export type Mood = "neutral" | "shock" | "happy" | "smug" | "worried";

// Person, viewBox 0 0 220 400. Arms rotate at the shoulders (degrees,
// 0 = hanging down, positive = raised outward).
export const Person: React.FC<{
  role: "driver" | "mechanic";
  mood: Mood;
  armL?: number;
  armR?: number;
  // Frame counter for blinking.
  frame: number;
  // Head turned away (looking left) for the part-swap gag.
  lookAway?: boolean;
}> = ({ role, mood, armL = 8, armR = -8, frame, lookAway = false }) => {
  const mech = role === "mechanic";
  const top = mech ? PAPER.carRed : PAPER.inkBlue;
  const legs = mech ? PAPER.carRedShade : PAPER.denim;
  const blink = frame % 96 < 4;
  const shock = mood === "shock";
  const eyeR = shock ? 9 : 6;
  const ex = lookAway ? -10 : 0;
  const mouth =
    mood === "shock" ? <ellipse cx={110 + ex} cy={100} rx={11} ry={14} fill={PAPER.ink} />
    : mood === "happy" ? <path d={`M ${92 + ex} 94 Q ${110 + ex} 112 ${128 + ex} 94`} stroke={PAPER.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
    : mood === "smug" ? <path d={`M ${94 + ex} 99 Q ${114 + ex} 106 ${130 + ex} 92`} stroke={PAPER.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
    : mood === "worried" ? <path d={`M ${95 + ex} 103 Q ${110 + ex} 94 ${125 + ex} 103`} stroke={PAPER.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
    : <path d={`M ${97 + ex} 99 H ${123 + ex}`} stroke={PAPER.ink} strokeWidth={5} strokeLinecap="round" />;
  const arm = (side: -1 | 1, angle: number) => (
    <g transform={`translate(${110 + side * 52} 170) rotate(${side * angle})`}>
      <rect x={-15} y={0} width={30} height={118} rx={15} fill={top} />
      <circle cx={0} cy={124} r={16} fill={PAPER.skin} />
    </g>
  );
  return (
    <svg viewBox="0 0 220 400" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      {/* Legs and shoes. */}
      <rect x={72} y={300} width={34} height={86} rx={10} fill={legs} />
      <rect x={114} y={300} width={34} height={86} rx={10} fill={legs} />
      <rect x={64} y={378} width={46} height={18} rx={9} fill={PAPER.ink} />
      <rect x={110} y={378} width={46} height={18} rx={9} fill={PAPER.ink} />
      {arm(-1, armL)}
      {arm(1, armR)}
      {/* Torso. */}
      <rect x={56} y={158} width={108} height={160} rx={30} fill={top} />
      {mech ? <rect x={86} y={196} width={48} height={30} rx={6} fill="#ffffff" opacity={0.9} /> : <path d="M 96 160 L 110 186 L 124 160" fill={PAPER.shirt} />}
      {/* Head. */}
      <rect x={98} y={130} width={24} height={34} fill={PAPER.skinShade} />
      <circle cx={110} cy={82} r={58} fill={PAPER.skin} />
      {mech ? (
        <g>
          <path d="M 52 70 Q 110 4 168 70 Z" fill={PAPER.carRed} />
          <rect x={lookAway ? 26 : 120} y={62} width={70} height={14} rx={7} fill={PAPER.carRedShade} />
        </g>
      ) : (
        <path d="M 52 78 Q 56 18 112 22 Q 168 24 168 76 Q 150 50 112 52 Q 76 52 52 78 Z" fill={PAPER.hair} />
      )}
      {/* Face. */}
      {blink && !shock ? (
        <g stroke={PAPER.ink} strokeWidth={4} strokeLinecap="round">
          <path d={`M ${84 + ex} 80 H ${98 + ex}`} />
          <path d={`M ${122 + ex} 80 H ${136 + ex}`} />
        </g>
      ) : (
        <g>
          {shock ? (
            <>
              <circle cx={91 + ex} cy={80} r={14} fill="#ffffff" stroke={PAPER.ink} strokeWidth={3} />
              <circle cx={129 + ex} cy={80} r={14} fill="#ffffff" stroke={PAPER.ink} strokeWidth={3} />
            </>
          ) : null}
          <circle cx={91 + ex} cy={80} r={eyeR / (shock ? 1.6 : 1)} fill={PAPER.ink} />
          <circle cx={129 + ex} cy={80} r={eyeR / (shock ? 1.6 : 1)} fill={PAPER.ink} />
        </g>
      )}
      {shock ? (
        <g stroke={PAPER.ink} strokeWidth={4} strokeLinecap="round">
          <path d={`M ${78 + ex} 56 L ${100 + ex} 52`} />
          <path d={`M ${120 + ex} 52 L ${142 + ex} 56`} />
        </g>
      ) : mood === "smug" ? (
        <g stroke={PAPER.ink} strokeWidth={4} strokeLinecap="round">
          <path d={`M ${80 + ex} 64 L ${100 + ex} 68`} />
          <path d={`M ${120 + ex} 66 L ${140 + ex} 60`} />
        </g>
      ) : null}
      {mouth}
      {/* Cheeks. */}
      <circle cx={78 + ex} cy={100} r={9} fill="#f29b8a" opacity={0.5} />
      <circle cx={142 + ex} cy={100} r={9} fill="#f29b8a" opacity={0.5} />
      {shock ? <path d="M 170 40 q 10 18 0 26 q -10 -8 0 -26 Z" fill="#7cc4f2" /> : null}
    </svg>
  );
};

// Sedan in side view, viewBox 0 0 640 260, front to the right.
export const Car: React.FC<{ wheelTurn: number; hoodOpen?: number }> = ({ wheelTurn, hoodOpen = 0 }) => {
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} 200) rotate(${wheelTurn})`}>
      <circle r={50} fill={PAPER.tire} />
      <circle r={28} fill={PAPER.hub} />
      {[0, 72, 144, 216, 288].map((a) => (
        <rect key={a} x={-4} y={-26} width={8} height={22} fill="#8d939b" transform={`rotate(${a})`} />
      ))}
      <circle r={7} fill="#6b7078" />
    </g>
  );
  return (
    <svg viewBox="0 0 640 260" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <path d="M 30 190 Q 26 140 70 128 L 170 118 Q 220 60 300 56 L 420 56 Q 470 58 510 118 L 590 130 Q 622 138 620 186 L 612 204 H 40 Z" fill={PAPER.carRed} />
      <path d="M 40 196 H 612 L 606 210 H 46 Z" fill={PAPER.carRedShade} />
      {/* Windows. */}
      <path d="M 190 120 Q 232 72 296 70 L 352 70 L 352 120 Z" fill={PAPER.glass} />
      <path d="M 366 70 L 418 70 Q 456 74 486 120 L 366 120 Z" fill={PAPER.glass} />
      {/* Door lines, handle, lights. */}
      <path d="M 358 70 V 196 M 236 124 V 196" stroke={PAPER.carRedShade} strokeWidth={4} />
      <rect x={300} y={136} width={30} height={8} rx={4} fill={PAPER.carRedShade} />
      <rect x={596} y={140} width={22} height={18} rx={6} fill="#ffe9a8" />
      <rect x={30} y={146} width={16} height={18} rx={5} fill="#ff6b5e" />
      {/* Hood lid (opens upward around the windscreen base). */}
      <g transform={`rotate(${-38 * hoodOpen} 512 118)`}>
        <path d="M 512 118 L 590 130 Q 612 134 616 146 L 516 132 Z" fill={PAPER.carRedShade} opacity={hoodOpen > 0 ? 1 : 0} />
      </g>
      {wheel(150)}
      {wheel(500)}
    </svg>
  );
};

// Long receipt that unrolls (unroll 0..1), viewBox 0 0 360 1000.
export const Invoice: React.FC<{ unroll: number; total: string; totalLabel: string; showTotal: boolean }> = ({ unroll, total, totalLabel, showTotal }) => {
  const h = 160 + 840 * ease(unroll);
  const rows = Math.floor((h - 260) / 56);
  return (
    <svg viewBox="0 0 360 1000" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <path d={`M 0 0 H 360 V ${h} l -20 14 l -20 -14 l -20 14 l -20 -14 l -20 14 l -20 -14 l -20 14 l -20 -14 l -20 14 l -20 -14 l -20 14 l -20 -14 l -20 14 l -20 -14 l -20 14 l -20 -14 l -20 14 l -20 -14 Z`} fill="#ffffff" />
      <rect x={30} y={40} width={180} height={18} rx={9} fill="#cfcfcf" />
      {Array.from({ length: Math.max(0, rows) }, (_, i) => (
        <g key={i}>
          <rect x={30} y={100 + i * 56} width={150 + ((i * 53) % 60)} height={14} rx={7} fill="#e0e0e0" />
          <rect x={250} y={100 + i * 56} width={80} height={14} rx={7} fill="#d6d6d6" />
        </g>
      ))}
      {showTotal ? (
        <g>
          <path d={`M 20 ${h - 120} H 340`} stroke={PAPER.ink} strokeWidth={3} strokeDasharray="10 8" />
          <text x={30} y={h - 75} fontFamily={FONTS.body} fontWeight={700} fontSize={30} fill={PAPER.ink}>
            {totalLabel}
          </text>
          <text x={330} y={h - 30} textAnchor="end" fontFamily={FONTS.headline} fontSize={58} fill={PAPER.inkRed}>
            {total}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

// Hanging price tag with a big question mark, viewBox 0 0 300 360.
export const PriceTag: React.FC = () => (
  <svg viewBox="0 0 300 360" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <path d="M 150 0 V 70" stroke={PAPER.ink} strokeWidth={4} />
    <path d="M 70 110 L 150 60 L 230 110 V 340 H 70 Z" fill={PAPER.kraft} />
    <circle cx={150} cy={100} r={12} fill={PAPER.board} />
    <text x={150} y={290} textAnchor="middle" fontFamily={FONTS.headline} fontSize={190} fill={PAPER.ink}>
      ?
    </text>
  </svg>
);

// Paper curtain drawn over something hidden, viewBox 0 0 420 300.
export const Curtain: React.FC<{ close: number }> = ({ close }) => {
  const w = 210 * ease(close);
  return (
    <svg viewBox="0 0 420 300" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <rect x={0} y={0} width={420} height={18} rx={9} fill={PAPER.ink} />
      <path d={`M 0 18 H ${w} Q ${w - 20} 160 ${w} 300 H 0 Z`} fill={PAPER.inkBlue} />
      <path d={`M 420 18 H ${420 - w} Q ${440 - w} 160 ${420 - w} 300 H 420 Z`} fill={PAPER.inkBlue} />
      {close > 0.9 ? (
        <text x={210} y={200} textAnchor="middle" fontFamily={FONTS.headline} fontSize={150} fill="#ffffff">
          ?
        </text>
      ) : null}
    </svg>
  );
};

// Spark plug, viewBox 0 0 80 240; `dirty` darkens the tip with soot.
export const SparkPlug: React.FC<{ dirty: boolean }> = ({ dirty }) => (
  <svg viewBox="0 0 80 240" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <rect x={30} y={0} width={20} height={26} rx={4} fill={PAPER.metal} />
    <path d="M 24 26 H 56 L 52 110 H 28 Z" fill="#f4f1ea" />
    {[44, 62, 80].map((y) => (
      <rect key={y} x={22} y={y} width={36} height={6} rx={3} fill="#e2ddd2" />
    ))}
    <path d="M 12 110 H 68 L 64 140 H 16 Z" fill={PAPER.metal} />
    <rect x={20} y={140} width={40} height={60} fill="#7b828b" />
    {[148, 160, 172, 184].map((y) => (
      <rect key={y} x={18} y={y} width={44} height={4} fill="#5d636b" />
    ))}
    <rect x={36} y={200} width={8} height={20} fill={dirty ? PAPER.soot : "#c9ccd1"} />
    <path d="M 52 200 V 230 H 36" stroke={dirty ? PAPER.soot : "#c9ccd1"} strokeWidth={6} fill="none" />
    {dirty ? <ellipse cx={40} cy={214} rx={20} ry={14} fill={PAPER.soot} opacity={0.6} /> : null}
  </svg>
);

// Mitten hand reaching in from the right, viewBox 0 0 260 120.
export const Hand: React.FC<{ sleeve?: string }> = ({ sleeve = PAPER.carRed }) => (
  <svg viewBox="0 0 260 120" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <rect x={130} y={30} width={130} height={60} rx={14} fill={sleeve} />
    <path d="M 140 30 Q 60 20 40 40 Q 18 60 40 80 Q 70 100 140 90 Z" fill={PAPER.skin} />
    <path d="M 70 32 Q 52 6 76 4 Q 92 8 96 30" fill={PAPER.skin} />
  </svg>
);

export const Bin: React.FC = () => (
  <svg viewBox="0 0 240 280" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <rect x={10} y={20} width={220} height={26} rx={10} fill="#6f7680" />
    <path d="M 26 46 H 214 L 196 276 H 44 Z" fill="#8b929c" />
    {[70, 120, 170].map((x) => (
      <path key={x} d={`M ${x} 70 V 250`} stroke="#6f7680" strokeWidth={8} strokeLinecap="round" />
    ))}
  </svg>
);

export const Magnifier: React.FC = () => (
  <svg viewBox="0 0 260 260" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <circle cx={100} cy={100} r={78} fill="rgba(169, 212, 240, 0.45)" stroke={PAPER.ink} strokeWidth={14} />
    <path d="M 158 158 L 240 240" stroke={PAPER.ink} strokeWidth={26} strokeLinecap="round" />
    <path d="M 60 80 Q 70 50 100 44" stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" />
  </svg>
);

// Workshop sign board (no text: just a wrench pictogram), viewBox 0 0 360 160.
export const ShopSign: React.FC = () => (
  <svg viewBox="0 0 360 160" style={{ width: "100%", height: "100%", overflow: "visible" }}>
    <rect x={20} y={0} width={10} height={160} fill="#6f7680" />
    <rect x={330} y={0} width={10} height={160} fill="#6f7680" />
    <rect x={0} y={10} width={360} height={110} rx={12} fill={PAPER.ink} />
    <g transform="translate(180 65) rotate(-35)">
      <rect x={-70} y={-9} width={120} height={18} rx={9} fill="#ffffff" />
      <path d="M 50 -28 a 30 30 0 1 1 0 56 l 0 -16 a 14 14 0 1 0 0 -24 Z" fill="#ffffff" />
    </g>
  </svg>
);
