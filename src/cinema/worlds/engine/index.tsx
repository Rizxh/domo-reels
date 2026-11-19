// World definition of the engine world (EP04).

import type { Shot, Vec3 } from "../../rig";
import { cue, type CueMap } from "../../timeline";
import type { SoundCue, WorldDef } from "../types";
import { EngineWorld } from "./EngineWorld";
import { ANCHORS, ENGINE_LOOK } from "./layout";
import { buildEngineShots, engineStateAt, type EngineState } from "./shots";

// Pump display markings: part of the asset (generic dispenser UI).
const PUMP_LABELS = ["TOTAL", "LITER"] as const;

const engineSounds = (cues: CueMap, shots: readonly Shot[]): SoundCue[] => {
  const c = (n: string) => cue(cues, n);
  const at = (prefix: string) => shots.find((s) => s.name.startsWith(prefix))?.from ?? 0;
  const ticks: SoundCue[] = [];
  // Pump counter ticking under the opening shot.
  for (let f = 2; f < c("pumpCut"); f += 3) {
    ticks.push({ at: f, sfx: "tick", gain: 0.45 });
  }
  return [
    ...ticks,
    { at: at("3 ") , sfx: "boom", gain: 0.55 },
    { at: at("4 ") - 6, sfx: "whoosh", gain: 0.6 },
    { at: c("burn") + 10, sfx: "crackle", gain: 0.5 },
    { at: at("12") - 4, sfx: "whoosh", gain: 0.7 },
    { at: c("price"), sfx: "slam", gain: 0.7 },
    { at: c("price"), sfx: "boom", gain: 0.6 },
  ];
};

export const ENGINE_WORLD: WorldDef<EngineState> = {
  look: ENGINE_LOOK,
  shots: buildEngineShots,
  state: (cues, frame, shots) => engineStateAt(cues, frame, shots),
  anchor: (name: string): Vec3 | null => ANCHORS[name] ?? null,
  region: () => null,
  sounds: engineSounds,
  Scene: ({ state, frame }) => <EngineWorld state={state} frame={frame} pumpLabels={PUMP_LABELS} />,
  music: {
    hit: "price",
    build: "audio/bgm/ep04-build.wav",
    riser: "audio/bgm/ep04-riser.wav",
    resolve: "audio/bgm/ep04-resolve.wav",
  },
};
