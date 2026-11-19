// Checks a "soft" episode (schema, world shots, headline length, 60 s limit)
// and prints every on-screen and spoken line plus the facts to verify.
//   npm run soft:check -- ep08

import { loadSoft, positional } from "./common";

const id = positional()[0];
if (!id) {
  console.error("Usage: npm run soft:check -- <id>");
  process.exit(1);
}
const { episode: e, problems } = loadSoft(id);
const total = e.scenes.reduce((a, s) => a + s.seconds, 0);
console.log(`${e.id} "${e.title}"  world ${e.world}  ${total.toFixed(1)} s  ${e.scenes.length} scenes`);
console.log("On-screen and spoken text (proofread every word):");
for (const s of e.scenes) {
  if (s.lyric) console.log(`  ${s.lyric}`);
  console.log(`  [VO ${s.shot}] ${s.vo.text}${s.vo.src ? "" : "  (not recorded yet)"}`);
}
if (e.post) console.log(`Caption:\n${e.post.caption}\n${e.post.hashtags.map((h) => `#${h}`).join(" ")}`);
console.log(`Facts to verify before posting (${e.claims.length}):`);
for (const c of e.claims) console.log(`  - ${c.text}`);
if (problems.length) {
  console.log(`\nProblems:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("OK: ready for npm run soft:look / npm run soft:render.");
