// Renders an episode to out/produce/<base>.mp4 (H.264 + AAC 192 kbps).
//
//   npm run render -- ep01        2D cut   -> out/produce/ep01.mp4
//   npm run render -- ep01 --3d   3D previz -> out/produce/ep01-3d.mp4
//   npm run render -- ep02        3D explainer -> out/produce/ep02-3d.mp4
//                                 (format is read from the episode file)
//   npm run render -- ep03        live R3F cinema reel -> out/produce/ep03.mp4
//   npm run render -- ep03 --draft  quick half-size check (3D formats)
//   npm run render -- ko-lung-lung --talking-head
//
// The episode JSON is validated and normalized (schema defaults applied, debug
// overlay off) into out/produce/.props/<id>.json, which is what Remotion renders.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PREVIZ_LOAD_TIMEOUT_IN_MS } from "../src/lib/previz";
import {
  FPS,
  REEL_MAX_DURATION_IN_SECONDS,
  REEL_MIN_DURATION_IN_SECONDS,
} from "../src/lib/timing";
import {
  isCinemaEpisode,
  isExplainerEpisode,
  loadCinemaEpisode,
  loadEpisode,
  loadExplainerEpisode,
  loadTalkingHead,
  outputBase,
  printProblems,
  probeMedia,
  reportMedia,
  requireEpisodeId,
  ROOT,
  run,
  runMain,
  ScriptError,
} from "./lib/common";
import { OUT, pipelinePaths } from "./lib/paths";

// The 3D cuts are WebGL: render them on the GPU through ANGLE (about 2x
// faster than the software default here) with fewer parallel tabs.
const VARIANTS = {
  "2d": { composition: "EduReel", extraArgs: [] as string[] },
  "3d": {
    composition: "EduReel3D",
    extraArgs: [
      "--gl=angle",
      "--concurrency=4",
      `--timeout=${PREVIZ_LOAD_TIMEOUT_IN_MS}`,
    ],
  },
  talkingHead: { composition: "TalkingHead", extraArgs: [] as string[] },
  explainer: {
    composition: "Explainer3D",
    extraArgs: [
      "--gl=angle",
      "--concurrency=4",
      `--timeout=${PREVIZ_LOAD_TIMEOUT_IN_MS}`,
    ],
  },
  cinema: {
    composition: "Cinema3D",
    extraArgs: ["--gl=angle", `--timeout=${PREVIZ_LOAD_TIMEOUT_IN_MS}`],
  },
  // 2D whiteboard episodes share the cinema schema and chunked render.
  paper: {
    composition: "Paper2D",
    extraArgs: [`--timeout=${PREVIZ_LOAD_TIMEOUT_IN_MS}`],
  },
} as const;
const AUDIO_BITRATE = "192k";
const DRAFT_SCALE = 0.5;
const REMOTION_CLI = path.join(
  ROOT,
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js",
);

// Live R3F worlds: every tab holds a WebGL context with shadows and a post
// stack, and GPU memory creeps up per tab over a long run (the sister
// project lost its browser midway). So cinema reels render in chunks, each
// in a fresh browser, video only; the audio is rendered once on its own
// (the 3D stage is skipped there); ffmpeg joins them without re-encoding.
const CINEMA = {
  concurrency: 2,
  chunkFrames: 240,
  retries: 2,
  crf: "18",
} as const;

const cli = async (args: string[]): Promise<void> => {
  const { code } = await run(process.execPath, [REMOTION_CLI, ...args]);
  if (code !== 0) {
    throw new ScriptError(`Remotion render failed with exit code ${code}`);
  }
};

const withRetries = async (label: string, fn: () => Promise<void>) => {
  for (let attempt = 0; ; attempt++) {
    try {
      await fn();
      return;
    } catch (e) {
      if (attempt >= CINEMA.retries) {
        throw e;
      }
      console.log(`${label} failed, retrying in a fresh browser`);
    }
  }
};

const renderInChunks = async (
  composition: string,
  output: string,
  common: string[],
): Promise<void> => {
  const dir = `${output}.chunks`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // WAV, not AAC: AAC encoder padding overstates the length by a frame.
  const audio = path.join(dir, "audio.wav");
  process.env.REMOTION_AUDIO_ONLY = "1";
  try {
    await withRetries("Audio pass", () =>
      cli(["render", composition, audio, ...common, "--codec=wav", "--concurrency=4"]),
    );
  } finally {
    delete process.env.REMOTION_AUDIO_ONLY;
  }
  const total = Math.round((await probeMedia(audio)).durationInSeconds * FPS);
  const parts: string[] = [];
  for (let from = 0; from < total; from += CINEMA.chunkFrames) {
    const to = Math.min(total - 1, from + CINEMA.chunkFrames - 1);
    const part = path.join(dir, `part_${String(parts.length).padStart(3, "0")}.mp4`);
    console.log(`Chunk ${parts.length + 1}: frames ${from}-${to} of ${total}`);
    await withRetries(`Chunk ${parts.length + 1}`, () =>
      cli([
        "render",
        composition,
        part,
        ...common,
        "--codec=h264",
        `--crf=${CINEMA.crf}`,
        "--muted",
        `--frames=${from}-${to}`,
        `--concurrency=${CINEMA.concurrency}`,
      ]),
    );
    parts.push(part);
  }
  const list = path.join(dir, "list.txt");
  writeFileSync(list, parts.map((p) => `file '${p.split(path.sep).join("/")}'`).join("\n"));
  const ff = await run("ffmpeg", [
    "-v", "error", "-y",
    "-f", "concat", "-safe", "0", "-i", list,
    "-i", audio,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", AUDIO_BITRATE,
    "-movflags", "+faststart",
    output,
  ]);
  if (ff.code !== 0) {
    throw new ScriptError(`ffmpeg join failed with exit code ${ff.code}`);
  }
  rmSync(dir, { recursive: true, force: true });
};

const episode0Format = (id: string): string => loadCinemaEpisode(id).format;

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      "3d": { type: "boolean", default: false },
      "talking-head": { type: "boolean", default: false },
      // 3D formats only: half size, lighter sampling, for timing checks.
      draft: { type: "boolean", default: false },
    },
  });
  const episodeId = requireEpisodeId(
    positionals,
    "npm run render -- <id> [--3d | --talking-head | --draft]",
  );
  const isTalkingHead = values["talking-head"];
  const isCinema = !isTalkingHead && isCinemaEpisode(episodeId);
  const isExplainer = !isTalkingHead && !isCinema && isExplainerEpisode(episodeId);
  const is3d = values["3d"] || isExplainer;
  const draft = (isExplainer || isCinema) && values.draft;
  const variant =
    VARIANTS[
      isTalkingHead
        ? "talkingHead"
        : isCinema
          ? (episode0Format(episodeId) === "paper" ? "paper" : "cinema")
          : isExplainer
            ? "explainer"
            : is3d
              ? "3d"
              : "2d"
    ];
  const base = isTalkingHead || isCinema ? episodeId : outputBase(episodeId, is3d);
  const episode = isTalkingHead
    ? loadTalkingHead(episodeId)
    : isCinema
      ? loadCinemaEpisode(episodeId)
      : isExplainer
        ? loadExplainerEpisode(episodeId)
        : loadEpisode(episodeId);
  const title = "title" in episode ? String(episode.title) : episodeId;
  const paths = pipelinePaths(episodeId, base, title, draft);

  mkdirSync(OUT.props, { recursive: true });
  mkdirSync(OUT.produce, { recursive: true });
  writeFileSync(
    paths.props,
    `${JSON.stringify({ ...episode, debug: false, ...(draft ? { draft } : {}) }, null, 2)}\n`,
  );

  console.log(`Rendering ${episode.id} "${title}" (${variant.composition})`);
  const common = [
    `--props=${paths.props}`,
    ...variant.extraArgs,
    ...(draft ? [`--scale=${DRAFT_SCALE}`] : []),
  ];
  if (isCinema) {
    await renderInChunks(variant.composition, paths.rendered, common);
  } else {
    await cli([
      "render",
      variant.composition,
      paths.rendered,
      ...common,
      "--codec=h264",
      "--audio-codec=aac",
      `--audio-bitrate=${AUDIO_BITRATE}`,
    ]);
  }

  const problems = reportMedia("Rendered", paths.rendered, await probeMedia(paths.rendered), {
    min: REEL_MIN_DURATION_IN_SECONDS,
    max: REEL_MAX_DURATION_IN_SECONDS,
  });
  if (draft) {
    console.log("Draft render: size and quality checks do not apply.");
    return;
  }
  printProblems(problems);
  console.log(
    `Next: npm run postprocess -- ${episodeId}${isTalkingHead ? " --talking-head" : values["3d"] ? " --3d" : ""}`,
  );
};

runMain(main);
