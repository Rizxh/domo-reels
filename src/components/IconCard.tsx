import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CARD,
  COLORS,
  FONT_WEIGHTS,
  FONTS,
  ICON,
  LINE_HEIGHT,
  MOTION,
  TINTS,
  TYPE,
} from "../lib/brand";
import { ANIM, SPRINGS } from "../lib/timing";
import { LottieIcon } from "./LottieIcon";

// One reason row: plain icon (no colored chip) and label, sliding in with a
// stagger based on its index.
export const IconCard: React.FC<{
  icon: string;
  label: string;
  index: number;
  delayInFrames: number;
}> = ({ icon, label, index, delayInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delayInFrames - index * ANIM.staggerInFrames,
    fps,
    config: SPRINGS.pop,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: CARD.gap,
        padding: `${CARD.paddingY}px ${CARD.paddingX}px`,
        borderRadius: CARD.radius,
        backgroundColor: TINTS.whiteFaint,
        border: `1px solid ${TINTS.whiteLine}`,
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [MOTION.slideInPx, 0])}px)`,
      }}
    >
      <div style={{ flexShrink: 0, display: "flex" }}>
        <LottieIcon src={icon} size={ICON.cardSize} color={COLORS.white} />
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: FONT_WEIGHTS.bold,
          fontSize: TYPE.cardLabel,
          lineHeight: LINE_HEIGHT.normal,
          color: COLORS.white,
        }}
      >
        {label}
      </div>
    </div>
  );
};
