// Lookdev of a "soft" episode: one still per scene (late in the scene, when
// it is fully built) and a contact sheet -> out/look/<id>_soft_frames.jpg.
//   npm run soft:look -- ep08

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OUT } from "../lib/paths";
import { compositionOf, ffmpeg, loadSoft, positional, remotion, ROOT } from "./common";

const id = positional()[0];
if (!id) {
  console.error("Usage: npm run soft:look -- <id>");
  process.exit(1);
}
const { episode: e, problems } = loadSoft(id);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
const dir = path.join(OUT.look, id, "soft");
mkdirSync(dir, { recursive: true });
mkdirSync(OUT.props, { recursive: true });
const props = path.join(OUT.props, `${id}-look.json`);
writeFileSync(props, JSON.stringify({ ...e, debug: false }));
let start = 0;
const files: string[] = [];
for (const [i, s] of e.scenes.entries()) {
  const len = Math.round(s.seconds * 30);
  const frame = start + Math.round(len * 0.8);
  start += len;
  const file = path.join(dir, `${String(i + 1).padStart(2, "0")}-${s.shot}.jpg`);
  remotion(["still", "src/index.ts", compositionOf(e), file, `--props=${props}`, `--frame=${frame}`, "--image-format=jpeg", "--scale=0.4", "--log=error"]);
  files.push(file);
  console.log(`  ${path.basename(file)}`);
}
const cols = Math.min(5, files.length);
const sheet = path.join(OUT.look, `${id}_soft_frames.jpg`);
ffmpeg([...files.flatMap((f) => ["-i", f]), "-filter_complex", `${files.map((_, i) => `[${i}:v]`).join("")}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) === 0 ? "0" : Array.from({ length: i % cols }, () => "w0").join("+")}_${Math.floor(i / cols) === 0 ? "0" : Array.from({ length: Math.floor(i / cols) }, () => "h0").join("+")}`).join("|")}:fill=black`, sheet]);
console.log(`Sheet -> ${path.relative(ROOT, sheet)}`);
