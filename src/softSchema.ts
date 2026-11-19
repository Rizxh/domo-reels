// "Soft" format (EP08 onward): a Kok Bisa-style animated explainer with our
// own calm look. A 2D SVG world (src/soft/) draws one illustration per scene,
// every beat cued on the narration's word timings; the camera glides between
// scenes and each cut dissolves. Narration by ElevenLabs (npm run soft:voice),
// subtitles word by word, a "Sumber" chip for every fact.

import { z } from "zod";

const word = z.object({ w: z.string(), t: z.number().min(0) });

export const softSceneSchema = z.object({
  // Shot name of the world (see src/soft/<world>.tsx).
  shot: z.string().min(1),
  // Filled in by npm run soft:voice from the recorded audio.
  seconds: z.number().min(1).max(15),
  // Short on-screen headline (pill at the top).
  lyric: z.string().max(26).optional(),
  outro: z.boolean().default(false),
  sfx: z.array(z.object({ sound: z.string(), at: z.number().min(0).max(1) })).default([]),
  vo: z.object({
    text: z.string().min(1).max(260),
    src: z.string().optional(),
    words: z.array(word).optional(),
    seconds: z.number().optional(),
  }),
});

export const softEpisodeSchema = z.object({
  id: z.string().regex(/^ep\d{2,}$/),
  format: z.literal("soft"),
  world: z.string(),
  title: z.string().min(1).max(60),
  handle: z.string(),
  brandName: z.string().default("DOKTERMOBIL"),
  tagline: z.string().max(60),
  music: z.string().optional(),
  narration: z
    .object({
      model: z.string().default("eleven_multilingual_v2"),
      voice: z.string().optional(),
      speed: z.number().min(0.7).max(1.2).default(1.2),
      stability: z.number().min(0).max(1).default(0.3),
      exaggeration: z.number().min(0).max(1).default(0.5),
    })
    .default({ model: "eleven_multilingual_v2", speed: 1.2, stability: 0.3, exaggeration: 0.5 }),
  claims: z.array(z.object({ text: z.string(), reviewed: z.boolean().default(false) })).default([]),
  scenes: z.array(softSceneSchema).min(2).max(14),
  thumb: z
    .object({ scene: z.number().int().min(1), at: z.number().min(0).max(1).default(0.85), title: z.string().max(40).optional(), highlight: z.string().max(24).optional(), hook: z.string().max(40).optional(), offset: z.number().default(380) })
    .optional(),
  post: z.object({ caption: z.string(), hashtags: z.array(z.string()).max(8) }).optional(),
});
export type SoftEpisode = z.infer<typeof softEpisodeSchema>;
export type SoftScene = z.infer<typeof softSceneSchema>;

export const softPropsSchema = softEpisodeSchema.extend({ debug: z.boolean().default(false) });
export type SoftProps = z.infer<typeof softPropsSchema>;
