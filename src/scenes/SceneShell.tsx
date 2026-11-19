import { AbsoluteFill } from "remotion";
import { BgFootage } from "../components/BgFootage";
import { Caption } from "../components/Caption";
import { CONTENT_AREA, LAYOUT } from "../lib/brand";
import { evenWordTimings } from "../lib/text";
import type { Scene, SceneTiming } from "../schema";

export type SceneProps<T extends Scene> = {
  scene: T;
  timing: SceneTiming;
};

// Shared frame for every scene: background, a content column inside the safe
// area, and the word by word caption strip below it.
export const SceneShell: React.FC<{
  scene: Scene;
  timing: SceneTiming;
  zoom?: React.ComponentProps<typeof BgFootage>["zoom"];
  children: React.ReactNode;
}> = ({ scene, timing, zoom, children }) => {
  // Real TTS alignment when available, otherwise spread words evenly.
  const words =
    timing.words ??
    evenWordTimings(scene.vo, timing.voStartFrame, timing.voDurationInFrames);

  return (
    <AbsoluteFill>
      <BgFootage
        src={scene.footage}
        durationInFrames={timing.durationInFrames}
        zoom={zoom}
      />
      <div
        style={{
          position: "absolute",
          left: CONTENT_AREA.x,
          top: CONTENT_AREA.y,
          width: CONTENT_AREA.width,
          height: CONTENT_AREA.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: LAYOUT.sectionGap,
        }}
      >
        {children}
      </div>
      <Caption words={words} highlight={scene.voHighlight} />
    </AbsoluteFill>
  );
};
