import { z } from "zod";
import { cueMatches } from "./lib/cues";
import { phrases, voLine } from "./schema";
import { wordTimingSchema } from "./schema";

// "Cinema" format (EP03 onward): a live React Three Fiber world with a shot
// list per beat. Every on-screen text and every picture event is tied to a
// word of its beat's VO line; the camera choreography lives in the world's
// code, the copy only here.

const label = z.string().trim().min(1);

// A word of the beat's own VO line; `nth` picks the repetition (1-based).
export const cueSchema = z.object({
  word: z.string().trim().min(1),
  nth: z.number().int().min(1).default(1),
});
export type Cue = z.infer<typeof cueSchema>;

export const TEXT_STYLES = [
  // Big headline in the top band of the safe area.
  "title",
  // Short line with a leader to a point in the 3D world.
  "callout",
  // Stacked labels in the middle band, one under the other.
  "label",
  // Two digits of the date code, pinned to the world with a sub label.
  "digit",
  // One big number in the middle of the frame with a sub label.
  "figure",
  // Small print under a title.
  "note",
  // CTA block: logo and follow handle.
  "handle",
] as const;

export const cinemaTextSchema = z.object({
  id: z.string().min(1),
  style: z.enum(TEXT_STYLES),
  text: label,
  sub: label.optional(),
  accent: z.boolean().default(false),
  // Named point of the world the text points at (callout and digit).
  anchor: z.string().optional(),
  cue: cueSchema,
});
export type CinemaText = z.infer<typeof cinemaTextSchema>;

// Picture-only events (a cut, a light change) on a spoken word.
export const markSchema = z.object({
  id: z.string().min(1),
  word: z.string().trim().min(1),
  nth: z.number().int().min(1).default(1),
});

export const cinemaBeatSchema = z
  .object({
    id: z.string().min(1),
    vo: voLine,
    voHighlight: phrases,
    texts: z.array(cinemaTextSchema).default([]),
    marks: z.array(markSchema).default([]),
  })
  .superRefine((beat, ctx) => {
    const check = (word: string, nth: number, path: (string | number)[]) => {
      const n = cueMatches(beat.vo, word).length;
      if (n < nth) {
        ctx.addIssue({
          code: "custom",
          path,
          message: `Cue "${word}" (#${nth}) is not in the VO line "${beat.vo}" (found ${n}x)`,
        });
      }
    };
    beat.texts.forEach((t, i) => check(t.cue.word, t.cue.nth, ["texts", i, "cue"]));
    beat.marks.forEach((m, i) => check(m.word, m.nth, ["marks", i]));
  });
export type CinemaBeat = z.infer<typeof cinemaBeatSchema>;

export const cinemaEpisodeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    // "cinema" = live R3F world, "paper" = 2D whiteboard and paper cut-outs.
    format: z.enum(["cinema", "paper"]),
    world: z.enum(["tire", "engine", "brake", "board", "story"]),
    title: label,
    tag: label,
    handle: z.string().regex(/^@[\w.]+$/, "Handle must look like @account"),
    // The production date printed on the tire (week + two-digit year).
    dateCode: z
      .object({
        week: z.number().int().min(1).max(53),
        year: z.number().int().min(2000).max(2099),
        ageYears: z.number().int().min(0).max(30),
      })
      .optional(),
    claims: z.array(z.object({ text: label, reviewed: z.boolean() })).min(1),
    beats: z.array(cinemaBeatSchema).min(3),
  })
  .superRefine((ep, ctx) => {
    const ids = new Set<string>();
    ep.beats.forEach((b, bi) =>
      [...b.texts, ...b.marks].forEach((x) => {
        if (ids.has(x.id)) {
          ctx.addIssue({ code: "custom", path: ["beats", bi], message: `Duplicate cue id "${x.id}"` });
        }
        ids.add(x.id);
      }),
    );
    // Digits on screen must match the date code.
    if (!ep.dateCode) {
      return;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const digits = { week: pad(ep.dateCode.week), year: pad(ep.dateCode.year % 100) };
    ep.beats.forEach((b, bi) =>
      b.texts.forEach((t, ti) => {
        if (t.style === "digit" && t.anchor === "weekDigits" && t.text !== digits.week) {
          ctx.addIssue({ code: "custom", path: ["beats", bi, "texts", ti], message: `Week digits must be ${digits.week}` });
        }
        if (t.style === "digit" && t.anchor === "yearDigits" && t.text !== digits.year) {
          ctx.addIssue({ code: "custom", path: ["beats", bi, "texts", ti], message: `Year digits must be ${digits.year}` });
        }
      }),
    );
  });
export type CinemaEpisode = z.infer<typeof cinemaEpisodeSchema>;

// Timeline of one beat, filled by calculateMetadata from the VO files.
export const cinemaBeatTimingSchema = z.object({
  startFrame: z.number().int(),
  endFrame: z.number().int(),
  voStartFrame: z.number().int(),
  voDurationInFrames: z.number().int(),
  voSrc: z.string().optional(),
  voGain: z.number().optional(),
  words: z.array(wordTimingSchema),
});

export const cinemaPropsSchema = cinemaEpisodeSchema.and(
  z.object({
    debug: z.boolean().default(false),
    draft: z.boolean().default(false),
    beatTimings: z.array(cinemaBeatTimingSchema).optional(),
  }),
);
export type CinemaProps = z.infer<typeof cinemaPropsSchema>;
