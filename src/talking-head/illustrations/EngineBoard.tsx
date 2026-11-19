import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  BOARD,
  COLORS,
  ENGINE_CARD,
  FONT_WEIGHTS,
  FONTS,
  LETTER_SPACING,
  LINE_HEIGHT,
  SAFE_AREA,
  TINTS,
} from "../../lib/brand";
import { TALKING_HEAD_TIMING } from "../../lib/timing";
import type { EnginePart } from "../../talkingHeadSchema";
import { presence, schedulePhases, type Window } from "../timeline";
import { EngineCutaway } from "./EngineCutaway";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

type BoardPart = {
  part: EnginePart;
  label: string;
  note: string;
  // Frame the part is spoken.
  spokenFrame: number;
};

// One focus line under the drawing: index, name and note for the current
// part, then the summary. Steps cross-fade and rise in.
const FocusStep: React.FC<{
  index: string | null;
  title: string;
  note: string;
  inFrame: number;
  outFrame: number | null;
}> = ({ index, title, note, inFrame, outFrame }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [inFrame, inFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const leave =
    outFrame === null
      ? 0
      : interpolate(frame, [outFrame, outFrame + 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const opacity = enter * (1 - leave);
  if (opacity <= 0) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        opacity,
        transform: `translateY(${(1 - enter) * 30 - leave * 12}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          fontFamily: FONTS.headline,
          fontSize: BOARD.focusNameSize,
          lineHeight: LINE_HEIGHT.tight,
          letterSpacing: LETTER_SPACING.headline,
          textTransform: "uppercase",
        }}
      >
        {index ? <span style={{ color: COLORS.red }}>{index}</span> : null}
        <span style={{ color: COLORS.white }}>{title}</span>
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: FONTS.body,
          fontWeight: FONT_WEIGHTS.semibold,
          fontSize: BOARD.focusNoteSize,
          lineHeight: LINE_HEIGHT.normal,
          color: TINTS.whiteMuted,
        }}
      >
        {note}
      </div>
    </div>
  );
};

// Split-screen explainer: the board slides down over the top of the frame
// while the speaker moves into the lower panel. Parts light up one by one
// with a readable minimum hold, then a summary line closes the board.
export const EngineBoard: React.FC<
  Window & {
    eyebrow: string;
    heading: string;
    parts: BoardPart[];
    summaryTitle: string;
    summary: string;
  }
> = ({ eyebrow, heading, parts, summaryTitle, summary, startFrame, endFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = TALKING_HEAD_TIMING;
  const minFrames = Math.round(T.minPartSeconds * fps);
  const slide = presence(
    frame,
    { startFrame, endFrame },
    T.splitFrames,
    T.splitFrames,
  );

  const phases = schedulePhases(
    parts.map((p) => p.spokenFrame),
    minFrames,
  );
  const summaryFrame = phases[phases.length - 1] + minFrames;
  const active = phases.filter((f) => frame >= f).length;
  const focusIndex = frame >= summaryFrame ? null : active - 1;
  const focus = focusIndex !== null && focusIndex >= 0 ? parts[focusIndex].part : null;
  const counterPop = interpolate(
    frame - (phases[active - 1] ?? startFrame),
    [0, 4, 10],
    [1, 1.18, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const contentWidth = SAFE_AREA.width;
  const diagramWidth = BOARD.diagramWidth;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: BOARD.height,
        backgroundColor: BOARD.fill,
        backgroundImage: `linear-gradient(${BOARD.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${BOARD.gridLine} 1px, transparent 1px)`,
        backgroundSize: `${BOARD.gridStep}px ${BOARD.gridStep}px`,
        boxShadow: BOARD.shadow,
        transform: `translateY(${-(1 - slide) * BOARD.height}px)`,
        overflow: "hidden",
      }}
    >
      {/* Heading row: eyebrow + title, counter on the right. */}
      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.x,
          top: SAFE_AREA.y - 20,
          width: contentWidth,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          whiteSpace: "nowrap",
          opacity: interpolate(frame - startFrame, [8, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: FONT_WEIGHTS.semibold,
              fontSize: BOARD.eyebrowSize,
              letterSpacing: LETTER_SPACING.label,
              textTransform: "uppercase",
              color: TINTS.whiteMuted,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: FONTS.headline,
              fontSize: BOARD.headingSize,
              lineHeight: LINE_HEIGHT.tight,
              letterSpacing: LETTER_SPACING.headline,
              textTransform: "uppercase",
              color: COLORS.white,
            }}
          >
            {heading}
          </div>
        </div>
        <div
          style={{
            fontFamily: FONTS.headline,
            fontSize: BOARD.counterSize,
            lineHeight: LINE_HEIGHT.tight,
            color: COLORS.red,
            transform: `scale(${counterPop})`,
            transformOrigin: "100% 100%",
          }}
        >
          {active}
          <span style={{ color: ENGINE_CARD.lineDim }}>/{parts.length}</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: BOARD.diagramLeft,
          top: BOARD.diagramTop,
        }}
      >
        <EngineCutaway
          width={diagramWidth}
          startFrame={startFrame}
          parts={parts.map((p, i) => ({
            part: p.part,
            label: p.label,
            frame: phases[i],
          }))}
          focus={focus}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.x,
          top: BOARD.focusTop,
          width: contentWidth,
        }}
      >
        {parts.map((p, i) => (
          <FocusStep
            key={p.part}
            index={String(i + 1).padStart(2, "0")}
            title={p.label}
            note={p.note}
            inFrame={phases[i]}
            outFrame={i + 1 < phases.length ? phases[i + 1] : summaryFrame}
          />
        ))}
        <FocusStep
          index={null}
          title={summaryTitle}
          note={summary}
          inFrame={summaryFrame}
          outFrame={null}
        />
      </div>
    </div>
  );
};
