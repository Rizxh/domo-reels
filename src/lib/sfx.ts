// Sound effects for the 3D explainers. Every file is synthesized from scratch
// by scripts/sfx.ts (`npm run sfx`), so there is no third-party audio to
// license. Keep this file free of Node-only imports: it is bundled.

export const SFX = {
  // Spark snap, then the low thump of one combustion.
  ignite: "audio/sfx/ignite.wav",
  // Air rush for the camera breaking out of or back into the engine.
  whoosh: "audio/sfx/whoosh.wav",
  // Engine drone under the engine shots; loops seamlessly.
  hum: "audio/sfx/hum.wav",
  // Low hit under a big number landing.
  slam: "audio/sfx/slam.wav",
  // Short soft blip for a text block opening.
  pop: "audio/sfx/pop.wav",
  // Clock tick (woodblock click) for the time lapse.
  tick: "audio/sfx/tick.wav",
  // Dry crackle of rubber splitting.
  crackle: "audio/sfx/crackle.wav",
  // Wet road hiss under a rolling tire; loops seamlessly.
  hiss: "audio/sfx/hiss.wav",
  // Deep sub hit for a hard cut or a reveal.
  boom: "audio/sfx/boom.wav",
  // Marker squeak-scribble on a whiteboard.
  marker: "audio/sfx/marker.wav",
  // Paper card slapped onto the board.
  paper: "audio/sfx/paper.wav",
  // Cash register bell.
  bell: "audio/sfx/bell.wav",
} as const;

export type SfxName = keyof typeof SFX;

// Linear gains under the voice over (VO is 1).
export const SFX_MIX = {
  ignite: 0.5,
  whoosh: 0.35,
  hum: 0.09,
  slam: 0.45,
  pop: 0.16,
  tick: 0.22,
  crackle: 0.5,
  hiss: 0.3,
  boom: 0.55,
  marker: 0.3,
  paper: 0.35,
  bell: 0.3,
  // Hum fades over these lengths at the start of the film and at the cut
  // away from the engine.
  humFadeInSeconds: 0.4,
  humFadeOutSeconds: 0.3,
} as const;

// Seconds from the start of whoosh.wav to its loudest point; the file starts
// this much before the moment it belongs to.
export const WHOOSH_PEAK_SECONDS = 0.5;
