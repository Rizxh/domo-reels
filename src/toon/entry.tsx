// Stand-alone entry for the toon format: bundles only these compositions for fast stills and renders.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./Bridge";
import { BenzShort, BENZ_FRAMES } from "./benz/Benz";
import { AcShort, AC_FRAMES } from "./ac/Short";

const Root: React.FC = () => (
  <>
    <Composition id="ToonShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BenzShort" component={BenzShort} durationInFrames={BENZ_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AcShort" component={AcShort} durationInFrames={AC_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
registerRoot(Root);
