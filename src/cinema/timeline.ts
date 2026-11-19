// Timeline of a cinema episode: VO lines back to back (layout shared with
// the 3D explainer), and every named cue resolved to a composition frame:
//   <beat>:start / <beat>:end / <beat>:vo   beat picture range, first word
//   <text id> / <mark id>                    the frame its cue word is spoken

import type { CinemaBeat, CinemaEpisode } from "../cinemaSchema";
import { cueMatches } from "../lib/cues";
import type { BeatTiming } from "../lib/explainerTiming";

export type CueMap = Readonly<Record<string, number>>;

export const cueWordFrame = (beat: CinemaBeat, timing: BeatTiming, word: string, nth: number): number => {
  const index = cueMatches(beat.vo, word)[nth - 1];
  const w = index === undefined ? undefined : timing.words[index];
  if (!w) {
    throw new Error(`Cue "${word}" (#${nth}) has no timing in "${beat.vo}"`);
  }
  return w.startFrame;
};

export const resolveCinemaCues = (
  beats: CinemaEpisode["beats"],
  timings: readonly BeatTiming[],
  durationInFrames: number,
): CueMap => {
  const cues: Record<string, number> = { end: durationInFrames };
  beats.forEach((beat, i) => {
    const t = timings[i];
    cues[`${beat.id}:start`] = t.startFrame;
    cues[`${beat.id}:end`] = t.endFrame;
    cues[`${beat.id}:vo`] = t.voStartFrame;
    for (const text of beat.texts) {
      cues[text.id] = cueWordFrame(beat, t, text.cue.word, text.cue.nth);
    }
    for (const mark of beat.marks) {
      cues[mark.id] = cueWordFrame(beat, t, mark.word, mark.nth);
    }
  });
  return cues;
};

export const cue = (cues: CueMap, name: string): number => {
  const f = cues[name];
  if (f === undefined) {
    throw new Error(`Unknown cue "${name}"`);
  }
  return f;
};
