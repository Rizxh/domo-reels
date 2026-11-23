// Final render of a "soft" episode: picture in 600-frame muted chunks (each
// retried on its own; long single renders crash headless Chrome silently),
// sound in one audio-only pass, joined without re-encoding, then loudness to
// -14 LUFS with a true-peak-safe limiter -> out/video/<id> - <Title>.mp4.
// Caption and facts -> out/produce/<id>_caption.md.
//   npm run soft:render -- ep08
//   npm run soft:render -- ep08 --reuse   only redo the loudness/finish step

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { finalVideoPath, OUT } from "../lib/paths";
import { compositionOf, ffmpeg, flag, loadSoft, positional, remotion, ROOT } from "./common";
import { niceTitle } from "./title";

const id = positional()[0];
if (!id) {
  console.error("Usage: npm run soft:render -- <id> [--reuse]");
  process.exit(1);
}
const { episode: e, problems } = loadSoft(id);
if (problems.length) {
  console.error(`Fix these first (npm run soft:check -- ${id}):\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
for (const d of [OUT.produce, OUT.props, OUT.video]) mkdirSync(d, { recursive: true });
const props = path.join(OUT.props, `${id}.json`);
writeFileSync(props, JSON.stringify({ ...e, debug: false }));
const rendered = path.join(OUT.produce, `${id}.mp4`);

if (!(flag("reuse") && existsSync(rendered))) {
  const total = Math.round(e.scenes.reduce((a, s) => a + s.seconds, 0) * 30);
  const dir = path.join(OUT.produce, `.chunks-${id}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const base = ["render", "src/index.ts", compositionOf(e)];
  const opts = [`--props=${props}`, "--timeout=120000", "--concurrency=1", "--log=error"];
  const parts: string[] = [];
  const CHUNK = 600;
  for (let a = 0, n = 0; a < total; a += CHUNK, n++) {
    const last = a + CHUNK >= total - 30;
    const file = path.join(dir, `part${String(n).padStart(2, "0")}.mp4`);
    console.log(`  frames ${a}-${last ? "end" : a + CHUNK - 1}`);
    remotion([...base, file, ...opts, "--codec=h264", "--crf=16", "--muted", `--frames=${a}-${last ? "" : a + CHUNK - 1}`]);
    parts.push(file);
    if (last) break;
  }
  const audio = path.join(dir, "audio.wav");
  remotion([...base, audio, ...opts, "--codec=wav"]);
  const list = path.join(dir, "list.txt");
  writeFileSync(list, parts.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
  ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-shortest", rendered]);
  rmSync(dir, { recursive: true, force: true });
}

const final = finalVideoPath(id, niceTitle(e.title));
ffmpeg([
  "-i", rendered,
  "-af", "loudnorm=I=-14:TP=-2:LRA=11,alimiter=limit=0.78:attack=1:release=60:level=disabled",
  "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
  final,
]);
// Subtitles (.srt) next to the video, from the TTS word timings.
const srtTime = (t: number) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const cues: string[] = [];
let sceneStart = 0;
for (const s of e.scenes) {
  const words = s.vo.words ?? [];
  for (let i = 0; i < words.length; i += 8) {
    const chunk = words.slice(i, i + 8);
    const from = sceneStart + chunk[0].t;
    const to = sceneStart + (words[i + 8]?.t ?? Math.min(s.vo.seconds ?? s.seconds, s.seconds));
    cues.push(`${cues.length + 1}\n${srtTime(from)} --> ${srtTime(to - 0.02)}\n${chunk.map((w) => w.w).join(" ")}\n`);
  }
  sceneStart += Math.round(s.seconds * 30) / 30;
}
// No voice over (no word timings): no subtitle file.
if (cues.length) writeFileSync(final.replace(/\.mp4$/, ".srt"), cues.join("\n"));

const caption = path.join(OUT.produce, `${id}_caption.md`);
writeFileSync(
  caption,
  `# ${e.title}\n\n${e.post ? `${e.post.caption}\n\n${e.post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}\n` : ""}\n## Facts to verify\n\n${e.claims.map((c) => `- [${c.reviewed ? "x" : " "}] ${c.text}`).join("\n")}\n`,
);
console.log(`\nVideo   -> ${path.relative(ROOT, final)}\nCaption -> ${path.relative(ROOT, caption)}`);
