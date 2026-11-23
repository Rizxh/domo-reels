// Shot names of every "soft" world, as plain data so scripts (soft:check,
// soft:voice) can validate episodes without loading React or fonts. Each
// world module must define exactly these shots.

export const SOFT_WORLD_SHOTS: Record<string, string[]> = {
  // Street -> under the hood: the camera glides from the sky down to the road
  // and into an x-ray "inside the car" layer. EP08 (airbag) shots.
  jalan: ["ab-hook", "ab-sensor", "ab-gas", "ab-blink", "ab-lives", "ab-belt", "ab-distance", "outro"],
  // 16:9 incident explainer ("Kejadian" series): dark/cream boards, split
  // layout 60/40, maps, timelines, quote cards. EP09 shots.
  // EP10 (Kejadian #2, no voice over) adds the k2-* shots and reuses k-label.
  kasus: ["k-hook", "k-label", "k-where", "k-hit", "k-timeline", "k-statement", "k-lesson", "k2-hook", "k2-where", "k2-diff", "k2-exam", "k2-statement", "k2-lesson"],
};
