// Edit decision list for talking-head clips: keeps a list of source ranges
// and maps source time (where the transcript and illustrations are anchored)
// onto the edited output timeline.

import type { WordTiming } from "./text";

export type SourceRange = { from: number; to: number };

export type CutClip = {
  // Source range in seconds.
  from: number;
  to: number;
  // Placement on the output timeline, in composition frames.
  startFrame: number;
  durationInFrames: number;
  // Frames to skip at the start of the source (composition fps).
  trimBefore: number;
  trimAfter: number;
};

export type SourceWord = { text: string; start: number; end: number };

export const buildCutTimeline = (
  ranges: SourceRange[],
  fps: number,
): CutClip[] => {
  let cursor = 0;
  return ranges.map((range) => {
    const trimBefore = Math.round(range.from * fps);
    const trimAfter = Math.round(range.to * fps);
    const clip: CutClip = {
      from: range.from,
      to: range.to,
      startFrame: cursor,
      durationInFrames: trimAfter - trimBefore,
      trimBefore,
      trimAfter,
    };
    cursor += clip.durationInFrames;
    return clip;
  });
};

export const cutDurationInFrames = (clips: CutClip[]): number =>
  clips.reduce((sum, clip) => sum + clip.durationInFrames, 0);

// Output frame for a source time, or null when that moment was cut out.
export const sourceToOutputFrame = (
  seconds: number,
  clips: CutClip[],
  fps: number,
): number | null => {
  for (const clip of clips) {
    if (seconds >= clip.from && seconds < clip.to) {
      return clip.startFrame + Math.round(seconds * fps) - clip.trimBefore;
    }
  }
  return null;
};

// Transcript words that survive the edit, on the output timeline. A word is
// kept when its midpoint falls inside a kept range.
export const wordsOnOutput = (
  words: SourceWord[],
  clips: CutClip[],
  fps: number,
): WordTiming[] => {
  const kept: WordTiming[] = [];
  words.forEach((word) => {
    const mid = (word.start + word.end) / 2;
    const clip = clips.find((c) => mid >= c.from && mid < c.to);
    if (!clip) {
      return;
    }
    const toFrame = (s: number) =>
      clip.startFrame +
      Math.min(
        Math.max(Math.round(s * fps), clip.trimBefore),
        clip.trimAfter,
      ) -
      clip.trimBefore;
    kept.push({
      text: word.text,
      startFrame: toFrame(word.start),
      endFrame: Math.max(toFrame(word.end), toFrame(word.start) + 1),
    });
  });
  return kept;
};

// Like sourceToOutputFrame, but a moment inside a removed stretch snaps to
// the start of the next kept clip (or the very end of the edit).
export const sourceToOutputFrameClamped = (
  seconds: number,
  clips: CutClip[],
  fps: number,
): number => {
  const inside = sourceToOutputFrame(seconds, clips, fps);
  if (inside !== null) {
    return inside;
  }
  const next = clips.find((c) => c.from >= seconds);
  return next ? next.startFrame : cutDurationInFrames(clips);
};

// True when a source time is the first moment of a kept clip (a hard cut).
export const isCutStart = (seconds: number, clips: CutClip[]): boolean =>
  clips.some((c) => Math.abs(c.from - seconds) < 1e-6);
