import { Img, staticFile, useCurrentFrame } from "remotion";
import type { CinemaEpisode } from "../cinemaSchema";
import { cue, type CueMap } from "../cinema/timeline";
import { BRAND_ASSETS, FONT_WEIGHTS, FONTS, PAPER } from "../lib/brand";
import { Bubble, Card, Cutout, MarkerPath, MarkerTitle, Note, pop, Stamp } from "./kit";
import { Car, Invoice, Magnifier, Person } from "./props";

const point = (col: number, row: number) => ({ x: col * 1080, y: row * 1920 });
const panels = { hook: point(0, 0), problem: point(1, 0), diagnose: point(0, 1), checklist: point(1, 1), estimate: point(0, 2), cta: point(1, 2) };
const board = { w: 2160, h: 5760 };

const Check: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <MarkerPath d="M 8 34 L 26 54 L 58 10" viewBox="0 0 64 64" t={t} frames={7} color={PAPER.inkGreen} width={10} style={{ left: x, top: y, width: 64, height: 64 }} />
);

export const diagnosisShots = (cues: CueMap) => {
  const c = (id: string) => cue(cues, id);
  return [
    { from: 0, to: c("problem:start"), panel: panels.hook, zoom: 1.08 },
    { from: c("problem:start"), to: c("diagnose:start"), panel: panels.problem, zoom: 1.04 },
    { from: c("diagnose:start"), to: c("checklist:start"), panel: panels.diagnose, zoom: 1.04 },
    { from: c("checklist:start"), to: c("estimate:start"), panel: panels.checklist, zoom: 1.05 },
    { from: c("estimate:start"), to: c("cta:start"), panel: panels.estimate, zoom: 1.05 },
    { from: c("cta:start"), to: c("end"), panel: panels.cta, zoom: 1.06 },
  ];
};

export const DiagnosisBoard: React.FC<{ ep: CinemaEpisode; cues: CueMap }> = ({ ep, cues }) => {
  const frame = useCurrentFrame();
  const c = (id: string) => cue(cues, id);
  const T = (id: string) => frame - c(id);
  const copy = (id: string) => ep.beats.flatMap((b) => b.texts).find((t) => t.id === id)?.text ?? "";
  const shots = diagnosisShots(cues);
  const shot = shots.find((s) => frame < s.to) ?? shots[shots.length - 1];
  const p = shot.panel; const zoom = shot.zoom + 0.025 * Math.sin(frame / 35);
  const transform = `translate(${540 - (p.x + 540) * zoom}px, ${960 - (p.y + 960) * zoom}px) scale(${zoom})`;
  const card = (p: {x:number;y:number}, seed: number) => <Card x={p.x + 55} y={p.y + 290} w={970} h={1050} rot={seed % 2 ? 0.7 : -0.6} seed={seed} />;
  const blink = 0.7 + 0.3 * Math.sin(frame / 4);
  return <div style={{ position: "absolute", width: board.w, height: board.h, transformOrigin: "0 0", transform }}>
    <div style={{ position: "absolute", inset: -1200, background: `radial-gradient(circle at 35% 20%, #fff 0%, ${PAPER.board} 58%, #e9e5dc 100%)` }} />
    {/* Hook: warning light, vibration, and a fast visual question. */}
    {card(panels.hook, 0)}
    <Note x={panels.hook.x + 110} y={panels.hook.y + 340} t={frame} text={ep.tag} size={32} color={PAPER.inkRed} weight={FONT_WEIGHTS.bold} />
    <MarkerTitle x={panels.hook.x + 105} y={panels.hook.y + 440} width={860} t={T("hookTitle")} text={copy("hookTitle")} size={112} />
    <Cutout place={{ x: panels.hook.x + 190, y: panels.hook.y + 890, rot: Math.sin(frame / 2) * 1.2 }} t={T("checkLight")} width={700} height={285} seed={1} enter="pop" sway={0}>
      <Car wheelTurn={frame * 5} hoodOpen={0.25} />
    </Cutout>
    <div style={{ position:"absolute", left:panels.hook.x+250, top:panels.hook.y+710, width:560, padding:"24px 20px", borderRadius:18, background:"#2a2720", color:"#ffd84d", fontFamily:FONTS.headline, fontSize:64, textAlign:"center", opacity: Math.max(0, Math.min(1,T("checkLight")/8))*blink, boxShadow:"0 12px 0 rgba(0,0,0,.14)" }}>{copy("checkLight")}</div>
    <Bubble place={{x:panels.hook.x+565,y:panels.hook.y+1160,rot:3}} t={T("hookTitle")+10} text="GANTI SEMUA?" width={380} tail="right" color={PAPER.inkRed}/>

    {/* Problem: receipt grows beyond the card and is rejected. */}
    {card(panels.problem, 1)}
    <MarkerTitle x={panels.problem.x+120} y={panels.problem.y+390} width={800} t={T("bill")} text="NOTA MEMBENGKAK" size={102}/>
    <Cutout place={{x:panels.problem.x+390,y:panels.problem.y+690,rot:2,scale:1+Math.max(0,Math.min(1,T("bill")/32))*0.2}} t={T("bill")} width={410} height={980} seed={2} enter="drop" sway={0}><Invoice unroll={Math.max(0,Math.min(1,T("bill")/28))} total={copy("bill")} totalLabel="CONTOH TAGIHAN" showTotal /></Cutout>
    <Stamp place={{x:panels.problem.x+130,y:panels.problem.y+1120,rot:-10}} t={T("notNeeded")} text={copy("notNeeded")}/>

    {/* Diagnosis: magnifier scans engine rather than guessing. */}
    {card(panels.diagnose, 2)}
    <MarkerTitle x={panels.diagnose.x+135} y={panels.diagnose.y+395} width={760} t={T("scanTitle")} text={copy("scanTitle")} size={126} underline={PAPER.inkBlue}/>
    <Cutout place={{x:panels.diagnose.x+180,y:panels.diagnose.y+920}} t={T("scanTitle")+5} width={700} height={285} seed={3} enter="slideLeft" sway={0}><Car wheelTurn={0} hoodOpen={1}/></Cutout>
    <Cutout place={{x:panels.diagnose.x+570+80*Math.sin(Math.max(0,T("scanTitle"))/9),y:panels.diagnose.y+680}} t={T("scanTitle")+10} width={270} height={270} seed={0} enter="pop" sway={0}><Magnifier/></Cutout>
    <div style={{position:"absolute",left:panels.diagnose.x+175,top:panels.diagnose.y+1220,width:720,padding:"18px",background:PAPER.inkBlue,color:"white",fontFamily:FONTS.body,fontWeight:800,fontSize:48,textAlign:"center",borderRadius:14,opacity:pop(T("scanResult"))}}>{copy("scanResult")} ✓</div>

    {/* Proof: counter and twelve checks provide visual rhythm. */}
    {card(panels.checklist, 3)}
    <MarkerTitle x={panels.checklist.x+130} y={panels.checklist.y+400} width={800} t={T("counter")} text="CEK MENYELURUH" size={110}/>
    <div style={{position:"absolute",left:panels.checklist.x+215,top:panels.checklist.y+610,width:650,height:350,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONTS.headline,fontSize:220,color:PAPER.inkRed,transform:`scale(${0.65+0.35*pop(T("counter"))})`}}>{copy("counter")}</div>
    {Array.from({length:12},(_,i)=><div key={i} style={{position:"absolute",left:panels.checklist.x+190+(i%3)*250,top:panels.checklist.y+1010+Math.floor(i/3)*92,width:210,height:70,fontFamily:FONTS.body,fontWeight:700,fontSize:29,color:PAPER.ink}}><Check x={0} y={0} t={T("counter")-i*3}/><span style={{marginLeft:72}}>TITIK {i+1}</span></div>)}

    {/* Estimate: only the failed part is charged. */}
    {card(panels.estimate, 4)}
    <MarkerTitle x={panels.estimate.x+120} y={panels.estimate.y+390} width={820} t={T("estimateTitle")} text={copy("estimateTitle")} size={112}/>
    <div style={{position:"absolute",left:panels.estimate.x+145,top:panels.estimate.y+650,width:790,height:640,background:"#fff",boxShadow:"0 12px 24px rgba(0,0,0,.16)",borderRadius:20,padding:"42px",fontFamily:FONTS.body,color:PAPER.ink}}>
      {[['Sensor oksigen','Rp185.000',PAPER.inkRed],['Oli mesin','Rp100.000',PAPER.ink],['Busi','Rp0 • MASIH LAYAK',PAPER.inkGreen]].map(([a,b,color],i)=><div key={a} style={{display:"flex",justifyContent:"space-between",marginBottom:36,fontSize:40,fontWeight:700,opacity:pop(T("estimateTitle")-8-i*8),color}}><span>{a}</span><span>{b}</span></div>)}
      <div style={{borderTop:`4px dashed ${PAPER.ink}`,paddingTop:28,display:"flex",justifyContent:"space-between",fontFamily:FONTS.headline,fontSize:76,color:PAPER.inkRed}}><span>TOTAL</span><span>{copy("total")}</span></div>
    </div>

    {/* CTA: brand card gives the viewer a clean stopping point. */}
    {card(panels.cta, 5)}
    <MarkerTitle x={panels.cta.x+115} y={panels.cta.y+490} width={850} t={T("ctaTitle")} text={copy("ctaTitle")} size={116} color={PAPER.inkRed}/>
    <Cutout place={{x:panels.cta.x+160,y:panels.cta.y+780,rot:-1}} t={T("ctaTitle")+8} width={760} height={520} seed={2} enter="drop" sway={0.2}><div style={{position:"absolute",inset:0,background:"white",borderRadius:30}}/><Img src={staticFile(BRAND_ASSETS.logo)} style={{position:"absolute",left:110,top:65,width:540}}/><div style={{position:"absolute",left:82,right:82,bottom:65,height:112,borderRadius:56,background:PAPER.inkRed,color:"white",fontFamily:FONTS.body,fontWeight:800,fontSize:44,display:"flex",alignItems:"center",justifyContent:"center",transform:`scale(${1+0.035*Math.sin(Math.max(0,T("book"))/5)})`}}>{copy("book")} →</div></Cutout>
    <Cutout place={{x:panels.cta.x+230,y:panels.cta.y+1370}} t={T("book")-4} width={210} height={382} seed={1} enter="slideLeft"><Person role="driver" mood="happy" armL={8} armR={120} frame={frame}/></Cutout>
  </div>;
};
