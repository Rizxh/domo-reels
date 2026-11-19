import { describe, expect, it } from "vitest";
import ep02 from "../data/episodes/ep02.json";
import {
  combustionsPerSecond,
  explainerEpisodeSchema,
  onScreenCopy,
  sceneCues,
} from "../src/explainerSchema";
import { cueWordIndex } from "../src/lib/cues";
import { splitWords, terbilang } from "../src/lib/text";
import {
  countWords,
  FPS,
  OUTRO_HOLD_IN_SECONDS,
  REEL_MAX_DURATION_IN_SECONDS,
  sceneTimingFromVo,
  secondsToFrames,
  totalDurationInFrames,
  VO_WORDS_PER_SECOND,
} from "../src/lib/timing";

type Json = Record<string, unknown> & {
  engine: { cylinders: number; rpm: number };
  scenes: Record<string, unknown>[];
};
const clone = (): Json => structuredClone(ep02) as unknown as Json;

const issuePaths = (data: unknown): string[] => {
  const result = explainerEpisodeSchema.safeParse(data);
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

const episode = explainerEpisodeSchema.parse(ep02);

// Pace of the EP01 ElevenLabs take: 58 words in 27.0 s.
const MEASURED_WORDS_PER_SECOND = 2.15;
// The brief asks for more than 20 seconds.
const MIN_SECONDS = 20;

const estimatedSeconds = (wordsPerSecond: number): number => {
  const durations = episode.scenes.map(
    (s) =>
      sceneTimingFromVo(countWords(s.vo) / wordsPerSecond).durationInFrames,
  );
  durations[durations.length - 1] += secondsToFrames(OUTRO_HOLD_IN_SECONDS);
  return totalDurationInFrames(durations) / FPS;
};

describe("terbilang", () => {
  it("spells Indonesian numbers", () => {
    const cases: [number, string][] = [
      [0, "nol"],
      [7, "tujuh"],
      [10, "sepuluh"],
      [11, "sebelas"],
      [15, "lima belas"],
      [20, "dua puluh"],
      [25, "dua puluh lima"],
      [100, "seratus"],
      [101, "seratus satu"],
      [111, "seratus sebelas"],
      [125, "seratus dua puluh lima"],
      [999, "sembilan ratus sembilan puluh sembilan"],
    ];
    for (const [n, text] of cases) {
      expect(terbilang(n)).toBe(text);
    }
    expect(() => terbilang(1000)).toThrow(RangeError);
  });
});

describe("ep02 script", () => {
  it("is valid", () => {
    expect(issuePaths(ep02)).toEqual([]);
  });

  it("derives its numbers from the stated engine", () => {
    expect(combustionsPerSecond(episode.engine)).toBe(100);
    const reveal = episode.scenes[1];
    expect(reveal.type).toBe("reveal");
    if (reveal.type === "reveal") {
      expect(reveal.note).toContain(episode.engine.rpm.toLocaleString("id-ID"));
      expect(reveal.note).toContain(`${episode.engine.cylinders} silinder`);
    }
  });

  it("resolves every cue to one word of its own line", () => {
    for (const scene of episode.scenes) {
      for (const cue of sceneCues(scene)) {
        expect(cueWordIndex(scene.vo, cue.word)).not.toBeNull();
      }
    }
  });

  it("fires the four stroke labels in spoken order", () => {
    const cycle = episode.scenes[2];
    expect(cycle.type).toBe("cycle");
    if (cycle.type === "cycle") {
      const order = cycle.steps.map((s) => cueWordIndex(cycle.vo, s.cueWord));
      expect(order).toEqual([...order].sort((a, b) => (a ?? 0) - (b ?? 0)));
      // The label on screen is the word being spoken.
      for (const step of cycle.steps) {
        expect(step.label.toLowerCase()).toBe(step.cueWord.toLowerCase());
      }
    }
  });

  // Proofreading lock: changing any on-screen text must be done here too.
  it("shows exactly the approved on-screen copy", () => {
    expect(onScreenCopy(episode)).toEqual([
      "100×",
      "PER DETIK",
      "MESIN MOBILMU",
      "±3.000 rpm, 4 silinder",
      "ISAP",
      "KOMPRESI",
      "USAHA",
      "BUANG",
      "25× PER DETIK",
      "BUSI AUS",
      "KERAK KARBON",
      "TARIKAN BERAT",
      "BENSIN BOROS",
      "@doktermobil",
    ]);
  });

  it("speaks exactly the approved lines", () => {
    expect(episode.scenes.map((s) => s.vo)).toEqual([
      "Ledakan ini terjadi seratus kali per detik, tepat di depan kakimu.",
      "Itu mesin mobilmu saat melaju di tol.",
      "Empat silinder bergantian: isap, kompresi, usaha, buang. Tiap busi memercik dua puluh lima kali per detik.",
      "Kalau busi aus atau ruang bakar berkerak, ledakannya melemah. Tarikan berat, bensin boros.",
      "Simpan video ini, dan follow Doktermobil.",
    ]);
  });

  it("has clean spacing and sentence punctuation", () => {
    for (const text of [
      ...episode.scenes.map((s) => s.vo),
      ...onScreenCopy(episode),
    ]) {
      expect(text).toBe(text.trim());
      expect(text).not.toMatch(/\s{2,}/);
      expect(text).not.toMatch(/\s[.,:!?]/);
    }
    for (const scene of episode.scenes) {
      expect(scene.vo).toMatch(/[.!?]$/);
      expect(splitWords(scene.vo).length).toBeGreaterThan(0);
    }
  });

  it("is estimated to run longer than 20 s and inside the Reel limit", () => {
    for (const rate of [VO_WORDS_PER_SECOND, MEASURED_WORDS_PER_SECOND]) {
      const seconds = estimatedSeconds(rate);
      expect(seconds).toBeGreaterThan(MIN_SECONDS);
      expect(seconds).toBeLessThanOrEqual(REEL_MAX_DURATION_IN_SECONDS);
    }
  });
});

describe("explainerEpisodeSchema: rejects copy that disagrees with the VO", () => {
  it("rejects a misspelled cue word", () => {
    const data = clone();
    (data.scenes[0].count as { cueWord: string }).cueWord = "seratuz";
    expect(issuePaths(data)).toContain("scenes.0.count.cueWord");
  });

  it("rejects a cue word spoken twice in its line", () => {
    const data = clone();
    data.scenes[4].vo =
      "Simpan video ini, simpan juga, dan follow Doktermobil.";
    expect(issuePaths(data)).toContain("scenes.4.saveCueWord");
  });

  it("rejects an on-screen number the voice does not say", () => {
    const data = clone();
    (data.scenes[0].count as { value: number }).value = 90;
    expect(issuePaths(data)).toContain("scenes.0.count.value");
  });

  it("rejects numbers that no longer follow from the engine", () => {
    const data = clone();
    data.engine.rpm = 2000;
    const paths = issuePaths(data);
    expect(paths).toContain("scenes.0.count.value");
    expect(paths).toContain("scenes.2.spark.value");
  });

  it("rejects a caption highlight that is not spoken", () => {
    const data = clone();
    data.scenes[3].voHighlight = ["melemas"];
    expect(issuePaths(data)).toContain("scenes.3.voHighlight.0");
  });

  it("rejects strokes out of order", () => {
    const data = clone();
    const steps = data.scenes[2].steps as unknown[];
    [steps[0], steps[1]] = [steps[1], steps[0]];
    expect(issuePaths(data).some((p) => p.startsWith("scenes.2.steps"))).toBe(
      true,
    );
  });

  it("rejects beats out of order", () => {
    const data = clone();
    [data.scenes[1], data.scenes[2]] = [data.scenes[2], data.scenes[1]];
    expect(issuePaths(data).some((p) => p.startsWith("scenes"))).toBe(true);
  });
});
