// Drives the 3D previz page (public/previz/ep01-3d.html) from the real VO
// timing. The previz has its own fixed choreography timeline (the original
// 26.5 s cut); every beat is mapped onto the length of its ElevenLabs line.

import type { Scene, SceneTiming } from "../schema";
import { sceneStartFrames } from "./mix";
import {
  evenWordTimings,
  highlightMask,
  paginateWords,
  type WordTiming,
} from "./text";

export const PREVIZ_PAGE = "previz/ep01-3d.html";

// Number of asset sheet views in public/previz/ep02-3d.html (its LOOKDEV
// table). One view per frame of the Explainer3DLookdev composition.
export const EXPLAINER_LOOKDEV_VIEWS = 16;

// Lighter 3D sampling for draft renders (no supersampling, less motion blur).
export const PREVIZ_DRAFT_QUALITY = { pixelRatio: 1, samples: 3 } as const;

// Time allowed for the previz page to load and become ready in a render tab.
export const PREVIZ_LOAD_TIMEOUT_IN_MS = 120_000;

// Shot times inside the previz (its SHOTS table), in choreography seconds.
// The smoke shot (18.5 to 20.5 s) is skipped because EP01 has two reasons.
export const PREVIZ_CHOREO = {
  hook: [0, 3],
  myth: [3, 7],
  fact: [7, 16],
  fuel: [16, 18.5],
  temp: [20.5, 22.5],
  cta: [22.5, 26.5],
} as const;

// The second reason starts slightly before this word is spoken.
export const REASON_SPLIT_WORD = "padahal";
export const REASON_SPLIT_LEAD_IN_SECONDS = 0.15;
// Keeps each reason shot at least this share of the reasons beat.
const MIN_REASON_SHARE = 0.3;

export type PrevizSegment = { t0: number; t1: number; p0: number; p1: number };
export type PrevizWord = {
  text: string;
  start: number;
  end: number;
  line: number;
  page: number;
  kw: boolean;
};
export type PrevizConfig = { segments: PrevizSegment[]; words: PrevizWord[] };

export type SecondsRange = { from: number; to: number };

const normalize = (word: string) =>
  word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// Real-time range of each beat. Cuts sit in the middle of where the 2D
// version cross-fades, so each VO line starts just after its cut.
export const beatRangesInSeconds = (
  timings: SceneTiming[],
  transitionInFrames: number,
  totalFrames: number,
  fps: number,
): SecondsRange[] => {
  const starts = sceneStartFrames(
    timings.map((t) => t.durationInFrames),
    transitionInFrames,
  );
  const cut = (i: number) => (starts[i] + transitionInFrames / 2) / fps;
  return timings.map((_, i) => ({
    from: i === 0 ? 0 : cut(i),
    to: i === timings.length - 1 ? totalFrames / fps : cut(i + 1),
  }));
};

// Every VO word on the global timeline, with caption page and keyword flag.
export const previzWords = (
  scenes: Scene[],
  timings: SceneTiming[],
  transitionInFrames: number,
  fps: number,
  maxWordsPerPage: number,
): PrevizWord[] => {
  const starts = sceneStartFrames(
    timings.map((t) => t.durationInFrames),
    transitionInFrames,
  );
  return scenes.flatMap((scene, line) => {
    const timing = timings[line];
    const words: WordTiming[] =
      timing.words ??
      evenWordTimings(scene.vo, timing.voStartFrame, timing.voDurationInFrames);
    const texts = words.map((w) => w.text);
    const mask = highlightMask(texts, scene.voHighlight);
    const pageOf: number[] = [];
    paginateWords(texts, maxWordsPerPage).forEach((page, p) =>
      page.forEach((i) => {
        pageOf[i] = p;
      }),
    );
    return words.map((w, i) => ({
      text: w.text,
      start: (starts[line] + w.startFrame) / fps,
      end: (starts[line] + w.endFrame) / fps,
      line,
      page: pageOf[i],
      kw: mask[i],
    }));
  });
};

const segment = (
  range: SecondsRange,
  choreo: readonly [number, number],
): PrevizSegment => ({
  t0: range.from,
  t1: range.to,
  p0: choreo[0],
  p1: choreo[1],
});

export const previzConfig = (
  scenes: Scene[],
  timings: SceneTiming[],
  transitionInFrames: number,
  totalFrames: number,
  fps: number,
  maxWordsPerPage: number,
): PrevizConfig => {
  const beats = beatRangesInSeconds(
    timings,
    transitionInFrames,
    totalFrames,
    fps,
  );
  const words = previzWords(
    scenes,
    timings,
    transitionInFrames,
    fps,
    maxWordsPerPage,
  );
  const byType = (type: Scene["type"]) =>
    beats[scenes.findIndex((s) => s.type === type)];

  const reasons = byType("reasons");
  const reasonsLine = scenes.findIndex((s) => s.type === "reasons");
  const splitWord = words.find(
    (w) => w.line === reasonsLine && normalize(w.text) === REASON_SPLIT_WORD,
  );
  const span = reasons.to - reasons.from;
  const split = Math.min(
    reasons.to - span * MIN_REASON_SHARE,
    Math.max(
      reasons.from + span * MIN_REASON_SHARE,
      splitWord
        ? splitWord.start - REASON_SPLIT_LEAD_IN_SECONDS
        : reasons.from + span / 2,
    ),
  );

  return {
    segments: [
      segment(byType("hook"), PREVIZ_CHOREO.hook),
      segment(byType("myth"), PREVIZ_CHOREO.myth),
      segment(byType("fact"), PREVIZ_CHOREO.fact),
      segment({ from: reasons.from, to: split }, PREVIZ_CHOREO.fuel),
      segment({ from: split, to: reasons.to }, PREVIZ_CHOREO.temp),
      segment(byType("cta"), PREVIZ_CHOREO.cta),
    ],
    words,
  };
};
