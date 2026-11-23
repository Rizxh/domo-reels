import { Composition } from "remotion";
import kolung from "../data/talking-head/ko-lung-lung.json";
import kolungTranscript from "../data/talking-head/ko-lung-lung.transcript.json";
import ep01 from "../data/episodes/ep01.json";
import ep02 from "../data/episodes/ep02.json";
import ep03 from "../data/episodes/ep03.json";
import { calculateCinemaMetadata } from "./cinema/metadata";
import { cinemaPropsSchema, type CinemaProps } from "./cinemaSchema";
import { Cinema3D } from "./compositions/Cinema3D";
import { Paper2D } from "./compositions/Paper2D";
import ep05 from "../data/episodes/ep05.json";
import { EduReel } from "./compositions/EduReel";
import { EduReel3D } from "./compositions/EduReel3D";
import { Explainer3D } from "./compositions/Explainer3D";
import { TalkingHead } from "./compositions/TalkingHead";
import ep08 from "../data/episodes/ep08.json";
import { sceneStarts, Soft2D } from "./compositions/Soft2D";
import { SoftThumb, softThumbSchema } from "./compositions/SoftThumb";
import { softPropsSchema, type SoftProps } from "./softSchema";
import ep09 from "../data/episodes/ep09.json";
import { Soft169, Soft169Thumb, soft169ThumbSchema } from "./compositions/Soft169";
import { calculateExplainerMetadata } from "./explainer/metadata";
import { explainerPropsSchema, type ExplainerProps } from "./explainerSchema";
import { PrevizFrame } from "./components/PrevizFrame";
import { EXPLAINER, VIDEO } from "./lib/brand";
import { EXPLAINER_LOOKDEV_VIEWS } from "./lib/previz";
import { calculateEduReelMetadata } from "./lib/metadata";
import { FPS, PLACEHOLDER_DURATION_IN_FRAMES } from "./lib/timing";
import { eduReelSchema, episodeSchema, type EduReelProps } from "./schema";
import { calculateTalkingHeadMetadata } from "./talking-head/metadata";
import {
  talkingHeadPropsSchema,
  type TalkingHeadProps,
} from "./talkingHeadSchema";

// Parsing here validates the episode at load time and fills schema defaults,
// so a typo in the JSON fails fast with a readable zod error.
const defaultProps: EduReelProps = {
  ...episodeSchema.parse(ep01),
  debug: true,
};

// Both cuts share props and timing: durations always come from the VO files.
const shared = {
  schema: eduReelSchema,
  defaultProps,
  calculateMetadata: calculateEduReelMetadata,
  // Replaced by calculateMetadata; required by the Composition API.
  durationInFrames: PLACEHOLDER_DURATION_IN_FRAMES,
  fps: FPS,
  width: VIDEO.width,
  height: VIDEO.height,
} as const;

// Talking-head edits: the edit JSON plus its whisper transcript.
const talkingHeadProps: TalkingHeadProps = talkingHeadPropsSchema.parse({
  ...kolung,
  words: kolungTranscript.words,
  debug: true,
});

// "Jarang Diketahui" 3D explainer (EP02 onward).
const explainerProps: ExplainerProps = explainerPropsSchema.parse({
  ...ep02,
  debug: true,
});

// Cinema format (EP03 onward): live React Three Fiber world.
const cinemaProps: CinemaProps = cinemaPropsSchema.parse({
  ...ep03,
  debug: true,
});

// Soft format (EP08 onward): calm 2D explainer.
const softProps: SoftProps = softPropsSchema.parse({ ...ep08, debug: true });

// Asset sheet: every frame is one fixed view of a set or asset.
const LOOKDEV_CONFIG = { lookdev: true } as const;
const Explainer3DLookdev: React.FC = () => (
  <PrevizFrame page={EXPLAINER.page} config={LOOKDEV_CONFIG} />
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="EduReel" component={EduReel} {...shared} />
      {/* 3D cut: the previz scene in public/previz, retimed to the VO. */}
      <Composition id="EduReel3D" component={EduReel3D} {...shared} />
      <Composition
        id="Explainer3D"
        component={Explainer3D}
        schema={explainerPropsSchema}
        defaultProps={explainerProps}
        calculateMetadata={calculateExplainerMetadata}
        durationInFrames={PLACEHOLDER_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Explainer3DLookdev"
        component={Explainer3DLookdev}
        durationInFrames={EXPLAINER_LOOKDEV_VIEWS}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Cinema3D"
        component={Cinema3D}
        schema={cinemaPropsSchema}
        defaultProps={cinemaProps}
        calculateMetadata={calculateCinemaMetadata}
        durationInFrames={PLACEHOLDER_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Paper2D"
        component={Paper2D}
        schema={cinemaPropsSchema}
        defaultProps={cinemaPropsSchema.parse({ ...ep05, debug: true })}
        calculateMetadata={calculateCinemaMetadata}
        durationInFrames={PLACEHOLDER_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      {/* "Soft" format (EP08 onward): Kok Bisa-style animated explainer with
          our own calm look; length = sum of the scene seconds (from the VO). */}
      <Composition
        id="Soft2D"
        component={Soft2D}
        schema={softPropsSchema}
        defaultProps={softProps}
        calculateMetadata={({ props }: { props: SoftProps }) => ({
          durationInFrames: Math.max(FPS, sceneStarts(props.scenes)[props.scenes.length]),
        })}
        durationInFrames={PLACEHOLDER_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="SoftThumb"
        component={SoftThumb}
        schema={softThumbSchema}
        defaultProps={softThumbSchema.parse({ world: "jalan", shot: "ab-gas", at: 0.85, title: "AIRBAG SECEPAT APA?", highlight: "APA?", hook: "Lebih cepat dari kedipan", handle: "@doktermobil" })}
        durationInFrames={1}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      {/* 16:9 soft format (EP09 onward, YouTube): kasus world, split layout. */}
      <Composition
        id="Soft169"
        component={Soft169}
        schema={softPropsSchema}
        defaultProps={softPropsSchema.parse({ ...ep09, debug: true })}
        calculateMetadata={({ props }: { props: SoftProps }) => ({
          durationInFrames: Math.max(FPS, sceneStarts(props.scenes)[props.scenes.length]),
        })}
        durationInFrames={PLACEHOLDER_DURATION_IN_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Soft169Thumb"
        component={Soft169Thumb}
        schema={soft169ThumbSchema}
        defaultProps={soft169ThumbSchema.parse({ world: "kasus", shot: "k-hook", at: 0.7, title: "RODA LEPAS SETELAH 1–2 KM", highlight: "LEPAS", hook: "Kejadian #1 · BYD Atto 1", handle: "@doktermobil" })}
        durationInFrames={1}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Talking-head cut with illustrations over the raw take. */}
      <Composition
        id="TalkingHead"
        component={TalkingHead}
        schema={talkingHeadPropsSchema}
        defaultProps={talkingHeadProps}
        calculateMetadata={calculateTalkingHeadMetadata}
        durationInFrames={PLACEHOLDER_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
