// 16:9 "soft" composition (1920x1080, YouTube): the kasus world draws every
// scene with its own on-screen copy (no burned-in subtitles; npm run
// soft:render writes an .srt next to the video), the voice per scene, the
// music ducked under it, sound effects on beats, and at the end a fade to
// black with a small Doktermobil logo watermark bottom right.

import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FONTS } from "../lib/brand";
import { FPS } from "../lib/timing";
import { k } from "../soft/kit";
import { Kasus169, KASUS_BG } from "../soft/kasus";
import type { SoftProps } from "../softSchema";
import { sceneStarts } from "./Soft2D";

const MUSIC_VOLUME = 0.3;
const MUSIC_DUCK = 0.3;
// Music level when no scene has a recorded voice (the music carries the video).
const MUSIC_SOLO = 0.42;
const SFX_VOLUME = 0.5;

const Watermark: React.FC<{ o: number }> = ({ o }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", right: 96, bottom: 54, opacity: o, background: "#FFFFFF", borderRadius: 18, padding: "12px 18px" }}>
      <Img src={staticFile("brand/logo.png")} style={{ width: 220, display: "block" }} />
    </div>
  );

export const Soft169: React.FC<SoftProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { scenes } = props;
  const starts = sceneStarts(scenes);
  let i = scenes.length - 1;
  while (i > 0 && frame < starts[i]) i--;
  const scene = scenes[i];
  const audioOnly = Boolean(process.env.REMOTION_AUDIO_ONLY);
  const fadeSec = props.ending?.fade ?? 0.45;
  const black = props.ending?.black ?? 0;
  const endSec = (frame - (durationInFrames - Math.round((fadeSec + black) * FPS) - 1)) / FPS;
  const fade = k(endSec, 0, fadeSec);
  const voiced = scenes.some((s) => s.vo.src);
  const musicLevel = voiced ? MUSIC_VOLUME * MUSIC_DUCK : MUSIC_SOLO;
  return (
    <AbsoluteFill style={{ backgroundColor: KASUS_BG }}>
      {!audioOnly ? (
        <>
          <Kasus169
            s={{
              shot: scene.shot,
              frame,
              local: frame - starts[i],
              len: starts[i + 1] - starts[i],
              words: scene.vo.words,
              screen: scene.screen,
              cues: scene.cues,
              prev: i > 0 ? { shot: scenes[i - 1].shot, len: starts[i] - starts[i - 1], words: scenes[i - 1].vo.words, screen: scenes[i - 1].screen, cues: scenes[i - 1].cues } : undefined,
            }}
          />
          <AbsoluteFill style={{ background: "#000", opacity: fade }} />
          <Watermark o={fade} />
        </>
      ) : null}
      {(props.musicParts ?? []).map((m, n) => {
        const from = Math.round(m.at * FPS);
        const to = Math.min(durationInFrames, m.until !== undefined ? Math.round(m.until * FPS) : durationInFrames);
        const len = to - from;
        if (len <= 0) return null;
        const inF = Math.max(1, Math.round((m.fadeIn ?? 0.4) * FPS));
        const outF = Math.max(1, Math.round((m.fadeOut ?? 1) * FPS));
        const vol = m.volume ?? 1;
        return (
          <Sequence key={`mus${n}`} from={from} durationInFrames={len} layout="none">
            <Audio
              src={staticFile(m.src)}
              volume={(f) => musicLevel * vol * interpolate(f, [0, inF, Math.max(inF + 1, len - outF), len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            />
          </Sequence>
        );
      })}
      {props.music && !props.musicParts?.length ? (
        <Audio
          src={staticFile(props.music)}
          volume={(f) => musicLevel * interpolate(f, [0, FPS, durationInFrames - 2 * FPS, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
      {scenes.map((s, n) =>
        s.vo.src ? (
          <Sequence key={`vo${n}`} from={starts[n]} durationInFrames={starts[n + 1] - starts[n]} layout="none">
            <Audio src={staticFile(s.vo.src)} />
          </Sequence>
        ) : null,
      )}
      {scenes.flatMap((s, n) =>
        s.sfx.map((x, j) => (
          <Sequence key={`sfx${n}-${j}`} from={Math.round(starts[n] + x.at * (starts[n + 1] - starts[n]))} layout="none">
            <Audio src={staticFile(`audio/sfx/${x.sound}.wav`)} volume={SFX_VOLUME} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};

// 16:9 cover: the frozen hook scene with a big title on the right.
export const soft169ThumbSchema = z.object({
  world: z.string(),
  shot: z.string(),
  at: z.number().default(0.7),
  seconds: z.number().default(5),
  words: z.array(z.object({ w: z.string(), t: z.number() })).default([]),
  title: z.string().max(40),
  highlight: z.string().max(24).optional(),
  hook: z.string().max(40).optional(),
  handle: z.string(),
  offset: z.number().default(0),
  screen: z.record(z.string(), z.string()).default({}),
});
export type Soft169ThumbProps = z.infer<typeof soft169ThumbSchema>;

export const Soft169Thumb: React.FC<Soft169ThumbProps> = ({ shot, at, seconds, words, title, highlight, hook, screen }) => {
  const len = Math.round(seconds * FPS);
  const local = Math.round(at * len);
  const ws = title.split(" ");
  const lines = ws.length > 2 ? [ws.slice(0, Math.ceil(ws.length / 2)).join(" "), ws.slice(Math.ceil(ws.length / 2)).join(" ")] : [title];
  return (
    <AbsoluteFill style={{ background: KASUS_BG }}>
      <AbsoluteFill style={{ transform: "translateX(-380px) scale(1.15)" }}>
        <Kasus169 s={{ shot, frame: local, local, len, words, screen, still: true }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(19,32,46,0) 30%, rgba(19,32,46,0.92) 55%)" }} />
      <div style={{ position: "absolute", right: 96, top: 230, width: 900, textAlign: "right" }}>
        {hook ? <div style={{ display: "inline-block", padding: "12px 30px", borderRadius: 999, background: "#E31E24", color: "#FFF", fontFamily: FONTS.body, fontWeight: 800, fontSize: 40, marginBottom: 30 }}>{hook}</div> : null}
        <div style={{ fontFamily: FONTS.headline, fontSize: 150, lineHeight: 1.0, color: "#FFFFFF" }}>
          {lines.map((l, n) => (
            <div key={n}>
              {l.split(" ").map((w, j, arr) => (
                <span key={j} style={highlight && w.toUpperCase() === highlight.toUpperCase() ? { color: "#E31E24" } : undefined}>
                  {w}
                  {j < arr.length - 1 ? " " : ""}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 96, bottom: 54, background: "#FFFFFF", borderRadius: 18, padding: "12px 18px" }}>
        <Img src={staticFile("brand/logo.png")} style={{ width: 240, display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};
