import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  COLORS,
  FONTS,
  ICON,
  LETTER_SPACING,
  LINE_HEIGHT,
  SERIES_COPY,
  STAMP,
  TYPE,
} from "../lib/brand";
import { ANIM, SPRINGS } from "../lib/timing";
import { Icon } from "./Icon";

// Rubber stamp that slams onto the screen: red and tilted for MITOS, white with
// a check for FAKTA.
export const Stamp: React.FC<{ variant: "myth" | "fact" }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({
    frame: frame - ANIM.stampDelayInFrames,
    fps,
    config: SPRINGS.slam,
  });

  const scale = interpolate(slam, [0, 1], [STAMP.scaleFrom, 1]);
  const opacity = interpolate(slam, [0, 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isMyth = variant === "myth";
  const color = isMyth ? COLORS.red : COLORS.white;
  const rotation = isMyth ? STAMP.rotationMythDeg : STAMP.rotationFactDeg;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: STAMP.paddingX / 2,
        alignSelf: "flex-start",
        padding: `${STAMP.paddingY}px ${STAMP.paddingX}px`,
        border: `${STAMP.borderWidth}px solid ${color}`,
        borderRadius: STAMP.radius,
        color,
        fontFamily: FONTS.headline,
        fontSize: TYPE.stamp,
        lineHeight: LINE_HEIGHT.snug,
        letterSpacing: LETTER_SPACING.stamp,
        opacity,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        transformOrigin: "30% 50%",
      }}
    >
      {isMyth ? null : (
        <Icon
          name="check"
          size={STAMP.checkSize}
          color={color}
          strokeWidth={ICON.boldStrokeWidth}
        />
      )}
      {SERIES_COPY[variant]}
    </div>
  );
};
