import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS, LINE_HEIGHT, TYPE } from "../lib/brand";
import { ANIM } from "../lib/timing";

// Counts from 0 to `to`, easing out so the last numbers land slowly.
export const Counter: React.FC<{ to: number; unit?: string }> = ({
  to,
  unit,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [
      ANIM.counterDelayInFrames,
      ANIM.counterDelayInFrames + ANIM.counterDurationInFrames,
    ],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
  const appear = interpolate(
    frame,
    [
      ANIM.counterDelayInFrames - ANIM.textRevealInFrames,
      ANIM.counterDelayInFrames,
    ],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: TYPE.label / 2,
        fontFamily: FONTS.headline,
        lineHeight: LINE_HEIGHT.tight,
        opacity: appear,
      }}
    >
      <span
        style={{
          fontSize: TYPE.counter,
          color: COLORS.white,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(progress * to)}
      </span>
      {unit ? (
        <span style={{ fontSize: TYPE.title, color: COLORS.red }}>{unit}</span>
      ) : null}
    </div>
  );
};
