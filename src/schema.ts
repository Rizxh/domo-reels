import { z } from "zod";

// Paths are relative to public/ and resolved with staticFile().
export const assetPath = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith("/") && !p.includes(".."), {
    message: "Asset path must be relative to public/ (no leading slash or ..)",
  });

export const voLine = z.string().trim().min(1, "Voice over line must not be empty");
// Phrases highlighted in brand red. `highlight` targets the on-screen text,
// `voHighlight` targets the word by word caption of the voice over.
export const phrases = z.array(z.string().min(1)).default([]);

// Fields every scene may carry.
const sceneBase = {
  vo: voLine,
  voHighlight: phrases,
  footage: assetPath.optional(),
  sfx: assetPath.optional(),
};

export const hookSceneSchema = z.object({
  type: z.literal("hook"),
  headline: z.string().min(1),
  highlight: phrases,
  ...sceneBase,
});

export const mythSceneSchema = z.object({
  type: z.literal("myth"),
  text: z.string().min(1),
  highlight: phrases,
  lottie: assetPath.optional(),
  ...sceneBase,
});

export const factSceneSchema = z.object({
  type: z.literal("fact"),
  text: z.string().min(1),
  highlight: phrases,
  counterTo: z.number().int().positive().optional(),
  counterUnit: z.string().min(1).optional(),
  ...sceneBase,
});

export const reasonItemSchema = z.object({
  icon: assetPath,
  label: z.string().min(1),
});

export const reasonsSceneSchema = z.object({
  type: z.literal("reasons"),
  items: z.array(reasonItemSchema).min(2).max(3),
  ...sceneBase,
});

export const ctaSceneSchema = z.object({
  type: z.literal("cta"),
  text: z.string().min(1),
  highlight: phrases,
  handle: z.string().regex(/^@[\w.]+$/, "Handle must look like @account"),
  ...sceneBase,
});

export const sceneSchema = z.discriminatedUnion("type", [
  hookSceneSchema,
  mythSceneSchema,
  factSceneSchema,
  reasonsSceneSchema,
  ctaSceneSchema,
]);

// Every "Mitos atau Fakta?" episode follows the same fixed 5 beat structure.
export const BEAT_ORDER = ["hook", "myth", "fact", "reasons", "cta"] as const;

export const episodeSchema = z.object({
  id: z.string().regex(/^ep\d{2,}$/, "Episode id must look like ep01"),
  title: z.string().min(1),
  bgm: assetPath.optional(),
  scenes: z
    .array(sceneSchema)
    .length(BEAT_ORDER.length)
    .refine((scenes) => scenes.every((s, i) => s.type === BEAT_ORDER[i]), {
      message: `Scenes must follow the beat order: ${BEAT_ORDER.join(" > ")}`,
    }),
});

export const wordTimingSchema = z.object({
  text: z.string(),
  startFrame: z.number().int(),
  endFrame: z.number().int(),
});

// Frame timing of one scene, relative to the scene's own first frame.
export const sceneTimingSchema = z.object({
  durationInFrames: z.number().int().positive(),
  voStartFrame: z.number().int().nonnegative(),
  voDurationInFrames: z.number().int().positive(),
  // public/ path of the generated VO; absent while the duration is estimated.
  voSrc: z.string().optional(),
  // Caption word timings from the TTS alignment; absent means even split.
  words: z.array(wordTimingSchema).optional(),
  // Measured loudness of the VO file, from its sidecar.
  voLoudnessLufs: z.number().optional(),
});

// Composition props: the episode plus render-time fields.
export const eduReelSchema = episodeSchema.extend({
  // Shows the safe zone overlay. Only ever visible inside Remotion Studio.
  debug: z.boolean(),
  // Filled in by calculateMetadata; never written by hand.
  sceneTimings: z.array(sceneTimingSchema).optional(),
});

export type Scene = z.infer<typeof sceneSchema>;
export type SceneType = Scene["type"];
export type HookScene = z.infer<typeof hookSceneSchema>;
export type MythScene = z.infer<typeof mythSceneSchema>;
export type FactScene = z.infer<typeof factSceneSchema>;
export type ReasonsScene = z.infer<typeof reasonsSceneSchema>;
export type CtaScene = z.infer<typeof ctaSceneSchema>;
export type SceneTiming = z.infer<typeof sceneTimingSchema>;
export type Episode = z.infer<typeof episodeSchema>;
export type EduReelProps = z.infer<typeof eduReelSchema>;
