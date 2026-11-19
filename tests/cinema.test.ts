import { describe, expect, it } from "vitest";
import ep03 from "../data/episodes/ep03.json";
import { cinemaEpisodeSchema } from "../src/cinemaSchema";
import { cueMatches } from "../src/lib/cues";

describe("cinema episode schema", () => {
  it("accepts EP03", () => {
    expect(cinemaEpisodeSchema.safeParse(ep03).success).toBe(true);
  });

  it("ties every text and mark to a word of its own VO line", () => {
    const ep = cinemaEpisodeSchema.parse(ep03);
    for (const beat of ep.beats) {
      for (const t of beat.texts) {
        expect(cueMatches(beat.vo, t.cue.word).length).toBeGreaterThanOrEqual(t.cue.nth);
      }
      for (const m of beat.marks) {
        expect(cueMatches(beat.vo, m.word).length).toBeGreaterThanOrEqual(m.nth);
      }
    }
  });

  it("rejects a cue word that is not spoken", () => {
    const bad = structuredClone(ep03);
    bad.beats[0].texts[0].cue.word = "kempes";
    expect(cinemaEpisodeSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects date digits that disagree with the date code", () => {
    const bad = structuredClone(ep03);
    const week = bad.beats[3].texts.find((t) => t.id === "week");
    if (week) {
      week.text = "21";
    }
    expect(cinemaEpisodeSchema.safeParse(bad).success).toBe(false);
  });

  it("keeps the spoken age consistent with the date code", () => {
    const ep = cinemaEpisodeSchema.parse(ep03);
    expect(ep.dateCode?.ageYears).toBe(2026 - (ep.dateCode?.year ?? 0));
  });
});

describe("EP04 (engine world)", () => {
  it("validates without a date code", async () => {
    const ep04 = (await import("../data/episodes/ep04.json")).default;
    const parsed = cinemaEpisodeSchema.safeParse(ep04);
    expect(parsed.success).toBe(true);
  });
});
