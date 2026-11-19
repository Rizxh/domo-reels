import { Easing, interpolate, useCurrentFrame } from "remotion";
import {
  COLORS,
  FONTS,
  LETTER_SPACING,
  LINE_HEIGHT,
  SAFE_AREA,
  TITLE_BLOCKS,
} from "../../lib/brand";
import { highlightMask } from "../../lib/text";
import { TALKING_HEAD_TIMING } from "../../lib/timing";
import type { Window } from "../timeline";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

// Stacked label blocks, like printed tape: each block wipes open from the
// left, its word rises inside it, and on exit the blocks wipe off to the
// right in the same order.
export const TitleBlocks: React.FC<
  Window & { lines: string[]; highlight: string[] }
> = ({ lines, highlight, startFrame, endFrame }) => {
  const frame = useCurrentFrame();
  const { enterFrames, exitFrames, staggerFrames } = TALKING_HEAD_TIMING;
  const red = highlightMask(lines, highlight);

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        top: TITLE_BLOCKS.top,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: TITLE_BLOCKS.lineGap,
      }}
    >
      {lines.map((line, i) => {
        const delay = i * staggerFrames;
        const open = interpolate(
          frame,
          [startFrame + delay, startFrame + delay + enterFrames],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          },
        );
        const rise = interpolate(
          frame,
          [startFrame + delay + 2, startFrame + delay + enterFrames + 2],
          [TITLE_BLOCKS.riseShare, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          },
        );
        const exitStart = endFrame - exitFrames - (lines.length - 1 - i) * 2;
        const close = interpolate(
          frame,
          [exitStart, exitStart + exitFrames],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_IN,
          },
        );
        return (
          <div
            key={`${line}-${i}`}
            style={{
              backgroundColor: red[i] ? COLORS.red : COLORS.black,
              padding: `${TITLE_BLOCKS.paddingY}px ${TITLE_BLOCKS.paddingX}px`,
              overflow: "hidden",
              clipPath: `inset(0 ${(1 - open) * 100}% 0 ${close * 100}%)`,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.headline,
                fontSize: TITLE_BLOCKS.fontSize,
                lineHeight: LINE_HEIGHT.tight,
                letterSpacing: LETTER_SPACING.headline,
                color: COLORS.white,
                transform: `translateY(${rise * 100}%)`,
              }}
            >
              {line}
            </div>
          </div>
        );
      })}
    </div>
  );
};
