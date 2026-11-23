---
name: buat-video
description: Plan, then produce a Doktermobil Instagram Reel end to end in this project (domo-reels). Use when the user asks to make a video, reel or konten video ("buat video", "bikin reels", "/buat-video <topik>"), gives a topic for a new episode, or asks to continue producing an approved episode.
---

# /buat-video: plan once, then produce without stopping

The user (often a manager, not a developer) gives a topic. You plan the
episode, get ONE approval, then produce the finished video on your own.
Talk to the user in casual Bahasa Indonesia. Code, comments and commits stay
in English (CLAUDE.md).

Before anything else, read `CLAUDE.md` (hard rules, brand, language),
`PRODUCTION_PLAN.md`, and `docs/ep02-3d/PLAN.md` (the reference plan: its
sections, checks and the quality bar the user approved).

## Phase A: plan (the only stop)

1. Pick the next free episode id (`data/episodes/epNN.json`) and the format:
   - **Cinema (live R3F 3D)**: `format: "cinema"`, schema
     `src/cinemaSchema.ts`, a world in `src/cinema/worlds/` with a shot list
     cut on cue words (EP03 tire world is the reference). Preferred for new
     3D stories: story hook, a camera change every 2 to 3 seconds.
   - **Jarang Diketahui (3D explainer)**: reuses the 3D kit
     (`public/previz/kit.js`, `kit-sets.js`, `engine-unit.js`), schema
     `src/explainerSchema.ts`. Default for "fakta otomotif" topics.
   - **Soft explainer (2D, Kok Bisa-style with our own calm look)**:
     `format: "soft"`, schema `src/softSchema.ts`, world `src/soft/jalan.tsx`
     (EP08 airbag is the reference). Preferred for "fakta otomotif" topics
     with official data. Every fact needs a strong source, spoken
     ("Menurut IIHS ...") and on screen (shot `source`). Fast, lively VO
     (speed 1.2) and a beat on every key word. Commands: `npm run
     soft:voice | soft:check | soft:look | soft:render | soft:thumb -- <id>`.
     Ending line: "Follow Doktermobil untuk info otomotif lainnya!"
   - **Toon (2D characters in a 3D world, edukasi / fun fact / sejarah)**: use the `/buat-toon` skill
     (`.claude/skills/buat-toon/SKILL.md`): formula Hook emosional, Isi, STAR, CTA (`docs/toon/FORMULA.md`),
     theme bank `docs/toon/TEMA.md`, reference EP11. Preferred for "fun fact" and "sejarah" topics.
   - **Mitos atau Fakta (2D)**: schema `src/schema.ts`. Cheapest, fully templated.
   - **Talking head**: only when the user supplies footage.
   If the request does not settle the format, pick the default above and say so.
2. Write `docs/<id>/PLAN.md` from `docs/templates/PLAN-TEMPLATE.md`: hook,
   VO lines (casual ID, 20 to 30 s at about 2.15 words per second), on-screen
   text, technical claims to verify, shot list, assets, sound, risks.
3. Write `data/episodes/<id>.json` and validate it: `npm test` and
   `npx tsc --noEmit`. Every cue word must appear in its VO line exactly once;
   numbers on screen must match the spoken number.
4. Show the user a short summary (topic, hook line, full VO, shot list,
   estimated length, anything that needs a human such as claims or licensed
   BGM) and ask ONE question with AskUserQuestion:
   "Setuju, langsung produksi" / "Revisi dulu". Loop on revisions here.
   Never start Phase B without an explicit yes.

## Phase B: produce (no stops)

After the yes, do not ask between steps. Report progress in one line per
step. Run long commands in the background and wait for them.

1. Voice over: `npm run tts -- <id>`. If it fails because `.env` has no key,
   stop and ask the user to fill `ELEVENLABS_API_KEY` and
   `ELEVENLABS_VOICE_ID` in `.env` themselves. Never open, print or ask for
   the key.
2. Picture work the format needs (for a new 3D episode: a page in
   `public/previz/<id>-3d.html` built like `ep02-3d.html`: cue table via
   `configure()`, `renderAt(t)` as a pure function of time, `anchorsAt` for
   callouts, `soundCues` for sound effects; register it like Explainer3D).
3. Draft loop (3D only): `npm run produce -- <id> --draft`, then look at
   `out/qc/<base>_draft_sheet.jpg` and full-size stills of each text card. Fix
   what you see and repeat, at most three rounds. Check: text inside the safe
   area (x 64, y 314, w 792, h 1122 on 1080x1920), text lands on its word,
   no clipped or overlapping text, the subject is clear of the text column,
   no flicker or blown-out frames, transitions smooth.
4. Final: `npm run produce -- <id>`. Read `out/qc/<base>_report.md`. If it lists
   problems, fix them and resume with `--from <step>` (tts, vo-level, sfx,
   render, postprocess, verify).
5. Deliver with SendUserFile: the final mp4, the frame sheet and the report.
   Summarize in Indonesian what was made and what still needs a human:
   technical claims marked `reviewed: false`, BGM license, ElevenLabs plan.

## When you may stop in Phase B

Only for: a missing secret or credit, a check that still fails after three
fixes, or a decision only the user can make (topic change, licensing, cost).
Say exactly what is needed, then wait.

## Never

- Commit, push or publish without being asked.
- Read or print `.env`.
- Use music, sound or footage without a commercial license (record every
  third-party file in `public/audio/bgm/LICENSES.md`).
- Write episode copy inside components or the 3D page: copy lives only in
  `data/episodes/<id>.json`.
