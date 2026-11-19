import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import type { PrevizSounds } from "../components/PrevizFrame";
import { EXPLAINER } from "../lib/brand";
import type { ExplainerCues } from "../lib/explainerTiming";
import { SFX, SFX_MIX, WHOOSH_PEAK_SECONDS, type SfxName } from "../lib/sfx";
import { secondsToFrames } from "../lib/timing";

type Hit = { name: SfxName; from: number; gain: number };

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Sound effects, each placed on the frame of the picture or text event it
// belongs to. Picture events (combustions, camera break-throughs) come from
// the 3D page; text events from the same cue frames the overlays use.
export const ExplainerSfx: React.FC<{
  cues: ExplainerCues;
  sounds: PrevizSounds;
}> = ({ cues, sounds }) => {
  const { fps } = useVideoConfig();
  // Text lands EXPLAINER.leadFrames before its word; so does its sound.
  const text = (frame: number) => frame - EXPLAINER.leadFrames;
  const hits: Hit[] = [
    ...(sounds.ignite ?? []).map((c) => ({
      name: "ignite" as const,
      from: Math.round(c.t * fps),
      gain: c.gain,
    })),
    ...(sounds.whoosh ?? []).map((c) => ({
      name: "whoosh" as const,
      from: Math.max(0, Math.round((c.t - WHOOSH_PEAK_SECONDS) * fps)),
      gain: c.gain,
    })),
    ...[cues.hook.count, cues.cycle.spark].map((f) => ({
      name: "slam" as const,
      from: text(f),
      gain: 1,
    })),
    ...[
      cues.reveal.title,
      ...cues.cycle.steps,
      ...cues.impact.causes,
      ...cues.impact.effects,
      cues.cta.save,
      cues.cta.follow,
    ].map((f) => ({ name: "pop" as const, from: text(f), gain: 1 })),
  ];

  // Engine drone from the first frame to the cut away from the engine.
  const humFrames = cues.impact.start;
  const humIn = secondsToFrames(SFX_MIX.humFadeInSeconds, fps);
  const humOut = secondsToFrames(SFX_MIX.humFadeOutSeconds, fps);

  return (
    <>
      <Sequence durationInFrames={humFrames} layout="none" name="SFX hum">
        <Audio
          src={staticFile(SFX.hum)}
          loop
          volume={(f) =>
            SFX_MIX.hum *
            interpolate(f, [0, humIn], [0, 1], CLAMP) *
            interpolate(f, [humFrames - humOut, humFrames], [1, 0], CLAMP)
          }
        />
      </Sequence>
      {hits.map((hit, i) => (
        <Sequence
          // Hits never move relative to each other; the index keeps keys unique
          // where two land on one frame.
          key={`${hit.name}-${hit.from}-${i}`}
          from={hit.from}
          layout="none"
          name={`SFX ${hit.name}`}
        >
          <Audio
            src={staticFile(SFX[hit.name])}
            volume={SFX_MIX[hit.name] * hit.gain}
          />
        </Sequence>
      ))}
    </>
  );
};
