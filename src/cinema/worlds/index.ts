// Registry of cinema worlds, keyed by the episode's `world`.

import type { CinemaEpisode } from "../../cinemaSchema";
import { BRAKE_WORLD } from "./brake";
import { ENGINE_WORLD } from "./engine";
import { TIRE_WORLD } from "./tire";
import type { WorldDef } from "./types";

// Each world has its own state type; the composition treats it as opaque.
// 3D worlds only; "board" episodes render with the 2D Paper2D composition.
export const WORLDS: Record<Exclude<CinemaEpisode["world"], "board" | "story">, WorldDef<unknown>> = {
  tire: TIRE_WORLD as WorldDef<unknown>,
  engine: ENGINE_WORLD as WorldDef<unknown>,
  brake: BRAKE_WORLD as WorldDef<unknown>,
};
