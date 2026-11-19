import type { CalculateMetadataFunction } from "remotion";
import { explainerPropsSchema, type ExplainerProps } from "../explainerSchema";
import { layoutBeats, type VoLine } from "../lib/explainerTiming";
import { timingForScene } from "../lib/metadata";
import { voGainFor } from "../lib/mix";
import { evenWordTimings } from "../lib/text";
import {
  FPS,
  REEL_MAX_DURATION_IN_SECONDS,
  REEL_MIN_DURATION_IN_SECONDS,
} from "../lib/timing";

// Measures every VO line (or estimates it while the file does not exist yet)
// and lays the beats out on one continuous timeline.
export const calculateExplainerMetadata: CalculateMetadataFunction<
  ExplainerProps
> = async ({ props }) => {
  const episode = explainerPropsSchema.parse(props);
  const lines: VoLine[] = await Promise.all(
    episode.scenes.map(async (scene, index) => {
      const timing = await timingForScene(episode.id, index, scene, FPS);
      // timingForScene places words after its own lead-in pad; make them
      // relative to the first frame of the VO file instead.
      const words = timing.words
        ? timing.words.map((w) => ({
            text: w.text,
            startFrame: w.startFrame - timing.voStartFrame,
            endFrame: w.endFrame - timing.voStartFrame,
          }))
        : evenWordTimings(scene.vo, 0, timing.voDurationInFrames);
      return {
        voDurationInFrames: timing.voDurationInFrames,
        voSrc: timing.voSrc,
        voGain: voGainFor(timing.voLoudnessLufs),
        words,
      };
    }),
  );
  const { beats, durationInFrames } = layoutBeats(lines, FPS);

  const seconds = durationInFrames / FPS;
  if (
    seconds < REEL_MIN_DURATION_IN_SECONDS ||
    seconds > REEL_MAX_DURATION_IN_SECONDS
  ) {
    console.warn(
      `${episode.id} is ${seconds.toFixed(1)} s, outside the ${REEL_MIN_DURATION_IN_SECONDS} to ${REEL_MAX_DURATION_IN_SECONDS} s Reels range. Shorten or extend the VO lines.`,
    );
  }
  return { durationInFrames, fps: FPS, props: { ...episode, beats } };
};
