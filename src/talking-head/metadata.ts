import type { CalculateMetadataFunction } from "remotion";
import { buildCutTimeline, cutDurationInFrames } from "../lib/cuts";
import {
  FPS,
  REEL_MAX_DURATION_IN_SECONDS,
  REEL_MIN_DURATION_IN_SECONDS,
} from "../lib/timing";
import {
  talkingHeadPropsSchema,
  type TalkingHeadProps,
} from "../talkingHeadSchema";

// The edit's length is the sum of its kept source ranges.
export const calculateTalkingHeadMetadata: CalculateMetadataFunction<
  TalkingHeadProps
> = ({ props }) => {
  const edit = talkingHeadPropsSchema.parse(props);
  const durationInFrames = cutDurationInFrames(
    buildCutTimeline(edit.cuts, FPS),
  );
  const seconds = durationInFrames / FPS;
  if (
    seconds < REEL_MIN_DURATION_IN_SECONDS ||
    seconds > REEL_MAX_DURATION_IN_SECONDS
  ) {
    console.warn(
      `${edit.id}: edit is ${seconds.toFixed(2)} s, outside the ${REEL_MIN_DURATION_IN_SECONDS} to ${REEL_MAX_DURATION_IN_SECONDS} s Reel range`,
    );
  }
  return { durationInFrames, fps: FPS, props: edit };
};
