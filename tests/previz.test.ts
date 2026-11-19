import { describe, expect, it } from "vitest";
import ep01 from "../data/episodes/ep01.json";
import {
  beatRangesInSeconds,
  PREVIZ_CHOREO,
  previzConfig,
  REASON_SPLIT_LEAD_IN_SECONDS,
} from "../src/lib/previz";
import { sceneTimingFromVo, totalDurationInFrames } from "../src/lib/timing";
import { episodeSchema, type SceneTiming } from "../src/schema";

const FPS = 30;
const TRANSITION = 9;
const WORDS_PER_PAGE = 4;
const scenes = episodeSchema.parse(ep01).scenes;

// VO lengths close to the real ElevenLabs files (s1..s5).
const timings: SceneTiming[] = [3.44, 3.9, 8.54, 7.06, 4.09].map((s) =>
  sceneTimingFromVo(s, FPS),
);
const total = totalDurationInFrames(
  timings.map((t) => t.durationInFrames),
  TRANSITION,
);

describe("beatRangesInSeconds", () => {
  it("covers the whole reel back to back without gaps", () => {
    const beats = beatRangesInSeconds(timings, TRANSITION, total, FPS);
    expect(beats[0].from).toBe(0);
    expect(beats[beats.length - 1].to).toBeCloseTo(total / FPS);
    beats.slice(1).forEach((b, i) => expect(b.from).toBe(beats[i].to));
  });

  it("cuts before each VO line starts", () => {
    const beats = beatRangesInSeconds(timings, TRANSITION, total, FPS);
    const config = previzConfig(
      scenes,
      timings,
      TRANSITION,
      total,
      FPS,
      WORDS_PER_PAGE,
    );
    beats.forEach((beat, line) => {
      const first = config.words.find((w) => w.line === line);
      expect(first?.start).toBeGreaterThanOrEqual(beat.from);
    });
  });
});

describe("previzConfig", () => {
  const config = previzConfig(
    scenes,
    timings,
    TRANSITION,
    total,
    FPS,
    WORDS_PER_PAGE,
  );

  it("maps every beat onto the previz choreography, skipping the smoke shot", () => {
    expect(config.segments.map((s) => [s.p0, s.p1])).toEqual([
      PREVIZ_CHOREO.hook,
      PREVIZ_CHOREO.myth,
      PREVIZ_CHOREO.fact,
      PREVIZ_CHOREO.fuel,
      PREVIZ_CHOREO.temp,
      PREVIZ_CHOREO.cta,
    ]);
  });

  it("keeps segments contiguous in real time", () => {
    config.segments
      .slice(1)
      .forEach((s, i) => expect(s.t0).toBeCloseTo(config.segments[i].t1));
  });

  it('starts the second reason just before "Padahal"', () => {
    const padahal = config.words.find((w) => w.text === "Padahal");
    expect(padahal).toBeDefined();
    expect(config.segments[4].t0).toBeCloseTo(
      (padahal?.start ?? 0) - REASON_SPLIT_LEAD_IN_SECONDS,
    );
  });

  it("flags caption keywords from voHighlight", () => {
    const kw = config.words.filter((w) => w.kw).map((w) => w.text);
    expect(kw).toEqual(
      expect.arrayContaining(["boros", "bensin.", "karburator."]),
    );
  });
});
