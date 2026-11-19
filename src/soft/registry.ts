// Shot names of every "soft" world, as plain data so scripts (soft:check,
// soft:voice) can validate episodes without loading React or fonts. Each
// world module must define exactly these shots.

export const SOFT_WORLD_SHOTS: Record<string, string[]> = {
  // Street -> under the hood: the camera glides from the sky down to the road
  // and into an x-ray "inside the car" layer. EP08 (airbag) shots.
  jalan: ["ab-hook", "ab-sensor", "ab-gas", "ab-blink", "ab-lives", "ab-belt", "ab-distance", "outro"],
};
