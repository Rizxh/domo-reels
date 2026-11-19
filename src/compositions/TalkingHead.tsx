import { useMemo } from "react";
import {
  AbsoluteFill,
  getRemotionEnvironment,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caption } from "../components/Caption";
import { SafeZone } from "../components/SafeZone";
import { COLORS } from "../lib/brand";
import { TALKING_HEAD_TIMING } from "../lib/timing";
import { EndCard } from "../talking-head/illustrations/EndCard";
import { BenefitCards } from "../talking-head/illustrations/BenefitCards";
import { EngineBoard } from "../talking-head/illustrations/EngineBoard";
import { LinkCue } from "../talking-head/illustrations/LinkCue";
import { PriceTag } from "../talking-head/illustrations/PriceTag";
import { TitleBlocks } from "../talking-head/illustrations/TitleBlocks";
import { SpeakerTrack } from "../talking-head/SpeakerTrack";
import {
  buildTalkingHeadTimeline,
  type PlacedIllustration,
  presence,
} from "../talking-head/timeline";
import { sourceToOutputFrameClamped } from "../lib/cuts";
import type { TalkingHeadProps } from "../talkingHeadSchema";

const IllustrationView: React.FC<{
  item: PlacedIllustration;
  toFrame: (seconds: number) => number;
}> = ({ item, toFrame }) => {
  const window = { startFrame: item.startFrame, endFrame: item.endFrame };
  switch (item.kind) {
    case "title":
      return (
        <TitleBlocks {...window} lines={item.lines} highlight={item.highlight} />
      );
    case "price":
      return (
        <PriceTag
          {...window}
          currency={item.currency}
          amount={item.amount}
          unit={item.unit}
          caption={item.caption}
        />
      );
    case "benefits":
      return (
        <BenefitCards
          {...window}
          items={item.items.map((b) => ({ ...b, frame: toFrame(b.at) }))}
        />
      );
    case "engine":
      return (
        <EngineBoard
          {...window}
          eyebrow={item.eyebrow}
          heading={item.heading}
          parts={item.parts.map((p) => ({
            part: p.part,
            label: p.label,
            note: p.note,
            spokenFrame: toFrame(p.at),
          }))}
          summaryTitle={item.summaryTitle}
          summary={item.summary}
        />
      );
    case "link":
      return <LinkCue {...window} label={item.label} />;
    case "endCard":
      return (
        <EndCard
          {...window}
          tagline={item.tagline}
          taglineFrame={toFrame(item.taglineAt)}
        />
      );
  }
};

// Talking-head explainer: the raw take trimmed to its strongest lines,
// punch-ins on the face, word-by-word captions, illustrations over the key
// beats and a split-screen board for the step-by-step part.
// Captions step aside whenever an illustration carries the words on screen.
export const TalkingHead: React.FC<TalkingHeadProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useMemo(
    () => buildTalkingHeadTimeline(props, fps),
    [props, fps],
  );
  const toFrame = (s: number) =>
    sourceToOutputFrameClamped(s, timeline.clips, fps);

  const active = (item: PlacedIllustration) =>
    frame >= item.startFrame && frame < item.endFrame;
  // The explainer board pushes the speaker into the lower panel.
  const split = Math.max(
    0,
    ...timeline.illustrations
      .filter((i) => i.kind === "engine")
      .map((i) =>
        presence(
          frame,
          i,
          TALKING_HEAD_TIMING.splitFrames,
          TALKING_HEAD_TIMING.splitFrames,
        ),
      ),
  );
  const captionCover = Math.max(
    0,
    ...timeline.illustrations.map((i) =>
      presence(
        frame,
        i,
        TALKING_HEAD_TIMING.captionFadeFrames,
        TALKING_HEAD_TIMING.captionFadeFrames,
      ),
    ),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <SpeakerTrack
        src={props.source}
        clips={timeline.clips}
        framing={timeline.framing}
        split={split}
      />
      <AbsoluteFill
        style={{
          opacity: interpolate(captionCover, [0, 1], [1, 0]),
        }}
      >
        <Caption words={timeline.words} highlight={props.captionHighlight} />
      </AbsoluteFill>
      {timeline.illustrations.filter(active).map((item) => (
        <IllustrationView
          key={`${item.kind}-${item.from}`}
          item={item}
          toFrame={toFrame}
        />
      ))}
      {props.debug && getRemotionEnvironment().isStudio ? <SafeZone /> : null}
    </AbsoluteFill>
  );
};
