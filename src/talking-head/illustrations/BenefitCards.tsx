import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BENEFIT_CARDS,
  COLORS,
  FONTS,
  LETTER_SPACING,
  LINE_HEIGHT,
  SAFE_AREA,
} from "../../lib/brand";
import { SPRINGS, TALKING_HEAD_TIMING } from "../../lib/timing";
import type { BenefitIcon } from "../../talkingHeadSchema";
import type { Window } from "../timeline";

const S = BENEFIT_CARDS;

// Stopwatch: the hand sweeps a full turn and a red arc fills behind it.
const Stopwatch: React.FC<{ t: number }> = ({ t }) => {
  const sweep = interpolate(t, [4, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const r = 72;
  return (
    <svg viewBox="0 0 220 220" width={S.art} height={S.art} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Speed lines trailing on the left. */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={18}
          x2={18 + 34 * interpolate(t, [i * 3, i * 3 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          y1={98 + i * 26}
          y2={98 + i * 26}
          stroke={COLORS.black}
          strokeWidth={S.stroke - 2}
        />
      ))}
      <circle cx={124} cy={126} r={r} stroke={COLORS.black} strokeWidth={S.stroke} />
      <circle
        cx={124}
        cy={126}
        r={r - 20}
        stroke={COLORS.red}
        strokeWidth={22}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - sweep}
        transform="rotate(-90 124 126)"
        opacity={0.9}
      />
      <rect x={110} y={30} width={28} height={16} rx={4} fill={COLORS.black} />
      <line x1={124} y1={46} x2={124} y2={54} stroke={COLORS.black} strokeWidth={S.stroke} />
      <line x1={178} y1={66} x2={188} y2={56} stroke={COLORS.black} strokeWidth={S.stroke} />
      <line
        x1={124}
        y1={126}
        x2={124}
        y2={70}
        stroke={COLORS.black}
        strokeWidth={S.stroke}
        transform={`rotate(${sweep * 360} 124 126)`}
      />
      <circle cx={124} cy={126} r={9} fill={COLORS.black} />
    </svg>
  );
};

// Wallet: coins drop in one after another and settle on the stack.
const Wallet: React.FC<{ t: number; fps: number }> = ({ t, fps }) => (
  <svg viewBox="0 0 220 220" width={S.art} height={S.art} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x={22} y={92} width={150} height={100} rx={18} stroke={COLORS.black} strokeWidth={S.stroke} fill={COLORS.white} />
    <path d="M 22 118 L 150 118" stroke={COLORS.black} strokeWidth={S.stroke - 3} />
    <rect x={128} y={130} width={50} height={36} rx={10} stroke={COLORS.black} strokeWidth={S.stroke} fill={COLORS.white} />
    <circle cx={146} cy={148} r={6} fill={COLORS.black} />
    {[0, 1, 2].map((i) => {
      const drop = spring({ frame: t - 6 - i * 5, fps, config: SPRINGS.pop });
      const y = 70 - i * 18;
      return (
        <g key={i} transform={`translate(0 ${(1 - drop) * -90})`} opacity={Math.min(drop * 2, 1)}>
          <ellipse cx={180} cy={y + 10} rx={30} ry={11} fill={COLORS.red} stroke={COLORS.black} strokeWidth={S.stroke - 4} />
          <rect x={150} y={y} width={60} height={10} fill={COLORS.red} />
          <ellipse cx={180} cy={y} rx={30} ry={11} fill={COLORS.red} stroke={COLORS.black} strokeWidth={S.stroke - 4} />
        </g>
      );
    })}
  </svg>
);

// Two white cards with drawn illustrations, each popping in on its word.
export const BenefitCards: React.FC<
  Window & { items: { icon: BenefitIcon; label: string; frame: number }[] }
> = ({ items, endFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(
    frame,
    [endFrame - TALKING_HEAD_TIMING.exitFrames, endFrame],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );
  const total = items.length * S.width + (items.length - 1) * S.gap;

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x + (SAFE_AREA.width - total) / 2,
        top: S.top,
        display: "flex",
        gap: S.gap,
      }}
    >
      {items.map((item, i) => {
        const t = frame - item.frame;
        const pop = spring({ frame: t, fps, config: SPRINGS.pop });
        return (
          <div
            key={item.label}
            style={{
              width: S.width,
              height: S.height,
              borderRadius: S.radius,
              backgroundColor: COLORS.white,
              boxShadow: S.shadow,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              opacity: (t < 0 ? 0 : Math.min(pop * 2, 1)) * (1 - exit),
              transform: `translateY(${(1 - pop) * 60 + exit * 40}px) rotate(${(i === 0 ? -2 : 2) * pop}deg) scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
            }}
          >
            {item.icon === "stopwatch" ? <Stopwatch t={t} /> : <Wallet t={t} fps={fps} />}
            <div
              style={{
                fontFamily: FONTS.headline,
                fontSize: S.labelSize,
                lineHeight: LINE_HEIGHT.tight,
                letterSpacing: LETTER_SPACING.headline,
                color: i === 0 ? COLORS.black : COLORS.red,
              }}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
