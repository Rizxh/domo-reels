import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { hasStaticFile } from "../lib/assets";
import { MIX, sfxCueFrames } from "../lib/mix";
import type { Scene, SceneTiming } from "../schema";

// Voice over and sound effects for one scene. Rendered inside the scene's
// TransitionSeries.Sequence, so all frames here are scene-relative. Files that
// do not exist yet are skipped silently (VO falls back to an estimate).
export const SceneAudio: React.FC<{ scene: Scene; timing: SceneTiming }> = ({
  scene,
  timing,
}) => {
  const sfx =
    scene.sfx !== undefined && hasStaticFile(scene.sfx) ? scene.sfx : null;

  return (
    <>
      {timing.voSrc ? (
        <Sequence from={timing.voStartFrame} layout="none" name="VO">
          <Audio src={staticFile(timing.voSrc)} volume={MIX.vo} />
        </Sequence>
      ) : null}
      {sfx
        ? sfxCueFrames(scene).map((cue) => (
            <Sequence key={cue} from={cue} layout="none" name="SFX">
              <Audio src={staticFile(sfx)} volume={MIX.sfx} />
            </Sequence>
          ))
        : null}
    </>
  );
};
