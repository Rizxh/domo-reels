import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  IFrame,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BgmTrack } from "../components/BgmTrack";
import { SceneAudio } from "../components/SceneAudio";
import { CAPTION, COLORS, VIDEO } from "../lib/brand";
import { sceneStartFrames } from "../lib/mix";
import {
  PREVIZ_LOAD_TIMEOUT_IN_MS,
  PREVIZ_PAGE,
  previzConfig,
  type PrevizConfig,
} from "../lib/previz";
import {
  estimateVoDurationInSeconds,
  sceneTimingFromVo,
  TRANSITION_DURATION_IN_FRAMES,
} from "../lib/timing";
import type { EduReelProps } from "../schema";

// API exposed by the previz page as window.__previz.
type PrevizApi = {
  ready: Promise<void>;
  enterRender: () => void;
  configure: (config: PrevizConfig) => void;
  renderAt: (seconds: number) => void;
};

// 3D version of the episode: the previz scene renders every frame from
// t = frame / fps (pure function of time), retimed to the ElevenLabs VO.
// Text overlay and captions come from the previz page itself.
export const EduReel3D: React.FC<EduReelProps> = ({
  scenes,
  bgm,
  sceneTimings,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const timings =
    sceneTimings ??
    scenes.map((scene) =>
      sceneTimingFromVo(estimateVoDurationInSeconds(scene.vo)),
    );
  const starts = sceneStartFrames(
    timings.map((t) => t.durationInFrames),
    TRANSITION_DURATION_IN_FRAMES,
  );

  const config = useMemo(
    () =>
      previzConfig(
        scenes,
        timings,
        TRANSITION_DURATION_IN_FRAMES,
        durationInFrames,
        fps,
        CAPTION.maxWordsPerPage,
      ),
    [scenes, timings, durationInFrames, fps],
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [api, setApi] = useState<PrevizApi | null>(null);
  // Each render tab loads three.js, fonts and environment maps and compiles
  // shaders before its first frame, which outlasts the default timeout.
  const [handle] = useState(() =>
    delayRender("Loading 3D previz", {
      timeoutInMilliseconds: PREVIZ_LOAD_TIMEOUT_IN_MS,
    }),
  );

  const onLoad = useCallback(() => {
    const win = iframeRef.current?.contentWindow as
      | (Window & { __previz?: PrevizApi })
      | null
      | undefined;
    const previz = win?.__previz;
    if (!previz) {
      cancelRender(new Error(`${PREVIZ_PAGE} did not expose window.__previz`));
      return;
    }
    previz.ready
      .then(() => {
        previz.enterRender();
        setApi(previz);
        continueRender(handle);
      })
      .catch((err: unknown) => cancelRender(err));
  }, [handle]);

  // Configure and draw synchronously before the frame is captured.
  useLayoutEffect(() => {
    if (api) {
      api.configure(config);
      api.renderAt(frame / fps);
    }
  }, [api, config, frame, fps]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <IFrame
        ref={iframeRef}
        src={staticFile(PREVIZ_PAGE)}
        onLoad={onLoad}
        // Four render tabs load the page, photo textures and HDRIs at once.
        delayRenderTimeoutInMilliseconds={PREVIZ_LOAD_TIMEOUT_IN_MS}
        style={{ width: VIDEO.width, height: VIDEO.height, border: 0 }}
      />
      {scenes.map((scene, index) => (
        <Sequence
          key={`${scene.type}-${index}`}
          from={starts[index]}
          durationInFrames={timings[index].durationInFrames}
          layout="none"
          name={`VO S${index + 1}`}
        >
          {/* SFX cues are timed to the 2D visuals, so the 3D cut plays VO only. */}
          <SceneAudio
            scene={{ ...scene, sfx: undefined }}
            timing={timings[index]}
          />
        </Sequence>
      ))}
      <BgmTrack src={bgm} timings={timings} />
    </AbsoluteFill>
  );
};
