// Timing constants and pure duration helpers. Scene durations are never
// hardcoded: they are derived from voice over length plus the padding below.

import type { SpringConfig } from "remotion";

export const FPS = 30;

// Casual Bahasa Indonesia reads at roughly 2.3 to 2.7 words per second. Used to
// estimate scene length until real voice over files exist (Phase 4).
export const VO_WORDS_PER_SECOND = 2.5;

// Silence before the voice over starts and after it ends, per scene. The end
// pad must stay longer than a transition so neighbouring VO lines never overlap.
export const SCENE_PAD_START_IN_SECONDS = 0.2;
export const SCENE_PAD_END_IN_SECONDS = 0.35;

// No scene is shorter than this, even with a very short line.
export const MIN_SCENE_DURATION_IN_SECONDS = 1.5;

export const TRANSITION_DURATION_IN_SECONDS = 0.3;

// Extra hold after the last line so the BGM can swell and fade out (0.5 s)
// without cutting under the CTA voice over.
export const OUTRO_HOLD_IN_SECONDS = 1;

// Instagram Reels target range (plan section 2).
export const REEL_MIN_DURATION_IN_SECONDS = 15;
// Raised from 30 s on 2026-11-17 for story episodes (user decisions: 35 s, then 60 s).
export const REEL_MAX_DURATION_IN_SECONDS = 60;

// Fallback length used only when an episode has no scenes to measure.
export const PLACEHOLDER_DURATION_IN_SECONDS = 1;

export const secondsToFrames = (seconds: number, fps: number = FPS): number =>
  Math.round(seconds * fps);

export const TRANSITION_DURATION_IN_FRAMES = secondsToFrames(
  TRANSITION_DURATION_IN_SECONDS,
);
export const PLACEHOLDER_DURATION_IN_FRAMES = secondsToFrames(
  PLACEHOLDER_DURATION_IN_SECONDS,
);

export const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export const estimateVoDurationInSeconds = (text: string): number =>
  countWords(text) / VO_WORDS_PER_SECOND;

export const sceneDurationInFrames = (
  voDurationInSeconds: number,
  fps: number = FPS,
): number => {
  const padded =
    SCENE_PAD_START_IN_SECONDS + voDurationInSeconds + SCENE_PAD_END_IN_SECONDS;
  return secondsToFrames(Math.max(padded, MIN_SCENE_DURATION_IN_SECONDS), fps);
};

export type SceneTimingValues = {
  durationInFrames: number;
  voStartFrame: number;
  voDurationInFrames: number;
};

export const sceneTimingFromVo = (
  voDurationInSeconds: number,
  fps: number = FPS,
): SceneTimingValues => ({
  durationInFrames: sceneDurationInFrames(voDurationInSeconds, fps),
  voStartFrame: secondsToFrames(SCENE_PAD_START_IN_SECONDS, fps),
  // Rounded up so the last syllable of a real VO file is never cut off.
  voDurationInFrames: Math.max(1, Math.ceil(voDurationInSeconds * fps)),
});

// TransitionSeries overlaps neighbouring scenes during each transition, so the
// total is the sum of scene lengths minus one overlap per transition.
export const totalDurationInFrames = (
  sceneDurations: number[],
  transitionDurationInFrames: number = TRANSITION_DURATION_IN_FRAMES,
): number => {
  if (sceneDurations.length === 0) {
    return PLACEHOLDER_DURATION_IN_FRAMES;
  }
  const sum = sceneDurations.reduce((acc, d) => acc + d, 0);
  return sum - transitionDurationInFrames * (sceneDurations.length - 1);
};

// Animation beats, in frames from the start of a scene unless noted.
export const ANIM = {
  // Hook headline jitters for this many frames right after frame 0, so frame 0
  // itself stays clean enough to be the Reel cover.
  hookShakeFrames: 3,
  hookZoomDurationInFrames: 24,
  // Delay before the MITOS / FAKTA stamp slams in.
  stampDelayInFrames: 3,
  // Delay before supporting content follows the stamp or title.
  contentDelayInFrames: 12,
  // Gap between consecutive reason cards (plan section 4: 8 frames).
  staggerInFrames: 8,
  counterDelayInFrames: 14,
  counterDurationInFrames: 36,
  // Duration of the slow drive of the car icon across the fact scene.
  carDriveDurationInFrames: 90,
  ctaPulsePeriodInFrames: 30,
  textRevealInFrames: 10,
  // Clock hand speed for the fallback clock icon, in degrees per frame.
  clockDegreesPerFrame: 6,
} as const;

export const SPRINGS = {
  // Heavy, fast landing for stamps.
  slam: { damping: 14, stiffness: 260, mass: 0.9 },
  // Quick pop for caption words and cards.
  pop: { damping: 16, stiffness: 220, mass: 0.6 },
  // Soft entrance for large text blocks.
  gentle: { damping: 200, stiffness: 120, mass: 1 },
} satisfies Record<string, Partial<SpringConfig>>;

// Frame on which the counter reaches its target (used for the ding SFX later).
export const counterEndFrame = (): number =>
  ANIM.counterDelayInFrames + ANIM.counterDurationInFrames;

// Talking-head edit: everything is in output frames.
export const TALKING_HEAD_TIMING = {
  // Smooth punch-in between framing keys (snapped when a key sits on a cut).
  punchInFrames: 10,
  // Micro fade on every cut so the audio never clicks.
  cutAudioFadeFrames: 2,
  // Illustration entrance / exit lengths.
  enterFrames: 14,
  exitFrames: 10,
  // Captions fade out this quickly when an illustration takes over.
  captionFadeFrames: 5,
  // Stagger between title lines, price digits and engine labels.
  staggerFrames: 4,
  // Engine animation: crank speed and flow speed (cycles per second).
  crankRevsPerSecond: 1.4,
  flowDashesPerSecond: 2.2,
  // Highlight pulse when a part is named.
  partPulseFrames: 16,
  // Each explainer part stays in focus at least this long, so its note can
  // be read even when the speaker names parts quickly.
  minPartSeconds: 1.6,
  // Board slides in / out while the speaker moves to the lower panel.
  splitFrames: 16,
  chevronPeriodFrames: 24,
} as const;

export const TALKING_HEAD_SPRINGS = {
  // Price tag pendulum: low damping so it swings and settles.
  swing: { damping: 7, stiffness: 90, mass: 0.9 },
  slide: { damping: 22, stiffness: 140, mass: 0.9 },
  card: { damping: 26, stiffness: 160, mass: 1 },
} satisfies Record<string, Partial<SpringConfig>>;

// "Jarang Diketahui" 3D explainer: one continuous timeline, VO lines back to
// back with a short breath between them (no cross-fades between beats).
export const EXPLAINER_TIMING = {
  // Picture runs this long before the first word.
  leadInSeconds: 0.2,
  // Pause between two VO lines.
  lineGapInSeconds: 0.25,
  // Hold after the last word for the logo and the music tail.
  outroHoldInSeconds: 1.2,
} as const;

// Cinema format: text entrances and exits, in frames.
export const CINEMA_TIMING = {
  textInFrames: 9,
  textOutFrames: 5,
  lineDrawFrames: 10,
  slamFrames: 8,
  ctaScrimFrames: 10,
} as const;
