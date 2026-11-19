import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, getRemotionEnvironment, Sequence, staticFile, useVideoConfig } from "remotion";
import { resolveCinemaCues, cue, type CueMap } from "../cinema/timeline";
import type { SoundCue } from "../cinema/worlds/types";
import type { CinemaProps } from "../cinemaSchema";
import { Caption } from "../components/Caption";
import { SafeZone } from "../components/SafeZone";
import { COLORS } from "../lib/brand";
import { MIX } from "../lib/mix";
import { Board, boardShots } from "../paper/Board";
import { StoryBoard, storyScenes } from "../paper/story/StoryBoard";
import { DiagnosisBoard, diagnosisShots } from "../paper/DiagnosisBoard";
import { PaperDefs } from "../paper/kit";
import { Music, Sounds } from "./Cinema3D";

// Board sounds: marker strokes on every written text, paper slaps when a
// card or cut-out lands, a whoosh on each long camera move, the register
// bell on the bill and a stamp thud.
const boardSounds = (ep: CinemaProps, cues: CueMap): SoundCue[] => {
  const c = (n: string) => cue(cues, n);
  const written = ep.beats.flatMap((b) => b.texts.filter((t) => t.style === "title" || t.style === "figure").map((t) => c(t.id)));
  if (ep.world === "story") {
    // Story dioramas: a whoosh into every new set, the act-1 hits, the scan
    // and checklist beeps, the signature and the CTA.
    const scenes = storyScenes(cues);
    return [
      { at: 0, sfx: "boom", gain: 0.45 },
      ...scenes.slice(1).map((s) => ({ at: s.from - 8, sfx: "whoosh" as const, gain: 0.3 })),
      { at: c("lightService"), sfx: "paper", gain: 0.7 },
      { at: c("smokeCut"), sfx: "hiss", gain: 0.6, loopUntil: c("oknum:start") },
      { at: c("modus"), sfx: "slam", gain: 0.7 },
      { at: c("hoodOpen"), sfx: "paper", gain: 0.6 },
      ...["up1", "up2", "up3"].map((id) => ({ at: c(id), sfx: "paper" as const, gain: 0.8 })),
      { at: c("damage:start") + 4, sfx: "crackle", gain: 0.5 },
      { at: c("hose") + 2, sfx: "hiss", gain: 0.8, loopUntil: c("checkLight") },
      { at: c("checkLight") + 4, sfx: "bell", gain: 0.35 },
      { at: c("billSwell"), sfx: "boom", gain: 0.4 },
      { at: c("scan"), sfx: "pop", gain: 0.8 },
      ...["pt1", "pt2", "pt4"].map((id) => ({ at: c(id), sfx: "tick" as const, gain: 0.8 })),
      { at: c("regret:start"), sfx: "hiss", gain: 0.35, loopUntil: c("turn:start") },
      { at: c("money"), sfx: "paper", gain: 0.8 },
      ...[0, 6, 12, 18].map((k) => ({ at: c("time") + k, sfx: "tick" as const, gain: 0.7 })),
      { at: c("arrive2"), sfx: "pop", gain: 0.5 },
      { at: c("needHead"), sfx: "pop", gain: 0.7 },
      { at: c("skipHead"), sfx: "tick", gain: 0.8 },
      { at: c("payTitle"), sfx: "paper", gain: 0.8 },
      { at: c("formTitle"), sfx: "marker", gain: 0.7 },
      { at: c("sign"), sfx: "marker", gain: 0.6 },
      { at: c("cta:start"), sfx: "paper", gain: 0.7 },
    ];
  }
  if (ep.id === "ep06") {
    const shots = diagnosisShots(cues);
    return [
      { at: 2, sfx: "hum", gain: 0.25 },
      { at: c("checkLight"), sfx: "bell", gain: 0.45 },
      { at: c("bill"), sfx: "crackle", gain: 0.5 },
      { at: c("notNeeded"), sfx: "slam", gain: 0.65 },
      ...written.map((at) => ({ at, sfx: "marker" as const, gain: 0.75 })),
      ...shots.slice(1).map((s) => ({ at: s.from - 8, sfx: "whoosh" as const, gain: 0.35 })),
      { at: c("scanResult"), sfx: "pop", gain: 0.7 },
      { at: c("book"), sfx: "paper", gain: 0.8 },
    ];
  }
  const shots = ep.id === "ep06" ? diagnosisShots(cues) : boardShots(cues);
  return [
    { at: 2, sfx: "paper", gain: 0.6 },
    { at: c("oilNote"), sfx: "paper", gain: 0.8 },
    { at: c("billOut"), sfx: "crackle", gain: 0.35 },
    { at: c("bill"), sfx: "bell", gain: 0.9 },
    ...written.map((at) => ({ at, sfx: "marker" as const, gain: 0.8 })),
    ...shots.slice(1).map((s) => ({ at: s.from - 10, sfx: "whoosh" as const, gain: 0.35 })),
    { at: c("s1Hide"), sfx: "paper", gain: 0.7 },
    { at: c("s2Swell"), sfx: "boom", gain: 0.25 },
    { at: c("s3Stamp"), sfx: "slam", gain: 0.8 },
    { at: c("s3Toss") + 10, sfx: "crackle", gain: 0.5 },
    ...["est1", "est2", "est3"].map((id) => ({ at: c(id), sfx: "marker" as const, gain: 0.5 })),
    { at: c("book"), sfx: "paper", gain: 0.8 },
  ];
};

// 2D whiteboard format: paper cut-outs on one big board, a 2D camera cut
// on cue words, word-by-word captions, VO, original music and SFX.
export const Paper2D: React.FC<CinemaProps> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const timings = props.beatTimings;
  const cues = useMemo(() => (timings ? resolveCinemaCues(props.beats, timings, durationInFrames) : null), [props.beats, timings, durationInFrames]);
  const world = useMemo(
    () => ({
      music: { hit: props.id === "ep06" ? "cta:start" : props.world === "story" ? "turn:start" : "pullBack", build: `audio/bgm/${props.id}-build.wav`, riser: `audio/bgm/${props.id}-riser.wav`, resolve: `audio/bgm/${props.id}-resolve.wav` },
      shots: () => [],
      sounds: () => (cues ? boardSounds(props, cues) : []),
    }),
    [props, cues],
  );
  if (!timings || !cues) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.white }} />;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.white, overflow: "hidden" }}>
      <PaperDefs />
      {props.world === "story" ? <StoryBoard ep={props} cues={cues} /> : props.id === "ep06" ? <DiagnosisBoard ep={props} cues={cues} /> : <Board ep={props} cues={cues} />}
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
