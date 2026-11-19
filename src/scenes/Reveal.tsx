import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MOTION } from "../lib/brand";
import { SPRINGS } from "../lib/timing";

// Fades and lifts its children in, starting at `delayInFrames`.
export const Reveal: React.FC<{
  delayInFrames: number;
  children: React.ReactNode;
}> = ({ delayInFrames, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delayInFrames,
    fps,
    config: SPRINGS.gentle,
  });

  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [MOTION.riseInPx, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};
