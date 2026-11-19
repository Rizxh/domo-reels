import { describe, expect, it } from "vitest";
import {
  ANIM,
  countWords,
  counterEndFrame,
  estimateVoDurationInSeconds,
  FPS,
  MIN_SCENE_DURATION_IN_SECONDS,
  PLACEHOLDER_DURATION_IN_FRAMES,
  SCENE_PAD_END_IN_SECONDS,
  SCENE_PAD_START_IN_SECONDS,
  sceneDurationInFrames,
  sceneTimingFromVo,
  secondsToFrames,
  totalDurationInFrames,
  TRANSITION_DURATION_IN_SECONDS,
  VO_WORDS_PER_SECOND,
} from "../src/lib/timing";

describe("secondsToFrames", () => {
  it("converts at the project frame rate by default", () => {
    expect(secondsToFrames(1)).toBe(FPS);
    expect(secondsToFrames(0.5)).toBe(FPS / 2);
  });

  it("accepts a custom frame rate", () => {
    expect(secondsToFrames(2, 60)).toBe(120);
  });
});

describe("countWords / estimateVoDurationInSeconds", () => {
  it("ignores extra whitespace", () => {
    expect(countWords("  Stop   dulu!  ")).toBe(2);
    expect(countWords("")).toBe(0);
  });

  it("estimates from the words per second constant", () => {
    const line = "satu dua tiga empat lima";
    expect(estimateVoDurationInSeconds(line)).toBeCloseTo(
      5 / VO_WORDS_PER_SECOND,
    );
  });
});

describe("sceneDurationInFrames", () => {
  it("adds start and end padding to the voice over", () => {
    const vo = 3 - SCENE_PAD_START_IN_SECONDS - SCENE_PAD_END_IN_SECONDS;
    expect(sceneDurationInFrames(vo)).toBe(secondsToFrames(3));
  });

  it("never goes below the minimum scene length", () => {
    expect(sceneDurationInFrames(0)).toBe(
      secondsToFrames(MIN_SCENE_DURATION_IN_SECONDS),
    );
  });
});

describe("sceneTimingFromVo", () => {
  it("starts the VO after the start pad", () => {
    expect(sceneTimingFromVo(2).voStartFrame).toBe(
      secondsToFrames(SCENE_PAD_START_IN_SECONDS),
    );
  });

  it("rounds the VO length up so the last syllable is never cut", () => {
    // 2.01 s = 60.3 frames
    expect(sceneTimingFromVo(2.01).voDurationInFrames).toBe(61);
  });

  it("keeps the VO inside the scene", () => {
    const t = sceneTimingFromVo(4.2);
    expect(t.voStartFrame + t.voDurationInFrames).toBeLessThanOrEqual(
      t.durationInFrames,
    );
  });
});

describe("totalDurationInFrames", () => {
  it("subtracts one transition overlap between each pair of scenes", () => {
    expect(totalDurationInFrames([100, 100, 100], 9)).toBe(282);
  });

  it("has no overlap for a single scene", () => {
    expect(totalDurationInFrames([50], 9)).toBe(50);
  });

  it("falls back to the placeholder length without scenes", () => {
    expect(totalDurationInFrames([])).toBe(PLACEHOLDER_DURATION_IN_FRAMES);
  });
});

describe("timing invariants", () => {
  it("leaves enough silence that VO lines never overlap across a transition", () => {
    expect(
      SCENE_PAD_START_IN_SECONDS + SCENE_PAD_END_IN_SECONDS,
    ).toBeGreaterThan(TRANSITION_DURATION_IN_SECONDS);
  });

  it("lands the counter after its delay", () => {
    expect(counterEndFrame()).toBe(
      ANIM.counterDelayInFrames + ANIM.counterDurationInFrames,
    );
  });
});
