import { describe, expect, it } from "vitest";
import {
  alignmentToWords,
  voAlignmentPath,
  voAudioPath,
} from "../src/lib/audio";
import {
  bgmVolumeAt,
  MIX,
  sceneStartFrames,
  sfxCueFrames,
} from "../src/lib/mix";
import {
  evenWordTimings,
  highlightMask,
  paginateWords,
  splitWords,
} from "../src/lib/text";
import { ANIM, counterEndFrame, FPS } from "../src/lib/timing";
import ep01 from "../data/episodes/ep01.json";
import { episodeSchema } from "../src/schema";

describe("highlightMask", () => {
  it("matches multi-word phrases ignoring case and punctuation", () => {
    const words = splitWords("STOP manasin mobil 15 MENIT!");
    expect(highlightMask(words, ["stop", "15 menit"])).toEqual([
      true,
      false,
      false,
      true,
      true,
    ]);
  });

  it("keeps the slash in s/d", () => {
    const words = splitWords("30 s/d 60 DETIK cukup");
    expect(highlightMask(words, ["30 s/d 60 DETIK"])).toEqual([
      true,
      true,
      true,
      true,
      false,
    ]);
  });

  it("does not match partial phrases", () => {
    expect(highlightMask(["lima", "puluh"], ["lima belas"])).toEqual([
      false,
      false,
    ]);
  });
});

describe("paginateWords", () => {
  it("breaks pages at sentence punctuation and at the word limit", () => {
    const words = splitWords(
      "Masih manasin mobil lima belas menit tiap pagi? Stop dulu!",
    );
    expect(paginateWords(words, 4)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9],
    ]);
  });
});

describe("evenWordTimings", () => {
  it("spreads words across the duration back to back", () => {
    const timings = evenWordTimings("a b c d", 10, 40);
    expect(timings.map((t) => t.startFrame)).toEqual([10, 20, 30, 40]);
    expect(timings[timings.length - 1].endFrame).toBe(50);
  });
});

describe("alignmentToWords", () => {
  it("groups characters into words with first-start and last-end times", () => {
    const text = "Halo  dunia!";
    const characters = [...text];
    const words = alignmentToWords({
      characters,
      character_start_times_seconds: characters.map((_, i) => i * 0.1),
      character_end_times_seconds: characters.map((_, i) => (i + 1) * 0.1),
    });
    expect(words.map((w) => w.text)).toEqual(splitWords(text));
    expect(words[0].startInSeconds).toBeCloseTo(0);
    expect(words[0].endInSeconds).toBeCloseTo(0.4);
    expect(words[1].startInSeconds).toBeCloseTo(0.6);
    expect(words[1].endInSeconds).toBeCloseTo(1.2);
  });
});

describe("audio paths", () => {
  it("uses 1-based scene numbers", () => {
    expect(voAudioPath("ep01", 0)).toBe("audio/ep01/s1.mp3");
    expect(voAlignmentPath("ep01", 4)).toBe("audio/ep01/s5.json");
  });
});

describe("sceneStartFrames", () => {
  it("overlaps each scene with the previous one by the transition", () => {
    expect(sceneStartFrames([100, 80, 60], 9)).toEqual([0, 91, 162]);
  });
});

describe("bgmVolumeAt", () => {
  const ranges = [{ from: 100, to: 200 }];
  const total = 1000;

  it("ducks under the voice over", () => {
    expect(bgmVolumeAt(150, ranges, total, FPS)).toBeCloseTo(MIX.bgmUnderVo);
  });

  it("returns to the free level away from any VO", () => {
    expect(bgmVolumeAt(500, ranges, total, FPS)).toBeCloseTo(MIX.bgmFree);
  });

  it("ramps between the two levels near a VO edge", () => {
    const halfway = 100 - MIX.duckRampInFrames / 2;
    expect(bgmVolumeAt(halfway, ranges, total, FPS)).toBeCloseTo(
      (MIX.bgmFree + MIX.bgmUnderVo) / 2,
    );
  });

  it("starts silent and ends silent", () => {
    expect(bgmVolumeAt(0, ranges, total, FPS)).toBe(0);
    expect(bgmVolumeAt(total, ranges, total, FPS)).toBe(0);
  });
});

describe("sfxCueFrames", () => {
  const scenes = episodeSchema.parse(ep01).scenes;

  it("fires the ding when the counter lands", () => {
    expect(sfxCueFrames(scenes[2])).toEqual([counterEndFrame()]);
  });

  it("pops once per reason card, staggered", () => {
    expect(sfxCueFrames(scenes[3])).toEqual(
      [0, 1].map((i) => ANIM.contentDelayInFrames + i * ANIM.staggerInFrames),
    );
  });

  it("alerts on the very first frame of the hook", () => {
    expect(sfxCueFrames(scenes[0])).toEqual([0]);
  });
});
