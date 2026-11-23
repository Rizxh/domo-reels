// Shared helpers of the "soft" format scripts (npm run soft:*): load/save an
// episode, check it, run the Remotion CLI with a retry, run ffmpeg.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { softEpisodeSchema, type SoftEpisode } from "../../src/softSchema";
import { SOFT_WORLD_SHOTS } from "../../src/soft/registry";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const EPISODES = path.join(ROOT, "data", "episodes");
const CLI = path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");

export const positional = () => process.argv.slice(2).filter((a) => !a.startsWith("--"));
export const flag = (name: string) => process.argv.includes(`--${name}`);

export const episodeFile = (id: string) => path.join(EPISODES, `${id}.json`);
export const readRaw = (id: string) => {
  const f = episodeFile(id);
  if (!existsSync(f)) throw new Error(`Not found: data/episodes/${id}.json`);
  return JSON.parse(readFileSync(f, "utf8"));
};
export const writeRaw = (id: string, data: unknown) => writeFileSync(episodeFile(id), JSON.stringify(data, null, 2) + "\n");

export const loadSoft = (id: string): { episode: SoftEpisode; problems: string[] } => {
  const raw = readRaw(id);
  const parsed = softEpisodeSchema.safeParse(raw);
  if (!parsed.success) return { episode: raw, problems: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  const e = parsed.data;
  const problems: string[] = [];
  const shots = SOFT_WORLD_SHOTS[e.world];
  if (!shots) problems.push(`unknown world "${e.world}" (worlds: ${Object.keys(SOFT_WORLD_SHOTS).join(", ")})`);
  e.scenes.forEach((s, i) => {
    if (shots && !shots.includes(s.shot)) problems.push(`scene ${i + 1}: shot "${s.shot}" is not in world ${e.world}`);
    if (s.lyric && s.lyric.length > 24) problems.push(`scene ${i + 1}: headline "${s.lyric}" is ${s.lyric.length} chars (keep <= 24)`);
  });
  if (!e.scenes[e.scenes.length - 1].outro) problems.push("the last scene must be the outro (outro: true)");
  const total = e.scenes.reduce((a, s) => a + s.seconds, 0);
  if (total > 60.5) problems.push(`total ${total.toFixed(1)} s is over the 60 s reel limit (shorten the VO)`);
  return { episode: e, problems };
};

// Headless Chrome drops out on long renders without a message: retry once.
export const remotion = (args: string[]) => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, stdio: "inherit" });
    if (r.status === 0) return;
    if (attempt === 2) throw new Error(`remotion ${args[0]} failed (exit ${r.status})`);
    console.warn(`remotion ${args[0]} failed (exit ${r.status}), retrying once…`);
  }
};

// Remotion composition of an episode (vertical reel or 16:9 video).
export const compositionOf = (e: SoftEpisode) => (e.aspect === "16:9" ? "Soft169" : "Soft2D");
export const thumbCompositionOf = (e: SoftEpisode) => (e.aspect === "16:9" ? "Soft169Thumb" : "SoftThumb");

export const ffmpeg = (args: string[]) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg failed (exit ${r.status})`);
};
