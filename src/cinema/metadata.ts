import type { CalculateMetadataFunction } from "remotion";
import { cinemaPropsSchema, type CinemaProps } from "../cinemaSchema";
import { layoutBeats, type VoLine } from "../lib/explainerTiming";
import { timingForScene } from "../lib/metadata";
import { voGainFor } from "../lib/mix";
import { evenWordTimings } from "../lib/text";
import { FPS, REEL_MAX_DURATION_IN_SECONDS, REEL_MIN_DURATION_IN_SECONDS } from "../lib/timing";

// Measures every VO line (or estimates it before TTS) and lays the beats out
// on one continuous timeline, like the 3D explainer.
export const calculateCinemaMetadata: CalculateMetadataFunction<CinemaProps> = async ({ props }) => {
  const episode = cinemaPropsSchema.parse(props);
  const lines: VoLine[] = await Promise.all(
    episode.beats.map(async (beat, index) => {
      const timing = await timingForScene(episode.id, index, beat, FPS);
      const words = timing.words
        ? timing.words.map((w) => ({
            text: w.text,
            startFrame: w.startFrame - timing.voStartFrame,
            endFrame: w.endFrame - timing.voStartFrame,
          }))
        : evenWordTimings(beat.vo, 0, timing.voDurationInFrames);
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
  if (seconds < REEL_MIN_DURATION_IN_SECONDS || seconds > REEL_MAX_DURATION_IN_SECONDS) {
    console.warn(`${episode.id} is ${seconds.toFixed(1)} s, outside the Reels range.`);
  }
  return { durationInFrames, fps: FPS, props: { ...episode, beatTimings: beats } };
};
