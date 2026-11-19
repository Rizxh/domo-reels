// Pure timing for the talking-head edit: maps the source-time edit data onto
// output frames. Everything the components need is derived here once.

import { Easing, interpolate } from "remotion";
import {
  buildCutTimeline,
  type CutClip,
  isCutStart,
  sourceToOutputFrameClamped,
  wordsOnOutput,
} from "../lib/cuts";
import type { WordTiming } from "../lib/text";
import { TALKING_HEAD_TIMING } from "../lib/timing";
import type { Illustration, TalkingHeadEdit } from "../talkingHeadSchema";

export type Window = { startFrame: number; endFrame: number };
export type PlacedIllustration = Illustration & Window;
export type FramingFrame = { frame: number; zoom: number; snap: boolean };

export type TalkingHeadTimeline = {
  clips: CutClip[];
  words: WordTiming[];
  illustrations: PlacedIllustration[];
  framing: FramingFrame[];
};

export const buildTalkingHeadTimeline = (
  edit: Pick<
    TalkingHeadEdit,
    "cuts" | "words" | "illustrations" | "framing"
  >,
  fps: number,
): TalkingHeadTimeline => {
  const clips = buildCutTimeline(edit.cuts, fps);
  const toFrame = (s: number) => sourceToOutputFrameClamped(s, clips, fps);
  return {
    clips,
    words: wordsOnOutput(edit.words, clips, fps),
    illustrations: edit.illustrations.map((i) => ({
      ...i,
      startFrame: toFrame(i.from),
      endFrame: toFrame(i.to),
    })),
    framing: edit.framing.map((key) => ({
      frame: toFrame(key.at),
      zoom: key.zoom,
      snap: isCutStart(key.at, clips),
    })),
  };
};

// 0 before the window, eases to 1 on entry, back to 0 just before it ends.
export const presence = (
  frame: number,
  window: Window,
  enter: number = TALKING_HEAD_TIMING.enterFrames,
  exit: number = TALKING_HEAD_TIMING.exitFrames,
): number => {
  const span = window.endFrame - window.startFrame;
  if (span <= 0) {
    return 0;
  }
  const inLen = Math.min(enter, span / 2);
  const outLen = Math.min(exit, span / 2);
  const ease = Easing.bezier(0.22, 1, 0.36, 1);
  const into = interpolate(
    frame,
    [window.startFrame, window.startFrame + inLen],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
  );
  const out = interpolate(
    frame,
    [window.endFrame - outLen, window.endFrame],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );
  return Math.min(into, out);
};

// Punch-in zoom at a frame. Keys on a cut snap (a deliberate jump cut);
// other keys glide over punchInFrames.
export const zoomAt = (frame: number, keys: FramingFrame[]): number => {
  if (keys.length === 0) {
    return 1;
  }
  let value = keys[0].zoom;
  for (let i = 1; i < keys.length; i++) {
    const key = keys[i];
    if (frame < key.frame) {
      break;
    }
    value = key.snap
      ? key.zoom
      : interpolate(
          frame,
          [key.frame, key.frame + TALKING_HEAD_TIMING.punchInFrames],
          [value, key.zoom],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          },
        );
  }
  return value;
};

// Explainer pacing: a step starts when it is spoken, but never before the
// previous one has been on screen for minFrames.
export const schedulePhases = (
  spokenFrames: number[],
  minFrames: number,
): number[] => {
  const out: number[] = [];
  spokenFrames.forEach((spoken, i) => {
    out.push(i === 0 ? spoken : Math.max(spoken, out[i - 1] + minFrames));
  });
  return out;
};
