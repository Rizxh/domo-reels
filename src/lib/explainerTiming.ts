// Timeline of a "Jarang Diketahui" explainer. Everything is derived from the
// VO files: where each line starts, where each beat's picture begins, and the
// frame on which any cue word is spoken.

import type { ExplainerEpisode, ExplainerScene } from "../explainerSchema";
import { cueWordIndex } from "./cues";
import type { WordTiming } from "./text";
import { EXPLAINER_TIMING, secondsToFrames } from "./timing";

// One VO line as measured: its length and word timings relative to its start.
export type VoLine = {
  voDurationInFrames: number;
  voSrc?: string;
  // Linear gain that levels this line with the others (1 when unmeasured).
  voGain?: number;
  words: WordTiming[];
};

// A beat on the global timeline (all frames are composition frames).
export type BeatTiming = {
  // The beat's picture owns [startFrame, endFrame).
  startFrame: number;
  endFrame: number;
  voStartFrame: number;
  voDurationInFrames: number;
  voSrc?: string;
  voGain?: number;
  words: WordTiming[];
};

export const layoutBeats = (
  lines: VoLine[],
  fps: number,
): { beats: BeatTiming[]; durationInFrames: number } => {
  const leadIn = secondsToFrames(EXPLAINER_TIMING.leadInSeconds, fps);
  const gap = secondsToFrames(EXPLAINER_TIMING.lineGapInSeconds, fps);
  const outro = secondsToFrames(EXPLAINER_TIMING.outroHoldInSeconds, fps);

  const voStarts: number[] = [];
  lines.forEach((line, i) => {
    voStarts.push(
      i === 0
        ? leadIn
        : voStarts[i - 1] + lines[i - 1].voDurationInFrames + gap,
    );
  });
  const last = lines.length - 1;
  const durationInFrames =
    lines.length === 0
      ? outro
      : voStarts[last] + lines[last].voDurationInFrames + outro;

  // A beat's picture starts in the middle of the pause before its line.
  const beatStart = (i: number) =>
    i === 0 ? 0 : voStarts[i] - Math.ceil(gap / 2);
  const beats = lines.map((line, i) => ({
    startFrame: beatStart(i),
    endFrame: i === last ? durationInFrames : beatStart(i + 1),
    voStartFrame: voStarts[i],
    voDurationInFrames: line.voDurationInFrames,
    voSrc: line.voSrc,
    voGain: line.voGain,
    words: line.words.map((w) => ({
      text: w.text,
      startFrame: voStarts[i] + w.startFrame,
      endFrame: voStarts[i] + w.endFrame,
    })),
  }));
  return { beats, durationInFrames };
};

// Frame on which a cue word of this beat's line starts being spoken.
export const cueFrame = (
  beat: BeatTiming,
  vo: string,
  cueWord: string,
): number => {
  const index = cueWordIndex(vo, cueWord);
  const word = index === null ? undefined : beat.words[index];
  if (!word) {
    throw new Error(`Cue word "${cueWord}" has no timing in "${vo}"`);
  }
  return word.startFrame;
};

type SceneOf<T extends ExplainerScene["type"]> = Extract<
  ExplainerScene,
  { type: T }
>;

// Every cue of the episode resolved to composition frames.
export type ExplainerCues = {
  hook: { start: number; count: number };
  reveal: { start: number; title: number };
  cycle: { start: number; steps: number[]; spark: number };
  impact: {
    start: number;
    causes: number[];
    weaken: number;
    effects: number[];
  };
  cta: { start: number; save: number; follow: number };
  end: number;
};

export const resolveCues = (
  scenes: ExplainerEpisode["scenes"],
  beats: BeatTiming[],
  durationInFrames: number,
): ExplainerCues => {
  const find = <T extends ExplainerScene["type"]>(type: T) => {
    const i = scenes.findIndex((s) => s.type === type);
    const scene = scenes[i] as SceneOf<T> | undefined;
    const beat = beats[i];
    if (!scene || !beat) {
      throw new Error(`Episode has no "${type}" beat with timing`);
    }
    return {
      scene,
      start: beat.startFrame,
      at: (word: string) => cueFrame(beat, scene.vo, word),
    };
  };
  const hook = find("hook");
  const reveal = find("reveal");
  const cycle = find("cycle");
  const impact = find("impact");
  const cta = find("cta");
  return {
    hook: { start: hook.start, count: hook.at(hook.scene.count.cueWord) },
    reveal: {
      start: reveal.start,
      title: reveal.at(reveal.scene.title.cueWord),
    },
    cycle: {
      start: cycle.start,
      steps: cycle.scene.steps.map((s) => cycle.at(s.cueWord)),
      spark: cycle.at(cycle.scene.spark.cueWord),
    },
    impact: {
      start: impact.start,
      causes: impact.scene.causes.map((c) => impact.at(c.cueWord)),
      weaken: impact.at(impact.scene.weakenCueWord),
      effects: impact.scene.effects.map((e) => impact.at(e.cueWord)),
    },
    cta: {
      start: cta.start,
      save: cta.at(cta.scene.saveCueWord),
      follow: cta.at(cta.scene.followCueWord),
    },
    end: durationInFrames,
  };
};

// The same cue table in seconds, for the 3D page (it animates in seconds).
export const cuesInSeconds = (
  cues: ExplainerCues,
  fps: number,
): ExplainerCues => {
  const s = (frame: number) => frame / fps;
  return {
    hook: { start: s(cues.hook.start), count: s(cues.hook.count) },
    reveal: { start: s(cues.reveal.start), title: s(cues.reveal.title) },
    cycle: {
      start: s(cues.cycle.start),
      steps: cues.cycle.steps.map(s),
      spark: s(cues.cycle.spark),
    },
    impact: {
      start: s(cues.impact.start),
      causes: cues.impact.causes.map(s),
      weaken: s(cues.impact.weaken),
      effects: cues.impact.effects.map(s),
    },
    cta: {
      start: s(cues.cta.start),
      save: s(cues.cta.save),
      follow: s(cues.cta.follow),
    },
    end: s(cues.end),
  };
};
