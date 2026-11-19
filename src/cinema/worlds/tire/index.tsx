// World definition of the tire world: look, shots, state, anchors, picture
// sound cues. The composition only talks to this interface.

import { useMemo } from "react";
import type { CinemaEpisode } from "../../../cinemaSchema";
import type { Shot, Vec3 } from "../../rig";
import { cue, type CueMap } from "../../timeline";
import type { SoundCue, WorldDef } from "../types";
import { STAGE_LOOK } from "./look";
import { buildTireShots, digitPairCorners, tireAnchor, tireStateAt, type TireState } from "./shots";
import type { SidewallCopy } from "./textures";
import { TireWorld } from "./TireWorld";

// Generic sidewall markings (part of the asset, no brand). Only the date
// digits come from the episode.
const sidewallCopy = (ep: CinemaEpisode): SidewallCopy => {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (!ep.dateCode) {
    throw new Error(`${ep.id}: the tire world needs a dateCode`);
  }
  return {
    size: "205/55 R16 91V",
    construction: ["TUBELESS", "RADIAL"],
    limits: "MAX LOAD 615 KG (1356 LBS)   MAX PRESS 350 kPa (51 PSI)",
    dotPrefix: "DOT B7 3F 9XR",
    date: `${pad(ep.dateCode.week)}${pad(ep.dateCode.year % 100)}`,
  };
};

// Sounds that belong to the picture (not to a text).
const tireSounds = (cues: CueMap, shots: readonly Shot[]): SoundCue[] => {
  const c = (n: string) => cue(cues, n);
  const at = (name: string) => shots.find((s) => s.name.startsWith(name))?.from ?? 0;
  const ticks: SoundCue[] = [];
  // Time lapse: the clock runs fast.
  for (let f = c("aging:start"); f < c("hard"); f += 4) {
    ticks.push({ at: f, sfx: "tick", gain: 0.7 });
  }
  return [
    { at: 0, sfx: "boom", gain: 0.6 },
    { at: at("2 ") - 8, sfx: "whoosh", gain: 0.7 },
    ...ticks,
    { at: c("hard"), sfx: "crackle", gain: 0.6 },
    // After the word, never on it: a crackle on "retak" masked the word.
    { at: c("crack") + 12, sfx: "crackle", gain: 0.6 },
    { at: c("grip") - 6, sfx: "whoosh", gain: 0.6 },
    { at: c("grip"), sfx: "hiss", loopUntil: c("decode:start") },
    { at: c("age"), sfx: "boom", gain: 1 },
    { at: c("age"), sfx: "slam", gain: 0.8 },
    { at: c("ctaMacro") - 6, sfx: "whoosh", gain: 0.45 },
  ];
};

const TireScene: React.FC<{ state: TireState; frame: number; episode: CinemaEpisode }> = ({ state, episode }) => {
  const copy = useMemo(() => sidewallCopy(episode), [episode]);
  return <TireWorld state={state} copy={copy} />;
};

export const TIRE_WORLD: WorldDef<TireState> = {
  look: STAGE_LOOK,
  shots: buildTireShots,
  state: (cues, frame) => tireStateAt(cues, frame),
  anchor: (name: string, state: TireState): Vec3 | null => tireAnchor(name, state),
  region: (name: string, state: TireState): Vec3[] | null =>
    name === "weekDigits" ? digitPairCorners("week", state) : name === "yearDigits" ? digitPairCorners("year", state) : null,
  sounds: tireSounds,
  Scene: TireScene,
  // The reveal: riser ends here, resolve starts here.
  music: {
    hit: "age",
    build: "audio/bgm/ep03-build.wav",
    riser: "audio/bgm/ep03-riser.wav",
    resolve: "audio/bgm/ep03-resolve.wav",
  },
};
