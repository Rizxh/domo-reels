import { COLORS } from "../lib/brand";
import { highlightMask, splitWords } from "../lib/text";

// Renders text word by word, coloring words that belong to a highlight phrase
// in brand red.
export const HighlightText: React.FC<{
  text: string;
  highlight: string[];
  style: React.CSSProperties;
  color?: string;
  highlightColor?: string;
}> = ({
  text,
  highlight,
  style,
  color = COLORS.white,
  highlightColor = COLORS.red,
}) => {
  const words = splitWords(text);
  const mask = highlightMask(words, highlight);

  return (
    <div style={{ color, ...style }}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={mask[i] ? { color: highlightColor } : undefined}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};
