import { describe, expect, it } from "vitest";
import ep02 from "../data/episodes/ep02.json";
import { explainerEpisodeSchema } from "../src/explainerSchema";
import {
  cueFrame,
  cuesInSeconds,
  layoutBeats,
  resolveCues,
  type VoLine,
} from "../src/lib/explainerTiming";
import { evenWordTimings, splitWords } from "../src/lib/text";
import { EXPLAINER_TIMING, FPS, secondsToFrames } from "../src/lib/timing";

const episode = explainerEpisodeSchema.parse(ep02);
const leadIn = secondsToFrames(EXPLAINER_TIMING.leadInSeconds, FPS);
const gap = secondsToFrames(EXPLAINER_TIMING.lineGapInSeconds, FPS);
const outro = secondsToFrames(EXPLAINER_TIMING.outroHoldInSeconds, FPS);

// Synthetic VO: every word lasts 10 frames.
const FRAMES_PER_WORD = 10;
const lines: VoLine[] = episode.scenes.map((scene) => {
  const voDurationInFrames = splitWords(scene.vo).length * FRAMES_PER_WORD;
  return {
    voDurationInFrames,
    words: evenWordTimings(scene.vo, 0, voDurationInFrames),
  };
});
const { beats, durationInFrames } = layoutBeats(lines, FPS);

describe("layoutBeats", () => {
  it("plays the lines back to back with one gap between them", () => {
    expect(beats[0].voStartFrame).toBe(leadIn);
    for (let i = 1; i < beats.length; i++) {
      const previousEnd =
        beats[i - 1].voStartFrame + beats[i - 1].voDurationInFrames;
      expect(beats[i].voStartFrame - previousEnd).toBe(gap);
    }
    const last = beats[beats.length - 1];
    expect(durationInFrames).toBe(
      last.voStartFrame + last.voDurationInFrames + outro,
    );
  });

  it("gives every frame to exactly one beat", () => {
    expect(beats[0].startFrame).toBe(0);
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i].startFrame).toBe(beats[i - 1].endFrame);
      // A beat's picture starts inside the pause before its line.
      expect(beats[i].startFrame).toBeLessThanOrEqual(beats[i].voStartFrame);
      expect(beats[i].startFrame).toBeGreaterThanOrEqual(
        beats[i].voStartFrame - gap,
      );
    }
    expect(beats[beats.length - 1].endFrame).toBe(durationInFrames);
  });

  it("moves word timings onto the global timeline", () => {
    beats.forEach((beat, i) => {
      expect(beat.words[0].startFrame).toBe(beat.voStartFrame);
      expect(beat.words).toHaveLength(lines[i].words.length);
    });
  });
});

describe("cues", () => {
  it("land on the frame their word starts", () => {
    const hook = episode.scenes[0];
    // "seratus" is the 4th word of the hook line.
    expect(cueFrame(beats[0], hook.vo, "seratus")).toBe(
      leadIn + 3 * FRAMES_PER_WORD,
    );
    expect(() => cueFrame(beats[0], hook.vo, "tidak-ada")).toThrow();
  });

  it("resolve in spoken order inside their own beat", () => {
    const cues = resolveCues(episode.scenes, beats, durationInFrames);
    const inBeat = (i: number, frames: number[]) => {
      for (const f of frames) {
        expect(f).toBeGreaterThanOrEqual(beats[i].voStartFrame);
        expect(f).toBeLessThan(
          beats[i].voStartFrame + beats[i].voDurationInFrames,
        );
      }
      expect(frames).toEqual([...frames].sort((a, b) => a - b));
    };
    inBeat(0, [cues.hook.count]);
    inBeat(1, [cues.reveal.title]);
    inBeat(2, [...cues.cycle.steps, cues.cycle.spark]);
    inBeat(3, [
      ...cues.impact.causes,
      cues.impact.weaken,
      ...cues.impact.effects,
    ]);
    inBeat(4, [cues.cta.save, cues.cta.follow]);
    expect(cues.end).toBe(durationInFrames);

    const seconds = cuesInSeconds(cues, FPS);
    expect(seconds.hook.count).toBeCloseTo(cues.hook.count / FPS);
    expect(seconds.cycle.steps).toHaveLength(4);
  });
});
