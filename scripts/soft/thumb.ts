// Cover / thumbnail of a "soft" episode: one frozen scene of the video with a
// big title, a hook line and the handle -> out/video/<id> - <Title> - thumbnail.jpg.
//   npm run soft:thumb -- ep08
// Episode field: "thumb": { "scene" (1-based), "at" (0..1), "title", "highlight", "hook", "offset" }.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OUT } from "../lib/paths";
import { loadSoft, positional, remotion, ROOT } from "./common";
import { niceTitle } from "./title";

const id = positional()[0];
if (!id) {
  console.error("Usage: npm run soft:thumb -- <id>");
  process.exit(1);
}
const { episode: e } = loadSoft(id);
const t = e.thumb ?? { scene: 1, at: 0.85, offset: 380 };
const sc = e.scenes[t.scene - 1];
const props = {
  world: e.world,
  shot: sc.shot,
  at: t.at,
  seconds: sc.seconds,
  words: sc.vo.words ?? [],
  title: t.title ?? e.title.toUpperCase(),
  highlight: t.highlight,
  hook: t.hook,
  handle: e.handle,
  offset: t.offset,
};
mkdirSync(OUT.props, { recursive: true });
const file = path.join(OUT.props, `${id}-thumb.json`);
writeFileSync(file, JSON.stringify(props));
const out = path.join(OUT.video, `${id} - ${niceTitle(e.title).replace(/[<>:"/\\|?*]+/g, " ").trim()} - thumbnail.jpg`);
remotion(["still", "src/index.ts", "SoftThumb", out, `--props=${file}`, "--image-format=jpeg", "--jpeg-quality=92", "--log=error"]);
console.log(`Thumbnail -> ${path.relative(ROOT, out)}`);
