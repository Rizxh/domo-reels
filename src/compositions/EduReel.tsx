import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Fragment } from "react";
import { AbsoluteFill, getRemotionEnvironment } from "remotion";
import { BgmTrack } from "../components/BgmTrack";
import { SafeZone } from "../components/SafeZone";
import { SceneAudio } from "../components/SceneAudio";
import { COLORS } from "../lib/brand";
import {
  estimateVoDurationInSeconds,
  sceneTimingFromVo,
  TRANSITION_DURATION_IN_FRAMES,
} from "../lib/timing";
import { Cta } from "../scenes/Cta";
import { Fact } from "../scenes/Fact";
import { Hook } from "../scenes/Hook";
import { Myth } from "../scenes/Myth";
import { Reasons } from "../scenes/Reasons";
import type { EduReelProps, Scene, SceneTiming } from "../schema";

const SceneView: React.FC<{ scene: Scene; timing: SceneTiming }> = ({
  scene,
  timing,
}) => {
  switch (scene.type) {
    case "hook":
      return <Hook scene={scene} timing={timing} />;
    case "myth":
      return <Myth scene={scene} timing={timing} />;
    case "fact":
      return <Fact scene={scene} timing={timing} />;
    case "reasons":
      return <Reasons scene={scene} timing={timing} />;
    case "cta":
      return <Cta scene={scene} timing={timing} />;
  }
};

export const EduReel: React.FC<EduReelProps> = ({
  scenes,
  bgm,
  debug,
  sceneTimings,
}) => {
  // calculateMetadata always provides timings; the estimate is a safety net
  // for when the component is rendered without it (e.g. in a Player).
  const timings =
    sceneTimings ??
    scenes.map((scene) =>
      sceneTimingFromVo(estimateVoDurationInSeconds(scene.vo)),
    );

  const showSafeZone = debug && getRemotionEnvironment().isStudio;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <TransitionSeries>
        {scenes.map((scene, index) => (
          <Fragment key={`${scene.type}-${index}`}>
            {index > 0 ? (
              <TransitionSeries.Transition
                presentation={fade()}
                timing={linearTiming({
                  durationInFrames: TRANSITION_DURATION_IN_FRAMES,
                })}
              />
            ) : null}
            <TransitionSeries.Sequence
              durationInFrames={timings[index].durationInFrames}
              name={`S${index + 1} ${scene.type}`}
            >
              <SceneView scene={scene} timing={timings[index]} />
              <SceneAudio scene={scene} timing={timings[index]} />
            </TransitionSeries.Sequence>
          </Fragment>
        ))}
      </TransitionSeries>
      <BgmTrack src={bgm} timings={timings} />
      {showSafeZone ? <SafeZone /> : null}
    </AbsoluteFill>
  );
};
