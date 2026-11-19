// Where every script writes under out/. One folder per kind of output, so
// the finished videos are easy to find and the working files stay apart
// (same layout as ../shifupo-reels):
//
//   out/video/     finished reels, named "<base> - <title>.mp4"
//   out/produce/   renders before loudness, render chunks, props, bundles
//   out/review/    review notes and review sheets
//   out/qc/        final QA: <base>_report.md, <base>_sheet.jpg, transcripts
//   out/look/      lookdev and stills: <id>/..., contact sheets
//   out/sound/     voice-over takes and audio checks
//   out/archive/   older material kept for reference

import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const OUT_ROOT = path.join(ROOT, "out");

export const OUT = {
  video: path.join(OUT_ROOT, "video"),
  produce: path.join(OUT_ROOT, "produce"),
  props: path.join(OUT_ROOT, "produce", ".props"),
  review: path.join(OUT_ROOT, "review"),
  qc: path.join(OUT_ROOT, "qc"),
  look: path.join(OUT_ROOT, "look"),
  sound: path.join(OUT_ROOT, "sound"),
  archive: path.join(OUT_ROOT, "archive"),
} as const;

// Characters Windows does not allow in file names.
const safeTitle = (title: string): string =>
  title
    .replace(/[<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const finalVideoPath = (base: string, title: string): string =>
  path.join(OUT.video, `${base} - ${safeTitle(title)}.mp4`);

// Every file of one pipeline run. `base` is the file stem ("ep03",
// "ep01-3d", "ko-lung-lung").
export const pipelinePaths = (id: string, base: string, title: string, draft = false) => {
  const d = draft ? "_draft" : "";
  const rendered = path.join(OUT.produce, `${base}${d}.mp4`);
  return {
    rendered,
    final: draft ? rendered : finalVideoPath(base, title),
    props: path.join(OUT.props, `${id}.json`),
    report: path.join(OUT.qc, `${base}${d}_report.md`),
    sheet: path.join(OUT.qc, `${base}${d}_sheet.jpg`),
    transcript: path.join(OUT.qc, `${base}.transcript.json`),
  };
};
