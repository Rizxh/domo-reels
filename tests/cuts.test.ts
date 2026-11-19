import { describe, expect, it } from "vitest";
import {
  buildCutTimeline,
  cutDurationInFrames,
  sourceToOutputFrame,
  wordsOnOutput,
} from "../src/lib/cuts";

const FPS = 30;
const clips = buildCutTimeline(
  [
    { from: 2, to: 4 },
    { from: 10, to: 11.5 },
  ],
  FPS,
);

describe("buildCutTimeline", () => {
  it("places clips back to back", () => {
    expect(clips.map((c) => [c.startFrame, c.durationInFrames])).toEqual([
      [0, 60],
      [60, 45],
    ]);
    expect(clips[1].trimBefore).toBe(300);
    expect(cutDurationInFrames(clips)).toBe(105);
  });
});

describe("sourceToOutputFrame", () => {
  it("maps kept moments and drops cut ones", () => {
    expect(sourceToOutputFrame(3, clips, FPS)).toBe(30);
    expect(sourceToOutputFrame(10.5, clips, FPS)).toBe(75);
    expect(sourceToOutputFrame(6, clips, FPS)).toBeNull();
  });
});

describe("wordsOnOutput", () => {
  it("keeps words whose midpoint survives and clamps to the clip", () => {
    const words = wordsOnOutput(
      [
        { text: "dibuang", start: 5, end: 5.4 },
        { text: "awal", start: 1.9, end: 2.3 },
        { text: "lanjut", start: 10.2, end: 10.6 },
      ],
      clips,
      FPS,
    );
    expect(words).toEqual([
      { text: "awal", startFrame: 0, endFrame: 9 },
      { text: "lanjut", startFrame: 66, endFrame: 78 },
    ]);
  });
});
