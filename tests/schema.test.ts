import { describe, expect, it } from "vitest";
import ep01 from "../data/episodes/ep01.json";
import { episodeSchema } from "../src/schema";

type Json = Record<string, unknown> & { scenes: Record<string, unknown>[] };

const clone = (): Json => structuredClone(ep01) as Json;

const expectInvalid = (data: unknown, pathFragment: string) => {
  const result = episodeSchema.safeParse(data);
  expect(result.success).toBe(false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths.some((p) => p.includes(pathFragment))).toBe(true);
  }
};

describe("episodeSchema: valid input", () => {
  it("accepts ep01", () => {
    expect(episodeSchema.safeParse(ep01).success).toBe(true);
  });

  it("fills highlight defaults when omitted", () => {
    const data = clone();
    delete data.scenes[1].voHighlight;
    const parsed = episodeSchema.parse(data);
    const myth = parsed.scenes[1];
    expect(myth.type).toBe("myth");
    expect(myth.voHighlight).toEqual([]);
    if (myth.type === "myth") {
      expect(myth.highlight).toEqual([]);
    }
  });

  it("accepts two or three reasons", () => {
    const data = clone();
    const items = data.scenes[3].items as unknown[];
    expect(items).toHaveLength(2);
    data.scenes[3].items = [...items, items[0]];
    expect(episodeSchema.safeParse(data).success).toBe(true);
  });
});

describe("episodeSchema: invalid input", () => {
  it("rejects a malformed id", () => {
    const data = clone();
    data.id = "episode-1";
    expectInvalid(data, "id");
  });

  it("rejects scenes out of beat order", () => {
    const data = clone();
    [data.scenes[1], data.scenes[2]] = [data.scenes[2], data.scenes[1]];
    expectInvalid(data, "scenes");
  });

  it("rejects a missing beat", () => {
    const data = clone();
    data.scenes.splice(3, 1);
    expectInvalid(data, "scenes");
  });

  it("rejects an empty voice over line", () => {
    const data = clone();
    data.scenes[0].vo = "   ";
    expectInvalid(data, "scenes.0.vo");
  });

  it("rejects an unknown scene type", () => {
    const data = clone();
    data.scenes[2].type = "quiz";
    expectInvalid(data, "scenes.2");
  });

  it("rejects absolute or parent asset paths", () => {
    const data = clone();
    data.scenes[0].footage = "/footage/garage.mp4";
    expectInvalid(data, "scenes.0.footage");

    const data2 = clone();
    data2.bgm = "../secrets/track.mp3";
    expectInvalid(data2, "bgm");
  });

  it("rejects a single reason or more than three", () => {
    const data = clone();
    data.scenes[3].items = [{ icon: "lottie/fuel.json", label: "Boros" }];
    expectInvalid(data, "scenes.3.items");

    const data2 = clone();
    const items = data2.scenes[3].items as unknown[];
    data2.scenes[3].items = [...items, items[0], items[0]].slice(0, 4);
    expectInvalid(data2, "scenes.3.items");
  });

  it("rejects a handle without @", () => {
    const data = clone();
    data.scenes[4].handle = "doktermobil";
    expectInvalid(data, "scenes.4.handle");
  });

  it("rejects a non-positive counter target", () => {
    const data = clone();
    data.scenes[2].counterTo = 0;
    expectInvalid(data, "scenes.2.counterTo");
  });
});
