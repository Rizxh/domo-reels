// EP11 soundtrack: voice lines at their scene offsets, the original soft-drive music bed (ducked under the voice),
// and license-free synthesized SFX (public/audio/sfx) on the story beats. Output: out/produce/ep11_mix.wav
// usage: npx tsx scripts/toon/ep11-audio.ts
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { cue, FPS, TOTAL, VOICE, sceneFrame } from "../../src/toon/benz/cues";

const OUT = path.resolve("out/produce/ep11_mix.wav");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const sec = (f: number) => (f / FPS).toFixed(3);

// [file, frame, gain dB]
const SFX: [string, number, number][] = [
  // hook: the cobbler's hammer on the brake block
  ["tick", 4, -4], ["tick", cue(1, "dunia"), -4], ["tick", cue(1, "sepatu"), -4],
  ["whoosh", cue(2, "kabur") - 4, -10],
  ["hum", cue(3, "menyetir"), -16],
  ["pop", cue(4, "habis"), -8],
  ["bell", cue(4, "apotek"), -12],
  ["marker", cue(4, "mercedes-benz"), -14],
  ["hiss", cue(5, "ditusuk"), -14], ["crackle", cue(5, "diikat"), -12], ["ignite", cue(5, "stoking"), -12],
  ["whoosh", cue(6, "turunan") - 4, -8], ["crackle", cue(6, "habis"), -6],
  ["pop", cue(7, "sialnya"), -10],
  ["tick", cue(8, "memaku"), -4], ["tick", cue(8, "kulit"), -4], ["tick", cue(8, "balok"), -4], ["tick", cue(8, "rem"), -4],
  ["marker", cue(8, "pertama"), -10],
  // 1888 -> today
  ["bell", cue(9, "selamat"), -12], ["whoosh", cue(9, "jadi") - 4, -10], ["pop", cue(9, "topi"), -8],
  ["whoosh", sceneFrame(9) - 8, -6], ["hum", sceneFrame(9), -18],
  ["hiss", cue(10, "menjepit"), -12], ["marker", cue(10, "cakram"), -16],
  ["hiss", cue(10, "habis"), -17], ["hiss", cue(10, "sedikit"), -17], ["hiss", cue(10, "kali"), -17], ["hiss", cue(10, "ngerem"), -15],
  ["pop", cue(11, "berdecit"), -14], ["marker", cue(11, "cek"), -8], ["bell", cue(11, "doktermobil"), -12],
];

const args: string[] = ["-v", "error", "-y"];
const parts: string[] = [];
let n = 0;
for (const v of VOICE) {
  if (!v.src) continue;
  args.push("-i", path.resolve("public", v.src));
  parts.push(`[${n}:a]aresample=48000,adelay=${Math.round((v.from / FPS) * 1000)}:all=1[v${n}]`);
  n++;
}
const nv = n;
parts.push(`${Array.from({ length: nv }, (_, i) => `[v${i}]`).join("")}amix=inputs=${nv}:normalize=0,apad=whole_dur=${sec(TOTAL)}[voice]`);
args.push("-stream_loop", "-1", "-i", path.resolve("public/audio/bgm/soft-drive.wav"));
const mi = n++;
parts.push(`[${mi}:a]aresample=48000,atrim=0:${sec(TOTAL)},volume=-17dB,afade=t=in:d=0.6,afade=t=out:st=${(TOTAL / FPS - 1.6).toFixed(2)}:d=1.6[bed]`);
const sl: string[] = [];
for (const [f, fr, db] of SFX) {
  args.push("-i", path.resolve(`public/audio/sfx/${f}.wav`));
  parts.push(`[${n}:a]aresample=48000,volume=${db}dB,adelay=${Math.round((Math.max(0, fr) / FPS) * 1000)}:all=1[s${n}]`);
  sl.push(`[s${n}]`);
  n++;
}
parts.push(`${sl.join("")}amix=inputs=${sl.length}:normalize=0[sfx]`);
parts.push(`[voice]asplit=2[vo][key]`);
parts.push(`[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck]`);
parts.push(`[vo][duck][sfx]amix=inputs=3:normalize=0,atrim=0:${sec(TOTAL)},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]`);
args.push("-filter_complex", parts.join(";"), "-map", "[out]", "-ac", "2", "-ar", "48000", OUT);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log("wrote", OUT, "frames", TOTAL);
