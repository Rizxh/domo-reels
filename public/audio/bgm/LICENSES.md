# Audio licenses

Every music or sound file used in a render is listed here with its source and
license. Only audio whose license allows commercial use is allowed.

## Background music (BGM)

Add one row per track before it is used:

| File | Title / author | Source | License | Proof of license |
|---|---|---|---|---|
| `public/audio/bgm/ep03-build.wav` | EP03 tension bed (A minor, 120 BPM, clock motif) | Synthesized by `scripts/music.ts` (`npm run music`): oscillators, Karplus-Strong plucks, seeded noise | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep03-riser.wav` | EP03 riser into the reveal | Synthesized by `scripts/music.ts` | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep03-resolve.wav` | EP03 stinger + warm resolve (F to C) | Synthesized by `scripts/music.ts` | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep04-build.wav` | EP04 pump-counter groove (D minor, 112 BPM) | Synthesized by `scripts/music.ts` (`npm run music -- ep04`) | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep04-riser.wav` | EP04 riser into the price reveal | Synthesized by `scripts/music.ts` | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep04-resolve.wav` | EP04 stinger + bright resolve (Bb to F) | Synthesized by `scripts/music.ts` | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep05-build.wav` | EP05 playful bed (C major, 104 BPM) | Synthesized by `scripts/music.ts` (`npm run music -- ep05`) | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep05-riser.wav` | EP05 riser into the pull back | Synthesized by `scripts/music.ts` | Original work, no third-party material | Source code in this repo |
| `public/audio/bgm/ep05-resolve.wav` | EP05 friendly resolve | Synthesized by `scripts/music.ts` | Original work, no third-party material | Source code in this repo |

| `public/audio/bgm/soft-drive.wav` | Soft format bed (electric-piano chords, kick, clap, hats, bass, pluck; seeded) | Synthesized by `scripts/soft/music-drive.ts` (`npx tsx scripts/soft/music-drive.ts`) | Original work, no third-party material | Source code in this repo |

## Sound effects

| File | Source | License |
|---|---|---|
| `public/audio/sfx/ignite.wav` | Synthesized by `scripts/sfx.ts` (ffmpeg oscillators and seeded noise) | Original work, no third-party material |
| `public/audio/sfx/whoosh.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/hum.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/slam.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/pop.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/tick.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/crackle.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/hiss.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/boom.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/marker.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/paper.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |
| `public/audio/sfx/bell.wav` | Synthesized by `scripts/sfx.ts` | Original work, no third-party material |

Regenerate with `npm run sfx` and `npm run music`; the output is identical on every run.

## Textures (3D)

The EP03 wet road uses `asphalt_02` and the studio floor the normal map of
`concrete_floor_02` from Poly Haven (CC0, see
`public/assets/polyhaven/LICENSES.md`). Tire lettering, cracks and rubber
grain are drawn procedurally in code.

## Voice over

Generated per episode with ElevenLabs (`npm run tts`). Commercial use needs a
paid ElevenLabs plan: confirm the account's plan before publishing. Files live
in `public/audio/<episode>/` (gitignored).
