// "jalan" soft world (automotive): one continuous strip the camera glides
// through: sky (depth 0), the street with the car (about 0.15), and below the
// road an x-ray "inside the car" layer (0.8+) where mechanisms are shown as
// soft blueprints. At every cut the camera glides from the previous depth
// while the previous shot's last frame dissolves into the new one.
// Shots of EP08 "Airbag Lebih Cepat dari Kedipan Mata". Every beat is cued on
// the narration's word timings (c.w("word", n)).

import { random } from "remotion";
import { c01, curve, FONT, k, KitDefs, kio, ks, L, lerp, Pill, pointAt, soft, toD, type Pt } from "./kit";
import { SOFT_WORLD_SHOTS } from "./registry";
import { Big, type Ctx, H, makeCtx, pop, type ShotDef, SourceChip, W, type Word } from "./scene";

const STRIP = H * 3;
const TRAVEL = STRIP - H;
const RED = "#E31E24";
const J = {
  sky0: "#FBEFE3",
  sky1: "#DDEDEA",
  city: "#C9D9DC",
  road: "#5E6B73",
  roadHi: "#73818A",
  xray0: "#22364D",
  xray1: "#121F2E",
  grid: "#3B5674",
  line: "#9CC4E4",
  car: "#E8ECEF",
  body: "#F25F5C",
  glass: "#A9D6E5",
};
const IIHS = "IIHS (mengutip NHTSA), iihs.org";

// ---------------------------------------------------------------- backdrop

const ROAD_Y = 1500; // strip y of the road surface
const Backdrop: React.FC<{ d: number; f: number }> = ({ d, f }) => {
  const off = d * TRAVEL;
  return (
    <g>
      <defs>
        <linearGradient id="jstrip" x1="0" y1="0" x2="0" y2={STRIP} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={J.sky0} />
          <stop offset="0.24" stopColor={J.sky1} />
          <stop offset="0.27" stopColor={J.road} />
          <stop offset="0.34" stopColor={J.road} />
          <stop offset="0.36" stopColor={J.xray0} />
          <stop offset="1" stopColor={J.xray1} />
        </linearGradient>
        <pattern id="jgrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M60 0 L0 0 0 60" fill="none" stroke={J.grid} strokeWidth={2} />
        </pattern>
      </defs>
      <g transform={`translate(0 ${-off})`}>
        <rect width={W} height={STRIP} fill="url(#jstrip)" />
        {/* Sun haze and a soft city skyline on the horizon. */}
        <circle cx={820} cy={520} r={240} fill="#FFE2B8" opacity={0.6} filter="url(#lblur)" />
        <path
          d={`M0 ${ROAD_Y - 10} ${Array.from({ length: 12 }, (_, i) => {
            const x = i * 95;
            const h = 80 + random(`cty${i}`) * 170;
            return `L${x} ${ROAD_Y - h} L${x + 70} ${ROAD_Y - h} L${x + 70} ${ROAD_Y - 40}`;
          }).join(" ")} L1080 ${ROAD_Y - 10} Z`}
          fill={J.city}
          opacity={0.8}
        />
        {/* Road with moving lane marks (the street drifts by). */}
        <rect x={0} y={ROAD_Y} width={W} height={20} fill={J.roadHi} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={((i * 180 - f * 6) % 1440) - 180} y={ROAD_Y + 170} width={110} height={16} rx={8} fill="#F4EDE2" opacity={0.7} />
        ))}
        {/* X-ray layer: blueprint grid under the road. */}
        <rect x={0} y={ROAD_Y + 470} width={W} height={STRIP - ROAD_Y - 470} fill="url(#jgrid)" opacity={0.5} />
      </g>
      {Array.from({ length: 18 }, (_, i) => {
        const x = random(`jx${i}`) * W + Math.sin(f / 50 + i) * 14;
        const y = (((random(`jy${i}`) * H - f * (0.2 + random(`jv${i}`) * 0.3)) % H) + H) % H;
        return <circle key={i} cx={x} cy={y} r={2 + random(`jr${i}`) * 4} fill="#FFFFFF" opacity={0.25} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- assets

// Soft side-view car. squash 0..1 crumples the nose on impact.
const Car: React.FC<{ x: number; y: number; s?: number; f: number; squash?: number; xray?: boolean; o?: number }> = ({ x, y, s = 1, f, squash = 0, xray = false, o = 1 }) => {
  const wheel = (f * 14) % 360;
  const fill = xray ? "none" : J.body;
  const stroke = xray ? J.line : "none";
  const nose = 250 - squash * 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter={xray ? undefined : "url(#lsoft)"}>
      <path d={`M-260 -10 L-250 -80 Q-240 -100 -200 -104 L-120 -110 L-60 -180 Q-40 -196 0 -196 L110 -196 Q150 -196 170 -170 L210 -112 L${nose - 20} -96 Q${nose} -90 ${nose} -60 L${nose} -10 Z`} fill={fill} stroke={stroke} strokeWidth={4} />
      <path d="M-44 -112 L-6 -168 L60 -168 L60 -112 Z M80 -112 L80 -168 L140 -168 L180 -112 Z" fill={xray ? "none" : J.glass} stroke={stroke} strokeWidth={3} />
      {[-160, 160].map((wx) => (
        <g key={wx} transform={`translate(${wx} 0) rotate(${wheel})`}>
          <circle r={50} fill={xray ? "none" : L.ink} stroke={stroke} strokeWidth={4} />
          <circle r={22} fill={xray ? "none" : "#9FB3B8"} stroke={stroke} strokeWidth={3} />
          <rect x={-3} y={-44} width={6} height={20} fill={xray ? J.line : "#9FB3B8"} />
        </g>
      ))}
    </g>
  );
};

// Steering wheel seen from the side with the airbag module; inflate 0..1.
const Wheel: React.FC<{ x: number; y: number; s?: number; inflate: number; glow?: number; o?: number }> = ({ x, y, s = 1, inflate, glow = 0, o = 1 }) => {
  const r = 30 + inflate * 230;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {glow > 0 ? <circle r={70} fill={L.glow} opacity={0.5 * glow} filter="url(#lblur)" /> : null}
      {/* The bag: grows from the hub toward the driver (left). */}
      {inflate > 0 ? <ellipse cx={-r * 0.55} cy={0} rx={r * 0.62} ry={r * 0.75} fill="#F4F6F7" stroke={J.line} strokeWidth={4} filter="url(#lsoft)" /> : null}
      <rect x={-20} y={-150} width={40} height={300} rx={20} fill="#3D4E5C" transform="rotate(-12)" />
      <rect x={-34} y={-46} width={68} height={92} rx={18} fill={RED} />
      <rect x={10} y={20} width={260} height={30} rx={15} fill="#3D4E5C" transform="rotate(28)" />
    </g>
  );
};

const Sensor: React.FC<{ x: number; y: number; s?: number; on: number }> = ({ x, y, s = 1, on }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={60 + on * 20} fill={RED} opacity={0.25 * on} filter="url(#lblur)" />
    <rect x={-36} y={-26} width={72} height={52} rx={10} fill="#2C3E50" stroke={J.line} strokeWidth={3} />
    <circle cx={0} cy={0} r={12} fill={on > 0.5 ? RED : "#5A6E80"} />
  </g>
);

const Gauge: React.FC<{ x: number; y: number; v: number; o?: number }> = ({ x, y, v, o = 1 }) => {
  const a = lerp(-200, 20, v);
  const p = (deg: number, r: number): Pt => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r];
  const arc = (from: number, to: number, col: string) => <path d={toD(curve((u) => p(lerp(from, to, u), 120), 30))} stroke={col} strokeWidth={22} fill="none" strokeLinecap="round" />;
  const [nx, ny] = p(a, 100);
  return (
    <g transform={`translate(${x} ${y})`} opacity={o} filter="url(#lsoft)">
      <circle r={160} fill={L.cream} />
      {arc(-200, -110, "#8CCFB0")}
      {arc(-110, -40, L.glow)}
      {arc(-40, 20, RED)}
      <path d={`M0 0 L${nx} ${ny}`} stroke={L.ink} strokeWidth={10} strokeLinecap="round" />
      <circle r={16} fill={L.ink} />
    </g>
  );
};

const Stopwatch: React.FC<{ x: number; y: number; ms: number; o?: number; s?: number }> = ({ x, y, ms, o = 1, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o} filter="url(#lsoft)">
    <rect x={-20} y={-196} width={40} height={36} rx={8} fill={L.cream} />
    <circle r={160} fill={L.cream} />
    <circle r={160} fill="none" stroke={RED} strokeWidth={10} strokeDasharray={`${(ms / 20) * 1005} 1005`} transform="rotate(-90)" />
    <text x={0} y={26} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={86} fill={L.ink}>
      {Math.round(ms)}
    </text>
    <text x={0} y={80} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill={L.inkSoft}>
      milidetik
    </text>
  </g>
);

const Eye: React.FC<{ x: number; y: number; s?: number; close: number }> = ({ x, y, s = 1, close }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lsoft)">
    <path d="M-90 0 Q0 -80 90 0 Q0 80 -90 0 Z" fill={L.cream} />
    <g transform={`scale(1 ${1 - close * 0.95})`}>
      <circle r={36} fill="#5B8FB9" />
      <circle r={16} fill={L.ink} />
      <circle cx={-10} cy={-10} r={6} fill="#FFFFFF" />
    </g>
    <path d={`M-90 0 Q0 ${-80 + close * 80} 90 0`} fill="#E7B898" opacity={close} />
  </g>
);

// Crash-test dummy, seated, facing right. belt 0..1 draws the seat belt.
const Dummy: React.FC<{ x: number; y: number; s?: number; belt?: number; lean?: number; o?: number; child?: boolean }> = ({ x, y, s = 1, belt = 0, lean = 0, o = 1, child = false }) => (
  <g transform={`translate(${x} ${y}) scale(${child ? s * 0.62 : s}) rotate(${lean})`} opacity={o} filter="url(#lsoft)">
    <rect x={-60} y={-40} width={130} height={60} rx={26} fill="#E9C46A" />
    <rect x={-40} y={-200} width={84} height={170} rx={36} fill="#E9C46A" />
    <circle cx={6} cy={-250} r={48} fill="#E9C46A" />
    <circle cx={6} cy={-250} r={14} fill="none" stroke={L.ink} strokeWidth={5} />
    <path d="M-8 -264 L20 -236 M20 -264 L-8 -236" stroke={L.ink} strokeWidth={4} />
    <rect x={30} y={-150} width={110} height={30} rx={15} fill="#E9C46A" />
    {belt > 0 ? <path d={`M-40 -190 L${lerp(-40, 44, belt)} ${lerp(-190, -20, belt)}`} stroke={RED} strokeWidth={16} strokeLinecap="round" /> : null}
  </g>
);

const Seat: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#lsoft)">
    <rect x={-90} y={-20} width={190} height={50} rx={22} fill="#4A5A66" />
    <rect x={-110} y={-260} width={60} height={270} rx={28} fill="#4A5A66" transform="rotate(-10 -80 0)" />
  </g>
);

const Person: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <circle cx={0} cy={-34} r={14} fill={RED} />
    <path d="M-20 10 Q-20 -16 0 -16 Q20 -16 20 10 Z" fill={RED} />
  </g>
);

// ---------------------------------------------------------------- shots

const STREET = 0.15;
const XRAY = 0.82;

// 1. Hook: the car hits a barrier; an inset shows the airbag pop; an eye blinks.
const hook = (c: Ctx) => {
  const tHit = c.w("tabrakan", 0, 0.42);
  const tBag = c.w("mengembang", 0, 1.28);
  const tBlink = c.w("kedipan", 0, 2.52);
  const tQ = c.w("kok", 0, 3.3);
  const drive = kio(c.sec, 0, Math.max(0.4, tHit));
  const squash = k(c.sec, tHit, 0.15);
  const inset = pop(c.sec, c.w("airbag", 0, 0.84) - 0.1, 0.4);
  const bag = k(c.sec, tBag - 0.05, 0.25);
  const shake = squash > 0 && c.sec < tHit + 0.5 ? Math.sin(c.f * 2.2) * 8 * (1 - (c.sec - tHit) / 0.5) : 0;
  return (
    <g transform={`translate(${shake} 0)`}>
      <rect x={880} y={1080} width={70} height={300} rx={14} fill="#F4A259" filter="url(#lsoft)" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={880} y={1110 + i * 90} width={70} height={30} fill="#FFFFFF" opacity={0.6} />
      ))}
      <Car x={lerp(-250, 610, drive)} y={1360} s={0.95} f={c.f * (1 - squash)} squash={squash} />
      {/* Inset: inside the cabin at the moment of impact. */}
      <g transform={`translate(420 760) scale(${inset.s})`} opacity={inset.o}>
        <circle r={230} fill={L.cream} filter="url(#lsoft)" />
        <g clipPath="url(#jinset)">
          <Dummy x={-60} y={150} s={0.8} lean={-bag * 6} />
          <Wheel x={150} y={-30} s={0.8} inflate={bag} />
        </g>
        <circle r={230} fill="none" stroke={RED} strokeWidth={10} />
      </g>
      <defs>
        <clipPath id="jinset">
          <circle r={222} />
        </clipPath>
      </defs>
      <g opacity={k(c.sec, tBlink - 0.2, 0.3)}>
        <Eye x={830} y={620} s={0.9} close={c.sec > tBlink ? Math.abs(Math.sin((c.sec - tBlink) * 4)) : 0} />
      </g>
      <Pill x={540} y={1080} text="Kok bisa secepat itu?" size={40} tone="brand" o={k(c.sec, tQ - 0.1, 0.3)} sc={pop(c.sec, tQ).s} />
    </g>
  );
};

// 2. Sensor: x-ray car, a shock wave from the nose, the sensor lights up and a
// gauge measures the hit.
const sensor = (c: Ctx) => {
  const tStart = c.w("dimulai", 0, 0.7);
  const tSensor = c.w("sensor", 0, 1.2);
  const tMeasure = c.w("mengukur", 0, 2.1);
  const tHard = c.w("keras", 0, 2.9);
  const wave = c.sec > tStart - 0.2 ? ((c.sec - tStart + 0.2) % 0.9) / 0.9 : 0;
  return (
    <g>
      <Car x={460} y={880} s={1.15} f={0} xray squash={0.6} />
      {wave > 0 ? <circle cx={760} cy={830} r={40 + wave * 260} fill="none" stroke={RED} strokeWidth={8} opacity={(1 - wave) * 0.8} /> : null}
      <Sensor x={700} y={840} s={1.1 * pop(c.sec, tSensor, 0.4).s} on={k(c.sec, tSensor, 0.3)} />
      <Pill x={700} y={720} text="Sensor tabrakan" size={34} tone="glow" o={k(c.sec, tSensor + 0.1, 0.3)} />
      <Gauge x={540} y={1250} v={k(c.sec, tMeasure - 0.1, Math.max(0.5, tHard - tMeasure + 0.4)) * 0.95} o={k(c.sec, tMeasure - 0.3, 0.4)} />
      <Pill x={540} y={1050} text="Seberapa keras?" size={36} o={k(c.sec, tMeasure, 0.3) * (1 - k(c.sec, tHard + 0.3, 0.3))} />
      <Pill x={540} y={1050} text="Keras! Picu airbag" size={36} tone="brand" o={k(c.sec, tHard + 0.3, 0.3)} sc={pop(c.sec, tHard + 0.3).s} />
    </g>
  );
};

// 3. Gas: the signal runs to the inflator, gas fills the bag, a stopwatch
// counts 10-20 ms.
const gas = (c: Ctx) => {
  const tTrig = c.w("memicu", 0, 1.1);
  const tInf = c.w("inflator", 0, 1.5);
  const tGas = c.w("gas", 0, 3.3);
  const tIIHS = c.w("iihs", 0, 3.9);
  const t10 = c.w("sepuluh", 0, 6.2);
  const tMs = c.w("milidetik", 0, 7.2);
  const wire: Pt[] = curve((u) => [lerp(180, 640, u), 1150 - Math.sin(u * Math.PI) * 80], 30);
  const sig = kio(c.sec, tTrig - 0.1, 0.5);
  const inflate = k(c.sec, tGas - 0.15, 0.35);
  const toWatch = kio(c.sec, tIIHS - 0.2, 0.6);
  const ms = lerp(0, 20, k(c.sec, t10 - 0.2, Math.max(0.5, tMs - t10 + 0.3)));
  return (
    <g>
      <g opacity={1 - toWatch * 0.85} transform={`translate(0 ${-toWatch * 140})`}>
        <Sensor x={180} y={1150} on={1} />
        <path d={toD(wire)} stroke={J.line} strokeWidth={6} fill="none" strokeDasharray="10 10" />
        {sig > 0 && sig < 1 ? (() => {
          const [px, py] = pointAt(wire, sig);
          return <circle cx={px} cy={py} r={16} fill={L.glow} filter="url(#lglow)" />;
        })() : null}
        <Wheel x={720} y={900} s={1.2} inflate={inflate} glow={k(c.sec, tInf - 0.1, 0.3) * (1 - inflate)} />
        <Pill x={760} y={640} text="Inflator" size={34} tone="glow" o={k(c.sec, tInf, 0.3) * (1 - inflate)} />
        {inflate > 0 && inflate < 1
          ? Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 40 + inflate * 220;
              return <circle key={i} cx={720 - 120 + Math.cos(a) * r * 0.6} cy={900 + Math.sin(a) * r * 0.7} r={10} fill="#FFFFFF" opacity={1 - inflate} />;
            })
          : null}
        <Pill x={450} y={1320} text="Kantong terisi gas" size={34} o={k(c.sec, tGas + 0.2, 0.3)} />
      </g>
      {toWatch > 0 ? (
        <g opacity={toWatch}>
          <Stopwatch x={540} y={900} ms={ms} s={0.8 + 0.2 * soft(toWatch)} />
          <Pill x={540} y={1180} text="Airbag samping: 10–20 ms" size={36} tone="brand" o={k(c.sec, tMs - 0.3, 0.3)} sc={pop(c.sec, tMs - 0.3).s} />
          <Pill x={540} y={620} text="Menurut IIHS" size={32} o={k(c.sec, tIIHS, 0.3)} />
        </g>
      ) : null}
    </g>
  );
};

// 4. Blink vs airbag on one timeline (0-400 ms).
const blink = (c: Ctx) => {
  const tEye = c.w("kedipan", 0, 1.4);
  const t100 = c.w("seratus", 0, 2.5);
  const t400 = c.w("milidetik", 0, 4.2);
  const x0 = 140;
  const x1 = 940;
  const px = (ms: number) => lerp(x0, x1, ms / 400);
  const bagBar = k(c.sec, 0.1, 0.4);
  const blinkBar = k(c.sec, t100 - 0.2, Math.max(0.6, t400 - t100 + 0.2));
  return (
    <g>
      <path d={`M${x0} 1180 L${x1} 1180`} stroke={L.inkSoft} strokeWidth={5} opacity={0.6} />
      {[0, 100, 200, 300, 400].map((ms) => (
        <g key={ms}>
          <path d={`M${px(ms)} 1165 L${px(ms)} 1195`} stroke={L.inkSoft} strokeWidth={4} />
          <text x={px(ms)} y={1240} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={L.inkSoft}>
            {ms}
          </text>
        </g>
      ))}
      <text x={540} y={1300} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill={L.inkSoft}>
        milidetik
      </text>
      {/* Airbag bar: 10-20 ms, tiny and done. */}
      <rect x={px(10)} y={980} width={(px(20) - px(10)) * bagBar} height={60} rx={14} fill={RED} filter="url(#lsoft)" />
      <Pill x={px(15) + 120} y={940} text="Airbag selesai" size={32} tone="brand" o={bagBar} />
      {/* Blink bar: 100-400 ms. */}
      <rect x={px(100)} y={1080} width={(px(400) - px(100)) * blinkBar} height={60} rx={14} fill="#5B8FB9" filter="url(#lsoft)" />
      <Eye x={540} y={720} s={1.3 * pop(c.sec, tEye - 0.2, 0.4).s} close={c.sec > t100 ? Math.abs(Math.sin((c.sec - t100) * 2.2)) : 0} />
      <Pill x={px(250)} y={1080 - 40} text="Kedipan: 100–400 ms" size={30} o={k(c.sec, t100, 0.3)} />
    </g>
  );
};

// 5. Lives saved: a counter to 70.059 and a field of people filling up.
const lives = (c: Ctx) => {
  const tNHTSA = c.w("nhtsa", 0, 1.3);
  const tNum = c.w("tujuh", 0, 3.0);
  const tNyawa = c.w("nyawa", 0, 5.2);
  const t2019 = c.w("belas", 0, 7.6);
  const n = Math.round(lerp(0, 70059, k(c.sec, tNum - 0.1, Math.max(0.8, tNyawa - tNum + 0.2))));
  const fill = k(c.sec, tNum - 0.3, Math.max(1, tNyawa - tNum + 0.6));
  return (
    <g>
      {Array.from({ length: 40 }, (_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const g = soft((fill * 40 - i) / 3);
        return <Person key={i} x={190 + col * 100} y={1030 + row * 82} s={1.15 * (0.6 + 0.4 * g)} o={0.15 + 0.85 * g} />;
      })}
      <Big x={540} y={820} text={n.toLocaleString("id-ID")} size={130} />
      <Pill x={540} y={900} text="nyawa terselamatkan" size={34} tone="brand" o={k(c.sec, tNyawa - 0.1, 0.3)} />
      <Pill x={540} y={640} text="Data NHTSA (AS)" size={32} o={k(c.sec, tNHTSA - 0.1, 0.3)} />
      <Pill x={540} y={1460 - 90} text="sampai 2019" size={30} tone="glow" o={k(c.sec, t2019 - 0.3, 0.3)} />
    </g>
  );
};

// 6. Seat belt: bars 34% / 50% / 61% fewer deaths; the belt draws over a dummy.
const belt = (c: Ctx) => {
  const tBelt = c.w("sabuk", 1, 2.3);
  const t61 = c.w("enam", 0, 5.4);
  const t34 = c.w("tiga", 0, 8.6);
  const bars = [
    { label: "Airbag saja", v: 34, at: t34 - 0.4, col: "#9FB3B8" },
    { label: "Sabuk saja", v: 50, at: t61 - 1.0, col: "#5B8FB9" },
    { label: "Airbag + sabuk", v: 61, at: t61 - 0.3, col: RED },
  ];
  return (
    <g>
      <Seat x={250} y={1230} s={0.9} />
      <Dummy x={260} y={1200} s={0.85} belt={k(c.sec, tBelt - 0.1, 0.5)} />
      <Pill x={250} y={700} text="Bukan pengganti sabuk" size={30} tone="brand" o={k(c.sec, c.w("bukan", 0, 0.6) - 0.1, 0.3)} />
      {bars.map((b, i) => {
        const g = k(c.sec, b.at, 0.6);
        const h = b.v * 7 * g;
        const x = 560 + i * 160;
        return (
          <g key={i} opacity={k(c.sec, b.at - 0.2, 0.3)}>
            <rect x={x - 55} y={1240 - h} width={110} height={h} rx={20} fill={b.col} filter="url(#lsoft)" />
            <text x={x} y={1240 - h - 20} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={L.ink}>
              {Math.round(b.v * g)}%
            </text>
            <text x={x} y={1290} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={L.inkSoft}>
              {b.label}
            </text>
          </g>
        );
      })}
      <text x={720} y={1340} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={24} fill={L.inkSoft} opacity={k(c.sec, t61, 0.4)}>
        turunnya risiko kematian, tabrakan depan
      </text>
    </g>
  );
};

// 7. Distance: 25 cm between chest and wheel; children in the back seat.
const distance = (c: Ctx) => {
  const t25 = c.w("dua", 0, 1.45);
  const tKid = c.w("anak", 0, 4.0);
  const ruler = k(c.sec, t25 - 0.2, 0.6);
  const toBack = kio(c.sec, tKid - 0.3, 0.7);
  return (
    <g>
      <g transform={`translate(${-toBack * 260} 0)`}>
        <Seat x={380} y={1200} />
        <Dummy x={390} y={1170} belt={1} />
        <Wheel x={760} y={880} s={0.9} inflate={0} />
        <g opacity={ruler}>
          <path d={`M470 980 L${lerp(470, 690, ruler)} 980`} stroke={RED} strokeWidth={8} strokeLinecap="round" />
          <path d="M470 955 L470 1005 M690 955 L690 1005" stroke={RED} strokeWidth={8} strokeLinecap="round" opacity={ruler} />
          <Pill x={580} y={920} text="min. 25 cm" size={38} tone="brand" sc={pop(c.sec, t25).s} />
        </g>
      </g>
      <g opacity={toBack} transform={`translate(${(1 - toBack) * 300} 0)`}>
        <Seat x={880} y={1220} s={0.8} />
        <Dummy x={890} y={1200} s={0.8} child belt={1} />
        <Pill x={860} y={760} text="Anak di kursi belakang" size={32} tone="glow" sc={pop(c.sec, tKid).s} />
      </g>
    </g>
  );
};

const outro = (c: Ctx) => <Car x={540} y={1420} s={0.8} f={c.f * 0.3} />;

const SHOTS: Record<string, ShotDef> = {
  "ab-hook": { depth: STREET, draw: (c) => hook(c) },
  "ab-sensor": { depth: XRAY, draw: (c) => sensor(c), source: IIHS },
  "ab-gas": { depth: XRAY + 0.06, draw: (c) => gas(c), source: IIHS },
  "ab-blink": { depth: 0.02, draw: (c) => blink(c), source: "BioNumbers (Harvard) · IIHS" },
  "ab-lives": { depth: 0.04, draw: (c) => lives(c), source: IIHS },
  "ab-belt": { depth: 0.04, draw: (c) => belt(c), source: IIHS },
  "ab-distance": { depth: 0.02, draw: (c) => distance(c), source: IIHS },
  outro: { depth: STREET, draw: (c) => outro(c) },
};

// The registry (plain data for scripts) must list exactly these shots.
if (SOFT_WORLD_SHOTS.jalan.join() !== Object.keys(SHOTS).join()) throw new Error("jalan shots out of sync with src/soft/registry.ts");

// ---------------------------------------------------------------- world

export type SoftShotState = { shot: string; frame: number; local: number; len?: number; words?: Word[]; prev?: { shot: string; len: number; words?: Word[] }; still?: boolean };

const depthOf = (def: ShotDef, c: Ctx) => (def.depthAt ? def.depthAt(c) : def.depth);
const PARALLAX = 0.5;

const Layer: React.FC<{ def: ShotDef; c: Ctx; cam: number; own: number }> = ({ def, c, cam, own }) => {
  const drift = 1 + 0.02 * c01(c.sec / c.len);
  return <g transform={`translate(0 ${(own - cam) * TRAVEL * PARALLAX}) translate(540 900) scale(${drift}) translate(-540 -900)`}>{def.draw(c, own)}</g>;
};

export const Jalan2D: React.FC<{ s: SoftShotState }> = ({ s }) => {
  const def = SHOTS[s.shot] ?? SHOTS.outro;
  const c = makeCtx(s.local / 30, s.frame, (s.len ?? 150) / 30, s.words ?? []);
  const own = depthOf(def, c);
  const prevDef = s.prev ? SHOTS[s.prev.shot] : undefined;
  const pc = s.prev ? makeCtx(s.prev.len / 30 - 1 / 30, s.frame, s.prev.len / 30, s.prev.words ?? []) : undefined;
  const prevDepth = prevDef && pc ? depthOf(prevDef, pc) : own;
  const cam = lerp(prevDepth, own, kio(c.sec, 0, 0.9));
  const inK = prevDef ? k(c.sec, 0.05, 0.45) : 1;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <KitDefs />
      <Backdrop d={cam} f={c.f} />
      {prevDef && pc && inK < 1 ? (
        <g opacity={1 - inK}>
          <Layer def={prevDef} c={pc} cam={cam} own={prevDepth} />
        </g>
      ) : null}
      <g opacity={inK}>
        <Layer def={def} c={c} cam={cam} own={own} />
      </g>
      {def.source && !s.still ? <SourceChip text={def.source} o={k(c.sec, 0.5, 0.5) * (1 - c01((c.sec - (c.len - 0.35)) / 0.35))} /> : null}
    </svg>
  );
};

export const JALAN_BG = J.sky0;
void ks;
