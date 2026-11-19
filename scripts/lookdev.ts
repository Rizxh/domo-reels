// Renders the 3D asset sheet: one still per view of the LOOKDEV table in the
// episode's 3D page, plus contact sheets for a quick look.
//
//   npm run lookdev            -> out/lookdev/view-00.jpeg ... and sheet-1.jpg ...
//   npm run lookdev -- --full  full 1080x1920 stills (default is half size)

import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PREVIZ_LOAD_TIMEOUT_IN_MS } from "../src/lib/previz";
import { OUT_DIR, rel, ROOT, run, runMain, ScriptError } from "./lib/common";

const COMPOSITION = "Explainer3DLookdev";
const HALF_SCALE = 0.5;
const SHEET_COLUMNS = 4;
const SHEET_ROWS = 2;
const SHEET_TILE_WIDTH = 540;
const REMOTION_CLI = path.join(
  ROOT,
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js",
);

const main = async () => {
  const { values } = parseArgs({
    options: { full: { type: "boolean", default: false } },
  });
  const dir = path.join(OUT_DIR, "look", "lookdev");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const render = await run(process.execPath, [
    REMOTION_CLI,
    "render",
    COMPOSITION,
    dir,
    "--sequence",
    "--image-format=jpeg",
    "--jpeg-quality=92",
    "--gl=angle",
    "--concurrency=1",
    `--timeout=${PREVIZ_LOAD_TIMEOUT_IN_MS}`,
    ...(values.full ? [] : [`--scale=${HALF_SCALE}`]),
  ]);
  if (render.code !== 0) {
    throw new ScriptError(
      `Remotion render failed with exit code ${render.code}`,
    );
  }

  const stills = readdirSync(dir)
    .filter((f) => /\.jpe?g$/.test(f))
    .sort();
  if (stills.length === 0) {
    throw new ScriptError(`No stills were written to ${rel(dir)}`);
  }
  const pattern = stills[0].replace(/\d+(?=\.jpe?g$)/, (d) => `%0${d.length}d`);
  const perSheet = SHEET_COLUMNS * SHEET_ROWS;
  for (let i = 0; i * perSheet < stills.length; i++) {
    const sheet = path.join(dir, `sheet-${i + 1}.jpg`);
    const tile = await run("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-start_number",
      String(i * perSheet),
      "-i",
      path.join(dir, pattern),
      "-vf",
      `scale=${SHEET_TILE_WIDTH}:-1,tile=${SHEET_COLUMNS}x${SHEET_ROWS}`,
      "-frames:v",
      "1",
      sheet,
    ]);
    if (tile.code !== 0) {
      throw new ScriptError(`ffmpeg failed to build ${rel(sheet)}`);
    }
    console.log(`Wrote ${rel(sheet)}`);
  }
  console.log(`${stills.length} views in ${rel(dir)}`);
};

runMain(main);
