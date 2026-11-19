import { AbsoluteFill } from "remotion";
import {
  DEBUG_OVERLAY,
  FONT_WEIGHTS,
  FONTS,
  SAFE_AREA,
  SAFE_ZONE,
  VIDEO,
} from "../lib/brand";

// Studio-only overlay: red bands are covered by the Instagram UI, the faint
// band is the gutter, and the outlined box is where text may go.

const Band: React.FC<{
  style: React.CSSProperties;
  label?: string;
}> = ({ style, label }) => (
  <div
    style={{
      position: "absolute",
      backgroundColor: DEBUG_OVERLAY.unsafeFill,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONTS.body,
      fontWeight: FONT_WEIGHTS.semibold,
      fontSize: DEBUG_OVERLAY.labelSize,
      color: DEBUG_OVERLAY.outline,
      ...style,
    }}
  >
    {label}
  </div>
);

export const SafeZone: React.FC = () => {
  const middleHeight = VIDEO.height - SAFE_ZONE.top - SAFE_ZONE.bottom;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Band
        label={`IG UI ${SAFE_ZONE.top}px`}
        style={{ left: 0, top: 0, width: VIDEO.width, height: SAFE_ZONE.top }}
      />
      <Band
        label={`IG UI ${SAFE_ZONE.bottom}px`}
        style={{
          left: 0,
          bottom: 0,
          width: VIDEO.width,
          height: SAFE_ZONE.bottom,
        }}
      />
      <Band
        style={{
          right: 0,
          top: SAFE_ZONE.top,
          width: SAFE_ZONE.right,
          height: middleHeight,
        }}
      />
      {SAFE_ZONE.left > 0 ? (
        <Band
          style={{
            left: 0,
            top: SAFE_ZONE.top,
            width: SAFE_ZONE.left,
            height: middleHeight,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: SAFE_ZONE.left,
          top: SAFE_ZONE.top,
          width: VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right,
          height: middleHeight,
          backgroundColor: DEBUG_OVERLAY.gutterFill,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.x,
          top: SAFE_AREA.y,
          width: SAFE_AREA.width,
          height: SAFE_AREA.height,
          outline: `${DEBUG_OVERLAY.outlineWidth}px dashed ${DEBUG_OVERLAY.outline}`,
        }}
      />
    </AbsoluteFill>
  );
};
