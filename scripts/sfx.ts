// Synthesizes the explainer sound effects with ffmpeg: oscillators, seeded
// noise and envelopes only, so the output is identical on every run and
// carries no third-party license.
//
//   npm run sfx

import { mkdirSync } from "node:fs";
import path from "node:path";
import { SFX, WHOOSH_PEAK_SECONDS, type SfxName } from "../src/lib/sfx";
import { PUBLIC_DIR, rel, run, runMain, ScriptError } from "./lib/common";

const SAMPLE_RATE = 48000;
// Seconds the hum file loops over. Every frequency in its recipe is a whole
// number of cycles in this length, so the loop has no seam.
const HUM_LOOP_SECONDS = 4;

// One ffmpeg filter graph per effect; each must end in a stream named [out].
// Swept tones integrate their frequency so the pitch glides without clicks:
// f(t) = lo + (hi - lo) * exp(-k t)  ->  phase = 2 pi (lo t + (hi - lo) / k (1 - exp(-k t))).
const RECIPES: Record<SfxName, string> = {
  ignite: [
    // Spark: a 40 ms burst of bright noise.
    "anoisesrc=d=0.05:c=white:seed=11:a=0.7,highpass=f=2800,afade=t=out:st=0:d=0.04:curve=exp[snap]",
    // Thump: a sine falling from 150 Hz to 42 Hz.
    "aevalsrc='0.9*sin(2*PI*(42*t+(108/14)*(1-exp(-14*t))))*exp(-5.5*t)':d=0.9:s=48000[thump]",
    // Body: low rumble of the burning charge.
    "anoisesrc=d=0.7:c=brown:seed=5:a=0.9,lowpass=f=320,afade=t=out:st=0:d=0.7:curve=exp,adelay=12[body]",
    "[snap][thump][body]amix=inputs=3:normalize=0,alimiter=limit=0.9[out]",
  ].join(";"),
  whoosh: [
    `anoisesrc=d=0.85:c=pink:seed=3:a=0.8,highpass=f=180,lowpass=f=2600,afade=t=in:st=0:d=${WHOOSH_PEAK_SECONDS}:curve=qsin,afade=t=out:st=${WHOOSH_PEAK_SECONDS}:d=0.35:curve=qsin,volume=9dB[out]`,
  ].join(";"),
  hum: [
    // Firing-rate harmonics with a slow pulse, low-passed into a drone.
    `aevalsrc='(0.34*sin(2*PI*48*t)+0.2*sin(2*PI*96*t+1)+0.11*sin(2*PI*144*t+2)+0.05*sin(2*PI*192*t+3))*(0.86+0.14*sin(2*PI*6*t))':d=${HUM_LOOP_SECONDS}:s=48000,lowpass=f=480[out]`,
  ].join(";"),
  slam: [
    "aevalsrc='0.95*sin(2*PI*(55*t+(65/18)*(1-exp(-18*t))))*exp(-6*t)':d=0.7:s=48000[low]",
    "anoisesrc=d=0.03:c=white:seed=21:a=0.5,highpass=f=1500,afade=t=out:st=0:d=0.025:curve=exp[click]",
    "[low][click]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]",
  ].join(";"),
  pop: [
    "aevalsrc='0.6*sin(2*PI*(520*t+(480/40)*(1-exp(-40*t))))*exp(-42*t)':d=0.1:s=48000[out]",
  ].join(";"),
  tick: [
    // Woodblock: two damped partials plus a tiny noise click.
    "aevalsrc='(0.7*sin(2*PI*1850*t)+0.4*sin(2*PI*2960*t))*exp(-95*t)':d=0.08:s=48000[wood]",
    "anoisesrc=d=0.01:c=white:seed=31:a=0.4,highpass=f=3000[click]",
    "[wood][click]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]",
  ].join(";"),
  crackle: [
    // Sparse seeded impulses through a band-pass: rubber splitting.
    "anoisesrc=d=0.9:c=white:seed=41:a=1,highpass=f=900,lowpass=f=6000[n]",
    "aevalsrc='gt(sin(2*PI*37*t)*sin(2*PI*23*t+1)*sin(2*PI*11*t+2),0.35)*exp(-2.2*t)':d=0.9:s=48000[gate]",
    "[n][gate]amultiply,volume=6dB,alimiter=limit=0.9[out]",
  ].join(";"),
  hiss: [
    // Pink noise band (spray) with a slow wash; whole cycles in 4 s.
    `anoisesrc=d=${HUM_LOOP_SECONDS}:c=pink:seed=51:a=0.8,highpass=f=700,lowpass=f=7000,volume='0.75+0.25*sin(2*PI*1*t)':eval=frame,afade=t=in:st=0:d=0.02,afade=t=out:st=${HUM_LOOP_SECONDS - 0.02}:d=0.02[out]`,
  ].join(";"),
  marker: [
    // Band-passed noise in short strokes: felt tip on a whiteboard.
    "anoisesrc=d=0.5:c=white:seed=71:a=0.9,bandpass=f=3200:width_type=q:w=1.2[n]",
    "aevalsrc='(0.6+0.4*sin(2*PI*9*t))*(1-exp(-60*t))*exp(-2.6*t)*gt(sin(2*PI*5.5*t),-0.6)':d=0.5:s=48000[env]",
    "[n][env]amultiply,volume=4dB,alimiter=limit=0.9[out]",
  ].join(";"),
  paper: [
    // Soft slap plus a short rustle.
    "anoisesrc=d=0.25:c=pink:seed=81:a=0.9,highpass=f=400,lowpass=f=5000,afade=t=out:st=0:d=0.22:curve=exp[rustle]",
    "aevalsrc='0.7*sin(2*PI*(120*t+(140/30)*(1-exp(-30*t))))*exp(-28*t)':d=0.2:s=48000[slap]",
    "[rustle][slap]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]",
  ].join(";"),
  bell: [
    // Register bell: two bright partials ringing out after a drawer clunk.
    "aevalsrc='(0.5*sin(2*PI*2093*t)+0.35*sin(2*PI*3136*t)+0.2*sin(2*PI*4186*t))*exp(-3.5*t)':d=1.2:s=48000[ring]",
    "aevalsrc='0.6*sin(2*PI*(90*t))*exp(-25*t)':d=0.2:s=48000[clunk]",
    "[ring][clunk]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]",
  ].join(";"),
  boom: [
    "aevalsrc='0.95*sin(2*PI*(38*t+(52/9)*(1-exp(-9*t))))*exp(-3.2*t)':d=1.6:s=48000[sub]",
    "anoisesrc=d=0.4:c=brown:seed=61:a=0.8,lowpass=f=180,afade=t=out:st=0:d=0.4:curve=exp[rumble]",
    "[sub][rumble]amix=inputs=2:normalize=0,alimiter=limit=0.9[out]",
  ].join(";"),
};

const main = async () => {
  for (const [name, file] of Object.entries(SFX) as [SfxName, string][]) {
    const output = path.join(PUBLIC_DIR, file);
    mkdirSync(path.dirname(output), { recursive: true });
    const { code, stderr } = await run(
      "ffmpeg",
      [
        "-hide_banner",
        "-y",
        "-filter_complex",
        RECIPES[name],
        "-map",
        "[out]",
        "-ar",
        String(SAMPLE_RATE),
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        output,
      ],
      { capture: true },
    );
    if (code !== 0) {
      const tail = stderr.trim().split("\n").slice(-4).join("\n");
      throw new ScriptError(`ffmpeg failed on ${name}\n${tail}`);
    }
    console.log(`wrote ${rel(output)}`);
  }
};

runMain(main);
