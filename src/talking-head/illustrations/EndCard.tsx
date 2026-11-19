import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRAND_ASSETS,
  COLORS,
  CTA,
  END_CARD,
  FONTS,
  LETTER_SPACING,
  LINE_HEIGHT,
  SAFE_AREA,
  SERIES_COPY,
  TALKING_HEAD,
} from "../../lib/brand";
import { SPRINGS, TALKING_HEAD_SPRINGS } from "../../lib/timing";
import type { Window } from "../timeline";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

// Dark wash rises over the shirt, the logo plate settles in, and the tagline
// lands with a hand-drawn check the moment it is spoken.
export const EndCard: React.FC<
  Window & { tagline: string; taglineFrame: number }
> = ({ tagline, taglineFrame, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - startFrame;

  const wash = interpolate(t, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const plate = spring({ frame: t - 4, fps, config: TALKING_HEAD_SPRINGS.card });
  const land = spring({ frame: frame - taglineFrame, fps, config: SPRINGS.slam });
  const check = interpolate(frame - taglineFrame - 4, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const s = END_CARD.checkSize;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: TALKING_HEAD.endScrimTop,
          bottom: 0,
          background: TALKING_HEAD.endScrim,
          opacity: wash,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.x,
          width: SAFE_AREA.width,
          top: END_CARD.plateTop,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: END_CARD.taglineGap,
        }}
      >
        <div
          style={{
            width: END_CARD.plateWidth,
            padding: CTA.logoPlatePadding,
            borderRadius: CTA.logoPlateRadius,
            backgroundColor: COLORS.white,
            boxSizing: "border-box",
            opacity: Math.min(plate * 1.5, 1),
            transform: `translateY(${(1 - plate) * 60}px)`,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Img
            src={staticFile(BRAND_ASSETS.logo)}
            alt={SERIES_COPY.logoAlt}
            style={{ width: "100%", display: "block" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: END_CARD.taglineGap / 2,
            opacity: frame >= taglineFrame ? Math.min(land * 2, 1) : 0,
            transform: `scale(${interpolate(land, [0, 1], [1.5, 1])})`,
          }}
        >
          <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
            {/* Bare drawn check, no badge circle behind it. */}
            <path
              d="M 14 54 L 38 78 L 88 22"
              stroke={COLORS.red}
              strokeWidth={END_CARD.checkStroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - check}
            />
          </svg>
          <div
            style={{
              fontFamily: FONTS.headline,
              fontSize: END_CARD.taglineSize,
              lineHeight: LINE_HEIGHT.tight,
              letterSpacing: LETTER_SPACING.headline,
              color: COLORS.white,
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    </>
  );
};
