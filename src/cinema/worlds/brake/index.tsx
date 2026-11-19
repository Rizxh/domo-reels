// World definition of the brake world (EP07). Look, shots, state, anchors and
// picture sound cues; the composition only talks to this interface.

import type { Shot, Vec3 } from "../../rig";
import { cue, type CueMap } from "../../timeline";
import type { SoundCue, WorldDef } from "../types";
import { BrakeWorld } from "./BrakeWorld";
import { BRAKE_LOOK } from "./look";
import { brakeAnchor, brakeStateAt, buildBrakeShots, type BrakeState } from "./shots";

// Sounds that belong to the picture (not to a text). Never place a hit on a
// word that must be heard: the tire world learned this with "retak". Hits land
// a few frames after the cue, and the heat hiss clears before "memerah".
const brakeSounds = (cues: CueMap, shots: readonly Shot[]): SoundCue[] => {
  const c = (n: string) => cue(cues, n);
  const at = (prefix: string) => shots.find((s) => s.name.startsWith(prefix))?.from ?? 0;
  const hissFrom = c("heatUp") + 8;
  const hissTo = Math.max(hissFrom + 4, c("red") - 10);
  return [
    // Opening reveal.
    { at: 0, sfx: "boom", gain: 0.5 },
    { at: at("2 ") - 6, sfx: "whoosh", gain: 0.6 },
    // Pads bite, after "Kampas dan cakram" so both words stay audible.
    { at: c("padHot") + 10, sfx: "slam", gain: 0.4 },
    { at: c("padHot") + 16, sfx: "crackle", gain: 0.3 },
    // Heat builds under the friction macro; low, and gone before the reveal.
    { at: hissFrom, sfx: "hiss", gain: 0.26, loopUntil: hissTo },
    // The reveal: a soft hit on the word, the slam lands after it.
    { at: c("red"), sfx: "boom", gain: 0.5 },
    { at: c("red") + 8, sfx: "slam", gain: 0.45 },
    // Pull back to the fading brakes.
    { at: at("10") - 5, sfx: "whoosh", gain: 0.55 },
    { at: c("bite") + 10, sfx: "crackle", gain: 0.28 },
    // Solution and CTA.
    { at: at("13") - 4, sfx: "whoosh", gain: 0.5 },
    { at: c("book"), sfx: "bell", gain: 0.3 },
  ];
};

export const BRAKE_WORLD: WorldDef<BrakeState> = {
  look: BRAKE_LOOK,
  shots: buildBrakeShots,
  state: (cues, frame) => brakeStateAt(cues, frame),
  anchor: (name: string): Vec3 | null => brakeAnchor(name),
  region: () => null,
  sounds: brakeSounds,
  Scene: ({ state, frame }) => <BrakeWorld state={state} frame={frame} />,
  music: {
    hit: "red",
    build: "audio/bgm/ep07-build.wav",
    riser: "audio/bgm/ep07-riser.wav",
    resolve: "audio/bgm/ep07-resolve.wav",
  },
};
