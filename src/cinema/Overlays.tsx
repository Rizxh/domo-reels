// Text layer of the cinema format, React on top of the live 3D picture.
// Every text enters on its cue word and leaves at the end of its beat, or
// earlier when a later text takes its place (a figure replaces the digits).
// Callouts and digit boxes are projected through the same camera as the 3D
// render, so they stay glued to the tire.

import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CinemaEpisode, CinemaText } from "../cinemaSchema";
import { BRAND_ASSETS, CINEMA, COLORS, FONT_WEIGHTS, FONTS, LINE_HEIGHT, SAFE_AREA, VIDEO } from "../lib/brand";
import { CINEMA_TIMING, SPRINGS } from "../lib/timing";
import { projectToScreen, type CamState, type Vec3 } from "./rig";
import type { CueMap } from "./timeline";

export type Projector = {
  cam: CamState;
  anchor: (name: string) => Vec3 | null;
  // Screen polygon (world corners) highlighting a named region.
  region: (name: string) => Vec3[] | null;
};

type Placed = { text: CinemaText; from: number; to: number };

// When each text is on screen.
export const placeTexts = (ep: CinemaEpisode, cues: CueMap): Placed[] => {
  const out: Placed[] = [];
  ep.beats.forEach((beat) => {
    const end = cues[`${beat.id}:end`];
    beat.texts.forEach((text) => {
      const from = cues[text.id];
      // A figure replaces everything shown before it in its beat (except a
      // CTA handle); a callout replaces the previous callout.
      const replacedBy = beat.texts.find(
        (t) =>
          cues[t.id] > from &&
          ((t.style === "figure" && text.style !== "handle") || (t.style === "callout" && text.style === "callout")),
      );
      out.push({ text, from, to: replacedBy ? cues[replacedBy.id] : end });
    });
  });
  return out;
};

const useEnter = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  const enter = spring({ frame: t, fps, config: SPRINGS.pop, durationInFrames: CINEMA_TIMING.textInFrames + 6 });
  const exit = interpolate(frame, [to - CINEMA_TIMING.textOutFrames, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { t, enter, opacity: Math.min(1, t / 3 + 0.2) * exit, visible: frame >= from && frame < to };
};

const headline: React.CSSProperties = {
  fontFamily: FONTS.headline,
  lineHeight: LINE_HEIGHT.tight,
  textTransform: "uppercase",
  textShadow: CINEMA.shadow,
  margin: 0,
};

// Mask wipe from below: the line rises into its own box.
const Rise: React.FC<{ enter: number; children: React.ReactNode }> = ({ enter, children }) => (
  <div style={{ overflow: "hidden", paddingBottom: 8 }}>
    <div style={{ transform: `translateY(${(1 - enter) * 105}%)` }}>{children}</div>
  </div>
);

const Kicker: React.FC<{ text: string; to: number }> = ({ text, to }) => {
  const { opacity } = useEnter(0, to);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        top: CINEMA.kickerTop,
        fontFamily: FONTS.body,
        fontWeight: FONT_WEIGHTS.bold,
        fontSize: CINEMA.kickerSize,
        letterSpacing: CINEMA.kickerSpacing,
        color: COLORS.red,
        textShadow: CINEMA.shadow,
        opacity: Math.max(opacity, 0),
      }}
    >
      {text}
    </div>
  );
};

const TitleStack: React.FC<{ items: Placed[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const shown = items.filter((p) => frame >= p.from && frame < p.to);
  if (shown.length === 0) {
    return null;
  }
  return (
    <div style={{ position: "absolute", left: SAFE_AREA.x, top: CINEMA.titleTop, width: SAFE_AREA.width }}>
      {shown.map((p) => (
        <TitleLine key={p.text.id} placed={p} />
      ))}
    </div>
  );
};

const TitleLine: React.FC<{ placed: Placed }> = ({ placed }) => {
  const { text, from, to } = placed;
  const { enter, opacity } = useEnter(from, to);
  if (text.style === "note") {
    return (
      <div
        style={{
          marginTop: CINEMA.noteGap,
          fontFamily: FONTS.body,
          fontWeight: FONT_WEIGHTS.semibold,
          fontSize: CINEMA.noteSize,
          color: COLORS.white,
          textShadow: CINEMA.shadow,
          opacity: opacity * enter,
        }}
      >
        {text.text}
      </div>
    );
  }
  const size = text.style === "label" ? CINEMA.labelSize : CINEMA.titleSize;
  return (
    <div style={{ marginBottom: text.style === "label" ? CINEMA.labelGap : CINEMA.titleGap, opacity }}>
      <Rise enter={enter}>
        <p style={{ ...headline, fontSize: size, color: text.accent ? COLORS.red : COLORS.white }}>{text.text}</p>
      </Rise>
    </div>
  );
};

const clampX = (x: number, margin: number) => Math.min(SAFE_AREA.x + SAFE_AREA.width - margin, Math.max(SAFE_AREA.x + margin, x));

const Callout: React.FC<{ placed: Placed; proj: Projector }> = ({ placed, proj }) => {
  const { text, from, to } = placed;
  const { t, enter, opacity } = useEnter(from, to);
  const a = text.anchor ? proj.anchor(text.anchor) : null;
  const p = a ? projectToScreen(proj.cam, a, VIDEO.width, VIDEO.height) : null;
  const draw = Math.min(1, Math.max(0, t / CINEMA_TIMING.lineDrawFrames));
  const labelY = CINEMA.titleTop;
  const labelBottom = labelY + CINEMA.calloutSize + 12;
  return (
    <>
      <svg width={VIDEO.width} height={VIDEO.height} style={{ position: "absolute", inset: 0, opacity }}>
        {p ? (
          <>
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={CINEMA.ringRadius * CINEMA.ringAspect}
              ry={CINEMA.ringRadius}
              fill="none"
              stroke={COLORS.red}
              strokeWidth={CINEMA.lineWidth}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
            />
            <line
              x1={clampX(p.x, 40)}
              y1={labelBottom}
              x2={p.x}
              y2={labelBottom + (p.y - CINEMA.ringRadius - labelBottom) * draw}
              stroke={COLORS.red}
              strokeWidth={CINEMA.lineWidth}
            />
          </>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: SAFE_AREA.x, top: labelY, width: SAFE_AREA.width, opacity }}>
        {text.sub ? (
          <div
            style={{
              position: "absolute",
              top: -CINEMA.kickerSize - 14,
              fontFamily: FONTS.body,
              fontWeight: FONT_WEIGHTS.bold,
              fontSize: CINEMA.kickerSize,
              letterSpacing: CINEMA.kickerSpacing,
              color: COLORS.red,
              textShadow: CINEMA.shadow,
            }}
          >
            {text.sub}
          </div>
        ) : null}
        <Rise enter={enter}>
          <p style={{ ...headline, fontSize: CINEMA.calloutSize, color: text.accent ? COLORS.red : COLORS.white }}>{text.text}</p>
        </Rise>
      </div>
    </>
  );
};

const Digit: React.FC<{ placed: Placed; proj: Projector; side: "left" | "right" }> = ({ placed, proj, side }) => {
  const { text, from, to } = placed;
  const { t, enter, opacity } = useEnter(from, to);
  const corners = text.anchor ? proj.region(text.anchor) : null;
  const pts = (corners ?? []).map((c) => projectToScreen(proj.cam, c, VIDEO.width, VIDEO.height));
  const ok = pts.length === 4 && pts.every(Boolean);
  const draw = Math.min(1, Math.max(0, t / CINEMA_TIMING.lineDrawFrames));
  const poly = ok ? pts.map((q) => `${q!.x},${q!.y}`).join(" ") : "";
  // Leader lands on the middle of the box's top edge.
  const top = ok
    ? (() => {
        const [p1, p2] = [...pts].sort((u, v) => u!.y - v!.y);
        return { x: (p1!.x + p2!.x) / 2, y: (p1!.y + p2!.y) / 2 };
      })()
    : null;
  const blockX = side === "left" ? SAFE_AREA.x : SAFE_AREA.x + SAFE_AREA.width / 2 + 20;
  const blockBottom = CINEMA.titleTop + CINEMA.digitSize + CINEMA.digitSubSize + 10;
  return (
    <>
      <svg width={VIDEO.width} height={VIDEO.height} style={{ position: "absolute", inset: 0, opacity }}>
        {ok && top ? (
          <>
            <polygon points={poly} fill="rgba(227, 30, 36, 0.12)" stroke={COLORS.red} strokeWidth={CINEMA.lineWidth} strokeLinejoin="round" opacity={draw} />
            <line
              x1={blockX + 50}
              y1={blockBottom + 12}
              x2={blockX + 50 + (top.x - blockX - 50) * draw}
              y2={blockBottom + 12 + (top.y - blockBottom - 18) * draw}
              stroke={COLORS.red}
              strokeWidth={CINEMA.lineWidth}
            />
          </>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: blockX, top: CINEMA.titleTop, opacity }}>
        <Rise enter={enter}>
          <p style={{ ...headline, fontSize: CINEMA.digitSize, color: COLORS.red }}>{text.text}</p>
        </Rise>
        <Rise enter={enter}>
          <p style={{ ...headline, fontSize: CINEMA.digitSubSize, color: COLORS.white }}>{text.sub}</p>
        </Rise>
      </div>
    </>
  );
};

const Figure: React.FC<{ placed: Placed }> = ({ placed }) => {
  const { text, from, to } = placed;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { enter, opacity } = useEnter(from, to);
  const slam = text.accent ? spring({ frame: frame - from, fps, config: SPRINGS.slam }) : 1;
  const scale = text.accent ? interpolate(slam, [0, 1], [1.5, 1]) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        top: CINEMA.figureTop,
        width: SAFE_AREA.width,
        textAlign: "center",
        opacity,
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "50% 40%" }}>
        <Rise enter={text.accent ? 1 : enter}>
          {/* Copy is already cased in the episode file ("Rp499 RIBU"). */}
          <p style={{ ...headline, textTransform: "none", fontSize: text.accent ? CINEMA.figureAgeSize : CINEMA.figureSize, color: text.accent ? COLORS.red : COLORS.white }}>{text.text}</p>
        </Rise>
      </div>
      {text.sub ? (
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: FONT_WEIGHTS.bold,
            fontSize: CINEMA.figureSubSize,
            letterSpacing: CINEMA.kickerSpacing,
            color: COLORS.white,
            textShadow: CINEMA.shadow,
            marginTop: 8,
            opacity: enter,
          }}
        >
          {text.sub}
        </div>
      ) : null}
    </div>
  );
};

const Handle: React.FC<{ placed: Placed }> = ({ placed }) => {
  const { text, from, to } = placed;
  const { enter, opacity } = useEnter(from, to);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        top: CINEMA.handleTop,
        width: SAFE_AREA.width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 34,
        opacity,
        transform: `translateY(${(1 - enter) * 40}px)`,
      }}
    >
      <div style={{ backgroundColor: COLORS.white, borderRadius: CINEMA.logoRadius, padding: CINEMA.logoPadding }}>
        <Img src={staticFile(BRAND_ASSETS.logo)} style={{ width: CINEMA.logoWidth, display: "block" }} />
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: FONT_WEIGHTS.extrabold,
          fontSize: CINEMA.handleSize,
          color: COLORS.white,
          textShadow: CINEMA.shadow,
        }}
      >
        {text.text}
      </div>
    </div>
  );
};

export const CinemaOverlays: React.FC<{ ep: CinemaEpisode; cues: CueMap; proj: Projector }> = ({ ep, cues, proj }) => {
  const frame = useCurrentFrame();
  const placed = placeTexts(ep, cues);
  const live = (p: Placed) => frame >= p.from && frame < p.to;
  const stackStyles = new Set(["title", "label", "note"]);
  const ctaStart = cues["cta:start"];
  const handle = placed.find((p) => p.text.style === "handle");
  const scrimCta = handle
    ? interpolate(frame, [handle.from, handle.from + CINEMA_TIMING.ctaScrimFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  let digitSide = 0;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: CINEMA.scrim }} />
      {scrimCta > 0 ? <div style={{ position: "absolute", inset: 0, backgroundColor: CINEMA.ctaScrim, opacity: scrimCta }} /> : null}
      {frame < cues[`${ep.beats[0].id}:end`] ? <Kicker text={ep.tag} to={cues[`${ep.beats[0].id}:end`]} /> : null}
      {ep.beats.map((beat) => (
        <TitleStack key={beat.id} items={placed.filter((p) => stackStyles.has(p.text.style) && beat.texts.includes(p.text))} />
      ))}
      {placed.map((p) => {
        if (p.text.style === "digit") {
          const side = digitSide++ % 2 === 0 ? "left" : "right";
          return live(p) ? <Digit key={p.text.id} placed={p} proj={proj} side={side} /> : null;
        }
        if (!live(p)) {
          return null;
        }
        switch (p.text.style) {
          case "callout":
            return <Callout key={p.text.id} placed={p} proj={proj} />;
          case "figure":
            return <Figure key={p.text.id} placed={p} />;
          case "handle":
            return frame >= ctaStart ? <Handle key={p.text.id} placed={p} /> : null;
          default:
            return null;
        }
      })}
    </>
  );
};
