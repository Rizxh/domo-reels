// Audio mix levels (PRODUCTION_PLAN section 5.4) and pure helpers for ducking
// and cue placement. Volumes are linear gain, 1 = unchanged.

import type { Scene } from "../schema";
import { ANIM, counterEndFrame, secondsToFrames } from "./timing";

export const MIX = {
  vo: 1,
  // BGM sits under the voice while anyone is talking...
  bgmUnderVo: 0.12,
  // ...and comes up in the gaps (intro, between lines, outro swell).
  bgmFree: 0.4,
  sfx: 0.65,
  // Frames over which the BGM ramps between the two levels.
  duckRampInFrames: 8,
  // Short fade at the very start to avoid a click on frame 0.
  bgmFadeInFrames: 3,
  bgmFadeOutInSeconds: 0.5,
} as const;

// Every VO line is brought to this loudness before the mix, so no line
// sounds quieter than the next and the sound effects keep the same balance
// whichever voice is used (voices differ by more than 10 dB). The gain is
// limited so a bad measurement, such as a near-silent file, cannot blow a
// line up.
export const VO_LEVEL = {
  targetLufs: -25,
  maxGainDb: 15,
} as const;

// Linear gain that brings a line measured at `lufs` to VO_LEVEL.targetLufs.
export const voGainFor = (lufs: number | undefined): number => {
  if (lufs === undefined) {
    return 1;
  }
  const db = Math.min(
    VO_LEVEL.maxGainDb,
    Math.max(-VO_LEVEL.maxGainDb, VO_LEVEL.targetLufs - lufs),
  );
  return 10 ** (db / 20);
};

// Final loudness after `npm run postprocess` (plan section 2): about -14 LUFS
// integrated with a -1.5 dBTP true peak ceiling.
export const LOUDNESS_TARGET = {
  integratedLufs: -14,
  truePeakDb: -1.5,
  loudnessRange: 11,
  // Allowed deviation when verifying the result.
  toleranceLu: 1,
} as const;

export type FrameRange = { from: number; to: number };

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

// First frame of each scene on the global timeline. TransitionSeries overlaps
// each scene with the previous one for the length of the transition.
export const sceneStartFrames = (
  durations: number[],
  transitionInFrames: number,
): number[] => {
  const starts: number[] = [];
  let cursor = 0;
  durations.forEach((duration, i) => {
    starts.push(cursor);
    cursor += duration - (i < durations.length - 1 ? transitionInFrames : 0);
  });
  return starts;
};

// BGM gain for a global frame: ducked inside any VO range, ramped near its
// edges, faded in at the start and out over the final half second.
export const bgmVolumeAt = (
  frame: number,
  voRanges: FrameRange[],
  totalFrames: number,
  fps: number,
): number => {
  let duck = 0;
  for (const range of voRanges) {
    if (frame >= range.from && frame < range.to) {
      duck = 1;
      break;
    }
    const distance = frame < range.from ? range.from - frame : frame - range.to;
    duck = Math.max(duck, clamp01(1 - distance / MIX.duckRampInFrames));
  }

  const level = MIX.bgmFree + (MIX.bgmUnderVo - MIX.bgmFree) * duck;
  const fadeIn = clamp01(frame / MIX.bgmFadeInFrames);
  const fadeOut = clamp01(
    (totalFrames - frame) / secondsToFrames(MIX.bgmFadeOutInSeconds, fps),
  );
  return level * fadeIn * fadeOut;
};

// Scene-relative frames at which the scene's SFX fires, matched to the visual
// beat it belongs to (plan section 4, audio column).
export const sfxCueFrames = (scene: Scene): number[] => {
  switch (scene.type) {
    case "hook":
      return [0];
    case "myth":
      return [ANIM.stampDelayInFrames];
    case "fact":
      return [
        scene.counterTo === undefined
          ? ANIM.stampDelayInFrames
          : counterEndFrame(),
      ];
    case "reasons":
      return scene.items.map(
        (_, i) => ANIM.contentDelayInFrames + i * ANIM.staggerInFrames,
      );
    case "cta":
      return [ANIM.contentDelayInFrames];
  }
};

// Cinema format: the original music bed sits a little higher than the
// explainer BGM levels because it carries the tension of the story.
export const CINEMA_MIX = {
  musicUnderVo: 0.2,
  musicFree: 0.5,
  duckRampInFrames: 6,
  musicFadeOutFrames: 3,
} as const;
