// One command from an approved episode file to a publish-ready video:
// voice over, levels, sound effects, render, loudness, then a QA report
// (file specs, loudness, whisper transcript vs script, frame sheet).
//
//   npm run produce -- ep03              full run -> out/video/<base> - <title>.mp4
//   npm run produce -- ep03 --draft      quick half-size check, no final
//   npm run produce -- ep01 --3d         EP01-style 3D reel
//   npm run produce -- ko-lung-lung --talking-head
//   npm run produce -- ep03 --from render   resume at a step
//
// Steps run in order and the run stops at the first failure. Steps that are
// already up to date skip themselves (TTS only regenerates edited lines).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { LOUDNESS_TARGET } from "../src/lib/mix";
import { SFX } from "../src/lib/sfx";
import { splitWords } from "../src/lib/text";
import {
  REEL_MAX_DURATION_IN_SECONDS,
  REEL_MIN_DURATION_IN_SECONDS,
} from "../src/lib/timing";
import {
  isCinemaEpisode,
  isExplainerEpisode,
  loadVoScript,
  talkingHeadTitle,
  outputBase,
  probeMedia,
  PUBLIC_DIR,
  rel,
  reportMedia,
  requireEpisodeId,
  ROOT,
  run,
  runMain,
  ScriptError,
  formatMb,
} from "./lib/common";
import { measureLoudness } from "./lib/loudness";
import { checkVo } from "./lib/voCheck";
import { OUT, pipelinePaths } from "./lib/paths";

const STEPS = [
  "tts",
  "vo-level",
  "sfx",
  "render",
  "postprocess",
  "verify",
] as const;
type Step = (typeof STEPS)[number];

const TSX_CLI = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
// Least share of script words whisper must hear, in order.
const MIN_VO_MATCH = 0.9;
// Frame sheet: one frame per second, this many per row, this wide each.
const SHEET_COLUMNS = 7;
const SHEET_FRAME_WIDTH = 270;
const USAGE =
  "npm run produce -- <id> [--draft] [--3d | --talking-head] [--from <step>]";

const transcriptSchema = z.object({
  words: z.array(z.object({ text: z.string() })),
});

// The 3D render now and then loses its browser tab midway (GPU or memory
// pressure) and passes on a second try.
const RENDER_RETRIES = 1;

// Runs a step; `retries` re-runs it after a failure before giving up.
const script = async (file: string, args: string[], retries = 0) => {
  for (let attempt = 0; ; attempt++) {
    console.log(`\n> ${file} ${args.join(" ")}`);
    const { code } = await run(process.execPath, [TSX_CLI, file, ...args]);
    if (code === 0) {
      return;
    }
    if (attempt >= retries) {
      throw new ScriptError(
        `${file} failed (exit ${code}). Fix it, then resume with --from.`,
      );
    }
    console.log(`  ${file} failed (exit ${code}); retrying`);
  }
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      draft: { type: "boolean", default: false },
      "3d": { type: "boolean", default: false },
      "talking-head": { type: "boolean", default: false },
      from: { type: "string" },
    },
  });
  const id = requireEpisodeId(positionals, USAGE);
  const from = (values.from ?? "tts") as Step;
  if (!STEPS.includes(from)) {
    throw new ScriptError(`--from must be one of: ${STEPS.join(", ")}`);
  }
  const talkingHead = values["talking-head"];
  const cinema = !talkingHead && isCinemaEpisode(id);
  const explainer = !talkingHead && !cinema && isExplainerEpisode(id);
  const is3d = values["3d"] || explainer;
  const draft = values.draft;
  if (draft && !explainer && !cinema) {
    throw new ScriptError(
      "--draft is only available for 3D explainer and cinema episodes",
    );
  }
  const base = talkingHead || cinema ? id : outputBase(id, is3d);
  const title = talkingHead ? talkingHeadTitle(id) : loadVoScript(id).title;
  const paths = pipelinePaths(id, base, title, draft);
  const final = paths.final;
  mkdirSync(OUT.qc, { recursive: true });
  const formatFlag = talkingHead
    ? ["--talking-head"]
    : values["3d"]
      ? ["--3d"]
      : [];

  const wanted = (step: Step) => STEPS.indexOf(step) >= STEPS.indexOf(from);
  const voiced = !talkingHead;

  if (voiced && wanted("tts")) await script("scripts/tts.ts", [id]);
  if (voiced && wanted("vo-level")) await script("scripts/vo-level.ts", [id]);
  if (
    (explainer || cinema) &&
    wanted("sfx") &&
    Object.values(SFX).some((f) => !existsSync(path.join(PUBLIC_DIR, f)))
  ) {
    await script("scripts/sfx.ts", []);
  }
  if (wanted("render")) {
    await script(
      "scripts/render.ts",
      [id, ...formatFlag, ...(draft ? ["--draft"] : [])],
      RENDER_RETRIES,
    );
  }
  if (!draft && wanted("postprocess")) {
    await script("scripts/postprocess.ts", [id, ...formatFlag]);
  }

  // ---- QA report ----
  console.log(`\n> QA ${rel(final)}`);
  if (!existsSync(final)) {
    throw new ScriptError(`${rel(final)} not found`);
  }
  const problems: string[] = [];
  const info = await probeMedia(final);
  if (!draft) {
    problems.push(
      ...reportMedia("Final", final, info, {
        min: REEL_MIN_DURATION_IN_SECONDS,
        max: REEL_MAX_DURATION_IN_SECONDS,
      }),
    );
  }
  const loudness = await measureLoudness(final);
  if (!draft) {
    if (
      Math.abs(loudness.integratedLufs - LOUDNESS_TARGET.integratedLufs) >
      LOUDNESS_TARGET.toleranceLu
    ) {
      problems.push(
        `loudness ${loudness.integratedLufs.toFixed(1)} LUFS is off target`,
      );
    }
    if (loudness.truePeakDb > LOUDNESS_TARGET.truePeakDb) {
      problems.push(
        `true peak ${loudness.truePeakDb.toFixed(1)} dB is above ${LOUDNESS_TARGET.truePeakDb} dB`,
      );
    }
  }

  // Whisper listens to the finished audio and is compared with the script.
  let vo: { ratio: number; missing: string[] } | null = null;
  if (voiced && !draft && wanted("verify")) {
    const transcript = paths.transcript;
    await script("scripts/transcribe.ts", [
      final,
      "--out",
      transcript,
      "--language",
      "id",
    ]);
    const heard = transcriptSchema
      .parse(JSON.parse(readFileSync(transcript, "utf8")))
      .words.map((w) => w.text);
    const lines = loadVoScript(id).scenes.flatMap((s) => splitWords(s.vo));
    vo = checkVo(lines, heard);
    if (vo.ratio < MIN_VO_MATCH) {
      problems.push(
        `whisper heard only ${(vo.ratio * 100).toFixed(0)}% of the script in order (missing: ${vo.missing.join(", ")})`,
      );
    }
  }

  // One frame per second, for a visual check of every shot.
  const sheet = paths.sheet;
  const rows = Math.ceil(info.durationInSeconds / SHEET_COLUMNS);
  const { code } = await run(
    "ffmpeg",
    [
      "-hide_banner",
      "-v",
      "error",
      "-y",
      "-i",
      final,
      "-vf",
      `fps=1,scale=${SHEET_FRAME_WIDTH}:-1,tile=${SHEET_COLUMNS}x${rows}`,
      "-frames:v",
      "1",
      sheet,
    ],
    { capture: true },
  );
  if (code !== 0) {
    problems.push("could not write the frame sheet");
  }

  const report = paths.report;
  const lines = [
    `# Laporan QA: ${path.basename(final)}`,
    "",
    `- Durasi: ${info.durationInSeconds.toFixed(2)} detik`,
    `- Resolusi: ${info.width}x${info.height}, ${info.videoCodec} + ${info.audioCodec}`,
    `- Ukuran: ${formatMb(info.sizeInBytes)}`,
    `- Loudness: ${loudness.integratedLufs.toFixed(1)} LUFS, true peak ${loudness.truePeakDb.toFixed(1)} dB`,
    vo
      ? `- Naskah vs suara (whisper): ${(vo.ratio * 100).toFixed(0)}% kata terdengar berurutan${vo.missing.length ? `; tidak terdengar: ${vo.missing.join(", ")}` : ""}`
      : "- Naskah vs suara: tidak dicek (draft atau talking head)",
    `- Lembar frame: ${rel(sheet)}`,
    "",
    problems.length === 0
      ? "Semua cek lolos."
      : ["Masalah:", ...problems.map((p) => `- ${p}`)].join("\n"),
    "",
  ];
  writeFileSync(report, lines.join("\n"));
  console.log(lines.join("\n"));
  if (problems.length > 0) {
    process.exitCode = 1;
  }
};

runMain(main);
