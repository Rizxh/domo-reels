// Cover / thumbnail of a "soft" episode (1080x1920): one frozen scene of the
// world, a big title (inside the 3:4 grid crop), a hook line and the handle.

import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { FONTS } from "../lib/brand";
import { WORLD_BG, WORLDS } from "./Soft2D";

export const softThumbSchema = z.object({
  world: z.string(),
  shot: z.string(),
  at: z.number().min(0).max(1).default(0.85),
  seconds: z.number().default(5),
  words: z.array(z.object({ w: z.string(), t: z.number() })).default([]),
  title: z.string().max(40),
  highlight: z.string().max(24).optional(),
  hook: z.string().max(40).optional(),
  handle: z.string(),
  offset: z.number().default(380),
});
export type SoftThumbProps = z.infer<typeof softThumbSchema>;

const INK = "#17323C";
const RED = "#E31E24";

export const SoftThumb: React.FC<SoftThumbProps> = ({ world, shot, at, seconds, words, title, highlight, hook, handle, offset }) => {
  const World = WORLDS[world];
  const len = Math.round(seconds * 30);
  const local = Math.round(at * len);
  const ws = title.split(" ");
  const lines = ws.length > 2 ? [ws.slice(0, Math.ceil(ws.length / 2)).join(" "), ws.slice(Math.ceil(ws.length / 2)).join(" ")] : [title];
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.round(Math.max(100, Math.min(200, 960 / (longest * 0.56))));
  return (
    <AbsoluteFill style={{ background: WORLD_BG[world] ?? "#FBEFE3" }}>
      {World ? (
        <AbsoluteFill style={{ transform: `translateY(${offset}px)` }}>
          <World s={{ shot, frame: local, local, len, words, still: true }} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(251,245,234,1) 0%, rgba(251,245,234,0.96) 30%, rgba(251,245,234,0) 46%)" }} />
      <div style={{ position: "absolute", top: 260, left: 50, right: 50, textAlign: "center" }}>
        <div style={{ fontFamily: FONTS.headline, fontSize: size, lineHeight: 1.0, color: INK, letterSpacing: "0.01em" }}>
          {lines.map((l, i) => (
            <div key={i}>
              {l.split(" ").map((w, j, arr) => {
                const hi = highlight && highlight.toUpperCase().split(" ").includes(w.toUpperCase());
                return (
                  <span key={j} style={hi ? { background: RED, color: "#FFFFFF", padding: "0 18px", borderRadius: 18, display: "inline-block", margin: "6px 0" } : undefined}>
                    {w}
                    {j < arr.length - 1 ? " " : ""}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        {hook ? (
          <div style={{ display: "inline-block", marginTop: 36, padding: "16px 36px", background: INK, color: "#FFFFFF", borderRadius: 999, fontFamily: FONTS.body, fontWeight: 700, fontSize: 48 }}>{hook}</div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "16px 34px", borderRadius: 999, background: "#FFFFFF", boxShadow: "0 10px 30px rgba(13,40,54,0.25)", fontFamily: FONTS.body, fontWeight: 800, fontSize: 44, color: INK }}>{handle}</div>
      </div>
    </AbsoluteFill>
  );
};
