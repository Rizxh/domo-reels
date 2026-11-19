import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CAPTION,
  CAPTION_AREA,
  COLORS,
  FONT_WEIGHTS,
  FONTS,
  LINE_HEIGHT,
  MOTION,
  TYPE,
} from "../lib/brand";
import { SPRINGS } from "../lib/timing";
import { highlightMask, paginateWords, type WordTiming } from "../lib/text";

// Burned-in, word by word caption of the voice over. Shows one short page at a
// time; each word pops in on its start frame and keywords render in brand red.
export const Caption: React.FC<{
  words: WordTiming[];
  highlight: string[];
  // Each word on a solid black box instead of an outline, for busy pictures.
  boxed?: boolean;
}> = ({ words, highlight, boxed = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let activeIndex = -1;
  words.forEach((word, i) => {
    if (word.startFrame <= frame) {
      activeIndex = i;
    }
  });
  if (activeIndex < 0) {
    return null;
  }

  const texts = words.map((w) => w.text);
  const mask = highlightMask(texts, highlight);
  const page =
    paginateWords(texts, CAPTION.maxWordsPerPage).find((p) =>
      p.includes(activeIndex),
    ) ?? [];

  return (
    <div
      style={{
        position: "absolute",
        left: CAPTION_AREA.x,
        top: CAPTION_AREA.y,
        width: CAPTION_AREA.width,
        height: CAPTION_AREA.height,
        display: "flex",
        flexWrap: "wrap",
        alignContent: "center",
        columnGap: boxed ? 0 : CAPTION.wordGap,
        rowGap: boxed ? CAPTION.boxRowGap : 0,
        fontFamily: FONTS.body,
        fontWeight: FONT_WEIGHTS.extrabold,
        fontSize: TYPE.caption,
        lineHeight: LINE_HEIGHT.normal,
        textShadow: boxed ? "none" : CAPTION.shadow,
      }}
    >
      {page.map((i) => {
        const pop = spring({
          frame: frame - words[i].startFrame,
          fps,
          config: SPRINGS.pop,
        });
        const spoken = i <= activeIndex;
        return (
          <span
            key={`${words[i].text}-${i}`}
            style={{
              display: "inline-block",
              color: mask[i] ? COLORS.red : COLORS.white,
              ...(boxed
                ? {
                    backgroundColor: COLORS.black,
                    padding: CAPTION.boxPadding,
                  }
                : {
                    WebkitTextStroke: `${CAPTION.strokeWidth}px ${COLORS.black}`,
                    paintOrder: "stroke fill",
                  }),
              opacity: spoken ? Math.min(pop * MOTION.wordFadeInSpeed, 1) : 0,
              transform: `scale(${spoken ? interpolate(pop, [0, 1], [MOTION.wordPopScaleFrom, 1]) : 1})`,
              transformOrigin: "50% 80%",
            }}
          >
            {words[i].text}
          </span>
        );
      })}
    </div>
  );
};
