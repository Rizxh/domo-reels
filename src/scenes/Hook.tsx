import { random, useCurrentFrame } from "remotion";
import { HighlightText } from "../components/HighlightText";
import {
  COLORS,
  FONT_WEIGHTS,
  FONTS,
  LETTER_SPACING,
  LINE_HEIGHT,
  MOTION,
  SERIES_COPY,
  TYPE,
} from "../lib/brand";
import { ANIM } from "../lib/timing";
import type { HookScene } from "../schema";
import { SceneShell, type SceneProps } from "./SceneShell";

// Seeded jitter in [-1, 1] for a given frame and axis.
const jitter = (frame: number, axis: "x" | "y"): number =>
  random(`hook-shake-${axis}-${frame}`) * 2 - 1;

// S1: stops the scroll. Everything is fully visible on frame 0 so the first
// frame works as the Reel cover; the headline shakes for a few frames after.
export const Hook: React.FC<SceneProps<HookScene>> = ({ scene, timing }) => {
  const frame = useCurrentFrame();
  const shaking = frame >= 1 && frame <= ANIM.hookShakeFrames;
  const dx = shaking ? jitter(frame, "x") * MOTION.shakePx : 0;
  const dy = shaking ? jitter(frame, "y") * MOTION.shakePx : 0;

  return (
    <SceneShell
      scene={scene}
      timing={timing}
      zoom={{
        from: 1,
        to: MOTION.hookZoomFrom,
        durationInFrames: ANIM.hookZoomDurationInFrames,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: FONT_WEIGHTS.bold,
          fontSize: TYPE.label,
          letterSpacing: LETTER_SPACING.label,
          color: COLORS.red,
        }}
      >
        {SERIES_COPY.series}
      </div>
      <HighlightText
        text={scene.headline}
        highlight={scene.highlight}
        style={{
          fontFamily: FONTS.headline,
          fontSize: TYPE.headline,
          lineHeight: LINE_HEIGHT.snug,
          letterSpacing: LETTER_SPACING.headline,
          textTransform: "uppercase",
          transform: `translate(${dx}px, ${dy}px)`,
        }}
      />
    </SceneShell>
  );
};
