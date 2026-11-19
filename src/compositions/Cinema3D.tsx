import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, getRemotionEnvironment, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraAt, shotIndexAt } from "../cinema/rig";
import { CinemaOverlays } from "../cinema/Overlays";
import { Stage3D } from "../cinema/Stage3D";
import { resolveCinemaCues, type CueMap } from "../cinema/timeline";
import { WORLDS } from "../cinema/worlds";
import type { WorldDef } from "../cinema/worlds/types";
import type { CinemaProps } from "../cinemaSchema";
import { Caption } from "../components/Caption";
import { SafeZone } from "../components/SafeZone";
import { COLORS, VIDEO } from "../lib/brand";
import type { BeatTiming } from "../lib/explainerTiming";
import { CINEMA_MIX, MIX } from "../lib/mix";
import { SFX, SFX_MIX } from "../lib/sfx";

// Original music bed (scripts/music.ts) and the level of each file so the
// three sit at the same loudness before ducking.
// (scripts/music.ts writes every episode's files at these relative levels.)
const MUSIC_GAIN = { build: 1, riser: 0.4, resolve: 1.5, riserSeconds: 3 } as const;

// Set by scripts/render.ts for the audio-only pass: no WebGL needed there.
const AUDIO_ONLY = Boolean(process.env.REMOTION_AUDIO_ONLY);

const World: React.FC<{ props: CinemaProps; cues: CueMap; world: WorldDef<unknown> }> = ({ props, cues, world }) => {
  const frame = useCurrentFrame();
  const shots = useMemo(() => world.shots(cues), [cues, world]);
  const cam = cameraAt(shots, frame);
  const shot = shots[shotIndexAt(shots, frame)];
  const state = world.state(cues, frame, shots);
  const Scene = world.Scene;
  const proj = {
    cam,
    anchor: (name: string) => world.anchor(name, state),
    region: (name: string) => world.region(name, state),
  };
  return (
    <>
      {AUDIO_ONLY ? null : (
        <Stage3D width={VIDEO.width} height={VIDEO.height} cam={cam} look={world.look} dof={{ range: shot.dofRange, bokeh: props.draft ? 0 : shot.bokeh }}>
          <Scene state={state} frame={frame} episode={props} />
        </Stage3D>
      )}
      <CinemaOverlays ep={props} cues={cues} proj={proj} />
    </>
  );
};

// Music: the build runs until the reveal, a riser ends on it, the resolve
// starts on it. Ducked under the voice.
export const Music: React.FC<{ cues: CueMap; timings: BeatTiming[]; world: Pick<WorldDef<unknown>, "music"> }> = ({ cues, timings, world }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const hit = cues[world.music.hit];
  const ranges = timings.map((t) => ({ from: t.voStartFrame, to: t.voStartFrame + t.voDurationInFrames }));
  const duck = (f: number) => {
    let d = 0;
    for (const r of ranges) {
      if (f >= r.from && f < r.to) return 1;
      const dist = f < r.from ? r.from - f : f - r.to;
      d = Math.max(d, 1 - dist / CINEMA_MIX.duckRampInFrames);
    }
    return Math.max(0, d);
  };
  const level = (f: number) => CINEMA_MIX.musicFree + (CINEMA_MIX.musicUnderVo - CINEMA_MIX.musicFree) * duck(f);
  const riserFrames = Math.round(MUSIC_GAIN.riserSeconds * fps);
  return (
    <>
      <Sequence durationInFrames={hit} layout="none" name="Music build">
        <Audio
          src={staticFile(world.music.build)}
          volume={(f) => MUSIC_GAIN.build * level(f) * interpolate(f, [hit - CINEMA_MIX.musicFadeOutFrames, hit], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>
      <Sequence from={hit - riserFrames} durationInFrames={riserFrames} layout="none" name="Music riser">
        <Audio src={staticFile(world.music.riser)} volume={(f) => MUSIC_GAIN.riser * level(f + hit - riserFrames)} />
      </Sequence>
      <Sequence from={hit} durationInFrames={durationInFrames - hit} layout="none" name="Music resolve">
        <Audio
          src={staticFile(world.music.resolve)}
          volume={(f) =>
            MUSIC_GAIN.resolve *
            level(f + hit) *
            interpolate(f + hit, [durationInFrames - Math.round(MIX.bgmFadeOutInSeconds * fps), durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          }
        />
      </Sequence>
    </>
  );
};

export const Sounds: React.FC<{ cues: CueMap; props: CinemaProps; world: Pick<WorldDef<unknown>, "shots" | "sounds"> }> = ({ cues, props, world }) => {
  const { fps } = useVideoConfig();
  const shots = useMemo(() => world.shots(cues), [cues, world]);
  const sounds = world.sounds(cues, shots);
  // A soft pop when a text block opens (not for the CTA handle: the music
  // resolve carries it).
  const pops = props.beats.flatMap((b) => b.texts.filter((t) => t.style !== "handle" && t.style !== "note").map((t) => cues[t.id]));
  return (
    <>
      {sounds.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, s.at)} durationInFrames={s.loopUntil ? s.loopUntil - s.at : undefined} layout="none" name={`SFX ${s.sfx}`}>
          <Audio src={staticFile(SFX[s.sfx])} volume={SFX_MIX[s.sfx] * (s.gain ?? 1)} loop={Boolean(s.loopUntil)} />
        </Sequence>
      ))}
      {pops.map((f, i) => (
        <Sequence key={`p${i}`} from={f} durationInFrames={Math.round(0.3 * fps)} layout="none" name="SFX pop">
          <Audio src={staticFile(SFX.pop)} volume={SFX_MIX.pop} />
        </Sequence>
      ))}
    </>
  );
};

// Cinema format: a live R3F world with a shot list cut on spoken words,
// React text on top, word-by-word captions, VO, original music and SFX.
export const Cinema3D: React.FC<CinemaProps> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const timings = props.beatTimings;
  const cues = useMemo(() => (timings ? resolveCinemaCues(props.beats, timings, durationInFrames) : null), [props.beats, timings, durationInFrames]);
  const world = WORLDS[props.world === "board" || props.world === "story" ? "tire" : props.world];
  if (!timings || !cues) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.black }} />;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <World props={props} cues={cues} world={world} />
      {props.beats.map((beat, i) => {
        const t = timings[i];
        return (
          <Sequence key={beat.id} from={t.startFrame} durationInFrames={t.endFrame - t.startFrame} name={`Caption ${beat.id}`}>
            <Caption
              words={t.words.map((w) => ({ text: w.text, startFrame: w.startFrame - t.startFrame, endFrame: w.endFrame - t.startFrame }))}
              highlight={beat.voHighlight}
              boxed
            />
          </Sequence>
        );
      })}
      {timings.map((t, i) =>
        t.voSrc ? (
          <Sequence key={t.voSrc} from={t.voStartFrame} layout="none" name={`VO ${props.beats[i].id}`}>
            <Audio src={staticFile(t.voSrc)} volume={MIX.vo * (t.voGain ?? 1)} />
          </Sequence>
        ) : null,
      )}
      <Music cues={cues} timings={timings} world={world} />
      <Sounds cues={cues} props={props} world={world} />
      {props.debug && getRemotionEnvironment().isStudio ? <SafeZone /> : null}
    </AbsoluteFill>
  );
};
