import { useCurrentFrame } from "remotion";
import { ANIM } from "../lib/timing";
import { ICON } from "../lib/brand";

// Built-in line icons. Used directly for UI glyphs and as the fallback when a
// scene's Lottie file has not been added to public/lottie yet.

const VIEWBOX = 24;
const CENTER = VIEWBOX / 2;
const HOUR_HAND_RATIO = 1 / 12;

const PATHS = {
  fuel: "M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M7 8h4M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3",
  smoke:
    "M7 17h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 10.1 3.5 3.5 0 0 0 7 17zM5 21h5M13 21h6",
  thermo: "M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0zM12 9v8",
  car: "M5 17H4a1 1 0 0 1-1-1v-3l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v3a1 1 0 0 1-1 1h-1M3 13h18M9 17h6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  bookmark: "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z",
  plus: "M12 5v14M5 12h14",
  wrench:
    "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
} as const;

export type IconName = keyof typeof PATHS | "clock";

export const isIconName = (name: string): name is IconName =>
  name === "clock" || name in PATHS;

const CAR_WHEEL_RADIUS = 2;
const CAR_WHEELS = [7, 17];
const CAR_WHEEL_Y = 17;
const CLOCK_RADIUS = 9;
const CLOCK_MINUTE_HAND = 6;
const CLOCK_HOUR_HAND = 3.5;
// Hour ticks at 12, 3, 6 and 9 so the icon reads as a clock at a glance.
const CLOCK_TICK_ANGLES = [0, 90, 180, 270];
const CLOCK_TICK_OUTER = 7.5;
const CLOCK_TICK_INNER = 6.5;
const CLOCK_PIN_RADIUS = 0.6;
// Starting pose (10:10) so the hands never overlap into an arrow shape.
const CLOCK_MINUTE_START_DEG = 60;
const CLOCK_HOUR_START_DEG = 305;

const ClockHands: React.FC = () => {
  const frame = useCurrentFrame();
  const minuteTravel = frame * ANIM.clockDegreesPerFrame;
  const minute = CLOCK_MINUTE_START_DEG + minuteTravel;
  const hour = CLOCK_HOUR_START_DEG + minuteTravel * HOUR_HAND_RATIO;
  return (
    <>
      <circle cx={CENTER} cy={CENTER} r={CLOCK_RADIUS} />
      {CLOCK_TICK_ANGLES.map((angle) => (
        <line
          key={angle}
          x1={CENTER}
          y1={CENTER - CLOCK_TICK_OUTER}
          x2={CENTER}
          y2={CENTER - CLOCK_TICK_INNER}
          transform={`rotate(${angle} ${CENTER} ${CENTER})`}
        />
      ))}
      <circle cx={CENTER} cy={CENTER} r={CLOCK_PIN_RADIUS} />
      <line
        x1={CENTER}
        y1={CENTER}
        x2={CENTER}
        y2={CENTER - CLOCK_MINUTE_HAND}
        transform={`rotate(${minute} ${CENTER} ${CENTER})`}
      />
      <line
        x1={CENTER}
        y1={CENTER}
        x2={CENTER}
        y2={CENTER - CLOCK_HOUR_HAND}
        transform={`rotate(${hour} ${CENTER} ${CENTER})`}
      />
    </>
  );
};

export const Icon: React.FC<{
  name: IconName;
  size: number;
  color: string;
  strokeWidth?: number;
}> = ({ name, size, color, strokeWidth = ICON.strokeWidth }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "clock" ? <ClockHands /> : <path d={PATHS[name]} />}
      {name === "car"
        ? CAR_WHEELS.map((cx) => (
            <circle key={cx} cx={cx} cy={CAR_WHEEL_Y} r={CAR_WHEEL_RADIUS} />
          ))
        : null}
    </svg>
  );
};
