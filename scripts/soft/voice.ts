// Records the narration of a "soft" episode with ElevenLabs: one mp3 per
// scene (public/audio/<id>/sNN.mp3), word timings for subtitles and beat
// cues, and scene lengths that fit the voice (+0.35 s breath, keeps the pace).
//   npm run soft:voice -- ep08          record missing scenes
//   npm run soft:voice -- ep08 --all    re-record every scene
// Voice: episode narration.voice, else ELEVENLABS_VOICE_ID from .env. The key
// (ELEVENLABS_API_KEY) is only sent as a request header, never printed.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { flag, positional, readRaw, ROOT, writeRaw } from "./common";
import { synth } from "./tts";

try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch {
  // No .env: synth() explains which key is missing.
}
const id = positional()[0];
if (!id) {
  console.error("Usage: npm run soft:voice -- <id> [--all]");
  process.exit(1);
}
type RawScene = {
  shot: string;
  seconds: number;
  outro?: boolean;
  hold?: number;
  vo: {
    text: string;
    src?: string;
    words?: { w: string; t: number }[];
    seconds?: number;
  };
};
const ep = readRaw(id) as {
  narration?: {
    model?: string;
    voice?: string;
    speed?: number;
    stability?: number;
    exaggeration?: number;
  };
  scenes: RawScene[];
};
const n = ep.narration ?? {};
const voice = n.voice || process.env.ELEVENLABS_VOICE_ID?.trim();
if (!voice) {
  console.error(
    "No voice: set narration.voice in the episode or ELEVENLABS_VOICE_ID in .env.",
  );
  process.exit(1);
}
const settings = {
  provider: "elevenlabs" as const,
  voice,
  model: n.model ?? "eleven_multilingual_v2",
  speed: n.speed ?? 1.2,
  stability: n.stability ?? 0.3,
  exaggeration: n.exaggeration ?? 0.5,
};
const outDir = path.join(ROOT, "public", "audio", id);
mkdirSync(outDir, { recursive: true });
const main = async () => {
  let done = 0;
  for (const [i, s] of ep.scenes.entries()) {
    if (s.vo.src && !flag("all")) continue;
    const r = await synth(s.vo.text, settings, {
      previous: ep.scenes[i - 1]?.vo.text,
      next: ep.scenes[i + 1]?.vo.text,
    });
    const name = `s${String(i + 1).padStart(2, "0")}.${r.ext}`;
    writeFileSync(path.join(outDir, name), r.audio);
    s.vo = {
      text: s.vo.text,
      src: `audio/${id}/${name}`,
      words: r.words,
      seconds: Math.round(r.seconds * 100) / 100,
    };
    done++;
    console.log(`  ${name}  ${r.seconds.toFixed(1)} s  ${s.shot}`);
  }
  for (const s of ep.scenes) {
    if (!s.vo.seconds) continue;
    s.seconds =
      Math.round(
        Math.min(15, Math.max(s.outro ? 4 : 2.5, s.vo.seconds + 0.35 + (s.hold ?? 0))) * 100,
      ) / 100;
  }
  writeRaw(id, ep);
  console.log(
    `\n${done} scene(s) recorded. Total ${ep.scenes.reduce((a, s) => a + s.seconds, 0).toFixed(1)} s. Next: npm run soft:check -- ${id}`,
  );
};
main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
