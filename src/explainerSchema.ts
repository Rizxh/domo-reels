import { z } from "zod";
import { cueMatches } from "./lib/cues";
import {
  highlightMask,
  normalizeWord,
  splitWords,
  terbilang,
} from "./lib/text";
import { assetPath, phrases, voLine } from "./schema";

// "Jarang Diketahui" 3D explainer (EP02 onward): hook, reveal, how it works,
// why it matters, call to action. Every on-screen text and every cue word
// lives here; the schema rejects copy that disagrees with the voice over.

const label = z.string().trim().min(1);
// A word of the scene's own VO line; the event fires when it is spoken.
const cueWord = z.string().trim().min(1);

const sceneBase = {
  vo: voLine,
  voHighlight: phrases,
};

// A number shown on screen, e.g. 100 + "×" + "PER DETIK".
const figure = z.object({
  value: z.number().int().min(0).max(999),
  suffix: z.string(),
  unit: label,
  cueWord,
});

export const explainerHookSchema = z.object({
  type: z.literal("hook"),
  count: figure,
  ...sceneBase,
});

export const explainerRevealSchema = z.object({
  type: z.literal("reveal"),
  title: z.object({ text: label, cueWord }),
  // Small print that keeps the headline number honest.
  note: label,
  ...sceneBase,
});

export const STROKES = ["intake", "compression", "power", "exhaust"] as const;

export const explainerCycleSchema = z.object({
  type: z.literal("cycle"),
  steps: z
    .array(z.object({ stroke: z.enum(STROKES), label, cueWord }))
    .length(STROKES.length)
    .refine((steps) => steps.every((s, i) => s.stroke === STROKES[i]), {
      message: `Steps must follow the stroke order: ${STROKES.join(" > ")}`,
    }),
  spark: figure,
  ...sceneBase,
});

export const IMPACT_CAUSES = ["wornPlug", "carbon"] as const;
export const IMPACT_EFFECTS = ["power", "fuel"] as const;

export const explainerImpactSchema = z.object({
  type: z.literal("impact"),
  causes: z
    .array(z.object({ kind: z.enum(IMPACT_CAUSES), label, cueWord }))
    .length(IMPACT_CAUSES.length),
  // Word on which the dirty cylinder's flame visibly weakens.
  weakenCueWord: cueWord,
  effects: z
    .array(z.object({ kind: z.enum(IMPACT_EFFECTS), label, cueWord }))
    .length(IMPACT_EFFECTS.length),
  ...sceneBase,
});

export const explainerCtaSchema = z.object({
  type: z.literal("cta"),
  handle: z.string().regex(/^@[\w.]+$/, "Handle must look like @account"),
  saveCueWord: cueWord,
  followCueWord: cueWord,
  ...sceneBase,
});

export const explainerSceneSchema = z.discriminatedUnion("type", [
  explainerHookSchema,
  explainerRevealSchema,
  explainerCycleSchema,
  explainerImpactSchema,
  explainerCtaSchema,
]);

export type ExplainerScene = z.infer<typeof explainerSceneSchema>;

export const EXPLAINER_BEAT_ORDER = [
  "hook",
  "reveal",
  "cycle",
  "impact",
  "cta",
] as const;

// Every cue word a scene uses, with the JSON path it came from.
export const sceneCues = (
  scene: ExplainerScene,
): { path: (string | number)[]; word: string }[] => {
  switch (scene.type) {
    case "hook":
      return [{ path: ["count", "cueWord"], word: scene.count.cueWord }];
    case "reveal":
      return [{ path: ["title", "cueWord"], word: scene.title.cueWord }];
    case "cycle":
      return [
        ...scene.steps.map((s, i) => ({
          path: ["steps", i, "cueWord"],
          word: s.cueWord,
        })),
        { path: ["spark", "cueWord"], word: scene.spark.cueWord },
      ];
    case "impact":
      return [
        ...scene.causes.map((c, i) => ({
          path: ["causes", i, "cueWord"],
          word: c.cueWord,
        })),
        { path: ["weakenCueWord"], word: scene.weakenCueWord },
        ...scene.effects.map((e, i) => ({
          path: ["effects", i, "cueWord"],
          word: e.cueWord,
        })),
      ];
    case "cta":
      return [
        { path: ["saveCueWord"], word: scene.saveCueWord },
        { path: ["followCueWord"], word: scene.followCueWord },
      ];
  }
};

// Numbers shown on screen, with where they sit in the scene.
const sceneFigures = (scene: ExplainerScene) => {
  if (scene.type === "hook") return [{ path: ["count"], ...scene.count }];
  if (scene.type === "cycle") return [{ path: ["spark"], ...scene.spark }];
  return [];
};

const containsPhrase = (vo: string, phrase: string): boolean =>
  highlightMask(splitWords(vo), [phrase]).some(Boolean);

// The engine the episode's numbers are derived from.
const engineSchema = z.object({
  cylinders: z.number().int().positive(),
  rpm: z.number().positive(),
});

// One spark per cylinder every two crank revolutions (four-stroke cycle).
export const sparksPerPlugPerSecond = (rpm: number): number => rpm / 60 / 2;
export const combustionsPerSecond = (engine: {
  cylinders: number;
  rpm: number;
}): number => sparksPerPlugPerSecond(engine.rpm) * engine.cylinders;

const explainerEpisodeBase = z.object({
  id: z.string().regex(/^ep\d{2,}$/, "Episode id must look like ep01"),
  series: z.literal("jarang-diketahui"),
  title: z.string().min(1),
  bgm: assetPath.optional(),
  engine: engineSchema,
  // Technical claims a Doktermobil technician signs off before publishing.
  claims: z.array(z.object({ text: label, reviewed: z.boolean() })).min(1),
  scenes: z
    .array(explainerSceneSchema)
    .length(EXPLAINER_BEAT_ORDER.length)
    .refine(
      (scenes) => scenes.every((s, i) => s.type === EXPLAINER_BEAT_ORDER[i]),
      {
        message: `Scenes must follow the beat order: ${EXPLAINER_BEAT_ORDER.join(" > ")}`,
      },
    ),
});

type RefineCtx = {
  addIssue: (issue: {
    code: "custom";
    path: (string | number)[];
    message: string;
  }) => void;
};

// Cross-field checks shared by the episode schema and the composition props.
const checkEpisode = (
  episode: z.infer<typeof explainerEpisodeBase>,
  ctx: RefineCtx,
): void => {
  episode.scenes.forEach((scene, i) => {
    // Each cue must name exactly one word of the scene's own line.
    for (const cue of sceneCues(scene)) {
      const count = cueMatches(scene.vo, cue.word).length;
      if (count !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i, ...cue.path],
          message: `Cue word "${cue.word}" must appear exactly once in the VO line (found ${count})`,
        });
      }
    }
    // Caption highlights must be phrases that are actually spoken.
    scene.voHighlight.forEach((phrase, j) => {
      if (!containsPhrase(scene.vo, phrase)) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i, "voHighlight", j],
          message: `Highlight "${phrase}" is not in the VO line`,
        });
      }
    });
    // A number on screen must be the number the voice says, and its cue
    // must be the first word of that spoken number.
    for (const fig of sceneFigures(scene)) {
      const spoken = terbilang(fig.value);
      if (!containsPhrase(scene.vo, spoken)) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i, ...fig.path, "value"],
          message: `On-screen ${fig.value} is not spoken as "${spoken}" in the VO line`,
        });
      }
      const firstSpokenWord = splitWords(spoken)[0];
      if (normalizeWord(fig.cueWord) !== firstSpokenWord) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i, ...fig.path, "cueWord"],
          message: `Cue for ${fig.value} must be "${firstSpokenWord}", the first word of the spoken number`,
        });
      }
    }
  });

  // The headline numbers must follow from the stated engine.
  const hook = episode.scenes.find((s) => s.type === "hook");
  const cycle = episode.scenes.find((s) => s.type === "cycle");
  const perSecond = combustionsPerSecond(episode.engine);
  if (hook?.type === "hook" && hook.count.value !== perSecond) {
    ctx.addIssue({
      code: "custom",
      path: ["scenes", 0, "count", "value"],
      message: `Hook shows ${hook.count.value} but the engine gives ${perSecond} combustions per second`,
    });
  }
  const perPlug = sparksPerPlugPerSecond(episode.engine.rpm);
  if (cycle?.type === "cycle" && cycle.spark.value !== perPlug) {
    ctx.addIssue({
      code: "custom",
      path: ["scenes", 2, "spark", "value"],
      message: `Spark figure shows ${cycle.spark.value} but the engine gives ${perPlug} sparks per plug per second`,
    });
  }
};

export const explainerEpisodeSchema =
  explainerEpisodeBase.superRefine(checkEpisode);

const wordTiming = z.object({
  text: z.string(),
  startFrame: z.number().int(),
  endFrame: z.number().int(),
});

// One beat on the global timeline (see lib/explainerTiming.ts).
export const beatTimingSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  voStartFrame: z.number().int().nonnegative(),
  voDurationInFrames: z.number().int().positive(),
  voSrc: z.string().optional(),
  voGain: z.number().positive().optional(),
  words: z.array(wordTiming),
});

// Composition props: the episode plus render-time fields.
export const explainerPropsSchema = explainerEpisodeBase
  .extend({
    // Shows the safe zone overlay. Only ever visible inside Remotion Studio.
    debug: z.boolean(),
    // Quick check render: lighter 3D sampling (see `npm run render -- --draft`).
    draft: z.boolean().optional(),
    // Filled in by calculateMetadata; never written by hand.
    beats: z.array(beatTimingSchema).optional(),
  })
  .superRefine(checkEpisode);

export type ExplainerProps = z.infer<typeof explainerPropsSchema>;

export type ExplainerEpisode = z.infer<typeof explainerEpisodeSchema>;

// All on-screen copy of an episode, in reading order (for proofreading).
export const onScreenCopy = (episode: ExplainerEpisode): string[] =>
  episode.scenes.flatMap((scene) => {
    switch (scene.type) {
      case "hook":
        return [`${scene.count.value}${scene.count.suffix}`, scene.count.unit];
      case "reveal":
        return [scene.title.text, scene.note];
      case "cycle":
        return [
          ...scene.steps.map((s) => s.label),
          `${scene.spark.value}${scene.spark.suffix} ${scene.spark.unit}`,
        ];
      case "impact":
        return [
          ...scene.causes.map((c) => c.label),
          ...scene.effects.map((e) => e.label),
        ];
      case "cta":
        return [scene.handle];
    }
  });
