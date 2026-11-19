// EP05 v2 "Masuk Sehat, Keluar Rusak": a sequence of layered paper
// dioramas. Act 1 (rogue shop): the car goes in healthy and comes out
// smoking, the upsell on the open engine bay, the careless job, the popped
// hose, the check-engine lamp, the swelling bill. A red brand wipe turns the
// set into the bright Doktermobil shop: welcome, OBD scan, every inspection
// point checked on the lift, the written estimate signed, then the work.
// Clean centred CTA. Copy comes from the episode file by text id.

import { Img, staticFile, useCurrentFrame } from "remotion";
import type { CinemaEpisode } from "../../cinemaSchema";
import { cue, type CueMap } from "../../cinema/timeline";
import { BRAND_ASSETS, FONT_WEIGHTS, FONTS, PAPER, SAFE_AREA, STORY } from "../../lib/brand";
import { Cutout, ease, pop, Stamp, Sticky } from "../kit";
import { Invoice } from "../props";
import { CleanBack, CleanMid, Facade, Grade, GrimeBack, GrimeMid, HangingLamp, Layer, Lift, type Cam } from "./env";
import { Clock, Cluster, ENGINE_SPOTS, EngineBay, Figure, FindingsTablet, FormSheet, Motes, ObdPort, ObdScanner, Rain, SedanSide, Smoke, Spray, Wallet } from "./objects";

type Scene = { id: string; from: number; to: number; cam: [Cam, Cam] };
const C0: Cam = { x: 0, y: 0, zoom: 1, rot: 0 };
const cam = (x: number, y: number, zoom: number, rot = 0): Cam => ({ x, y, zoom, rot });

export const storyScenes = (cues: CueMap): Scene[] => {
  const c = (n: string) => cue(cues, n);
  const wipeAt = c("turn:start");
  const scanAt = c("domoScan:start");
  return [
    { id: "arrive", from: 0, to: c("smokeCut"), cam: [cam(-140, 40, 1.12, -1), cam(-20, 20, 1.06, 0)] },
    { id: "smoke", from: c("smokeCut"), to: c("oknum:start"), cam: [cam(60, -20, 1.18, 1.5), cam(40, -10, 1.1, 0)] },
    { id: "oknum", from: c("oknum:start"), to: c("upsell:start"), cam: [cam(120, 0, 1.0), cam(160, -20, 1.14)] },
    { id: "bay", from: c("upsell:start"), to: c("damage:start"), cam: [cam(0, -260, 1.3), cam(0, 0, 1.0)] },
    { id: "careless", from: c("damage:start"), to: c("hose"), cam: [cam(-60, 0, 1.15, -2), cam(40, 0, 1.2, 1)] },
    { id: "hose", from: c("hose"), to: c("checkLight"), cam: [cam(0, 0, 1.0), cam(0, 0, 1.08)] },
    { id: "dash", from: c("checkLight"), to: c("billSwell"), cam: [cam(0, 0, 1.0), cam(0, 0, 1.1)] },
    { id: "bill", from: c("billSwell"), to: c("regret:start"), cam: [cam(0, 0, 1.0), cam(0, 20, 1.06)] },
    { id: "regret", from: c("regret:start"), to: wipeAt, cam: [cam(-40, 60, 1.14), cam(20, 20, 1.04)] },
    { id: "facade", from: wipeAt, to: c("arrive2"), cam: [cam(0, -120, 1.0), cam(0, 0, 1.08)] },
    { id: "welcome", from: c("arrive2"), to: scanAt, cam: [cam(-60, 0, 1.08), cam(0, 0, 1.0)] },
    { id: "port", from: scanAt, to: scanAt + 45, cam: [cam(0, 40, 1.0), cam(0, 20, 1.35)] },
    { id: "scanner", from: scanAt + 45, to: c("pt1"), cam: [cam(0, 60, 1.12), cam(0, 0, 1.0)] },
    { id: "lift", from: c("pt1"), to: c("explain:start"), cam: [cam(0, 0, 1.0), cam(0, -30, 1.06)] },
    { id: "explain", from: c("explain:start"), to: c("domoForm:start"), cam: [cam(30, 40, 1.06), cam(0, 0, 1.0)] },
    { id: "form", from: c("domoForm:start"), to: c("work"), cam: [cam(0, 40, 1.08, -2), cam(0, 0, 1.0, 0)] },
    { id: "work", from: c("work"), to: c("payoff:start"), cam: [cam(0, 0, 1.0), cam(0, 0, 1.06)] },
    { id: "payoff", from: c("payoff:start"), to: c("cta:start"), cam: [cam(80, 0, 1.1), cam(-40, -20, 1.0)] },
    { id: "cta", from: c("cta:start"), to: c("end"), cam: [C0, C0] },
  ];
};

const camAt = (s: Scene, frame: number): Cam => {
  const k = Math.min(1, Math.max(0, (frame - s.from) / Math.max(1, s.to - s.from)));
  const e = 0.4 * k + 0.6 * ease(k);
  const [a, b] = s.cam;
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, zoom: a.zoom + (b.zoom - a.zoom) * e, rot: a.rot + (b.rot - a.rot) * e };
};

// A paper strip with a headline, used for the few on-screen titles.
const TitleStrip: React.FC<{ t: number; text: string; accent?: boolean; top?: number }> = ({ t, text, accent = false, top = SAFE_AREA.y + 10 }) => {
  if (t < 0) return null;
  const p = pop(t, 11);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        top,
        width: SAFE_AREA.width,
        display: "flex",
        justifyContent: "flex-start",
        transform: `translateY(${(1 - p) * -40}px) rotate(${-1.5 + (1 - p) * -4}deg)`,
        opacity: Math.min(1, p * 2),
      }}
    >
      <div style={{ background: accent ? STORY.brandRed : STORY.paperWhite, padding: "14px 30px 10px", boxShadow: "0 10px 24px rgba(0,0,0,0.35)", filter: "url(#paper-2)" }}>
        <div style={{ fontFamily: FONTS.headline, fontSize: STORY.titleSize, lineHeight: 1.0, color: accent ? "#ffffff" : PAPER.ink }}>{text}</div>
      </div>
    </div>
  );
};

const PointChip: React.FC<{ x: number; y: number; t: number; text: string }> = ({ x, y, t, text }) => {
  if (t < 0) return null;
  const p = pop(t, 12);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2) }}>
      <div style={{ position: "absolute", left: -26, top: -26, width: 52, height: 52, borderRadius: 26, background: STORY.screenGreen, boxShadow: `0 0 0 10px rgba(77,255,154,0.25)` }} />
      <svg viewBox="0 0 52 52" style={{ position: "absolute", left: -26, top: -26, width: 52, height: 52 }}>
        <path d="M 14 27 L 23 36 L 39 17" stroke="#0b3d22" strokeWidth={6} fill="none" strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 36,
          top: -30,
          background: "#ffffff",
          borderRadius: 14,
          padding: "6px 18px",
          fontFamily: FONTS.body,
          fontWeight: FONT_WEIGHTS.bold,
          fontSize: 38,
          color: PAPER.ink,
          whiteSpace: "nowrap",
          boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const StoryBoard: React.FC<{ ep: CinemaEpisode; cues: CueMap }> = ({ ep, cues }) => {
  const frame = useCurrentFrame();
  const c = (n: string) => cue(cues, n);
  const T = (n: string) => frame - c(n);
  const copy = (id: string) => ep.beats.flatMap((b) => b.texts).find((x) => x.id === id)?.text ?? "";
  const scenes = storyScenes(cues);
  const scene = scenes.find((s) => frame >= s.from && frame < s.to) ?? scenes[scenes.length - 1];
  const cm = camAt(scene, frame);
  const local = frame - scene.from;
  const flicker = 0.75 + 0.25 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37 + 1) + (frame % 47 < 3 ? -0.5 : 0);
  const grime = ["arrive", "smoke", "oknum", "bill", "regret"].includes(scene.id);
  const clean = ["welcome", "lift", "work", "explain"].includes(scene.id);
  // Cut shake: a few frames of jitter on hard cuts into act-1 beats.
  const shake = ["smoke", "hose", "dash"].includes(scene.id) && local < 8 ? (8 - local) * 1.6 : 0;
  const cmS: Cam = { ...cm, x: cm.x + Math.sin(frame * 7) * shake, y: cm.y + Math.cos(frame * 9) * shake };
  const wipe = c("turn:start");
  const wipeK = Math.min(1, Math.max(0, (frame - wipe + 2) / 14));

  const hardCut = ["smoke", "hose", "dash", "arrive", "facade"].includes(scene.id);
  const whip = !hardCut && local < 9 ? (9 - local) / 9 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: grime ? STORY.grimeWallDark : STORY.cleanWall }}>
     <div style={{ position: "absolute", inset: 0, filter: whip > 0 ? `blur(${(whip * whip * 14).toFixed(2)}px)` : undefined, transform: `translateX(${-whip * whip * 120}px)` }}>
      {/* ---------------- ROGUE SHOP SETS ---------------- */}
      {grime ? (
        <>
          <Layer cam={cmS} depth={0.35} blur={2}>
            <GrimeBack flicker={flicker} />
          </Layer>
          <Layer cam={cmS} depth={0.6} blur={scene.id === "oknum" ? 3 : 0.6}>
            <GrimeMid />
          </Layer>
          <Layer cam={cmS} depth={0.8}>
            <HangingLamp x={700} swing={Math.sin(frame / 28) * 3} on={flicker} cord={460} />
          </Layer>
        </>
      ) : null}

      {scene.id === "arrive" || scene.id === "smoke" ? (
        <Layer cam={cmS} depth={1}>
          {(() => {
            const k = scene.id === "arrive" ? ease((frame + 10) / (c("smokeCut") + 10)) : 1;
            const x = -420 + 900 * k;
            return (
              <>
                <div style={{ position: "absolute", left: x, top: 950, width: 800, height: 329 }}>
                  <SedanSide wheelTurn={k * 700} bob={scene.id === "arrive" ? Math.sin(frame / 3) * 2.5 * (1 - k) : 0} speed={scene.id === "arrive" ? 1 - k : 0} />
                </div>
                <Sticky place={{ x: x + 420, y: 960, rot: -6 }} t={T("lightService")} text={copy("lightService")} width={250} fontSize={44} />
                {scene.id === "smoke" ? <Smoke t={local + 30} x={x + 720} y={1050} width={620} dark /> : null}
              </>
            );
          })()}
        </Layer>
      ) : null}
      {scene.id === "smoke" ? <TitleStrip t={T("hookTitle")} text={copy("hookTitle")} accent /> : null}

      {scene.id === "oknum" ? (
        <>
          <Layer cam={cmS} depth={1}>
            <div style={{ position: "absolute", left: 560, top: 640, width: 300, height: 800 }}>
              <Figure role="rogue" frame={frame} silhouette armL={20} armR={-30} />
            </div>
          </Layer>
          <Stamp place={{ x: 540, y: 520, rot: -8 }} t={T("modus")} text={copy("modus")} />
        </>
      ) : null}

      {/* ---------------- ENGINE BAY ---------------- */}
      {["bay", "careless", "hose"].includes(scene.id) ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#16171a" }} />
          <Layer cam={scene.id === "hose" ? { x: 470, y: 160, zoom: 2.0 + 0.1 * (local / 30), rot: 0 } : cmS} depth={1}>
            {(() => {
              const bayX = 40;
              const bayY = 520;
              const bayW = 1000;
              const s = bayW / 900;
              const spot = (k: keyof typeof ENGINE_SPOTS) => ({ x: bayX + ENGINE_SPOTS[k].x * s, y: bayY + ENGINE_SPOTS[k].y * s });
              // Starts already lifting so the cut never lands on a full red frame.
              const hoodUp = scene.id === "bay" ? 0.35 + 0.65 * ease(local / 12) : 1;
              const hoseOff = frame >= c("hose") ? Math.min(1, T("hose") / 6) : 0;
              return (
                <>
                  <div style={{ position: "absolute", left: bayX, top: bayY, width: bayW, height: 700 * s, filter: "url(#paper-0)" }}>
                    <EngineBay hoseOff={hoseOff} dirt={scene.id === "bay" ? 0.4 : 0.8} />
                  </div>
                  {/* Hood lid lifting out of frame. */}
                  <div
                    style={{
                      position: "absolute",
                      left: bayX - 20,
                      top: bayY - 40 - 1500 * hoodUp,
                      width: bayW + 40,
                      height: 820,
                      background: `linear-gradient(180deg, ${PAPER.carRed} 0%, ${PAPER.carRedShade} 100%)`,
                      borderRadius: 40,
                      filter: "url(#paper-1)",
                    }}
                  />
                  {/* Upsell notes slapped on parts. */}
                  {scene.id !== "hose" ? <>
                  <Sticky place={{ ...spot("airbox"), rot: -8 }} t={T("up1")} text={copy("up1")} width={260} fontSize={40} />
                  <Sticky place={{ ...spot("radiator"), rot: 6 }} t={T("up2")} text={copy("up2")} width={260} fontSize={40} />
                  <Sticky place={{ ...spot("plugs"), rot: -4 }} t={T("up3")} text={copy("up3")} width={260} fontSize={40} />
                  </> : null}
                  {/* The receipt grows with every "sekalian". */}
                  {scene.id === "bay" && frame >= c("up1") ? (
                    <div style={{ position: "absolute", left: 860, top: 420, width: 190, height: 527, transform: "rotate(5deg)", filter: "url(#paper-3)" }}>
                      <Invoice unroll={Math.min(1, (frame - c("up1")) / 60)} total="" totalLabel="" showTotal={false} />
                    </div>
                  ) : null}
                  {/* Rogue hand slapping each note. */}
                  {scene.id === "bay"
                    ? (["up1", "up2", "up3"] as const).map((id, i) => {
                        const t = T(id);
                        if (t < -6 || t > 10) return null;
                        const target = spot((["airbox", "radiator", "plugs"] as const)[i]);
                        const k = ease((t + 6) / 8);
                        return (
                          <div key={id} style={{ position: "absolute", left: target.x + 60 + 200 * (1 - k), top: target.y - 40, width: 220, height: 110, filter: "url(#paper-2)" }}>
                            <svg viewBox="0 0 260 120" style={{ width: "100%", height: "100%" }}>
                              <rect x={130} y={30} width={130} height={60} rx={14} fill={STORY.greyOverall} />
                              <path d="M 140 30 Q 60 20 40 40 Q 18 60 40 80 Q 70 100 140 90 Z" fill={STORY.skin} />
                            </svg>
                          </div>
                        );
                      })
                    : null}
                  {/* Careless job: a wrench spins across, bolts tumble. */}
                  {scene.id === "careless" ? (
                    <>
                      <div style={{ position: "absolute", left: -200 + local * 22, top: 700 + Math.sin(local / 6) * 60, width: 360, height: 70, transform: `rotate(${local * 14}deg)`, filter: "url(#paper-1)" }}>
                        <svg viewBox="0 0 360 70" style={{ width: "100%", height: "100%" }}>
                          <rect x={40} y={22} width={280} height={26} rx={13} fill={STORY.steel} />
                          <circle cx={36} cy={35} r={34} fill={STORY.steel} />
                          <circle cx={36} cy={35} r={14} fill="#16171a" />
                        </svg>
                      </div>
                      {Array.from({ length: 9 }, (_, i) => {
                        const tt = Math.max(0, local - i * 3);
                        return <div key={i} style={{ position: "absolute", left: 300 + i * 70, top: 760 + tt * tt * 0.6, width: 34, height: 34, borderRadius: 6, background: STORY.steelDark, transform: `rotate(${tt * 20}deg)` }} />;
                      })}
                      <div style={{ position: "absolute", left: 640, top: 380, width: 280, height: 747 }}>
                        <Figure role="rogue" frame={frame} armL={10} armR={-70 + 40 * Math.sin(local / 3)} mood="smirk" />
                      </div>
                    </>
                  ) : null}
                  {scene.id === "hose" ? <Spray t={T("hose")} x={spot("hose").x + 30} y={spot("hose").y - 30} scale={0.8} /> : null}
                </>
              );
            })()}
          </Layer>
        </>
      ) : null}

      {/* ---------------- DASHBOARD ---------------- */}
      {scene.id === "dash" ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#0b0c0e" }} />
          <Layer cam={cmS} depth={1}>
            <div style={{ position: "absolute", left: 40, top: 640, width: 1000, height: 578 }}>
              <Cluster checkOn={frame >= c("checkLight") + 4 ? (Math.floor(local / 6) % 4 === 3 ? 0.6 : 1) : 0} rpm={0.15 + 0.05 * Math.sin(frame / 2)} />
            </div>
          </Layer>
        </>
      ) : null}

      {/* ---------------- THE BILL ---------------- */}
      {scene.id === "bill" ? (
        <Layer cam={cmS} depth={1}>
          <div style={{ position: "absolute", left: 160, top: 990, width: 800, height: 329, opacity: 0.95 }}>
            <SedanSide wheelTurn={0} dirty />
          </div>
          <Smoke t={local + 40} x={820} y={1080} width={600} dark />
          <div style={{ position: "absolute", left: 600, top: 420, width: 300, height: 833, transform: `rotate(4deg) scale(${0.55 + 0.45 * ease(local / 30) + 0.02 * Math.sin(frame / 3)})`, transformOrigin: "50% 0%", filter: "url(#paper-3)" }}>
            <Invoice unroll={1} total="" totalLabel="" showTotal={false} />
          </div>
          <div style={{ position: "absolute", left: 40, top: 620, width: 260, height: 693 }}>
            <Figure role="customer" frame={frame} armL={150} armR={150} mood="shock" />
          </div>
        </Layer>
      ) : null}

      {/* ---------------- DOKTERMOBIL SETS ---------------- */}
      {clean ? (
        <>
          <Layer cam={cmS} depth={0.35} blur={1.5}>
            <CleanBack />
          </Layer>
          <Layer cam={cmS} depth={0.6} blur={0.6}>
            <CleanMid />
          </Layer>
        </>
      ) : null}

      {scene.id === "welcome" ? (
        <Layer cam={cmS} depth={1}>
          <div style={{ position: "absolute", left: 260, top: 980, width: 800, height: 329 }}>
            <SedanSide wheelTurn={0} />
          </div>
          <div style={{ position: "absolute", left: 30, top: 500, width: 300, height: 800 }}>
            <Figure role="domo" frame={frame} armL={10} armR={120 + 15 * Math.sin(local / 4)} mood="smile" />
          </div>
        </Layer>
      ) : null}

      {scene.id === "port" ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#141518" }} />
          <Layer cam={cmS} depth={1}>
            <div style={{ position: "absolute", left: 40, top: 600, width: 1000, height: 600 }}>
              <ObdPort plug={local / 18} />
            </div>
          </Layer>
        </>
      ) : null}

      {scene.id === "scanner" ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 45%, #ffffff 0%, ${STORY.cleanWallShade} 100%)` }} />
          <Layer cam={cmS} depth={1}>
            <div style={{ position: "absolute", left: 300, top: 420, width: 480, height: 700, filter: "url(#paper-1)" }}>
              <ObdScanner t={frame} ok={Math.min(1, Math.max(0, (frame - c("scan") - 6) / 6))} />
            </div>
          </Layer>
        </>
      ) : null}

      {scene.id === "lift" || scene.id === "work" ? (
        <Layer cam={cmS} depth={1}>
          {(() => {
            const rise = scene.id === "lift" ? ease(local / 24) : 1;
            const carY = 1000 - 280 * rise;
            const pts: { id: string; x: number; y: number }[] = [
              { id: "pt1", x: 400, y: carY + 210 },
              { id: "pt2", x: 830, y: carY + 210 },
              { id: "pt3", x: 900, y: carY + 120 },
              { id: "pt4", x: 640, y: carY + 290 },
              { id: "pt5", x: 560, y: carY + 80 },
              { id: "pt6", x: 300, y: carY + 300 },
            ];
            return (
              <>
                <Lift rise={rise} />
                <div style={{ position: "absolute", left: 160, top: carY, width: 760, height: 313 }}>
                  <SedanSide wheelTurn={0} />
                </div>
                {scene.id === "lift"
                  ? pts.map((p, i) => <PointChip key={p.id} x={p.x} y={p.y} t={T(p.id) - (i % 3) * 3} text={copy(p.id)} />)
                  : null}
                {scene.id === "work" ? (
                  <>
                    <div style={{ position: "absolute", left: 600, top: 640, width: 280, height: 747 }}>
                      <Figure role="domo" frame={frame} armL={10} armR={150 + 12 * Math.sin(local / 3)} mood="smile" />
                    </div>
                    <div style={{ position: "absolute", left: 40, top: 680, width: 250, height: 667 }}>
                      <Figure role="customer" frame={frame} armL={10} armR={-10} mood="smile" nod={Math.sin(local / 5) * 0.5} />
                    </div>
                  </>
                ) : null}
              </>
            );
          })()}
        </Layer>
      ) : null}

      {scene.id === "form" ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, #ffffff 0%, ${STORY.cleanWallShade} 100%)` }} />
          <Layer cam={cmS} depth={1}>
            <Cutout place={{ x: 540, y: 820, rot: -1.5 }} t={local + 2} width={900} height={900} seed={2} enter="drop" sway={0.2}>
              <FormSheet
                title={copy("formTitle")}
                titleT={T("formTitle")}
                rows={[
                  { text: copy("f1"), t: T("f1") },
                  { text: copy("f2"), t: T("f2") - 6 },
                  { text: copy("f3"), t: T("f3") },
                ]}
                signT={T("sign")}
              />
            </Cutout>
          </Layer>
        </>
      ) : null}

      {/* ---------------- REGRET (rain, worse smoke, empty wallet, clock) ---------------- */}
      {scene.id === "regret" ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,20,40,0.35)" }} />
          <Layer cam={cmS} depth={1}>
            <div style={{ position: "absolute", left: 220, top: 990, width: 800, height: 329 }}>
              <SedanSide wheelTurn={0} dirty />
            </div>
            <Smoke t={local + 40 + Math.max(0, frame - c("worse")) * 2} x={900} y={1080} width={frame >= c("worse") ? 780 : 560} dark />
            <div style={{ position: "absolute", left: 40, top: 640, width: 250, height: 667 }}>
              <Figure role="customer" frame={frame} armL={40} armR={-40} mood="worried" nod={-0.6} />
            </div>
            <Cutout place={{ x: 360, y: 520, rot: -8 }} t={T("money")} width={280} height={205} seed={1} enter="drop">
              <Wallet open={Math.min(1, Math.max(0, T("money")) / 10)} />
            </Cutout>
            <Cutout place={{ x: 760, y: 500, rot: 6 }} t={T("time")} width={230} height={230} seed={2} enter="pop">
              <Clock t={Math.max(0, T("time"))} />
            </Cutout>
          </Layer>
          <Rain t={frame} />
        </>
      ) : null}

      {/* ---------------- DOKTERMOBIL STOREFRONT ---------------- */}
      {scene.id === "facade" || scene.id === "payoff" ? (
        <>
          <Layer cam={cmS} depth={0.5}>
            <Facade logo={staticFile(BRAND_ASSETS.logo)} />
          </Layer>
          <Layer cam={cmS} depth={1}>
            {(() => {
              const k = scene.id === "facade" ? ease(local / Math.max(1, scene.to - scene.from)) : ease(local / 90);
              const x = scene.id === "facade" ? -760 + 980 * k : 200 + 620 * k;
              return (
                <>
                  <div style={{ position: "absolute", left: x, top: 1010, width: 800, height: 329 }}>
                    <SedanSide wheelTurn={x * 1.4} bob={Math.sin(frame / 3) * 2} speed={0.4} />
                  </div>
                  {scene.id === "payoff" ? (
                    <div style={{ position: "absolute", left: 60, top: 680, width: 250, height: 667 }}>
                      <Figure role="domo" frame={frame} armL={10} armR={140 + 12 * Math.sin(local / 3)} mood="smile" />
                    </div>
                  ) : null}
                </>
              );
            })()}
          </Layer>
          {scene.id === "payoff" ? <TitleStrip t={T("payTitle")} text={copy("payTitle")} /> : null}
        </>
      ) : null}

      {/* ---------------- EXPLAIN FINDINGS ---------------- */}
      {scene.id === "explain" ? (
        <Layer cam={cmS} depth={1}>
          <div style={{ position: "absolute", left: 60, top: 680, width: 260, height: 693 }}>
            <Figure role="domo" frame={frame} armL={10} armR={70 + 10 * Math.sin(local / 4)} mood="smile" />
          </div>
          <div style={{ position: "absolute", left: 780, top: 700, width: 250, height: 667 }}>
            <Figure role="customer" frame={frame} armL={10} armR={-10} mood="smile" nod={frame >= c("skipHead") ? Math.sin(local / 4) * 0.6 : 0} />
          </div>
          <Cutout place={{ x: 560, y: 560, rot: -1 }} t={T("talk") + 4} width={800} height={420} seed={3} enter="drop" sway={0.3}>
            <FindingsTablet
              needHead={copy("needHead")}
              skipHead={copy("skipHead")}
              needT={T("needHead")}
              skipT={T("skipHead")}
              need={[{ text: copy("need1"), t: T("need1") }]}
              skip={[
                { text: copy("skip1"), t: T("skip1") },
                { text: copy("skip2"), t: T("skip2") - 5 },
              ]}
            />
          </Cutout>
        </Layer>
      ) : null}

      {/* Atmosphere: dust in the rogue shop's lamp, sparkle in the clean one. */}
      {grime && scene.id !== "regret" ? <Motes frame={frame} kind="dust" /> : null}
      {clean || scene.id === "payoff" || scene.id === "facade" ? <Motes frame={frame} kind="sparkle" /> : null}

      {/* ---------------- CTA ---------------- */}
      {scene.id === "cta" ? (
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, #ffffff 0%, ${STORY.cleanWallShade} 100%)` }}>
          {(() => {
            const p1 = pop(local, 14);
            const p2 = pop(local - 8, 14);
            const p3 = pop(local - 14, 14);
            const centerX = SAFE_AREA.x + SAFE_AREA.width / 2;
            return (
              <>
                <div style={{ position: "absolute", left: centerX - 330, top: 560, width: 660, height: 300, background: "#ffffff", borderRadius: 32, boxShadow: "0 18px 40px rgba(20,30,40,0.18)", transform: `scale(${0.85 + 0.15 * p1})`, opacity: Math.min(1, p1 * 2), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Img src={staticFile(BRAND_ASSETS.logo)} style={{ width: 520 }} />
                </div>
                <div style={{ position: "absolute", left: SAFE_AREA.x, width: SAFE_AREA.width, top: 920, textAlign: "center", fontFamily: FONTS.body, fontWeight: FONT_WEIGHTS.extrabold, fontSize: 46, whiteSpace: "nowrap", color: PAPER.ink, opacity: Math.min(1, p2 * 2), transform: `translateY(${(1 - p2) * 20}px)` }}>
                  {copy("book")}
                </div>
                <div style={{ position: "absolute", left: SAFE_AREA.x, width: SAFE_AREA.width, top: 995, textAlign: "center", fontFamily: FONTS.body, fontWeight: FONT_WEIGHTS.bold, fontSize: 44, color: STORY.brandRed, opacity: Math.min(1, p3 * 2) }}>
                  {ep.handle}
                </div>
              </>
            );
          })()}
        </div>
      ) : null}

     </div>
      {/* Grade per world. */}
      {grime || ["bay", "careless", "hose", "dash"].includes(scene.id) ? <Grade kind="grime" /> : null}
      {clean ? <Grade kind="clean" strength={0.8} /> : null}

      {/* Brand wipe from the rogue shop into the Doktermobil shop. */}
      {wipeK > 0 && wipeK < 1 ? (
        <div
          style={{
            position: "absolute",
            left: -400,
            top: -200,
            width: 1880,
            height: 2320,
            background: STORY.brandRed,
            transform: `rotate(-14deg) translateX(${(-1 + 2 * wipeK) * 1900}px)`,
          }}
        />
      ) : null}
    </div>
  );
};
