import { describe, expect, it } from "vitest";
import edit from "../data/talking-head/ko-lung-lung.json";
import transcript from "../data/talking-head/ko-lung-lung.transcript.json";
import {
  buildTalkingHeadTimeline,
  presence,
  schedulePhases,
  zoomAt,
} from "../src/talking-head/timeline";
import { talkingHeadSchema } from "../src/talkingHeadSchema";

const FPS = 30;
const parsed = talkingHeadSchema.parse({ ...edit, words: transcript.words });
const timeline = buildTalkingHeadTimeline(parsed, FPS);

describe("ko-lung-lung edit", () => {
  it("validates and fits the Reel length", () => {
    const last = timeline.clips[timeline.clips.length - 1];
    const seconds = (last.startFrame + last.durationInFrames) / FPS;
    expect(seconds).toBeGreaterThanOrEqual(15);
    expect(seconds).toBeLessThanOrEqual(30);
  });

  it("keeps every transcript word (the transcript only covers kept ranges)", () => {
    expect(timeline.words).toHaveLength(parsed.words.length);
  });

  it("places illustrations inside the edit, in order", () => {
    const total = timeline.clips.reduce((s, c) => s + c.durationInFrames, 0);
    timeline.illustrations.forEach((item, i) => {
      expect(item.endFrame).toBeGreaterThan(item.startFrame);
      expect(item.endFrame).toBeLessThanOrEqual(total);
      if (i > 0) {
        expect(item.startFrame).toBeGreaterThanOrEqual(
          timeline.illustrations[i - 1].startFrame,
        );
      }
    });
  });

  it("snaps framing on cuts and glides elsewhere", () => {
    const onCut = timeline.framing.filter((k) => k.snap).map((k) => k.frame);
    expect(onCut).toContain(timeline.clips[1].startFrame);
    const glide = timeline.framing.find((k) => !k.snap && k.frame > 0);
    expect(glide).toBeDefined();
    if (glide) {
      const before = zoomAt(glide.frame - 1, timeline.framing);
      const mid = zoomAt(glide.frame + 3, timeline.framing);
      expect(mid).not.toBe(before);
      expect(mid).not.toBe(glide.zoom);
    }
  });
});

describe("presence", () => {
  it("rises, holds and falls inside its window", () => {
    const w = { startFrame: 10, endFrame: 60 };
    expect(presence(5, w)).toBe(0);
    expect(presence(35, w)).toBe(1);
    expect(presence(60, w)).toBe(0);
    expect(presence(15, w)).toBeGreaterThan(0);
    expect(presence(15, w)).toBeLessThan(1);
  });
});

describe("schedulePhases", () => {
  it("holds each step for the minimum before the next one starts", () => {
    expect(schedulePhases([10, 12, 40, 41], 20)).toEqual([10, 30, 50, 70]);
    expect(schedulePhases([0, 100], 20)).toEqual([0, 100]);
  });
});
