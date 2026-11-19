// Shared helpers for the CLI scripts (tts, render, postprocess).

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  explainerEpisodeSchema,
  type ExplainerEpisode,
} from "../../src/explainerSchema";
import {
  cinemaEpisodeSchema,
  type CinemaEpisode,
} from "../../src/cinemaSchema";
import { episodeSchema, type Episode } from "../../src/schema";
import {
  talkingHeadSchema,
  type TalkingHeadEdit,
} from "../../src/talkingHeadSchema";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const PUBLIC_DIR = path.join(ROOT, "public");
export const OUT_DIR = path.join(ROOT, "out");
export const EPISODES_DIR = path.join(ROOT, "data", "episodes");
export const TALKING_HEAD_DIR = path.join(ROOT, "data", "talking-head");

const BYTES_PER_MB = 1024 * 1024;

// Expected failures: printed as a one-line message without a stack trace.
export class ScriptError extends Error {}

export const rel = (file: string): string => path.relative(ROOT, file);

export const episodeFile = (episodeId: string): string =>
  path.join(EPISODES_DIR, `${episodeId}.json`);

// Reads and validates data/episodes/<id>.json, applying schema defaults.
export const loadEpisode = (episodeId: string): Episode => {
  const file = episodeFile(episodeId);
  if (!existsSync(file)) {
    throw new ScriptError(`Episode file not found: ${rel(file)}`);
  }
  const parsed = episodeSchema.safeParse(
    JSON.parse(readFileSync(file, "utf8")),
  );
  if (!parsed.success) {
    throw new ScriptError(
      `Invalid ${rel(file)}:\n${z.prettifyError(parsed.error)}`,
    );
  }
  if (parsed.data.id !== episodeId) {
    throw new ScriptError(
      `Episode id mismatch: file is ${episodeId}.json but id is "${parsed.data.id}"`,
    );
  }
  return parsed.data;
};

// What the TTS script needs from any episode format: one VO line per scene.
export type VoScript = {
  id: string;
  title: string;
  scenes: { type: string; vo: string }[];
};

// Reads data/episodes/<id>.json in whichever format it is written ("Mitos
// atau Fakta?" or the "jarang-diketahui" explainer) and validates it.
export const loadVoScript = (episodeId: string): VoScript => {
  const file = episodeFile(episodeId);
  if (!existsSync(file)) {
    throw new ScriptError(`Episode file not found: ${rel(file)}`);
  }
  const json: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (isCinemaJson(json)) {
    const ep = loadCinemaEpisode(episodeId);
    return {
      id: ep.id,
      title: ep.title,
      scenes: ep.beats.map((b) => ({ type: b.id, vo: b.vo })),
    };
  }
  const isExplainer =
    typeof json === "object" && json !== null && "series" in json;
  const parsed = (
    isExplainer ? explainerEpisodeSchema : episodeSchema
  ).safeParse(json);
  if (!parsed.success) {
    throw new ScriptError(
      `Invalid ${rel(file)}:
${z.prettifyError(parsed.error)}`,
    );
  }
  if (parsed.data.id !== episodeId) {
    throw new ScriptError(
      `Episode id mismatch: file is ${episodeId}.json but id is "${parsed.data.id}"`,
    );
  }
  return parsed.data;
};

const readEpisodeJson = (episodeId: string): unknown => {
  const file = episodeFile(episodeId);
  if (!existsSync(file)) {
    throw new ScriptError(`Episode file not found: ${rel(file)}`);
  }
  return JSON.parse(readFileSync(file, "utf8"));
};

const isCinemaJson = (json: unknown): boolean =>
  typeof json === "object" &&
  json !== null &&
  ["cinema", "paper"].includes(String((json as { format?: unknown }).format));

// True for episodes written in the live R3F "cinema" format (EP03 onward).
export const isCinemaEpisode = (episodeId: string): boolean =>
  isCinemaJson(readEpisodeJson(episodeId));

export const loadCinemaEpisode = (episodeId: string): CinemaEpisode => {
  const parsed = cinemaEpisodeSchema.safeParse(readEpisodeJson(episodeId));
  if (!parsed.success) {
    throw new ScriptError(
      `Invalid ${rel(episodeFile(episodeId))}:\n${z.prettifyError(parsed.error)}`,
    );
  }
  if (parsed.data.id !== episodeId) {
    throw new ScriptError(
      `Episode id mismatch: file is ${episodeId}.json but id is "${parsed.data.id}"`,
    );
  }
  return parsed.data;
};

// True for episodes written in the "jarang-diketahui" 3D explainer format.
export const isExplainerEpisode = (episodeId: string): boolean => {
  const json = readEpisodeJson(episodeId);
  return typeof json === "object" && json !== null && "series" in json;
};

export const loadExplainerEpisode = (episodeId: string): ExplainerEpisode => {
  const parsed = explainerEpisodeSchema.safeParse(readEpisodeJson(episodeId));
  if (!parsed.success) {
    throw new ScriptError(
      `Invalid ${rel(episodeFile(episodeId))}:\n${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
};

// Reads data/talking-head/<id>.json plus its <id>.transcript.json and
// validates them together (render props minus the debug flag).
export const loadTalkingHead = (id: string): TalkingHeadEdit => {
  const file = path.join(TALKING_HEAD_DIR, `${id}.json`);
  const transcript = path.join(TALKING_HEAD_DIR, `${id}.transcript.json`);
  for (const f of [file, transcript]) {
    if (!existsSync(f)) {
      throw new ScriptError(`Talking-head file not found: ${rel(f)}`);
    }
  }
  const parsed = talkingHeadSchema.safeParse({
    ...JSON.parse(readFileSync(file, "utf8")),
    words: JSON.parse(readFileSync(transcript, "utf8")).words,
  });
  if (!parsed.success) {
    throw new ScriptError(
      `Invalid ${rel(file)}:
${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
};

// Title used in the finished file name: the edit JSON's "title", or the id.
export const talkingHeadTitle = (id: string): string => {
  const file = path.join(TALKING_HEAD_DIR, `${id}.json`);
  const json: unknown = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const title = (json as { title?: unknown }).title;
  return typeof title === "string" && title.trim() ? title.trim() : id;
};

export const requireEpisodeId = (
  positionals: string[],
  usage: string,
): string => {
  const id = positionals[0];
  if (!id) {
    throw new ScriptError(`Usage: ${usage}`);
  }
  return id;
};

// File name stem in out/: "ep01" for the 2D cut, "ep01-3d" for the 3D cut.
export const outputBase = (episodeId: string, is3d: boolean): string =>
  is3d ? `${episodeId}-3d` : episodeId;

export const formatMb = (bytes: number): string =>
  `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;

type RunResult = { code: number; stderr: string };

// Runs a command without a shell. Output streams to the terminal unless
// `capture` is set, in which case stderr is collected and returned.
export const run = (
  command: string,
  args: string[],
  options: { capture?: boolean } = {},
): Promise<RunResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: options.capture ? ["ignore", "ignore", "pipe"] : "inherit",
    });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      reject(
        err.code === "ENOENT"
          ? new ScriptError(`"${command}" was not found on PATH.`)
          : err,
      );
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stderr }));
  });

// Publish checks from PRODUCTION_PLAN section 8.
export const QA = {
  maxFileBytes: 30 * BYTES_PER_MB,
  width: 1080,
  height: 1920,
  videoCodec: "h264",
  audioCodec: "aac",
} as const;

export type MediaInfo = {
  durationInSeconds: number;
  sizeInBytes: number;
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;
};

const ffprobeSchema = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      codec_name: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
  ),
  format: z.object({ duration: z.string(), size: z.string() }),
});

export const probeMedia = async (file: string): Promise<MediaInfo> => {
  const { code, stdout } = await runCapturingStdout("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=codec_type,codec_name,width,height:format=duration,size",
    "-of",
    "json",
    file,
  ]);
  if (code !== 0) {
    throw new ScriptError(`ffprobe could not read ${rel(file)}`);
  }
  const info = ffprobeSchema.parse(JSON.parse(stdout));
  const video = info.streams.find((s) => s.codec_type === "video");
  const audio = info.streams.find((s) => s.codec_type === "audio");
  return {
    durationInSeconds: Number(info.format.duration),
    sizeInBytes: Number(info.format.size),
    width: video?.width,
    height: video?.height,
    videoCodec: video?.codec_name,
    audioCodec: audio?.codec_name,
  };
};

const runCapturingStdout = (
  command: string,
  args: string[],
): Promise<{ code: number; stdout: string }> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "inherit"],
    });
    let stdout = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      reject(
        err.code === "ENOENT"
          ? new ScriptError(`"${command}" was not found on PATH.`)
          : err,
      );
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout }));
  });

// Prints a media summary and returns the QA problems found (empty = all good).
export const reportMedia = (
  label: string,
  file: string,
  info: MediaInfo,
  durationRange: { min: number; max: number },
): string[] => {
  console.log(`${label}: ${rel(file)}`);
  console.log(
    `  ${info.width}x${info.height}, ${info.durationInSeconds.toFixed(2)} s, ` +
      `${info.videoCodec ?? "no video"} + ${info.audioCodec ?? "no audio"}, ${formatMb(info.sizeInBytes)}`,
  );

  const problems: string[] = [];
  if (info.width !== QA.width || info.height !== QA.height) {
    problems.push(`resolution is not ${QA.width}x${QA.height}`);
  }
  if (
    info.durationInSeconds < durationRange.min ||
    info.durationInSeconds > durationRange.max
  ) {
    problems.push(
      `duration is outside ${durationRange.min} to ${durationRange.max} s`,
    );
  }
  if (info.videoCodec !== QA.videoCodec) {
    problems.push(`video codec is not ${QA.videoCodec}`);
  }
  if (info.audioCodec !== QA.audioCodec) {
    problems.push(
      info.audioCodec
        ? `audio codec is not ${QA.audioCodec}`
        : "no audio track (run npm run tts first)",
    );
  }
  if (info.sizeInBytes > QA.maxFileBytes) {
    problems.push(`file is larger than ${formatMb(QA.maxFileBytes)}`);
  }
  return problems;
};

export const printProblems = (problems: string[]): void => {
  if (problems.length === 0) {
    console.log("  QA: all checks passed");
    return;
  }
  for (const problem of problems) {
    console.warn(`  QA warning: ${problem}`);
  }
};

export const runMain = (main: () => Promise<void>): void => {
  main().catch((err: unknown) => {
    console.error(err instanceof ScriptError ? `Error: ${err.message}` : err);
    process.exit(1);
  });
};
