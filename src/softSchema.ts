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
  // Seconds held after the voice ends (e.g. 1.5 s hold before a fade out).
  hold: z.number().min(0).max(4).default(0),
  // On-screen copy of the scene, read by the shot by key (keeps episode copy
  // out of components). Example: { "title": "RODA LEPAS SETELAH 1-2 KM" }.
  screen: z.record(z.string(), z.string()).default({}),
  sfx: z.array(z.object({ sound: z.string(), at: z.number().min(0).max(1) })).default([]),
  // Named beat times in seconds from the scene start, for episodes without a
  // voice over (no word timings to cue on). Shots read them by name.
  cues: z.record(z.string(), z.number().min(0)).default({}),
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
  // 9:16 (Reels, composition Soft2D) or 16:9 (YouTube, composition Soft169).
  aspect: z.enum(["9:16", "16:9"]).default("9:16"),
  world: z.string(),
  title: z.string().min(1).max(60),
  handle: z.string(),
  brandName: z.string().default("DOKTERMOBIL"),
  tagline: z.string().max(60),
  music: z.string().optional(),
  // Music in parts placed on the timeline (seconds); used instead of `music`
  // when set. Without any recorded voice the music plays un-ducked.
  musicParts: z
    .array(z.object({ src: z.string(), at: z.number().min(0), until: z.number().optional(), fadeIn: z.number().min(0).default(0.4), fadeOut: z.number().min(0).default(1), volume: z.number().min(0).max(2).default(1) }))
    .default([]),
  // End of the video: fade to black over `fade` s, then `black` s of black
  // with the logo watermark.
  ending: z.object({ fade: z.number().min(0.1).max(3).default(0.45), black: z.number().min(0).max(3).default(0) }).default({ fade: 0.45, black: 0 }),
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
