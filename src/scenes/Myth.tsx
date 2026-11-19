import { HighlightText } from "../components/HighlightText";
import { LottieIcon } from "../components/LottieIcon";
import { Stamp } from "../components/Stamp";
import { COLORS, FONTS, ICON, LINE_HEIGHT, TYPE } from "../lib/brand";
import { ANIM } from "../lib/timing";
import type { MythScene } from "../schema";
import { Reveal } from "./Reveal";
import { SceneShell, type SceneProps } from "./SceneShell";

// S2: names the wrong habit. MITOS stamp slams in, then the icon and claim.
export const Myth: React.FC<SceneProps<MythScene>> = ({ scene, timing }) => {
  return (
    <SceneShell scene={scene} timing={timing}>
      <Stamp variant="myth" />
      {scene.lottie ? (
        <Reveal delayInFrames={ANIM.contentDelayInFrames}>
          <LottieIcon
            src={scene.lottie}
            size={ICON.sceneSize}
            color={COLORS.white}
          />
        </Reveal>
      ) : null}
      <Reveal delayInFrames={ANIM.contentDelayInFrames + ANIM.staggerInFrames}>
        <HighlightText
          text={scene.text}
          highlight={scene.highlight}
          style={{
            fontFamily: FONTS.headline,
            fontSize: TYPE.title,
            lineHeight: LINE_HEIGHT.snug,
            textTransform: "uppercase",
          }}
        />
      </Reveal>
    </SceneShell>
  );
};
