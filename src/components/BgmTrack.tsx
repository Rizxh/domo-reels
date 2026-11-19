import { Audio } from "@remotion/media";
import { staticFile, useVideoConfig } from "remotion";
import { hasStaticFile } from "../lib/assets";
import { bgmVolumeAt, sceneStartFrames, type FrameRange } from "../lib/mix";
import { TRANSITION_DURATION_IN_FRAMES } from "../lib/timing";
import type { SceneTiming } from "../schema";

// Background music across the whole reel, looped, ducked under every VO line.
export const BgmTrack: React.FC<{
  src?: string;
  timings: SceneTiming[];
}> = ({ src, timings }) => {
  const { durationInFrames, fps } = useVideoConfig();
  if (src === undefined || !hasStaticFile(src)) {
    return null;
  }

  const starts = sceneStartFrames(
    timings.map((t) => t.durationInFrames),
    TRANSITION_DURATION_IN_FRAMES,
  );
  const voRanges: FrameRange[] = timings.map((t, i) => ({
    from: starts[i] + t.voStartFrame,
    to: starts[i] + t.voStartFrame + t.voDurationInFrames,
  }));

  return (
    <Audio
      src={staticFile(src)}
      loop
      // Keep counting frames across loops; the default ("repeat") would reset
      // the frame to 0 on every loop and duck against the wrong VO ranges.
      loopVolumeCurveBehavior="extend"
      volume={(frame) => bgmVolumeAt(frame, voRanges, durationInFrames, fps)}
    />
  );
};
