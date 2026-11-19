import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { hasStaticFile } from "../lib/assets";
import { BACKGROUND, TINTS, VIDEO } from "../lib/brand";

type Zoom = { from: number; to: number; durationInFrames: number };

// Dimmed, slightly blurred workshop footage. When the clip is not in public/
// yet, falls back to a dark gradient with subtle film grain.
export const BgFootage: React.FC<{
  src?: string;
  durationInFrames: number;
  zoom?: Zoom;
}> = ({ src, durationInFrames, zoom }) => {
  const frame = useCurrentFrame();
  const {
    from,
    to,
    durationInFrames: zoomDuration,
  } = zoom ?? {
    from: 1,
    to: BACKGROUND.footageZoomTo,
    durationInFrames,
  };
  const scale = interpolate(frame, [0, zoomDuration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hasFootage = src !== undefined && hasStaticFile(src);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {hasFootage ? (
          <OffthreadVideo
            src={staticFile(src)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `blur(${BACKGROUND.footageBlurPx}px)`,
            }}
          />
        ) : (
          <AbsoluteFill style={{ background: BACKGROUND.gradient }} />
        )}
      </AbsoluteFill>
      {hasFootage ? (
        <AbsoluteFill
          style={{
            backgroundColor: TINTS.blackDim,
            opacity: BACKGROUND.footageDim,
          }}
        />
      ) : (
        <Grain />
      )}
    </AbsoluteFill>
  );
};

// Deterministic grain: cycles through a fixed set of turbulence seeds by frame.
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % BACKGROUND.grainVariants;
  const filterId = `grain-${seed}`;
  return (
    <AbsoluteFill
      style={{ opacity: BACKGROUND.grainOpacity, mixBlendMode: "screen" }}
    >
      <svg width={VIDEO.width} height={VIDEO.height}>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={BACKGROUND.grainBaseFrequency}
            numOctaves={BACKGROUND.grainOctaves}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
    </AbsoluteFill>
  );
};
