// EP05 "3 Tanda Bengkel Nakal" on one big whiteboard: six paper panels in a
// 2 x 3 grid, a 2D camera that pans and zooms from panel to panel on cue
// words, and a final pull back to the whole board. Copy comes from the
// episode file by text id; layout and motion live here.

import { Img, random, staticFile, useCurrentFrame } from "remotion";
import type { CinemaEpisode } from "../cinemaSchema";
import { cue, type CueMap } from "../cinema/timeline";
import { BRAND_ASSETS, FONT_WEIGHTS, FONTS, PAPER } from "../lib/brand";
import { Bubble, Card, circleAround, Cutout, ease, MarkerPath, MarkerTitle, Note, pop, Stamp, Sticky } from "./kit";
import { Bin, Car, Curtain, Hand, Invoice, Magnifier, Person, PriceTag, SparkPlug } from "./props";

export const PANEL = { w: 1080, h: 1920 } as const;
export const BOARD = { w: PANEL.w * 2, h: PANEL.h * 3, pad: 1600 } as const;
const P = (col: number, row: number) => ({ x: col * PANEL.w, y: row * PANEL.h });
const PANELS = {
  hook: P(0, 0),
  promise: P(1, 0),
  sign1: P(0, 1),
  sign2: P(1, 1),
  sign3: P(0, 2),
  solution: P(1, 2),
} as const;

// ---------------------------------------------------------------- camera
type CamKey = { t: number; x: number; y: number; zoom: number; rot?: number };
type Shot2D = { from: number; to: number; keys: CamKey[] };
const TRAVEL_FRAMES = 14;

const at = (keys: CamKey[], t: number) => {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b.t === a.t ? 0 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
  const e = 0.35 * k + 0.65 * ease(k);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, zoom: a.zoom + (b.zoom - a.zoom) * e, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * e };
};

const cameraAt = (shots: Shot2D[], frame: number) => {
  const i = Math.max(0, shots.findIndex((s) => frame < s.to));
  const s = shots[i === -1 ? shots.length - 1 : i];
  const here = at(s.keys, (frame - s.from) / Math.max(1, s.to - s.from));
  const next = shots[i + 1];
  const into = s.to - TRAVEL_FRAMES;
  if (!next || frame < into) return here;
  const w = ease((frame - into) / TRAVEL_FRAMES);
  const there = at(next.keys, 0);
  // Zoom travels in log space so a pull back feels even.
  const z = Math.exp(Math.log(here.zoom) + (Math.log(there.zoom) - Math.log(here.zoom)) * w);
  return { x: here.x + (there.x - here.x) * w, y: here.y + (there.y - here.y) * w, zoom: z, rot: here.rot + (there.rot - here.rot) * w };
};

const center = (p: { x: number; y: number }, dx = 0, dy = 0) => ({ x: p.x + PANEL.w / 2 + dx, y: p.y + PANEL.h / 2 + dy });

export const boardShots = (cues: CueMap): Shot2D[] => {
  const c = (n: string) => cue(cues, n);
  const k = (t: number, p: { x: number; y: number }, zoom: number, rot = 0): CamKey => ({ t, x: p.x, y: p.y, zoom, rot });
  return [
    { from: 0, to: c("billOut"), keys: [k(0, center(PANELS.hook, -150, 20), 1.22, -1), k(1, center(PANELS.hook, -110, 20), 1.18, 0)] },
    { from: c("billOut"), to: c("promise:start"), keys: [k(0, center(PANELS.hook, 0, 0), 1.0), k(1, center(PANELS.hook, 10, -10), 1.06)] },
    { from: c("promise:start"), to: c("sign1:start"), keys: [k(0, center(PANELS.promise), 1.0, 1), k(1, center(PANELS.promise), 1.06, 0)] },
    { from: c("sign1:start"), to: c("s1Hide"), keys: [k(0, center(PANELS.sign1), 1.0), k(1, center(PANELS.sign1, 20, 0), 1.05)] },
    { from: c("s1Hide"), to: c("sign2:start"), keys: [k(0, center(PANELS.sign1, -20, 0), 1.18), k(1, center(PANELS.sign1, -10, 0), 1.24)] },
    { from: c("sign2:start"), to: c("s2Swell"), keys: [k(0, center(PANELS.sign2), 1.0, -1), k(1, center(PANELS.sign2), 1.05, 0)] },
    { from: c("s2Swell"), to: c("sign3:start"), keys: [k(0, center(PANELS.sign2, 40, 60), 1.12), k(1, center(PANELS.sign2, 40, 60), 1.18)] },
    { from: c("sign3:start"), to: c("s3Stamp"), keys: [k(0, center(PANELS.sign3), 1.0), k(1, center(PANELS.sign3, 30, 0), 1.06)] },
    { from: c("s3Stamp"), to: c("solution:start"), keys: [k(0, center(PANELS.sign3, 0, 20), 1.12, 1), k(1, center(PANELS.sign3, 0, 20), 1.18, 0)] },
    { from: c("solution:start"), to: c("pullBack"), keys: [k(0, center(PANELS.solution, 0, -60), 1.1), k(1, center(PANELS.solution, 0, -60), 1.18)] },
    { from: c("pullBack"), to: c("book") - 10, keys: [k(0, { x: BOARD.w / 2, y: BOARD.h / 2 }, 0.333), k(1, { x: BOARD.w / 2, y: BOARD.h / 2 }, 0.345)] },
    { from: c("book") - 10, to: c("end"), keys: [k(0, center(PANELS.solution, 0, 560), 1.0), k(1, center(PANELS.solution, 0, 560), 1.06)] },
  ];
};

// ---------------------------------------------------------------- board
const boardTexture = (() => {
  let url: string | null = null;
  return () => {
    if (url) return url;
    const N = 512;
    const c = document.createElement("canvas");
    c.width = N;
    c.height = N;
    const g = c.getContext("2d") as CanvasRenderingContext2D;
    g.fillStyle = PAPER.board;
    g.fillRect(0, 0, N, N);
    for (let i = 0; i < 5000; i++) {
      const v = 200 + Math.floor(random(`bt-${i}`) * 55);
      g.fillStyle = `rgba(${v},${v},${v - 6},0.18)`;
      g.fillRect(random(`bx-${i}`) * N, random(`by-${i}`) * N, 2, 2);
    }
    // Ghost marks of old marker strokes.
    g.strokeStyle = PAPER.boardSmudge;
    g.lineWidth = 18;
    for (let i = 0; i < 2; i++) {
      g.beginPath();
      g.moveTo(random(`sx-${i}`) * N, random(`sy-${i}`) * N);
      g.bezierCurveTo(random(`c1-${i}`) * N, random(`c2-${i}`) * N, random(`c3-${i}`) * N, random(`c4-${i}`) * N, random(`ex-${i}`) * N, random(`ey-${i}`) * N);
      g.stroke();
    }
    url = c.toDataURL("image/png");
    return url;
  };
})();

const NumberBadge: React.FC<{ x: number; y: number; t: number; n: string }> = ({ x, y, t, n }) => {
  if (t < 0) return null;
  const p = pop(t);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 150, height: 150, transform: `scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 2) }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.headline, fontSize: 112, color: PAPER.inkRed }}>{n}</div>
      <MarkerPath d={circleAround(150, 150, `nb-${n}`)} viewBox="0 0 150 150" t={t - 2} frames={12} style={{ inset: 0, width: 150, height: 150 }} />
    </div>
  );
};

const RedX: React.FC<{ x: number; y: number; t: number; size: number }> = ({ x, y, t, size }) => (
  <>
    <MarkerPath d="M 10 10 L 190 190" viewBox="0 0 200 200" t={t} frames={8} width={16} style={{ left: x, top: y, width: size, height: size }} />
    <MarkerPath d="M 190 10 L 10 190" viewBox="0 0 200 200" t={t - 6} frames={8} width={16} style={{ left: x, top: y, width: size, height: size }} />
  </>
);

const Check: React.FC<{ x: number; y: number; t: number; size?: number }> = ({ x, y, t, size = 64 }) => (
  <MarkerPath d="M 8 34 L 26 54 L 58 10" viewBox="0 0 64 64" t={t} frames={7} color={PAPER.inkGreen} width={10} style={{ left: x, top: y, width: size, height: size }} />
);

export const Board: React.FC<{ ep: CinemaEpisode; cues: CueMap }> = ({ ep, cues }) => {
  const frame = useCurrentFrame();
  const c = (n: string) => cue(cues, n);
  const T = (n: string) => frame - c(n);
  const text = (id: string) => ep.beats.flatMap((b) => b.texts).find((x) => x.id === id);
  const copy = (id: string) => text(id)?.text ?? "";
  const cam = cameraAt(boardShots(cues), frame);

  // ---- hook panel
  const H = PANELS.hook;
  // The car is already half in on frame 0 so the cover is never empty.
  const carIn = ease((frame + 20) / 52);
  const carX = H.x - 360 + (H.x + 380 - (H.x - 360)) * carIn;
  const unroll = Math.min(1, Math.max(0, T("billOut") / 34));
  const driverMood = frame >= c("bill") ? "shock" : "happy";

  // ---- sign 2 swelling invoice
  const swell = frame >= c("s2Swell") ? ease(T("s2Swell") / 30) : 0;
  const puff = 1 + 0.6 * swell + 0.03 * Math.sin(frame / 3) * swell;

  // ---- sign 3 swap: the hand takes the old plug to the bin, the new one sits
  const swap = ease((frame - (c("sign3:start") + 24)) / 26);
  const toss = frame >= c("s3Toss") ? ease(T("s3Toss") / 16) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: BOARD.w,
        height: BOARD.h,
        transformOrigin: "0 0",
        transform: `translate(${540 - cam.x * cam.zoom}px, ${960 - cam.y * cam.zoom}px) scale(${cam.zoom}) rotate(${cam.rot}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -BOARD.pad,
          top: -BOARD.pad,
          width: BOARD.w + BOARD.pad * 2,
          height: BOARD.h + BOARD.pad * 2,
          backgroundColor: PAPER.board,
          // In-memory data URL drawn synchronously: nothing to wait for.
          // eslint-disable-next-line @remotion/no-background-image
          backgroundImage: `url(${boardTexture()})`,
          backgroundSize: "512px 512px",
        }}
      />

      {/* ---------------- HOOK ---------------- */}
      <Card x={H.x + 60} y={H.y + 300} w={960} h={900} rot={-0.6} seed={0} />
      <Note x={H.x + 110} y={H.y + 340} t={frame + 10} text={ep.tag} size={34} color={PAPER.inkRed} weight={FONT_WEIGHTS.bold} />
      <Sticky place={{ x: H.x + 330, y: H.y + 690, rot: -7 }} t={T("oilNote")} text={copy("oilNote")} width={280} />
      <Cutout place={{ x: carX, y: H.y + 930, scale: 0.95 }} t={0} width={560} height={228} seed={1} enter="none" sway={0}>
        <Car wheelTurn={carIn * 420} />
      </Cutout>
      {/* Receipt unrolls from the shop, the total is written on in red. */}
      <Cutout place={{ x: H.x + 810, y: H.y + 880, rot: 2 }} t={T("billOut")} width={240} height={666} seed={2} enter="pop" sway={0.3}>
        <Invoice unroll={unroll} total={copy("bill")} totalLabel={text("bill")?.sub ?? ""} showTotal={frame >= c("bill")} />
      </Cutout>
      <Cutout place={{ x: H.x + 200, y: H.y + 960, scale: frame >= c("bill") ? 1 + 0.04 * Math.sin(T("bill") / 2) * Math.max(0, 1 - T("bill") / 20) : 1 }} t={frame - c("billOut") + 6} width={260} height={473} seed={0}>
        <Person role="driver" mood={driverMood} armL={frame >= c("bill") ? 150 : 10} armR={frame >= c("bill") ? 150 : -10} frame={frame} />
      </Cutout>
      {frame >= c("bill") ? (
        <MarkerTitle x={H.x + 110} y={H.y + 390} width={860} t={T("bill")} text={copy("bill")} color={PAPER.inkRed} size={132} underline={null} />
      ) : null}

      {/* ---------------- PROMISE ---------------- */}
      {(() => {
        const Q = PANELS.promise;
        const t0 = frame - c("promise:start");
        const scan = ease(t0 / 50);
        return (
          <>
            <Card x={Q.x + 60} y={Q.y + 300} w={960} h={900} rot={0.7} seed={1} />
            <Cutout place={{ x: Q.x + 260 + 520 * scan, y: Q.y + 820 - 80 * Math.sin(scan * Math.PI), rot: -12 + 20 * scan }} t={t0} width={260} height={260} seed={3} enter="slideRight">
              <Magnifier />
            </Cutout>
            <Cutout place={{ x: Q.x + 230, y: Q.y + 1010 }} t={t0} width={210} height={382} seed={2} enter="slideLeft">
              <Person role="driver" mood="worried" armL={10} armR={110} frame={frame} />
            </Cutout>
            <MarkerTitle x={Q.x + 120} y={Q.y + 380} width={840} t={T("title")} text={copy("title")} size={128} />
          </>
        );
      })()}

      {/* ---------------- SIGN 1 ---------------- */}
      {(() => {
        const S = PANELS.sign1;
        const hide = frame >= c("s1Hide") ? Math.min(1, T("s1Hide") / 14) : 0;
        return (
          <>
            <Card x={S.x + 60} y={S.y + 300} w={960} h={900} rot={-0.4} seed={2} />
            <NumberBadge x={S.x + 90} y={S.y + 330} t={T("s1Label")} n="1" />
            <MarkerTitle x={S.x + 260} y={S.y + 360} width={720} t={T("s1Label")} text={copy("s1Label")} size={96} />
            <Cutout place={{ x: S.x + 400, y: S.y + 940 }} t={T("s1Label") + 4} width={520} height={212} seed={1} enter="slideLeft" sway={0}>
              <Car wheelTurn={0} />
            </Cutout>
            <Cutout place={{ x: S.x + 850, y: S.y + 920 }} t={T("s1Label") + 8} width={250} height={455} seed={0} enter="slideRight">
              <Person role="mechanic" mood={frame >= c("s1Hide") ? "smug" : "neutral"} armL={frame >= c("s1Bubble") ? 120 : 15} armR={-10} frame={frame} />
            </Cutout>
            <Bubble place={{ x: S.x + 640, y: S.y + 640, rot: 3 }} t={T("s1Bubble")} text={copy("s1Bubble")} width={500} tail="right" color={PAPER.inkRed} />
            {hide > 0 ? (
              <div style={{ position: "absolute", left: S.x + 330, top: S.y + 770, width: 360, height: 260, filter: "url(#paper-1)" }}>
                <Curtain close={hide} />
              </div>
            ) : null}
          </>
        );
      })()}

      {/* ---------------- SIGN 2 ---------------- */}
      {(() => {
        const S = PANELS.sign2;
        const swing = Math.sin(T("s2Label") / 6) * 14 * Math.exp(-Math.max(0, T("s2Label")) / 30);
        return (
          <>
            <Card x={S.x + 60} y={S.y + 300} w={960} h={900} rot={0.5} seed={3} />
            <NumberBadge x={S.x + 90} y={S.y + 330} t={T("s2Label")} n="2" />
            <MarkerTitle x={S.x + 260} y={S.y + 360} width={720} t={T("s2Label")} text={copy("s2Label")} size={96} />
            <Cutout place={{ x: S.x + 300, y: S.y + 700, rot: swing }} t={T("s2Label") + 6} width={230} height={276} seed={1} enter="drop">
              <PriceTag />
            </Cutout>
            <Cutout place={{ x: S.x + 680, y: S.y + 930, rot: 4, scale: 0.5 * puff }} t={T("s2Label") + 12} width={300} height={833} seed={2} sway={0.4}>
              <Invoice unroll={0.35 + 0.65 * swell} total="?" totalLabel="" showTotal={false} />
            </Cutout>
            <Cutout place={{ x: S.x + 230, y: S.y + 980 }} t={T("s2Swell")} width={240} height={436} seed={0} enter="slideLeft">
              <Person role="driver" mood="shock" armL={150} armR={150} frame={frame} />
            </Cutout>
          </>
        );
      })()}

      {/* ---------------- SIGN 3 ---------------- */}
      {(() => {
        const S = PANELS.sign3;
        const plugBase = { x: S.x + 560, y: S.y + 880 };
        // Old plug: carried right by the hand, then tossed into the bin.
        const oldX = plugBase.x + 220 * swap + 60 * toss;
        const oldY = plugBase.y - 40 * Math.sin(swap * Math.PI) + 220 * toss;
        return (
          <>
            <Card x={S.x + 60} y={S.y + 300} w={960} h={900} rot={-0.7} seed={0} />
            <NumberBadge x={S.x + 90} y={S.y + 330} t={T("s3Label")} n="3" />
            <MarkerTitle x={S.x + 260} y={S.y + 360} width={720} t={T("s3Label")} text={copy("s3Label")} size={92} />
            <Cutout place={{ x: S.x + 220, y: S.y + 930 }} t={T("s3Label") + 4} width={250} height={455} seed={0} enter="slideLeft">
              <Person role="driver" mood="neutral" armL={10} armR={-10} frame={frame} lookAway />
            </Cutout>
            <Cutout place={{ x: S.x + 850, y: S.y + 1050 }} t={T("s3Label") + 6} width={200} height={233} seed={3} enter="pop" sway={0}>
              <Bin />
            </Cutout>
            {/* New plug slides in where the old one was. */}
            <Cutout place={{ x: plugBase.x, y: plugBase.y + 200 * (1 - swap), rot: 0 }} t={T("s3Label") + 24} width={95} height={285} seed={1} enter="none" sway={0}>
              <SparkPlug dirty={false} />
            </Cutout>
            {toss < 1 ? (
              <Cutout place={{ x: oldX, y: oldY, rot: 25 * swap + 120 * toss }} t={T("s3Label") + 4} width={95} height={285} seed={2} enter="pop" sway={0}>
                <SparkPlug dirty />
              </Cutout>
            ) : null}
            <Cutout place={{ x: oldX + 150, y: oldY - 40 }} t={T("s3Label") + 18} width={260} height={120} seed={3} enter="slideRight" sway={0}>
              <Hand />
            </Cutout>
            <Stamp place={{ x: S.x + 560, y: S.y + 640, rot: -10 }} t={T("s3Stamp")} text={copy("s3Stamp")} />
          </>
        );
      })()}

      {/* ---------------- SOLUTION ---------------- */}
      {(() => {
        const S = PANELS.solution;
        const items = ["est1", "est2", "est3"];
        return (
          <>
            <Card x={S.x + 60} y={S.y + 300} w={960} h={900} rot={0.4} seed={1} />
            {/* Clipboard with the written estimate. */}
            <Cutout place={{ x: S.x + 560, y: S.y + 770, rot: -2 }} t={frame - c("solution:start")} width={700} height={820} seed={2} enter="drop" sway={0.3}>
              <div style={{ position: "absolute", inset: 0, background: PAPER.kraft, borderRadius: 28 }} />
              <div style={{ position: "absolute", left: 40, top: 70, right: 40, bottom: 40, background: "#ffffff" }} />
              <div style={{ position: "absolute", left: 250, top: 10, width: 200, height: 90, background: PAPER.metal, borderRadius: 16 }} />
            </Cutout>
            <MarkerTitle x={S.x + 270} y={S.y + 470} width={600} t={T("estTitle")} text={copy("estTitle")} size={84} underline={PAPER.inkBlue} />
            {items.map((id, i) => (
              <div key={id}>
                <div style={{ position: "absolute", left: S.x + 280, top: S.y + 640 + i * 120, width: 64, height: 64, border: `5px solid ${PAPER.ink}`, borderRadius: 8, opacity: T("estTitle") > 6 ? 1 : 0 }} />
                <Check x={S.x + 280} y={S.y + 630 + i * 120} t={T(id)} size={74} />
                <Note x={S.x + 365} y={S.y + 650 + i * 120} t={T(id)} text={copy(id)} size={40} />
              </div>
            ))}
            <MarkerPath d="M 10 50 C 60 0, 90 90, 140 30 S 230 70, 290 20" viewBox="0 0 300 80" t={T("est3") + 6} frames={14} color={PAPER.inkBlue} width={6} style={{ left: S.x + 560, top: S.y + 1000, width: 300, height: 80 }} />
            <Cutout place={{ x: S.x + 170, y: S.y + 1020 }} t={T("est1")} width={220} height={400} seed={0} enter="slideLeft">
              <Person role="driver" mood="happy" armL={10} armR={120} frame={frame} />
            </Cutout>
            {/* Brand card below the panel: the final framing. */}
            {frame >= c("book") - 10 ? (
              <Cutout place={{ x: S.x + 540, y: S.y + 1440, rot: -1.5 }} t={T("book") + 4} width={640} height={420} seed={3} enter="drop" sway={0.4}>
                <div style={{ position: "absolute", inset: 0, background: "#ffffff", borderRadius: 24 }} />
                <Img src={staticFile(BRAND_ASSETS.logo)} style={{ position: "absolute", left: 90, top: 50, width: 460 }} />
                <div
                  style={{
                    position: "absolute",
                    left: 110,
                    right: 110,
                    bottom: 46,
                    height: 96,
                    borderRadius: 48,
                    background: PAPER.inkRed,
                    color: "#ffffff",
                    fontFamily: FONTS.body,
                    fontWeight: FONT_WEIGHTS.extrabold,
                    fontSize: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {copy("book")}
                </div>
              </Cutout>
            ) : null}
          </>
        );
      })()}

      {/* Pull back: the three signs get crossed out, one after another. */}
      {[PANELS.sign1, PANELS.sign2, PANELS.sign3].map((p, i) => (
        <RedX key={i} x={p.x + 190} y={p.y + 470} t={frame - c("pullBack") - 10 - i * 8} size={700} />
      ))}
    </div>
  );
};
