# CLAUDE.md: domo-reels

Remotion project for Doktermobil educational Instagram Reels ("Mitos atau Fakta?" series). Full plan: `PRODUCTION_PLAN.md`. Read it before starting any phase.

## Output spec

- 1080x1920, 30fps, 15 to 60 seconds, H.264 + AAC (raised from 30 s on 2026-11-17 for longer story episodes).
- Every on-screen text must stay inside the safe zone defined in `src/lib/brand.ts`.

## Hard rules

1. Frame-driven animation only. Use `useCurrentFrame`, `interpolate`, `spring`. Never use `Date.now()`, `setTimeout`, `setInterval`, CSS animations/transitions, or `Math.random()`. Use `random(seed)` from `remotion` for randomness.
2. No hardcoded scene durations. Durations come from voice over files via `calculateMetadata` plus padding constants in `src/lib/timing.ts`.
3. No magic numbers. Colors, fonts, sizes, and safe zones go in `src/lib/brand.ts`. Timing constants go in `src/lib/timing.ts`.
4. Content lives in `data/episodes/*.json` and is validated by the zod schema in `src/schema.ts`. Components never contain episode copy.
5. Async assets (Lottie JSON, fonts) must use `delayRender` / `continueRender`, and `cancelRender` on error.
6. Secrets only in `.env` (gitignored). Never print or log API keys. Keep `.env.example` updated.
7. Licensing. Only use BGM/SFX with a license that allows commercial use. Record each asset in `public/audio/bgm/LICENSES.md`.

## Brand

- Red `#E31E24`, black `#0B0B0B`, white `#FFFFFF`.
- Headline font: Anton. Body and captions: Poppins (via `@remotion/google-fonts`).
- Caption style: word by word, keywords highlighted in brand red.

## Commands

- `npm run studio`: preview in Remotion Studio
- `npm run tts -- ep01`: generate voice over per scene
- `npm run render -- ep01`: render to `out/produce/ep01.mp4`
- `npm run postprocess -- ep01`: loudness normalize to about -14 LUFS into `out/video/<base> - <title>.mp4`
- `npm test`: vitest (timing + schema)
- `npm run produce -- <id> [--draft] [--from <step>]`: whole pipeline (TTS, VO levels, SFX, render, loudness, whisper check) to `out/video/<base> - <title>.mp4` plus `out/qc/<base>_report.md` and a frame sheet
- `npm run music`: synthesize the original music beds (EP03)
- `npm run vo-level -- <id>`: measure VO loudness into the sidecars (TTS does this for new lines)
- `npm run sfx`: synthesize the license-free sound effects

## out/ layout

Never write loose files into `out/`. Folders (defined in `scripts/lib/paths.ts`): `video/` finished reels named `<base> - <title>.mp4`, `produce/` renders before loudness, chunks, props and logs, `qc/` reports, frame sheets and whisper transcripts, `look/` stills and lookdev, `review/` review notes, `sound/` audio checks, `archive/` older material.

## Cinema format (EP03 onward)

Live React Three Fiber world in Remotion (`Cinema3D`, schema `src/cinemaSchema.ts`, worlds in `src/cinema/worlds/`). Copy and cue words in the episode JSON; the shot list (cuts on cue words) in the world's `shots.ts`. Nothing animates by itself: no `useFrame`, every change from `useCurrentFrame()`. Renders in 240-frame chunks plus an audio-only pass (`REMOTION_AUDIO_ONLY`).

## Soft format (EP08 onward)

The soft format is a Kok Bisa-style animated explainer with our own calm look: soft pastel shapes, no outlines, one camera that glides between scenes (sky, then the street, then an x-ray layer "inside the car"), and a cross-dissolve at every cut. Smootherstep easing keeps every motion free of jolts.

- **Files:**
  - schema: `src/softSchema.ts` (episode `format: "soft"`);
  - composition: `Soft2D`;
  - cover: `SoftThumb`;
  - world: `src/soft/jalan.tsx`;
  - kit: `src/soft/kit.tsx`;
  - shot names: `src/soft/registry.ts`.
- **Episode content:** headline pill (`lyric`), VO text, `sfx` (names of `public/audio/sfx/*.wav`), `thumb`, `post`, `claims`.
- **Shots:** each shot draws one illustration. Every beat is cued on a spoken word with `c.w("word", n)`, using the word timings from the TTS.
- **Pipeline:**
  1. `npm run soft:voice -- <id>`: ElevenLabs with timestamps; voice from `narration.voice` or `ELEVENLABS_VOICE_ID`; speed 1.2, stability 0.3, style 0.5. Scene length is the voice length + 0.35 s.
  2. `npm run soft:check -- <id>`: proofread all text, list the facts; 60 s limit.
  3. `npm run soft:look -- <id>`: contact sheet in `out/look/<id>_soft_frames.jpg`.
  4. `npm run soft:render -- <id>`: 600-frame muted chunks plus an audio pass, -14 LUFS with a true-peak-safe limiter, output `out/video/<id> - <Title>.mp4`.
  5. `npm run soft:thumb -- <id>`.
- **Sources:**
  - Every fact needs a strong source: IIHS, NHTSA, a manufacturer, an official body.
  - Say it in the VO ("Menurut IIHS, ...").
  - Show it on screen with the shot's `source` (a "Sumber: ..." chip).
  - List it in `claims` and at the end of `post.caption`.
  - If only a weak source exists, rewrite the scene.
- **Ending line:** "Follow Doktermobil untuk info otomotif lainnya!"

## New episodes

Use the `/buat-video` skill (`.claude/skills/buat-video/SKILL.md`): plan with `docs/templates/PLAN-TEMPLATE.md`, get one approval, then produce without stopping. Laptop setup: `docs/setup/SETUP-LAPTOP.md`.

## Before every commit

`npx tsc --noEmit` passes, lint passes, tests pass, visual check in Studio, `gitleaks detect` clean.

## Language

Code, comments, and commit messages in English. On-screen text and voice over in casual Bahasa Indonesia.
