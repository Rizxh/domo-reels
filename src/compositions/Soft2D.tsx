// "Soft" format composition (EP08 onward): the world draws each scene, with a
// headline pill at the top, word-by-word subtitles of the narration, the
// voice per scene, the music ducked under it, sound effects on scene beats
// and a calm closing card. Timing comes only from the episode's scene
// seconds (set from the recorded voice by npm run soft:voice).

import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Jalan2D } from "../soft/jalan";
import { k } from "../soft/kit";
import { FONTS } from "../lib/brand";
import { FPS } from "../lib/timing";
import type { SoftProps, SoftScene } from "../softSchema";

const INK = "#17323C";
const RED = "#E31E24";
const MUSIC_VOLUME = 0.32;
const MUSIC_DUCK = 0.28;
const SFX_VOLUME = 0.55;

export const WORLDS: Record<string, React.FC<{ s: Parameters<typeof Jalan2D>[0]["s"] }>> = { jalan: Jalan2D };
export const WORLD_BG: Record<string, string> = { jalan: "#FBEFE3" };

export const sceneStarts = (scenes: { seconds: number }[]) => {
  const out = [0];
  for (const s of scenes) out.push(out[out.length - 1] + Math.round(s.seconds * FPS));
  return out;
};

const Headline: React.FC<{ text: string; from: number; to: number; frame: number }> = ({ text, from, to, frame }) => {
  const words = text.split(" ");
  const lines = text.length > 14 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [text];
  const inK = k((frame - from) / FPS, 0, 0.45);
  const outK = k((frame - (to - 8)) / FPS, 0, 0.25);
  return (
    <div style={{ position: "absolute", top: 150, left: 60, right: 60, textAlign: "center", opacity: inK * (1 - outK), transform: `translateY(${(1 - inK) * 24 - outK * 14}px)` }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "table", margin: "0 auto 12px", background: "rgba(251,245,234,0.95)", borderRadius: 999, padding: "6px 36px 12px", fontFamily: FONTS.body, fontWeight: 800, fontSize: 64, color: INK, letterSpacing: "-0.01em", boxShadow: "0 12px 30px rgba(13,40,54,0.2)" }}>
          {l}
        </div>
      ))}
    </div>
  );
};

const MAX_WORDS = 7;
const Subtitle: React.FC<{ vo: SoftScene["vo"]; from: number; to: number; frame: number }> = ({ vo, from, to, frame }) => {
  const words = vo.words?.length ? vo.words : vo.text.split(" ").map((w, i, a) => ({ w, t: (i / a.length) * ((to - from) / FPS) * 0.9 }));
  const now = (frame - from) / FPS;
  let cur = words.findIndex((w, i) => now >= w.t && (i === words.length - 1 || now < words[i + 1].t));
  if (cur < 0) cur = now < (words[0]?.t ?? 0) ? 0 : words.length - 1;
  const chunks: number[][] = [];
  let chunk: number[] = [];
  words.forEach((w, i) => {
    chunk.push(i);
    const left = words.length - 1 - i;
    if ((chunk.length >= MAX_WORDS && left !== 1) || (/[.!?]$/.test(w.w) && chunk.length >= 2) || (/[,;:]$/.test(w.w) && chunk.length >= 4 && left >= 2)) {
      chunks.push(chunk);
      chunk = [];
    }
  });
  if (chunk.length) chunks.push(chunk);
  const shown = chunks.find((ch) => ch.includes(cur)) ?? chunks[0] ?? [];
  const inK = k((frame - from) / FPS, 0, 0.2);
  const outK = k((frame - (to - 5)) / FPS, 0, 0.17);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1500, display: "flex", justifyContent: "center", opacity: inK * (1 - outK) }}>
      <div style={{ background: "rgba(13,40,54,0.66)", borderRadius: 40, padding: "20px 30px", fontFamily: FONTS.body, fontWeight: 600, fontSize: 50, lineHeight: 1.3, color: "#FFFFFF", textAlign: "center", boxShadow: "0 14px 40px rgba(13,40,54,0.25)" }}>
        {shown.map((i) => (
          <span key={i} style={{ color: i === cur ? "#FFD27A" : i < cur ? "#FFFFFF" : "rgba(255,255,255,0.72)" }}>
            {words[i].w}
            {i < shown[shown.length - 1] ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

const Outro: React.FC<{ from: number; frame: number; title: string; tagline: string; name: string; handle: string }> = ({ from, frame, title, tagline, name, handle }) => {
  const sec = (frame - from) / FPS;
  const veil = k(sec, 0, 0.4);
  const card = k(sec, 0.1, 0.6);
  const pill = k(sec, 0.9, 0.4);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(251,245,234,${0.55 * veil})` }} />
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>
        <div style={{ width: 920, padding: "72px 64px 64px", background: "#FBF5EA", borderRadius: 56, boxShadow: "0 30px 80px rgba(13,40,54,0.3)", textAlign: "center", opacity: card, transform: `translateY(${(1 - card) * 80}px) scale(${0.92 + 0.08 * card})` }}>
          <div style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 32, letterSpacing: "0.16em", color: RED, marginBottom: 26 }}>{name}</div>
          <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 82, lineHeight: 1.05, letterSpacing: "-0.02em", color: INK }}>{title}</div>
          <div style={{ width: 120, height: 12, borderRadius: 6, background: RED, margin: "36px auto 32px" }} />
          <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 42, color: "#3A4A52" }}>{tagline}</div>
          <div style={{ display: "inline-block", marginTop: 44, padding: "18px 40px", borderRadius: 999, background: INK, color: "#FFFFFF", fontFamily: FONTS.body, fontWeight: 800, fontSize: 40, opacity: pill, transform: `scale(${0.8 + 0.2 * pill})` }}>
            Follow {handle}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Soft2D: React.FC<SoftProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { scenes } = props;
  const starts = sceneStarts(scenes);
  let i = scenes.length - 1;
  while (i > 0 && frame < starts[i]) i--;
  const scene = scenes[i];
  const len = starts[i + 1] - starts[i];
  const World = WORLDS[props.world] ?? Jalan2D;
  const audioOnly = Boolean(process.env.REMOTION_AUDIO_ONLY);
  return (
    <AbsoluteFill style={{ backgroundColor: WORLD_BG[props.world] ?? "#FBEFE3" }}>
      {!audioOnly ? (
        <>
          <World
            s={{
              shot: scene.shot,
              frame,
              local: frame - starts[i],
              len,
              words: scene.vo.words,
              prev: i > 0 ? { shot: scenes[i - 1].shot, len: starts[i] - starts[i - 1], words: scenes[i - 1].vo.words } : undefined,
            }}
          />
          {scene.lyric && !scene.outro ? <Headline key={`h${i}`} text={scene.lyric} from={starts[i]} to={starts[i + 1]} frame={frame} /> : null}
          {!scene.outro ? <Subtitle key={`s${i}`} vo={scene.vo} from={starts[i]} to={starts[i + 1]} frame={frame} /> : null}
          {scene.outro ? <Outro from={starts[i]} frame={frame} title={props.title} tagline={props.tagline} name={props.brandName} handle={props.handle} /> : null}
        </>
      ) : null}
      {props.music ? (
        <Audio
          src={staticFile(props.music)}
          volume={(f) => MUSIC_VOLUME * MUSIC_DUCK * interpolate(f, [0, FPS, durationInFrames - 2 * FPS, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
      {scenes.map((s, k2) =>
        s.vo.src ? (
          <Sequence key={`vo${k2}`} from={starts[k2]} durationInFrames={starts[k2 + 1] - starts[k2]} layout="none">
            <Audio src={staticFile(s.vo.src)} />
          </Sequence>
        ) : null,
      )}
      {scenes.flatMap((s, k2) =>
        s.sfx.map((x, j) => (
          <Sequence key={`sfx${k2}-${j}`} from={Math.round(starts[k2] + x.at * (starts[k2 + 1] - starts[k2]))} layout="none">
            <Audio src={staticFile(`audio/sfx/${x.sound}.wav`)} volume={SFX_VOLUME} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};
