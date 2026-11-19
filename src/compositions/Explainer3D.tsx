import { Audio } from "@remotion/media";
import { useMemo } from "react";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Caption } from "../components/Caption";
import { PrevizFrame, type PrevizAnchors } from "../components/PrevizFrame";
import { SafeZone } from "../components/SafeZone";
import {
  CtaOverlay,
  CycleOverlay,
  HookOverlay,
  ImpactOverlay,
  RevealOverlay,
} from "../explainer/Overlays";
import { ExplainerSfx } from "../explainer/Sfx";
import type { ExplainerProps, ExplainerScene } from "../explainerSchema";
import { COLORS, EXPLAINER } from "../lib/brand";
import {
  cuesInSeconds,
  resolveCues,
  type BeatTiming,
  type ExplainerCues,
} from "../lib/explainerTiming";
import { MIX } from "../lib/mix";
import { PREVIZ_DRAFT_QUALITY } from "../lib/previz";

const BeatOverlay: React.FC<{
  scene: ExplainerScene;
  beat: BeatTiming;
  cues: ExplainerCues;
  anchors: PrevizAnchors;
}> = ({ scene, beat, cues, anchors }) => {
  switch (scene.type) {
    case "hook":
      return <HookOverlay scene={scene} beat={beat} cues={cues.hook} />;
    case "reveal":
      return <RevealOverlay scene={scene} beat={beat} cues={cues.reveal} />;
    case "cycle":
      return <CycleOverlay scene={scene} beat={beat} cues={cues.cycle} />;
    case "impact":
      return (
        <ImpactOverlay
          scene={scene}
          beat={beat}
          cues={cues.impact}
          anchors={anchors}
        />
      );
    case "cta":
      return <CtaOverlay scene={scene} beat={beat} cues={cues.cta} />;
  }
};

// "Jarang Diketahui" 3D explainer. The 3D page draws the picture; text and
// captions are React on top of it. Every event is placed on the frame its
// cue word is spoken, so picture, text and sound cannot drift apart.
export const Explainer3D: React.FC<ExplainerProps> = ({
  scenes,
  beats,
  debug,
  draft,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const cues = useMemo(
    () => (beats ? resolveCues(scenes, beats, durationInFrames) : null),
    [scenes, beats, durationInFrames],
  );
  const config = useMemo(
    () =>
      cues
        ? {
            cues: cuesInSeconds(cues, fps),
            quality: draft ? PREVIZ_DRAFT_QUALITY : undefined,
          }
        : null,
    [cues, fps, draft],
  );
  // beats come from calculateMetadata; without them there is nothing to time.
  if (!beats || !cues || !config) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.black }} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <PrevizFrame page={EXPLAINER.page} config={config}>
        {(anchors, sounds) => (
          <>
            {scenes.map((scene, i) => (
              <BeatOverlay
                key={scene.type}
                scene={scene}
                beat={beats[i]}
                cues={cues}
                anchors={anchors}
              />
            ))}
            <ExplainerSfx cues={cues} sounds={sounds} />
          </>
        )}
      </PrevizFrame>
      {scenes.map((scene, i) => {
        const beat = beats[i];
        return (
          <Sequence
            key={scene.type}
            from={beat.startFrame}
            durationInFrames={beat.endFrame - beat.startFrame}
            name={`Caption ${scene.type}`}
          >
            <Caption
              words={beat.words.map((w) => ({
                text: w.text,
                startFrame: w.startFrame - beat.startFrame,
                endFrame: w.endFrame - beat.startFrame,
              }))}
              highlight={scene.voHighlight}
              boxed
            />
          </Sequence>
        );
      })}
      {beats.map((beat, i) =>
        beat.voSrc ? (
          <Sequence
            key={beat.voSrc}
            from={beat.voStartFrame}
            layout="none"
            name={`VO ${scenes[i].type}`}
          >
            <Audio
              src={staticFile(beat.voSrc)}
              volume={MIX.vo * (beat.voGain ?? 1)}
            />
          </Sequence>
        ) : null,
      )}
      {debug && getRemotionEnvironment().isStudio ? <SafeZone /> : null}
    </AbsoluteFill>
  );
};
