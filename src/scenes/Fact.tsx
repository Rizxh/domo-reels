import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Counter } from "../components/Counter";
import { HighlightText } from "../components/HighlightText";
import { Icon } from "../components/Icon";
import { Stamp } from "../components/Stamp";
import { COLORS, FONTS, ICON, LAYOUT, LINE_HEIGHT, TYPE } from "../lib/brand";
import { ANIM, counterEndFrame } from "../lib/timing";
import type { FactScene } from "../schema";
import { Reveal } from "./Reveal";
import { SceneShell, type SceneProps } from "./SceneShell";

// Small car that eases in after the counter lands and keeps rolling slowly to
// the right ("lalu jalan pelan").
const SlowCar: React.FC = () => {
  const frame = useCurrentFrame();
  const start = counterEndFrame();
  const progress = interpolate(
    frame,
    [start, start + ANIM.carDriveDurationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.sin),
    },
  );
  const opacity = interpolate(
    frame,
    [start, start + ANIM.textRevealInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{ flex: 1, position: "relative", height: ICON.carSize, opacity }}
    >
      <div
        style={{
          position: "absolute",
          left: `calc(${progress} * (100% - ${ICON.carSize}px))`,
          top: 0,
        }}
      >
        <Icon name="car" size={ICON.carSize} color={COLORS.white} />
      </div>
    </div>
  );
};

// S3: the correct answer with a concrete number.
export const Fact: React.FC<SceneProps<FactScene>> = ({ scene, timing }) => {
  return (
    <SceneShell scene={scene} timing={timing}>
      <Stamp variant="fact" />
      {scene.counterTo !== undefined ? (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: LAYOUT.itemGap,
          }}
        >
          <Counter to={scene.counterTo} unit={scene.counterUnit} />
          <SlowCar />
        </div>
      ) : null}
      <Reveal delayInFrames={ANIM.contentDelayInFrames + ANIM.staggerInFrames}>
        <HighlightText
          text={scene.text}
          highlight={scene.highlight}
          style={{
            fontFamily: FONTS.headline,
            fontSize: TYPE.factText,
            lineHeight: LINE_HEIGHT.snug,
            textTransform: "uppercase",
          }}
        />
      </Reveal>
    </SceneShell>
  );
};
