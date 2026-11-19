import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  IFrame,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VIDEO } from "../lib/brand";
import { PREVIZ_LOAD_TIMEOUT_IN_MS } from "../lib/previz";

// Screen positions of named points in the picture, as [x, y] shares of the
// frame with 0,0 at the top left.
export type PrevizAnchors = Partial<Record<string, readonly [number, number]>>;

// API every 3D page in public/previz exposes as window.__previz.
type PrevizApi<Config> = {
  ready: Promise<void>;
  enterRender: () => void;
  configure: (config: Config) => void;
  renderAt: (seconds: number) => void;
  // Optional: points callouts can aim at, for the frame at `seconds`.
  anchorsAt?: (seconds: number) => PrevizAnchors;
  // Optional: moments sound effects belong to, for the configured cues.
  soundCues?: () => PrevizSounds;
};

// A moment (seconds) a sound effect belongs to, and its relative loudness.
export type PrevizSoundCue = { t: number; gain: number };
export type PrevizSounds = Partial<Record<string, PrevizSoundCue[]>>;

const NO_ANCHORS: PrevizAnchors = {};
const NO_SOUNDS: PrevizSounds = {};

// Hosts a 3D page and draws it for the current frame. The page renders as a
// pure function of time, so every frame is reproducible.
export const PrevizFrame = <Config,>({
  page,
  config,
  children,
}: {
  // Path under public/.
  page: string;
  // Must be referentially stable between frames (memoize it).
  config: Config;
  // Drawn on top of the picture, with this frame's anchor positions and the
  // page's sound cues.
  children?: (anchors: PrevizAnchors, sounds: PrevizSounds) => React.ReactNode;
}): React.ReactElement => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [api, setApi] = useState<PrevizApi<Config> | null>(null);
  const [anchors, setAnchors] = useState<PrevizAnchors>(NO_ANCHORS);
  const [sounds, setSounds] = useState<PrevizSounds>(NO_SOUNDS);
  const soundsFor = useRef<Config | null>(null);
  // Each render tab loads three.js, textures and HDRIs and compiles shaders
  // before its first frame, which outlasts the default timeout.
  const [handle] = useState(() =>
    delayRender(`Loading ${page}`, {
      timeoutInMilliseconds: PREVIZ_LOAD_TIMEOUT_IN_MS,
    }),
  );

  const onLoad = useCallback(() => {
    const win = iframeRef.current?.contentWindow as
      | (Window & { __previz?: PrevizApi<Config> })
      | null
      | undefined;
    const previz = win?.__previz;
    if (!previz) {
      cancelRender(new Error(`${page} did not expose window.__previz`));
      return;
    }
    previz.ready
      .then(() => {
        previz.enterRender();
        setApi(previz);
        continueRender(handle);
      })
      .catch((err: unknown) => cancelRender(err));
  }, [handle, page]);

  // Configure and draw synchronously before the frame is captured.
  useLayoutEffect(() => {
    if (api) {
      api.configure(config);
      // Sound cues depend only on the configuration: read them once per change.
      if (soundsFor.current !== config) {
        soundsFor.current = config;
        setSounds(api.soundCues?.() ?? NO_SOUNDS);
      }
      api.renderAt(frame / fps);
      // Read after drawing; the state update re-renders before capture.
      setAnchors(api.anchorsAt?.(frame / fps) ?? NO_ANCHORS);
    }
  }, [api, config, frame, fps]);

  return (
    <>
      <IFrame
        ref={iframeRef}
        src={staticFile(page)}
        onLoad={onLoad}
        delayRenderTimeoutInMilliseconds={PREVIZ_LOAD_TIMEOUT_IN_MS}
        style={{ width: VIDEO.width, height: VIDEO.height, border: 0 }}
      />
      {children?.(anchors, sounds)}
    </>
  );
};
