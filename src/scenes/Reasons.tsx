import { IconCard } from "../components/IconCard";
import {
  COLORS,
  FONTS,
  LAYOUT,
  LINE_HEIGHT,
  SERIES_COPY,
  TYPE,
} from "../lib/brand";
import { ANIM } from "../lib/timing";
import type { ReasonsScene } from "../schema";
import { Reveal } from "./Reveal";
import { SceneShell, type SceneProps } from "./SceneShell";

// S4: two or three short reasons, each card arriving 8 frames after the last.
export const Reasons: React.FC<SceneProps<ReasonsScene>> = ({
  scene,
  timing,
}) => {
  return (
    <SceneShell scene={scene} timing={timing}>
      <Reveal delayInFrames={0}>
        <div
          style={{
            fontFamily: FONTS.headline,
            fontSize: TYPE.title,
            lineHeight: LINE_HEIGHT.tight,
            color: COLORS.red,
          }}
        >
          {SERIES_COPY.reasons}
        </div>
      </Reveal>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: LAYOUT.itemGap,
        }}
      >
        {scene.items.map((item, index) => (
          <IconCard
            key={`${item.label}-${index}`}
            icon={item.icon}
            label={item.label}
            index={index}
            delayInFrames={ANIM.contentDelayInFrames}
          />
        ))}
      </div>
    </SceneShell>
  );
};
