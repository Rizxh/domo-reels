import { z } from "zod";

// Talking-head edit: a raw take, the source ranges kept, framing keyframes
// and illustrations. Every time here is in SOURCE seconds, so illustrations
// stay glued to the words when the cut list changes.

const assetPath = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith("/") && !p.includes(".."), {
    message: "Asset path must be relative to public/ (no leading slash or ..)",
  });

const seconds = z.number().nonnegative();
const phrases = z.array(z.string().min(1)).default([]);

const timed = { from: seconds, to: seconds };

export const titleIllustrationSchema = z.object({
  kind: z.literal("title"),
  ...timed,
  // Each line is a label block; highlighted lines sit on brand red.
  lines: z.array(z.string().min(1)).min(1).max(3),
  highlight: phrases,
});

export const priceIllustrationSchema = z.object({
  kind: z.literal("price"),
  ...timed,
  currency: z.string().min(1),
  amount: z.string().min(1),
  unit: z.string().min(1),
  caption: z.string().min(1),
});

export const ENGINE_PARTS = [
  "intake",
  "throttle",
  "sparkPlug",
  "piston",
  "catalytic",
] as const;

// Split-screen explainer board: engine cutaway on top, speaker below. Each
// part is held long enough to read its note even when it is named quickly.
export const engineIllustrationSchema = z.object({
  kind: z.literal("engine"),
  ...timed,
  eyebrow: z.string().min(1),
  heading: z.string().min(1),
  parts: z
    .array(
      z.object({
        part: z.enum(ENGINE_PARTS),
        label: z.string().min(1),
        // One-line explanation shown while the part is in focus.
        note: z.string().min(1),
        // Source second the part is named in the take.
        at: seconds,
      }),
    )
    .min(1),
  // Shown once every part has had its turn.
  summaryTitle: z.string().min(1),
  summary: z.string().min(1),
});

export const BENEFIT_ICONS = ["stopwatch", "wallet"] as const;

export const benefitsIllustrationSchema = z.object({
  kind: z.literal("benefits"),
  ...timed,
  items: z
    .array(
      z.object({
        icon: z.enum(BENEFIT_ICONS),
        label: z.string().min(1),
        at: seconds,
      }),
    )
    .min(1)
    .max(2),
});

export const linkIllustrationSchema = z.object({
  kind: z.literal("link"),
  ...timed,
  label: z.string().min(1),
});

export const endCardIllustrationSchema = z.object({
  kind: z.literal("endCard"),
  ...timed,
  tagline: z.string().min(1),
  // Source second the tagline lands (e.g. when "pasti beres" is spoken).
  taglineAt: seconds,
});

export const illustrationSchema = z
  .discriminatedUnion("kind", [
    titleIllustrationSchema,
    priceIllustrationSchema,
    benefitsIllustrationSchema,
    engineIllustrationSchema,
    linkIllustrationSchema,
    endCardIllustrationSchema,
  ])
  .refine((i) => i.to > i.from, { message: "Illustration needs to > from" });

export const framingKeySchema = z.object({
  at: seconds,
  // Punch-in relative to the full frame (1 = as shot).
  zoom: z.number().min(1).max(1.6),
});

export const transcriptWordSchema = z.object({
  text: z.string().min(1),
  start: seconds,
  end: seconds,
});

const talkingHeadBase = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  source: assetPath,
  cuts: z
    .array(z.object(timed).refine((c) => c.to > c.from))
    .min(1)
    .refine(
      (cuts) => cuts.every((c, i) => i === 0 || c.from >= cuts[i - 1].to),
      { message: "Cuts must be in order and must not overlap" },
    ),
  framing: z.array(framingKeySchema).min(1),
  captionHighlight: phrases,
  illustrations: z.array(illustrationSchema).default([]),
  words: z.array(transcriptWordSchema).min(1),
});

const framingInOrder = (edit: { framing: { at: number }[] }) =>
  edit.framing.every((k, i) => i === 0 || k.at > edit.framing[i - 1].at);
const FRAMING_ORDER = { message: "Framing keys must be in ascending order" };

export const talkingHeadSchema = talkingHeadBase.refine(
  framingInOrder,
  FRAMING_ORDER,
);

export const talkingHeadPropsSchema = talkingHeadBase
  .extend({
    // Shows the safe zone overlay. Only ever visible inside Remotion Studio.
    debug: z.boolean(),
  })
  .refine(framingInOrder, FRAMING_ORDER);

export type TalkingHeadEdit = z.infer<typeof talkingHeadSchema>;
export type TalkingHeadProps = z.infer<typeof talkingHeadPropsSchema>;
export type Illustration = z.infer<typeof illustrationSchema>;
export type EngineIllustration = z.infer<typeof engineIllustrationSchema>;
export type EnginePart = (typeof ENGINE_PARTS)[number];
export type BenefitIcon = (typeof BENEFIT_ICONS)[number];
