import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  COLORS,
  FONT_WEIGHTS,
  FONTS,
  LINK_CUE,
  SAFE_AREA,
} from "../../lib/brand";
import { SPRINGS, TALKING_HEAD_TIMING } from "../../lib/timing";
import type { Window } from "../timeline";

// White pill with a label, chevrons below it fall in a loop toward the
// bottom of the screen where the link lives.
export const LinkCue: React.FC<Window & { label: string }> = ({
  label,
  startFrame,
  endFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = TALKING_HEAD_TIMING;
  const t = frame - startFrame;
  const pop = spring({ frame: t, fps, config: SPRINGS.pop });
  const exit = interpolate(frame, [endFrame - T.exitFrames, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        width: SAFE_AREA.width,
        top: LINK_CUE.top,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: (1 - exit) * Math.min(pop * 2, 1),
        transform: `translateY(${(1 - pop) * 40 + exit * 30}px) scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.white,
          color: COLORS.black,
          borderRadius: LINK_CUE.radius,
          padding: `${LINK_CUE.paddingY}px ${LINK_CUE.paddingX}px`,
          fontFamily: FONTS.body,
          fontWeight: FONT_WEIGHTS.extrabold,
          fontSize: LINK_CUE.fontSize,
          textTransform: "uppercase",
          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
        }}
      >
        {label}
      </div>
      <svg
        width={LINK_CUE.chevronSize * 2}
        height={
          (LINK_CUE.chevronSize / 2 + LINK_CUE.chevronGap) *
            LINK_CUE.chevronCount +
          LINK_CUE.chevronGap
        }
        style={{ marginTop: LINK_CUE.chevronGap * 2 }}
        fill="none"
        stroke={COLORS.white}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {Array.from({ length: LINK_CUE.chevronCount }, (_, i) => {
          // Each chevron lights up in turn, top to bottom.
          const phase =
            ((t - i * (T.chevronPeriodFrames / LINK_CUE.chevronCount)) %
              T.chevronPeriodFrames) /
            T.chevronPeriodFrames;
          const glow = interpolate(
            phase < 0 ? phase + 1 : phase,
            [0, 0.25, 0.7, 1],
            [0.25, 1, 0.25, 0.25],
          );
          const y = i * (LINK_CUE.chevronSize / 2 + LINK_CUE.chevronGap) + 6;
          const s = LINK_CUE.chevronSize;
          return (
            <path
              key={i}
              d={`M ${s * 0.4} ${y} L ${s} ${y + s / 2.4} L ${s * 1.6} ${y}`}
              opacity={glow}
              stroke={i === LINK_CUE.chevronCount - 1 ? COLORS.red : COLORS.white}
            />
          );
        })}
      </svg>
    </div>
  );
};
