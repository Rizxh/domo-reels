// Shared pieces of "soft" shots (Kok Bisa-style explainers with our own calm
// look): the shot context (time, frame, word cues), the shot definition and
// small text helpers. Every beat is cued on a spoken word: c.w("word", n).

import { FONT, k, L } from "./kit";

export const W = 1080;
export const H = 1920;

export type Word = { w: string; t: number };
export type Ctx = { sec: number; f: number; len: number; w: (word: string, n?: number, fallback?: number) => number };

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
export const makeCtx = (sec: number, f: number, len: number, words: Word[]): Ctx => ({
  sec,
  f,
  len,
  w: (word, n = 0, fallback = 0) => {
    const hits = words.filter((x) => norm(x.w).startsWith(norm(word)));
    return hits[n]?.t ?? fallback;
  },
});

// A shot: the camera depth it settles at (or a function of time for shots
// that move the camera themselves), its drawing, and the source of the facts
// it shows (rendered as a small "Sumber: ..." chip).
export type ShotDef = {
  depth: number;
  depthAt?: (c: Ctx) => number;
  draw: (c: Ctx, d: number) => React.ReactNode;
  source?: string;
};

// Quick soft pop: fade + scale, used for every element that lands on a word.
export const pop = (sec: number, at: number, d = 0.4) => ({ o: k(sec, at - 0.05, d * 0.7), s: 0.6 + 0.4 * k(sec, at - 0.05, d) });

export const Big: React.FC<{ x: number; y: number; text: string; size: number; o?: number; color?: string }> = ({ x, y, text, size, o = 1, color = L.ink }) =>
  o <= 0 ? null : (
    <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={size} fill={color} opacity={o} style={{ letterSpacing: "-0.02em" }} filter="url(#lsoft)">
      {text}
    </text>
  );

export const SourceChip: React.FC<{ text: string; o: number }> = ({ text, o }) => {
  if (o <= 0) return null;
  const label = `Sumber: ${text}`;
  const w = label.length * 15 + 48;
  return (
    <g opacity={o * 0.92} transform="translate(540 1430)">
      <rect x={-w / 2} y={-26} width={w} height={50} rx={25} fill={L.ink} opacity={0.55} />
      <text x={0} y={7} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={26} fill={L.cream}>
        {label}
      </text>
    </g>
  );
};
