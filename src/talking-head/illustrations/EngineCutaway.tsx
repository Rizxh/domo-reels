import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, ENGINE_CARD, FONT_WEIGHTS, FONTS } from "../../lib/brand";
import { TALKING_HEAD_TIMING } from "../../lib/timing";
import type { EnginePart } from "../../talkingHeadSchema";

// Geometry of the single-cylinder cutaway, in viewBox units (800 x 430).
const G = {
  intakeY: 120,
  pipeHalf: 24,
  intakeStartX: 16,
  throttleX: 132,
  throttleHalf: 40,
  headLeft: 290,
  headRight: 510,
  headTop: 66,
  headBottom: 150,
  boreLeft: 322,
  boreRight: 478,
  boreBottom: 330,
  pistonInset: 5,
  pistonHeight: 62,
  plugX: 400,
  crankX: 400,
  crankY: 378,
  crankRadius: 44,
  crankWeb: 58,
  rodLength: 140,
  // Wrist pin sits this far below the piston crown.
  pinDrop: 38,
  catLeft: 572,
  catRight: 772,
  catTop: 292,
  catBottom: 362,
  exhaustTurnX: 672,
} as const;

// Label positions (viewBox units). Labels stay left of x = 665 so they sit
// inside the Reel safe area once the drawing is scaled onto the board.
const LABELS: Record<
  EnginePart,
  { at: [number, number]; align: "start" | "end" }
> = {
  intake: { at: [180, 44], align: "start" },
  throttle: { at: [60, 214], align: "start" },
  sparkPlug: { at: [440, 26], align: "start" },
  piston: { at: [272, 292], align: "end" },
  catalytic: { at: [520, 414], align: "start" },
};

export type PartPhase = {
  part: EnginePart;
  label: string;
  // Frame the part becomes active (turns red, gets its label).
  frame: number;
};

const intakePath = `M ${G.intakeStartX} ${G.intakeY} L ${G.headLeft + 30} ${G.intakeY}`;
const exhaustPath = `M ${G.headRight - 30} ${G.intakeY - 6} L ${G.exhaustTurnX - 40} ${G.intakeY - 6} Q ${G.exhaustTurnX} ${G.intakeY - 6} ${G.exhaustTurnX} ${G.intakeY + 34} L ${G.exhaustTurnX} ${G.catTop}`;
const catMidY = (G.catTop + G.catBottom) / 2;
const tailPath = `M ${G.catRight} ${catMidY} L 800 ${catMidY}`;

// Piston crown height for a crank angle (true slider-crank motion, so the
// piston dwells at the top and bottom like a real engine).
const pistonTop = (angle: number): number => {
  const r = G.crankRadius;
  const pinY =
    G.crankY -
    (r * Math.cos(angle) +
      Math.sqrt(G.rodLength ** 2 - (r * Math.sin(angle)) ** 2));
  return pinY - G.pinDrop;
};

// Line-art cutaway: intake with throttle butterfly, cylinder with a moving
// piston and firing plug, exhaust into the catalytic converter. Parts turn
// red when they become active; the focused one carries a pulse ring.
export const EngineCutaway: React.FC<{
  width: number;
  startFrame: number;
  parts: PartPhase[];
  focus: EnginePart | null;
}> = ({ width, startFrame, parts, focus }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = TALKING_HEAD_TIMING;
  const C = ENGINE_CARD;

  const draw = interpolate(frame - startFrame, [6, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const angle = (frame / fps) * T.crankRevsPerSecond * Math.PI * 2;
  const crown = pistonTop(angle);
  const pinX = G.crankX + G.crankRadius * Math.sin(angle);
  const pinY = G.crankY - G.crankRadius * Math.cos(angle);
  const firing = Math.cos(angle) > 0.93 ? 1 : 0;
  const butterfly = 50 + 28 * Math.sin(angle * 0.5);
  const flow = (frame / fps) * T.flowDashesPerSecond;

  const on = (part: EnginePart) => {
    const p = parts.find((x) => x.part === part);
    return p
      ? interpolate(frame - p.frame, [0, 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  };
  const pulse = (part: EnginePart) => {
    const p = parts.find((x) => x.part === part);
    if (!p || focus !== part) {
      return 0;
    }
    return interpolate(frame - p.frame, [0, 4, T.partPulseFrames * 1.5], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };
  const stroke = (part: EnginePart) => (on(part) > 0.5 ? COLORS.red : C.line);
  const fill = (part: EnginePart, idle: string) =>
    on(part) > 0.5 ? C.redFill : idle;
  const drawn = {
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - draw,
  };
  // Parts not in focus dim slightly so the eye goes to the current one.
  const dim = (part: EnginePart) =>
    focus === null || focus === part ? 1 : on(part) > 0.5 ? 0.75 : 0.55;

  const pistonLeft = G.boreLeft + G.pistonInset;
  const pistonWidth = G.boreRight - G.boreLeft - G.pistonInset * 2;

  const anchors: Record<EnginePart, [number, number]> = {
    intake: [G.headLeft - 70, G.intakeY - G.pipeHalf],
    throttle: [G.throttleX, G.intakeY + G.throttleHalf],
    sparkPlug: [G.plugX + 11, G.headTop - 32],
    piston: [pistonLeft, crown + 5],
    catalytic: [G.catLeft + 40, G.catBottom],
  };
  const pulseAt: Record<EnginePart, [number, number]> = {
    intake: [G.headLeft - 70, G.intakeY],
    throttle: [G.throttleX, G.intakeY],
    sparkPlug: [G.plugX, G.headTop - 30],
    piston: [G.plugX, crown + 4],
    catalytic: [(G.catLeft + G.catRight) / 2, catMidY],
  };

  return (
    <svg
      viewBox={`0 0 ${C.viewWidth} ${C.viewHeight}`}
      width={width}
      height={(width / C.viewWidth) * C.viewHeight}
      style={{ overflow: "visible", display: "block" }}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Airflow dashes travel through intake and exhaust. */}
      <path
        d={intakePath}
        stroke={C.lineDim}
        strokeWidth={C.stroke}
        strokeDasharray="6 16"
        strokeDashoffset={-flow * 22}
        opacity={draw}
      />
      <path
        d={`${exhaustPath} M ${G.catLeft + 20} ${catMidY} L 800 ${catMidY}`}
        stroke={C.lineDim}
        strokeWidth={C.stroke}
        strokeDasharray="6 16"
        strokeDashoffset={-flow * 22}
        opacity={draw}
      />

      {/* Intake runner. */}
      <g stroke={stroke("intake")} strokeWidth={C.strokeBold} opacity={dim("intake")}>
        <rect
          x={G.throttleX + 34}
          y={G.intakeY - G.pipeHalf}
          width={G.headLeft - G.throttleX - 34}
          height={G.pipeHalf * 2}
          fill={C.redFill}
          stroke="none"
          opacity={on("intake")}
        />
        <path
          d={`M ${G.intakeStartX} ${G.intakeY - G.pipeHalf} L ${G.headLeft} ${G.intakeY - G.pipeHalf} M ${G.intakeStartX} ${G.intakeY + G.pipeHalf} L ${G.headLeft} ${G.intakeY + G.pipeHalf}`}
          {...drawn}
        />
      </g>

      {/* Throttle body and butterfly plate. */}
      <g stroke={stroke("throttle")} strokeWidth={C.strokeBold} opacity={dim("throttle")}>
        <rect
          x={G.throttleX - 26}
          y={G.intakeY - G.throttleHalf}
          width={52}
          height={G.throttleHalf * 2}
          rx={10}
          fill={fill("throttle", C.fill)}
          {...drawn}
        />
        <line
          x1={G.throttleX}
          y1={G.intakeY - G.pipeHalf + 4}
          x2={G.throttleX}
          y2={G.intakeY + G.pipeHalf - 4}
          transform={`rotate(${butterfly} ${G.throttleX} ${G.intakeY})`}
          opacity={draw}
        />
      </g>

      {/* Cylinder head, chamber roof, bore. */}
      <g opacity={dim("piston") === 1 || dim("sparkPlug") === 1 ? 1 : 0.7}>
        <path
          d={`M ${G.headLeft} ${G.headBottom} L ${G.headLeft} ${G.headTop + 20} Q ${G.headLeft} ${G.headTop} ${G.headLeft + 20} ${G.headTop} L ${G.headRight - 20} ${G.headTop} Q ${G.headRight} ${G.headTop} ${G.headRight} ${G.headTop + 20} L ${G.headRight} ${G.headBottom}`}
          stroke={C.line}
          strokeWidth={C.strokeBold}
          {...drawn}
        />
        <path
          d={`M ${G.boreLeft} ${G.headBottom} Q ${G.plugX} ${G.headBottom - 40} ${G.boreRight} ${G.headBottom}`}
          stroke={C.lineDim}
          strokeWidth={C.stroke}
          {...drawn}
        />
        <path
          d={`M ${G.boreLeft} ${G.headBottom} L ${G.boreLeft} ${G.boreBottom} M ${G.boreRight} ${G.headBottom} L ${G.boreRight} ${G.boreBottom}`}
          stroke={C.line}
          strokeWidth={C.strokeBold}
          {...drawn}
        />
      </g>

      {/* Spark plug and spark at top dead centre. */}
      <g stroke={stroke("sparkPlug")} strokeWidth={C.stroke} opacity={draw * dim("sparkPlug")}>
        <rect x={G.plugX - 7} y={G.headTop - 62} width={14} height={16} rx={3} fill={C.fill} />
        <rect x={G.plugX - 11} y={G.headTop - 46} width={22} height={28} rx={4} fill={fill("sparkPlug", C.fill)} />
        <path d={`M ${G.plugX - 17} ${G.headTop - 18} h 34 v 18 h -34 z`} fill={fill("sparkPlug", C.fill)} />
        <line x1={G.plugX} y1={G.headTop} x2={G.plugX} y2={G.headBottom - 22} strokeWidth={C.strokeBold} />
      </g>
      <g
        stroke={COLORS.white}
        strokeWidth={C.stroke}
        opacity={firing * draw}
        transform={`translate(${G.plugX} ${G.headBottom - 16})`}
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line key={deg} x1={0} y1={6} x2={0} y2={16} transform={`rotate(${deg})`} />
        ))}
      </g>

      {/* Crank, connecting rod, piston. */}
      <g opacity={draw * dim("piston")}>
        <circle cx={G.crankX} cy={G.crankY} r={G.crankWeb} stroke={C.lineDim} strokeWidth={C.stroke} />
        <line x1={G.crankX} y1={G.crankY} x2={pinX} y2={pinY} stroke={C.lineDim} strokeWidth={C.strokeBold * 2} />
        <line x1={pinX} y1={pinY} x2={G.plugX} y2={crown + G.pinDrop} stroke={C.line} strokeWidth={C.strokeBold * 1.6} />
        <circle cx={pinX} cy={pinY} r={7} fill={C.line} />
        <rect
          x={pistonLeft}
          y={crown}
          width={pistonWidth}
          height={G.pistonHeight}
          rx={6}
          fill={C.fill}
          stroke={C.line}
          strokeWidth={C.strokeBold}
        />
        <line x1={pistonLeft + 8} y1={crown + 16} x2={pistonLeft + pistonWidth - 8} y2={crown + 16} stroke={C.lineDim} strokeWidth={C.stroke} />
        <line x1={pistonLeft + 8} y1={crown + 26} x2={pistonLeft + pistonWidth - 8} y2={crown + 26} stroke={C.lineDim} strokeWidth={C.stroke} />
        <circle cx={G.plugX} cy={crown + G.pinDrop} r={8} stroke={C.line} strokeWidth={C.stroke} />
        <rect x={pistonLeft} y={crown} width={pistonWidth} height={10} rx={4} fill={COLORS.red} opacity={on("piston")} />
      </g>

      {/* Exhaust into the catalytic converter. */}
      <g opacity={dim("catalytic")}>
        <path d={exhaustPath} stroke={C.line} strokeWidth={G.pipeHalf * 2} strokeOpacity={0.12} opacity={draw} />
        <path d={exhaustPath} stroke={C.line} strokeWidth={C.strokeBold} {...drawn} />
        <path d={tailPath} stroke={C.line} strokeWidth={C.strokeBold} {...drawn} />
        <g stroke={stroke("catalytic")} strokeWidth={C.strokeBold}>
          <rect
            x={G.catLeft}
            y={G.catTop}
            width={G.catRight - G.catLeft}
            height={G.catBottom - G.catTop}
            rx={26}
            fill={fill("catalytic", C.fill)}
            {...drawn}
          />
          {Array.from({ length: 9 }, (_, i) => G.catLeft + 36 + i * 16).map((x) => (
            <line key={x} x1={x} y1={G.catTop + 14} x2={x} y2={G.catBottom - 14} strokeWidth={C.stroke} opacity={draw * (on("catalytic") > 0.5 ? 1 : 0.45)} />
          ))}
        </g>
      </g>

      {/* Pulse ring on the focused part. */}
      {parts.map((p) => {
        const s = pulse(p.part);
        const [cx, cy] = pulseAt[p.part];
        return (
          <circle key={`pulse-${p.part}`} cx={cx} cy={cy} r={30 + (1 - s) * 60} stroke={COLORS.red} strokeWidth={C.stroke} opacity={s} />
        );
      })}

      {/* Labels with leader lines. */}
      {parts.map((p) => {
        const a = LABELS[p.part];
        const target = anchors[p.part];
        const [lx, ly] = a.at;
        const elbowX = a.align === "end" ? lx + 10 : lx - 10;
        const reveal = interpolate(frame - p.frame, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        const focused = focus === p.part;
        return (
          <g key={p.part} opacity={on(p.part) * (focus === null || focused ? 1 : 0.7)}>
            <path
              d={`M ${target[0]} ${target[1]} L ${elbowX} ${ly - 10}`}
              stroke={COLORS.red}
              strokeWidth={C.stroke - 1}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - reveal}
            />
            <circle cx={target[0]} cy={target[1]} r={5} fill={COLORS.red} />
            <text
              x={lx}
              y={ly}
              textAnchor={a.align}
              fill={focused ? COLORS.white : C.line}
              stroke="none"
              fontFamily={FONTS.body}
              fontWeight={FONT_WEIGHTS.bold}
              fontSize={C.labelSize}
              transform={`translate(${(1 - reveal) * (a.align === "end" ? 16 : -16)} 0)`}
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
