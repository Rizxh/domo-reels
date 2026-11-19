// 2D paper kit: the building blocks of the whiteboard format. Everything is
// a pure function of the frame (`t` = frames since the element's cue), so
// any element can be reused in a new scene by giving it a position and a cue.
//
//   <PaperDefs/>        filters once per composition (ragged edge + shadow)
//   <Cutout>            wraps any drawing so it looks cut from paper
//   <Sticky>            yellow sticky note slapped on the board
//   <MarkerPath>        a hand-drawn stroke that draws itself
//   <MarkerTitle>       big Anton words written on, with an underline
//   <Stamp>             rubber stamp that slams in
//   <Bubble>            paper speech bubble that pops in
//   <Tape>              strip of tape holding a card

import { random, spring } from "remotion";
import { FONT_WEIGHTS, FONTS, PAPER } from "../lib/brand";

export const FPS_SPRING = 30;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));
export const pop = (t: number, damping = 12) =>
  t < 0 ? 0 : spring({ frame: t, fps: FPS_SPRING, config: { damping, stiffness: 180, mass: 0.7 } });

const FILTER_SEEDS = [3, 7, 11, 19];
export const paperFilter = (seed = 0) => `url(#paper-${seed % FILTER_SEEDS.length})`;

export const PaperDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      {FILTER_SEEDS.map((seed, i) => (
        <filter key={seed} id={`paper-${i}`} x="-10%" y="-10%" width="125%" height="130%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={PAPER.edgeFrequency} numOctaves={2} seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={PAPER.edgeScale} xChannelSelector="R" yChannelSelector="G" result="cut" />
          <feFlood floodColor={PAPER.shadow} result="ink" />
          <feComposite in="ink" in2="cut" operator="in" result="shade" />
          <feGaussianBlur in="shade" stdDeviation={3} result="soft" />
          <feOffset in="soft" dx={PAPER.shadowX} dy={PAPER.shadowY} result="drop" />
          <feMerge>
            <feMergeNode in="drop" />
            <feMergeNode in="cut" />
          </feMerge>
        </filter>
      ))}
      {/* Marker: slightly wobbly edges on strokes. */}
      <filter id="marker" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency={0.09} numOctaves={1} seed={5} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.5} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);

// Placement on the board: centre position, rotation (deg), scale.
export type Place = { x: number; y: number; rot?: number; scale?: number };

// Generic animated wrapper: pops in (scale) at t >= 0, hidden before.
export const Cutout: React.FC<{
  place: Place;
  t: number;
  width: number;
  height: number;
  seed?: number;
  enter?: "pop" | "drop" | "slideLeft" | "slideRight" | "none";
  // Small idle sway (degrees) so a held cut-out still breathes.
  sway?: number;
  children: React.ReactNode;
}> = ({ place, t, width, height, seed = 0, enter = "pop", sway = 0.6, children }) => {
  if (t < 0 && enter !== "none") {
    return null;
  }
  const p = enter === "none" ? 1 : pop(t);
  let dx = 0;
  let dy = 0;
  let s = 1;
  if (enter === "pop") s = 0.6 + 0.4 * p;
  if (enter === "drop") dy = -260 * (1 - p);
  if (enter === "slideLeft") dx = -700 * (1 - p);
  if (enter === "slideRight") dx = 700 * (1 - p);
  const wobble = Math.sin((t + seed * 13) / 22) * sway;
  return (
    <div
      style={{
        position: "absolute",
        left: place.x - width / 2,
        top: place.y - height / 2,
        width,
        height,
        transform: `translate(${dx}px, ${dy}px) rotate(${(place.rot ?? 0) + wobble}deg) scale(${(place.scale ?? 1) * s})`,
        opacity: enter === "pop" ? Math.min(1, p * 2) : 1,
        filter: paperFilter(seed),
      }}
    >
      {children}
    </div>
  );
};

export const Sticky: React.FC<{ place: Place; t: number; text: string; color?: string; width?: number; seed?: number; fontSize?: number }> = ({
  place,
  t,
  text,
  color = PAPER.sticky,
  width = 340,
  seed = 1,
  fontSize = PAPER.stickySize,
}) => (
  <Cutout place={place} t={t} width={width} height={width} seed={seed} enter="drop">
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(170deg, ${color} 0%, ${color} 82%, rgba(0,0,0,0.06) 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 28,
        boxSizing: "border-box",
        fontFamily: FONTS.headline,
        fontSize,
        lineHeight: 1.02,
        color: PAPER.ink,
      }}
    >
      {text}
    </div>
  </Cutout>
);

// A stroke that draws itself over `frames` frames from t = 0.
export const MarkerPath: React.FC<{
  d: string;
  t: number;
  frames?: number;
  color?: string;
  width?: number;
  viewBox: string;
  style?: React.CSSProperties;
}> = ({ d, t, frames = 12, color = PAPER.inkRed, width = PAPER.markerWidth, viewBox, style }) => {
  if (t < 0) return null;
  const k = ease(t / frames);
  return (
    <svg viewBox={viewBox} style={{ position: "absolute", overflow: "visible", ...style }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} filter="url(#marker)" />
    </svg>
  );
};

// Hand-drawn loop around a box (w x h) centred at the element it surrounds.
export const circleAround = (w: number, h: number, seed: string) => {
  const j = (k: string) => (random(`${seed}-${k}`) - 0.5) * 0.08;
  const rx = w / 2;
  const ry = h / 2;
  const pts = Array.from({ length: 9 }, (_, i) => {
    const a = -Math.PI * 0.8 + (i / 8) * Math.PI * 2.15;
    return [rx + Math.cos(a) * rx * (1 + j(`x${i}`)), ry + Math.sin(a) * ry * (1 + j(`y${i}`))];
  });
  return `M ${pts.map((p) => p.join(" ")).join(" L ")}`;
};

// Big words written on left to right, then underlined.
export const MarkerTitle: React.FC<{
  x: number;
  y: number;
  width: number;
  t: number;
  text: string;
  color?: string;
  size?: number;
  underline?: string | null;
  align?: "left" | "center";
}> = ({ x, y, width, t, text, color = PAPER.ink, size = PAPER.titleSize, underline = PAPER.inkRed, align = "left" }) => {
  if (t < 0) return null;
  const write = ease(t / 14);
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      <div
        style={{
          fontFamily: FONTS.headline,
          fontSize: size,
          lineHeight: 1.0,
          color,
          textAlign: align,
          clipPath: `inset(0 ${(1 - write) * 100}% 0 0)`,
          filter: "url(#marker)",
        }}
      >
        {text.replace(/-/g, "\u2011")}
      </div>
      {underline ? (
        <MarkerPath
          d="M 4 14 C 200 4, 420 22, 700 8"
          viewBox="0 0 704 28"
          t={t - 10}
          frames={10}
          color={underline}
          style={{ left: align === "center" ? "10%" : 0, width: align === "center" ? "80%" : "86%", height: 28, top: "100%", marginTop: 6 }}
        />
      ) : null}
    </div>
  );
};

export const Stamp: React.FC<{ place: Place; t: number; text: string; color?: string }> = ({ place, t, text, color = PAPER.inkRed }) => {
  if (t < 0) return null;
  const s = pop(t, 9);
  const scale = 1.8 - 0.8 * s;
  return (
    <div
      style={{
        position: "absolute",
        left: place.x,
        top: place.y,
        transform: `translate(-50%, -50%) rotate(${place.rot ?? -12}deg) scale(${scale * (place.scale ?? 1)})`,
        opacity: Math.min(1, s * 2),
        border: `10px solid ${color}`,
        borderRadius: 18,
        padding: "10px 34px",
        fontFamily: FONTS.headline,
        fontSize: 96,
        letterSpacing: "0.04em",
        color,
        whiteSpace: "nowrap",
        mixBlendMode: "multiply",
        filter: "url(#marker)",
      }}
    >
      {text}
    </div>
  );
};

export const Bubble: React.FC<{ place: Place; t: number; text: string; width?: number; tail?: "left" | "right"; color?: string; size?: number }> = ({
  place,
  t,
  text,
  width = 520,
  tail = "left",
  color = PAPER.ink,
  size = 76,
}) => (
  <Cutout place={place} t={t} width={width} height={width * 0.5} seed={2}>
    <svg viewBox="0 0 520 260" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <path
        d={
          tail === "left"
            ? "M 40 20 H 480 Q 510 20 510 50 V 170 Q 510 200 480 200 H 150 L 70 255 L 95 200 H 40 Q 10 200 10 170 V 50 Q 10 20 40 20 Z"
            : "M 40 20 H 480 Q 510 20 510 50 V 170 Q 510 200 480 200 H 425 L 450 255 L 370 200 H 40 Q 10 200 10 170 V 50 Q 10 20 40 20 Z"
        }
        fill="#ffffff"
        stroke={PAPER.ink}
        strokeWidth={6}
      />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "77%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.headline,
        fontSize: size,
        color,
      }}
    >
      {text}
    </div>
  </Cutout>
);

export const Tape: React.FC<{ x: number; y: number; rot: number; width?: number }> = ({ x, y, rot, width = 170 }) => (
  <div
    style={{
      position: "absolute",
      left: x - width / 2,
      top: y - 22,
      width,
      height: 44,
      background: PAPER.tape,
      transform: `rotate(${rot}deg)`,
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    }}
  />
);

// Paper card the panel's content sits on.
export const Card: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; seed?: number; color?: string; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  rot = 0,
  seed = 0,
  color = PAPER.card,
  children,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)` }}>
    <div style={{ position: "absolute", inset: 0, background: color, filter: paperFilter(seed) }} />
    <Tape x={60} y={12} rot={-28} />
    <Tape x={w - 60} y={12} rot={26} />
    {children}
  </div>
);

export const Note: React.FC<{ x: number; y: number; t: number; text: string; size?: number; color?: string; weight?: number }> = ({
  x,
  y,
  t,
  text,
  size = PAPER.noteSize,
  color = PAPER.ink,
  weight = FONT_WEIGHTS.semibold,
}) => {
  if (t < 0) return null;
  const k = ease(t / 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: FONTS.body,
        fontWeight: weight,
        fontSize: size,
        color,
        whiteSpace: "nowrap",
        clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`,
      }}
    >
      {text}
    </div>
  );
};
