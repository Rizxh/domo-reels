import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BOARD, TALKING_HEAD } from "../lib/brand";
import type { CutClip } from "../lib/cuts";
import { TALKING_HEAD_TIMING } from "../lib/timing";
import { type FramingFrame, zoomAt } from "./timeline";

// The raw take, cut down to the kept clips and played back to back. Framing
// (punch-in) applies to all clips at once. `split` (0..1) moves the speaker
// into the lower panel under the explainer board.
export const SpeakerTrack: React.FC<{
  src: string;
  clips: CutClip[];
  framing: FramingFrame[];
  split: number;
}> = ({ src, clips, framing, split }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const fade = TALKING_HEAD_TIMING.cutAudioFadeFrames;

  const faceX = width * TALKING_HEAD.faceOriginX;
  const faceY = height * TALKING_HEAD.faceOriginY;
  const scale = interpolate(
    split,
    [0, 1],
    [zoomAt(frame, framing), BOARD.speakerScale],
  );
  const dy = (BOARD.faceTargetY - faceY) * split;

  return (
    <AbsoluteFill style={{ clipPath: `inset(${BOARD.height * split}px 0 0 0)` }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${dy}px) scale(${scale})`,
          transformOrigin: `${faceX}px ${faceY}px`,
        }}
      >
        {clips.map((clip, i) => (
          <Sequence
            key={`${clip.from}-${clip.to}`}
            from={clip.startFrame}
            durationInFrames={clip.durationInFrames}
            premountFor={fps}
            name={`Clip ${i + 1}`}
          >
            <Video
              src={staticFile(src)}
              trimBefore={clip.trimBefore}
              trimAfter={clip.trimAfter}
              // Micro fades on both sides of every cut stop clicks.
              volume={(f) =>
                Math.min(
                  interpolate(f, [0, fade], [i === 0 ? 1 : 0, 1], {
                    extrapolateRight: "clamp",
                  }),
                  interpolate(
                    f,
                    [clip.durationInFrames - fade, clip.durationInFrames],
                    [1, 0],
                    { extrapolateLeft: "clamp" },
                  ),
                )
              }
              objectFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </Sequence>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
