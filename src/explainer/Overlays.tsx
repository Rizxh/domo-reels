import { useLayoutEffect, useRef, useState } from "react";
import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PrevizAnchors } from "../components/PrevizFrame";
import type { ExplainerScene } from "../explainerSchema";
import {
  BRAND_ASSETS,
  COLORS,
  CTA,
  EXPLAINER,
  EXPLAINER_COPY,
  FONT_WEIGHTS,
  FONTS,
  LETTER_SPACING,
  LINE_HEIGHT,
  SAFE_AREA,
  SERIES_COPY,
  VIDEO,
} from "../lib/brand";
import type { BeatTiming, ExplainerCues } from "../lib/explainerTiming";
import { SPRINGS } from "../lib/timing";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type SceneOf<T extends ExplainerScene["type"]> = Extract<
  ExplainerScene,
  { type: T }
>;
type Tone = "black" | "red" | "white";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  black: { bg: COLORS.black, fg: COLORS.white },
  red: { bg: COLORS.red, fg: COLORS.white },
  white: { bg: COLORS.white, fg: COLORS.black },
};

// Entry and exit progress of an element that lives in [inFrame, outFrame).
const useLife = (cueFrame: number, outFrame: number) => {
  const frame = useCurrentFrame();
  const inFrame = cueFrame - EXPLAINER.leadFrames;
  return {
    alive: frame >= inFrame && frame < outFrame,
    enter: interpolate(
      frame,
      [inFrame, inFrame + EXPLAINER.enterFrames],
      [0, 1],
      { ...CLAMP, easing: EASE_OUT },
    ),
    exit: interpolate(
      frame,
      [outFrame - EXPLAINER.exitFrames, outFrame],
      [0, 1],
      CLAMP,
    ),
  };
};

// Text overlays share one column at the top left of the safe area.
const Stack: React.FC<{ children: React.ReactNode; top?: number }> = ({
  children,
  top = EXPLAINER.top,
}) => (
  <div
    style={{
      position: "absolute",
      left: SAFE_AREA.x,
      top,
      width: SAFE_AREA.width,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: EXPLAINER.blockGap,
    }}
  >
    {children}
  </div>
);

// Solid label block: wipes open from the left while its text rises into it.
const Block: React.FC<{
  text: string;
  size: number;
  tone: Tone;
  inFrame: number;
  outFrame: number;
  // Small spaced caps (tags) instead of the headline face.
  tag?: boolean;
}> = ({ text, size, tone, inFrame, outFrame, tag = false }) => {
  const { alive, enter, exit } = useLife(inFrame, outFrame);
  if (!alive) {
    return null;
  }
  const { bg, fg } = TONES[tone];
  return (
    <div
      style={{
        backgroundColor: bg,
        padding: `${EXPLAINER.blockPaddingY + (tag ? 8 : 0)}px ${EXPLAINER.blockPaddingX}px`,
        overflow: "hidden",
        clipPath: `inset(0 ${(1 - enter) * 100}% 0 0)`,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 14}px)`,
      }}
    >
      <div
        style={{
          fontFamily: tag ? FONTS.body : FONTS.headline,
          fontWeight: tag ? FONT_WEIGHTS.bold : FONT_WEIGHTS.regular,
          fontSize: size,
          lineHeight: tag ? LINE_HEIGHT.normal : LINE_HEIGHT.snug,
          letterSpacing: tag ? LETTER_SPACING.label : LETTER_SPACING.headline,
          color: fg,
          whiteSpace: "nowrap",
          transform: `translateY(${(1 - enter) * 60}%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// A big number that slams in on its word, with its unit on a red block.
const Figure: React.FC<{
  value: string;
  unit: string;
  size: number;
  unitSize: number;
  inFrame: number;
  outFrame: number;
}> = ({ value, unit, size, unitSize, inFrame, outFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { exit } = useLife(inFrame, outFrame);
  const start = inFrame - EXPLAINER.leadFrames;
  if (frame < start || frame >= outFrame) {
    return null;
  }
  const slam = spring({ frame: frame - start, fps, config: SPRINGS.slam });
  return (
    <div
      style={{ opacity: 1 - exit, transform: `translateY(${-exit * 14}px)` }}
    >
      <div
        style={{
          fontFamily: FONTS.headline,
          fontSize: size,
          lineHeight: LINE_HEIGHT.tight,
          color: COLORS.white,
          textShadow: EXPLAINER.textShadow,
          opacity: Math.min(slam * 3, 1),
          transform: `scale(${interpolate(slam, [0, 1], [1.7, 1])})`,
          transformOrigin: "0% 60%",
        }}
      >
        {value}
      </div>
      <div style={{ display: "flex", marginTop: EXPLAINER.blockGap }}>
        <Block
          text={unit}
          size={unitSize}
          tone="red"
          inFrame={inFrame + EXPLAINER.staggerFrames}
          outFrame={outFrame + EXPLAINER.exitFrames}
        />
      </div>
    </div>
  );
};

const figureText = (fig: { value: number; suffix: string }) =>
  `${fig.value}${fig.suffix}`;

export const HookOverlay: React.FC<{
  scene: SceneOf<"hook">;
  beat: BeatTiming;
  cues: ExplainerCues["hook"];
}> = ({ scene, beat, cues }) => (
  <Stack>
    {/* Already open on frame 0 so the cover frame carries the series tag. */}
    <Block
      text={EXPLAINER_COPY.series}
      size={EXPLAINER.tagSize}
      tone="white"
      tag
      inFrame={beat.startFrame - EXPLAINER.enterFrames - EXPLAINER.leadFrames}
      outFrame={beat.endFrame}
    />
    <div style={{ height: EXPLAINER.tagGap }} />
    <Figure
      value={figureText(scene.count)}
      unit={scene.count.unit}
      size={EXPLAINER.figureSize}
      unitSize={EXPLAINER.figureUnitSize}
      inFrame={cues.count}
      outFrame={beat.endFrame}
    />
  </Stack>
);

export const RevealOverlay: React.FC<{
  scene: SceneOf<"reveal">;
  beat: BeatTiming;
  cues: ExplainerCues["reveal"];
}> = ({ scene, beat, cues }) => {
  return (
    <Stack>
      <Block
        text={scene.title.text}
        size={EXPLAINER.titleSize}
        tone="red"
        inFrame={cues.title}
        outFrame={beat.endFrame}
      />
      {/* On a solid block: it sits over bright sky. */}
      <Block
        text={scene.note}
        size={EXPLAINER.noteSize}
        tone="black"
        tag
        inFrame={cues.title + EXPLAINER.staggerFrames * 2}
        outFrame={beat.endFrame}
      />
    </Stack>
  );
};

export const CycleOverlay: React.FC<{
  scene: SceneOf<"cycle">;
  beat: BeatTiming;
  cues: ExplainerCues["cycle"];
}> = ({ scene, beat, cues }) => {
  const frame = useCurrentFrame();
  // The step list leaves just before the spark figure takes its place.
  const stepsOut = cues.spark - EXPLAINER.staggerFrames;
  return (
    <>
      <Stack>
        <Block
          text={EXPLAINER_COPY.slowMotion}
          size={EXPLAINER.tagSize}
          tone="white"
          tag
          inFrame={cues.steps[0] - EXPLAINER.enterFrames}
          outFrame={stepsOut}
        />
        <div style={{ height: EXPLAINER.tagGap - EXPLAINER.blockGap }} />
        {scene.steps.map((step, i) => {
          const next = cues.steps[i + 1] ?? stepsOut;
          const current = frame >= cues.steps[i] && frame < next;
          return (
            <Block
              key={step.stroke}
              text={step.label}
              size={EXPLAINER.stepSize}
              tone={current ? "red" : "black"}
              inFrame={cues.steps[i]}
              outFrame={stepsOut}
            />
          );
        })}
      </Stack>
      <Stack>
        <Figure
          value={figureText(scene.spark)}
          unit={scene.spark.unit}
          size={EXPLAINER.sparkSize}
          unitSize={EXPLAINER.sparkUnitSize}
          inFrame={cues.spark}
          outFrame={beat.endFrame}
        />
      </Stack>
    </>
  );
};

type Point = readonly [number, number];

const samePoints = (a: (Point | null)[], b: (Point | null)[]) =>
  a.length === b.length &&
  a.every((p, i) => {
    const q = b[i];
    return p === q || (!!p && !!q && p[0] === q[0] && p[1] === q[1]);
  });

// Callout leader: a short level stub off the label, then a straight run to
// a ring on the target. Draws itself from the label outwards.
const Leader: React.FC<{
  from: Point;
  to: Point;
  inFrame: number;
  outFrame: number;
}> = ({ from, to, inFrame, outFrame }) => {
  const frame = useCurrentFrame();
  const { alive, exit } = useLife(inFrame, outFrame);
  if (!alive) {
    return null;
  }
  const start = inFrame - EXPLAINER.leadFrames;
  const draw = interpolate(
    frame,
    [start, start + EXPLAINER.leaderDrawFrames],
    [0, 1],
    { ...CLAMP, easing: EASE_OUT },
  );
  const r = EXPLAINER.leaderRingRadius;
  const a: Point = [from[0] + EXPLAINER.leaderGap, from[1]];
  const knee: Point = [a[0] + EXPLAINER.leaderKnee, from[1]];
  const dx = to[0] - knee[0];
  const dy = to[1] - knee[1];
  const d = Math.hypot(dx, dy) || 1;
  const end: Point = [to[0] - (dx / d) * r, to[1] - (dy / d) * r];
  const length = EXPLAINER.leaderKnee + Math.max(0, d - r);
  const ring = interpolate(draw, [0.75, 1], [0, 1], CLAMP);
  return (
    <svg
      width={VIDEO.width}
      height={VIDEO.height}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        opacity: 1 - exit,
        filter: EXPLAINER.leaderShadow,
      }}
    >
      <path
        d={`M ${a[0]} ${a[1]} L ${knee[0]} ${knee[1]} L ${end[0]} ${end[1]}`}
        fill="none"
        stroke={COLORS.white}
        strokeWidth={EXPLAINER.leaderWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - draw)}
      />
      <circle
        cx={to[0]}
        cy={to[1]}
        r={r * interpolate(ring, [0, 1], [0.5, 1])}
        fill="none"
        stroke={COLORS.white}
        strokeWidth={EXPLAINER.leaderWidth}
        opacity={ring}
      />
    </svg>
  );
};

export const ImpactOverlay: React.FC<{
  scene: SceneOf<"impact">;
  beat: BeatTiming;
  cues: ExplainerCues["impact"];
  anchors: PrevizAnchors;
}> = ({ scene, beat, cues, anchors }) => {
  // Causes belong to the comparison shot, effects to the dashboard shot.
  const causesOut = cues.effects[0] - EXPLAINER.staggerFrames;
  // Leaders leave before the dissolve to the dashboard begins.
  const leadersOut = causesOut - EXPLAINER.exitFrames;
  // Right end of each cause label, measured after layout. Labels only
  // change size from frame to frame, so the measure follows the frame.
  const frame = useCurrentFrame();
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  const [ends, setEnds] = useState<(Point | null)[]>([]);
  useLayoutEffect(() => {
    const next = labels.current.map((el): Point | null =>
      el && el.offsetWidth > 0
        ? [
            SAFE_AREA.x + el.offsetLeft + el.offsetWidth,
            EXPLAINER.top + el.offsetTop + el.offsetHeight / 2,
          ]
        : null,
    );
    setEnds((prev) => (samePoints(prev, next) ? prev : next));
  }, [frame]);
  return (
    <>
      <Stack>
        {scene.causes.map((cause, i) => (
          <div
            key={cause.kind}
            ref={(el) => {
              labels.current[i] = el;
            }}
            style={{ display: "flex" }}
          >
            <Block
              text={cause.label}
              size={EXPLAINER.causeSize}
              tone="black"
              inFrame={cues.causes[i]}
              outFrame={causesOut}
            />
          </div>
        ))}
      </Stack>
      {/* One leader at a time, handing over on each cause word, so the
          lines never cross. */}
      {scene.causes.map((cause, i) => {
        const from = ends[i];
        const target = anchors[cause.kind];
        if (!from || !target) {
          return null;
        }
        return (
          <Leader
            key={cause.kind}
            from={from}
            to={[target[0] * VIDEO.width, target[1] * VIDEO.height]}
            inFrame={cues.causes[i] + EXPLAINER.staggerFrames}
            outFrame={cues.causes[i + 1] ?? leadersOut}
          />
        );
      })}
      <Stack>
        {scene.effects.map((effect, i) => (
          <Block
            key={effect.kind}
            text={effect.label}
            size={EXPLAINER.effectSize}
            tone="red"
            inFrame={cues.effects[i]}
            outFrame={beat.endFrame}
          />
        ))}
      </Stack>
    </>
  );
};

const Pill: React.FC<{
  children: React.ReactNode;
  filled: boolean;
  inFrame: number;
}> = ({ children, filled, inFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < inFrame) {
    return null;
  }
  const pop = spring({ frame: frame - inFrame, fps, config: SPRINGS.pop });
  return (
    <div
      style={{
        padding: `${CTA.buttonPaddingY}px ${CTA.buttonPaddingX}px`,
        borderRadius: CTA.buttonRadius,
        backgroundColor: filled ? COLORS.red : COLORS.white,
        color: filled ? COLORS.white : COLORS.black,
        fontFamily: FONTS.body,
        fontWeight: FONT_WEIGHTS.extrabold,
        fontSize: EXPLAINER.pillSize,
        whiteSpace: "nowrap",
        opacity: Math.min(pop * 2, 1),
        transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
        transformOrigin: "0% 50%",
      }}
    >
      {children}
    </div>
  );
};

export const CtaOverlay: React.FC<{
  scene: SceneOf<"cta">;
  beat: BeatTiming;
  cues: ExplainerCues["cta"];
}> = ({ scene, beat, cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const plate = spring({
    frame: frame - beat.startFrame - EXPLAINER.staggerFrames,
    fps,
    config: SPRINGS.gentle,
  });
  return (
    <Stack top={EXPLAINER.ctaTop}>
      <div
        style={{
          width: EXPLAINER.ctaPlateWidth,
          padding: CTA.logoPlatePadding,
          borderRadius: CTA.logoPlateRadius,
          backgroundColor: COLORS.white,
          boxSizing: "border-box",
          opacity: plate,
          transform: `translateY(${(1 - plate) * 30}px)`,
        }}
      >
        <Img
          src={staticFile(BRAND_ASSETS.logo)}
          alt={SERIES_COPY.logoAlt}
          style={{ width: "100%", display: "block" }}
        />
      </div>
      <div style={{ height: EXPLAINER.ctaGap - EXPLAINER.blockGap }} />
      <Pill filled inFrame={cues.save}>
        {SERIES_COPY.save}
      </Pill>
      <Pill filled={false} inFrame={cues.follow}>
        {SERIES_COPY.follow}{" "}
        <span style={{ color: COLORS.red }}>{scene.handle}</span>
      </Pill>
    </Stack>
  );
};
