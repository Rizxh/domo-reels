// Interface every cinema world implements; the composition only talks to it.

import type { CinemaEpisode } from "../../cinemaSchema";
import type { SfxName } from "../../lib/sfx";
import type { LookConfig } from "../Stage3D";
import type { Shot, Vec3 } from "../rig";
import type { CueMap } from "../timeline";

export type SoundCue = { at: number; sfx: SfxName; gain?: number; loopUntil?: number };

export type WorldDef<S> = {
  look: LookConfig;
  shots: (cues: CueMap) => Shot[];
  state: (cues: CueMap, frame: number, shots: readonly Shot[]) => S;
  anchor: (name: string, state: S) => Vec3 | null;
  // World corners of a named region (highlight boxes), or null.
  region: (name: string, state: S) => Vec3[] | null;
  sounds: (cues: CueMap, shots: readonly Shot[]) => SoundCue[];
  Scene: React.FC<{ state: S; frame: number; episode: CinemaEpisode }>;
  // Original music: the build runs until `hit`, a riser ends on it, the
  // resolve starts on it.
  music: { hit: string; build: string; riser: string; resolve: string };
};
