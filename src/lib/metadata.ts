import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { staticFile, type CalculateMetadataFunction } from "remotion";
import {
  episodeSchema,
  type EduReelProps,
  type SceneTiming,
} from "../schema";
import { hasStaticFile } from "./assets";
import { voAlignmentPath, voAudioPath, voSidecarSchema } from "./audio";
import { splitWords, type WordTiming } from "./text";
import {
  estimateVoDurationInSeconds,
  FPS,
  OUTRO_HOLD_IN_SECONDS,
  REEL_MAX_DURATION_IN_SECONDS,
  REEL_MIN_DURATION_IN_SECONDS,
  sceneTimingFromVo,
  secondsToFrames,
  totalDurationInFrames,
} from "./timing";

const audioDurationInSeconds = async (src: string): Promise<number> => {
  const input = new Input({ source: new UrlSource(src), formats: ALL_FORMATS });
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};

// Word timings from the TTS sidecar, shifted to scene-relative frames, and
// the measured loudness of the line. Both are undefined (caption falls back
// to an even split, no level correction) when the sidecar is missing, stale,
// or its words do not line up one to one with the caption.
const loadSidecar = async (
  episodeId: string,
  index: number,
  scene: { vo: string },
  voStartFrame: number,
  fps: number,
): Promise<{ words?: WordTiming[]; loudnessLufs?: number }> => {
  const path = voAlignmentPath(episodeId, index);
  if (!hasStaticFile(path)) {
    return {};
  }
  const res = await fetch(staticFile(path));
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
  }
  const parsed = voSidecarSchema.safeParse(await res.json());
  const expected = splitWords(scene.vo).length;
  if (
    !parsed.success ||
    parsed.data.text !== scene.vo ||
    parsed.data.words.length !== expected
  ) {
    console.warn(
      `${path} is invalid or out of date; captions use an even split. Re-run: npm run tts -- ${episodeId}`,
    );
    return {};
  }
  return {
    words: parsed.data.words.map((word) => ({
      text: word.text,
      startFrame: voStartFrame + Math.round(word.startInSeconds * fps),
      endFrame: voStartFrame + Math.round(word.endInSeconds * fps),
    })),
    loudnessLufs: parsed.data.loudnessLufs,
  };
};

// Real VO file when it exists (duration read from the audio itself), else an
// estimate from the word count so the Studio works before running TTS.
export const timingForScene = async (
  episodeId: string,
  index: number,
  scene: { vo: string },
  fps: number,
): Promise<SceneTiming> => {
  const voPath = voAudioPath(episodeId, index);
  if (!hasStaticFile(voPath)) {
    return sceneTimingFromVo(estimateVoDurationInSeconds(scene.vo), fps);
  }

  const timing = sceneTimingFromVo(
    await audioDurationInSeconds(staticFile(voPath)),
    fps,
  );
  const { words, loudnessLufs } = await loadSidecar(
    episodeId,
    index,
    scene,
    timing.voStartFrame,
    fps,
  );
  return { ...timing, voSrc: voPath, words, voLoudnessLufs: loudnessLufs };
};

export const calculateEduReelMetadata: CalculateMetadataFunction<
  EduReelProps
> = async ({ props }) => {
  // Re-parse so props passed with --props get schema defaults too (e.g. an
  // omitted `highlight` becomes []). Throws a readable zod error if invalid.
  const episode = episodeSchema.parse(props);
  const sceneTimings = await Promise.all(
    episode.scenes.map((scene, index) =>
      timingForScene(episode.id, index, scene, FPS),
    ),
  );

  // Hold the last scene a little longer for the BGM swell and fade out.
  const last = sceneTimings.length - 1;
  if (last >= 0) {
    sceneTimings[last] = {
      ...sceneTimings[last],
      durationInFrames:
        sceneTimings[last].durationInFrames +
        secondsToFrames(OUTRO_HOLD_IN_SECONDS, FPS),
    };
  }

  const durationInFrames = totalDurationInFrames(
    sceneTimings.map((t) => t.durationInFrames),
  );
  const seconds = durationInFrames / FPS;
  if (
    seconds < REEL_MIN_DURATION_IN_SECONDS ||
    seconds > REEL_MAX_DURATION_IN_SECONDS
  ) {
    console.warn(
      `${episode.id} is ${seconds.toFixed(1)} s, outside the ${REEL_MIN_DURATION_IN_SECONDS} to ${REEL_MAX_DURATION_IN_SECONDS} s Reels range. Shorten or extend the VO lines.`,
    );
  }

  return {
    durationInFrames,
    fps: FPS,
    props: { ...props, ...episode, sceneTimings },
  };
};
