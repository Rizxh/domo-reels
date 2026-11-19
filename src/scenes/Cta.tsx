import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HighlightText } from "../components/HighlightText";
import { Icon, type IconName } from "../components/Icon";
import {
  BRAND_ASSETS,
  COLORS,
  CTA,
  FONT_WEIGHTS,
  FONTS,
  ICON,
  LAYOUT,
  LETTER_SPACING,
  LINE_HEIGHT,
  MOTION,
  SERIES_COPY,
  TINTS,
  TYPE,
} from "../lib/brand";
import { ANIM, SPRINGS } from "../lib/timing";
import type { CtaScene } from "../schema";
import { Reveal } from "./Reveal";
import { SceneShell, type SceneProps } from "./SceneShell";

// Breathing scale for the buttons; `phase` (0 to 1) offsets one from another.
const pulse = (frame: number, start: number, phase: number): number => {
  if (frame < start) {
    return 1;
  }
  const t = (frame - start) / ANIM.ctaPulsePeriodInFrames + phase;
  return 1 + MOTION.pulseScale * (0.5 - 0.5 * Math.cos(2 * Math.PI * t));
};

const PULSE_PHASE_OFFSET = 0.5;

const Button: React.FC<{
  label: string;
  icon: IconName;
  filled: boolean;
  index: number;
}> = ({ label, icon, filled, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = ANIM.contentDelayInFrames + index * ANIM.staggerInFrames;
  const enter = spring({ frame: frame - delay, fps, config: SPRINGS.pop });
  const scale =
    interpolate(enter, [0, 1], [MOTION.wordPopScaleFrom, 1]) *
    pulse(frame, delay + ANIM.textRevealInFrames, index * PULSE_PHASE_OFFSET);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: CTA.buttonGap / 2,
        padding: `${CTA.buttonPaddingY}px ${CTA.buttonPaddingX}px`,
        borderRadius: CTA.buttonRadius,
        backgroundColor: filled ? COLORS.red : "transparent",
        border: `${CTA.buttonBorderWidth}px solid ${filled ? COLORS.red : COLORS.white}`,
        color: COLORS.white,
        fontFamily: FONTS.body,
        fontWeight: FONT_WEIGHTS.extrabold,
        fontSize: TYPE.handle,
        letterSpacing: LETTER_SPACING.label,
        opacity: enter,
        transform: `scale(${scale})`,
      }}
    >
      <Icon
        name={icon}
        size={ICON.buttonSize}
        color={COLORS.white}
        strokeWidth={ICON.boldStrokeWidth}
      />
      {label}
    </div>
  );
};

// S5: logo, call to action, and pulsing SAVE / FOLLOW buttons.
export const Cta: React.FC<SceneProps<CtaScene>> = ({ scene, timing }) => {
  return (
    <SceneShell scene={scene} timing={timing}>
      <Reveal delayInFrames={0}>
        <div
          style={{
            width: CTA.logoPlateWidth,
            padding: CTA.logoPlatePadding,
            borderRadius: CTA.logoPlateRadius,
            backgroundColor: COLORS.white,
          }}
        >
          <Img
            src={staticFile(BRAND_ASSETS.logo)}
            alt={SERIES_COPY.logoAlt}
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </Reveal>
      <Reveal delayInFrames={ANIM.staggerInFrames}>
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: LAYOUT.itemGap,
        }}
      >
        <div style={{ display: "flex", gap: CTA.buttonGap }}>
          <Button label={SERIES_COPY.save} icon="bookmark" filled index={0} />
          <Button
            label={SERIES_COPY.follow}
            icon="plus"
            filled={false}
            index={1}
          />
        </div>
        <Reveal
          delayInFrames={ANIM.contentDelayInFrames + ANIM.staggerInFrames * 2}
        >
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: FONT_WEIGHTS.semibold,
              fontSize: TYPE.handle,
              color: TINTS.whiteMuted,
            }}
          >
            {scene.handle}
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
};
