import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  COLORS,
  FONT_WEIGHTS,
  FONTS,
  LINE_HEIGHT,
  PRICE_TAG,
  TINTS,
} from "../../lib/brand";
import { TALKING_HEAD_SPRINGS, TALKING_HEAD_TIMING } from "../../lib/timing";
import type { Window } from "../timeline";

// Outline of a shop price tag: pointed nose on the left (with the string
// hole), rounded corners on the right.
const tagPath = (w: number, h: number, nose: number, r: number): string =>
  [
    `M ${nose} 0`,
    `L ${w - r} 0`,
    `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `L ${nose} ${h}`,
    `L 0 ${h / 2}`,
    "Z",
  ].join(" ");

// A red tag slides in on its string and swings to rest around the hole,
// like it was just hung. Digits roll up one after another.
export const PriceTag: React.FC<
  Window & { currency: string; amount: string; unit: string; caption: string }
> = ({ currency, amount, unit, caption, startFrame, endFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { staggerFrames, exitFrames } = TALKING_HEAD_TIMING;
  const t = frame - startFrame;

  const slide = spring({ frame: t, fps, config: TALKING_HEAD_SPRINGS.slide });
  const swing = spring({ frame: t, fps, config: TALKING_HEAD_SPRINGS.swing });
  const exit = interpolate(frame, [endFrame - exitFrames, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const { width: w, height: h, noseWidth: nose } = PRICE_TAG;
  const holeX = nose * 0.55;
  const rotation =
    interpolate(swing, [0, 1], [PRICE_TAG.swingFromDeg, PRICE_TAG.restDeg]) +
    exit * PRICE_TAG.swingFromDeg * -0.5;
  const x = interpolate(slide, [0, 1], [PRICE_TAG.slideFromPx, 0]);

  const digit = (char: string, i: number) => {
    const p = interpolate(
      t,
      [6 + i * staggerFrames, 6 + i * staggerFrames + 10],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      },
    );
    return (
      <span
        key={`${char}-${i}`}
        style={{ display: "inline-block", overflow: "hidden" }}
      >
        <span
          style={{
            display: "inline-block",
            transform: `translateY(${p * 105}%)`,
          }}
        >
          {char}
        </span>
      </span>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: PRICE_TAG.left,
        top: PRICE_TAG.top,
        width: w,
        height: h,
        opacity: 1 - exit,
        transform: `translateX(${x}px) translateY(${exit * 60}px) rotate(${rotation}deg)`,
        transformOrigin: `${holeX}px ${h / 2}px`,
        filter: "drop-shadow(0 26px 40px rgba(0, 0, 0, 0.35))",
      }}
    >
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <path d={tagPath(w, h, nose, PRICE_TAG.radius)} fill={COLORS.red} />
        {/* Stitched inner border, like a printed card tag. */}
        <path
          d={tagPath(w - 28, h - 28, nose - 8, PRICE_TAG.radius - 10)}
          transform="translate(14 14)"
          fill="none"
          stroke={TINTS.whiteMuted}
          strokeWidth={3}
          strokeDasharray="10 9"
        />
        <circle
          cx={holeX}
          cy={h / 2}
          r={PRICE_TAG.holeRadius}
          fill={COLORS.black}
          stroke={COLORS.white}
          strokeWidth={5}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: nose + 26,
          right: 40,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: COLORS.white,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            whiteSpace: "nowrap",
            fontFamily: FONTS.headline,
            lineHeight: LINE_HEIGHT.tight,
          }}
        >
          <span style={{ fontSize: PRICE_TAG.currencySize, marginTop: 30 }}>
            {currency}
          </span>
          <span style={{ fontSize: PRICE_TAG.amountSize, marginLeft: 6 }}>
            {amount.split("").map(digit)}
          </span>
          <span
            style={{
              fontSize: PRICE_TAG.unitSize,
              alignSelf: "flex-end",
              marginBottom: 34,
              marginLeft: 14,
            }}
          >
            {digit(unit, amount.length)}
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: FONT_WEIGHTS.semibold,
            fontSize: PRICE_TAG.captionSize,
            marginTop: -18,
            opacity: interpolate(t, [16, 26], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  );
};
