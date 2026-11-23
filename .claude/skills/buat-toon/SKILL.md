---
name: buat-toon
description: Plan, then produce a Doktermobil Reel in the toon format (2D characters in a 3D world) with the formula in docs/toon/FORMULA.md. Pattern A is a case/ad story (hook → problem → false hope → solution → 3 features → result → CTA); pattern B is a fun fact told with STAR. Use when the user asks for an edukasi, kasus bengkel, fun fact, sejarah otomotif or "kok bisa" video ("buat toon", "bikin konten", "/buat-toon <topik>"), picks a theme from docs/toon/TEMA.md or docs/toon/DRAFT-*.md, or asks to continue an approved toon episode.
---

# /buat-toon: one urgent desire, told as a story, explained for laymen, closed with an urgent Doktermobil CTA

Talk to the user in casual Bahasa Indonesia. Code, comments and commits stay in English (CLAUDE.md).

Read first:
- `CLAUDE.md` (toon format section).
- `docs/toon/FORMULA.md` v2: desire/premise, the two patterns, the seven deadly hooks, layman rules, CTA, intonation, visual rules.
- The reference episodes the user approved:
  - **EP13** "Mobil Kamu Bau Kambing" (pattern A): `data/episodes/ep13.json`, code in `src/toon/ac/`.
  - **EP11** (pattern B): `src/toon/benz/`.

## Phase A: plan (the only stop)

1. **Topic and premise.**
   - If the user gives no topic, offer three from `docs/toon/TEMA.md` / `DRAFT-*.md` with AskUserQuestion, strongest hook first.
   - Name the most urgent desire behind the topic and turn it into a premise.
   - Confirm facts and numbers with strong sources (web search). A topic that rests only on weak sources is out.
2. **Script.**
   - Pattern A (default for problems Doktermobil fixes): 105–130 words. Pattern B: 125–155 words.
   - Hook: one of the seven deadly hooks plus two lock techniques, ≤ 14 words, peak action in frame 1.
   - False hope (pattern A) is mandatory.
   - CTA: "<gejala>? Langsung <aksi> di Doktermobil. Klik link di bio, karena di Doktermobil pasti beres!"
   - Write `vo.tts` with v3 emotion tags along the arc.
3. **Layman visual plan.** For every technical part:
   - where it sits in the car (x-ray `xrayBody`);
   - what it really looks like (detailed asset, medium shot);
   - how it works (airflow / process animation tied to the words);
   - a label;
   - how Doktermobil fixes it (an action animation).
4. **Files.**
   - `docs/<id>/PLAN.md` from `docs/templates/TOON-PLAN-TEMPLATE.md`.
   - `data/episodes/<id>.json` (`format: "toon"`, narration = approved v3 settings, `captionHighlight`, `cta {line, eyebrow, button, tagline, at}`, `claims` all `reviewed: false`, `post.caption`). Mark fictional characters "Cerita ilustrasi; tokoh fiktif".
5. **Ask for approval.** Show topic, premise, hook, full VO with the structure labels, shot list, length (words ÷ 2.65) and what needs a human. Ask ONE question: "Setuju, langsung produksi" / "Revisi dulu".

## Phase B: produce (no stops)

1. **Voice.** `npx tsx scripts/toon/voice.ts <id> --all`.
   - Total must be ≤ 58.5 s; re-record single scenes with `--only N`.
   - Never read or print `.env`.
2. **Story code.**
   - Copy the structure of `src/toon/ac/` (cues, shots, stage, fx, hvac-like stage, world, Short.tsx) into `src/toon/<story>/` and register a composition in `src/toon/entry.tsx`.
   - Reuse `src/toon/benz/modern.ts`: `ModernCar({ cabin: true })` with x-ray, `buildModern` (street + workshop with the real logo sign), `M_SEATS`/`M_VENT`/`M_ACBOX`.
   - Reuse the overlays in `src/toon/ac/Short.tsx`: subtitles, ad CTA card, logo preload.
   - Every shot cuts on a cue word. Pure functions of the frame.
3. **Look loop** (max 3 rounds).
   - Command: `REMOTION_TMP=C:/Portofolio/.remotion-tmp TOON_COMP=<Comp> node scripts/toon/stills.mjs out/look/<id>/vN_ <frames> 0.5`.
   - At least one still per shot; build contact sheets.
   - Check the visual rules in FORMULA.md: whole car, faces not crossed by pillars, gag animal unmistakable, parts readable with context, labels inside the frame, subtitles not on same-colour backgrounds, CTA layout.
   - Renders sometimes die silently: run stills in a retry loop.
4. **Audio.** `scripts/toon/<id>-audio.ts` from `ep13-audio.ts`: VO, ducked `soft-drive` bed, SFX on cue words, −14 LUFS.
5. **Render.** `node scripts/toon/render.mjs <id> "<Title>"` in a retry loop of 4 (chunks resume). To fix one shot later, delete only its chunk and re-run.
6. **QA.** `python scripts/toon/qa.py "out/video/<id> - <Title>.mp4" out/qc/<id>`.
   - Specs, loudness and frame sheet must be right.
   - **pops and whips must be empty.** Fix and re-render the chunk otherwise.
   - Look at the frame sheet yourself.
7. **Deliver.** Send the mp4 with SendUserFile and summarise in Indonesian, including the claims still to be checked by a technician.

## Never

- Commit, push or publish without being asked.
- Read or print `.env`.
- Use third-party music or sound without a commercial license.
- Put episode copy in components.
- Invent facts or numbers, claim "viral" without a source, or show @handles on the CTA card.
