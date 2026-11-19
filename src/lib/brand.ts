// Brand and canvas constants. Every color, font, size, and safe zone lives here.

import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

export const VIDEO = {
  width: 1080,
  height: 1920,
} as const;

export const COLORS = {
  red: "#E31E24",
  black: "#0B0B0B",
  white: "#FFFFFF",
} as const;

// Semi-transparent tints derived from the brand colors.
export const TINTS = {
  blackDim: "rgba(11, 11, 11, 0.62)",
  blackSoft: "rgba(11, 11, 11, 0.85)",
  whiteFaint: "rgba(255, 255, 255, 0.07)",
  whiteLine: "rgba(255, 255, 255, 0.16)",
  whiteMuted: "rgba(255, 255, 255, 0.7)",
  redGlow: "rgba(227, 30, 36, 0.22)",
} as const;

// @remotion/google-fonts calls delayRender/continueRender internally, so frames
// are not captured until these fonts finish loading (and it cancels on error).
const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const poppins = loadPoppins("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const FONTS = {
  headline: anton.fontFamily,
  body: poppins.fontFamily,
} as const;

export const FONT_WEIGHTS = {
  regular: 400,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

// Font sizes in px at the 1080x1920 canvas.
export const TYPE = {
  counter: 300,
  headline: 150,
  stamp: 120,
  title: 104,
  factText: 80,
  cardLabel: 50,
  body: 60,
  caption: 60,
  label: 40,
  handle: 44,
} as const;

export const LINE_HEIGHT = {
  tight: 1.0,
  snug: 1.08,
  normal: 1.25,
} as const;

export const LETTER_SPACING = {
  label: "0.14em",
  stamp: "0.06em",
  headline: "0.01em",
} as const;

// Areas covered by the Instagram Reels UI (approximate, verify on a phone with
// a private draft upload). Text must never enter these bands.
export const SAFE_ZONE = {
  top: 250,
  bottom: 420,
  right: 160,
  left: 0,
} as const;

// Extra breathing room between text and the safe zone edges.
export const GUTTER = 64;

// The rectangle text is allowed to occupy.
export const SAFE_AREA = {
  x: SAFE_ZONE.left + GUTTER,
  y: SAFE_ZONE.top + GUTTER,
  width: VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right - GUTTER * 2,
  height: VIDEO.height - SAFE_ZONE.top - SAFE_ZONE.bottom - GUTTER * 2,
} as const;

// The safe area is split into a content region and a caption strip below it.
export const LAYOUT = {
  captionHeight: 230,
  sectionGap: 48,
  itemGap: 28,
} as const;

export const CONTENT_AREA = {
  x: SAFE_AREA.x,
  y: SAFE_AREA.y,
  width: SAFE_AREA.width,
  height: SAFE_AREA.height - LAYOUT.captionHeight - LAYOUT.sectionGap,
} as const;

export const CAPTION_AREA = {
  x: SAFE_AREA.x,
  y: SAFE_AREA.y + SAFE_AREA.height - LAYOUT.captionHeight,
  width: SAFE_AREA.width,
  height: LAYOUT.captionHeight,
} as const;

export const CAPTION = {
  maxWordsPerPage: 4,
  strokeWidth: 10,
  shadow: "0 6px 24px rgba(0, 0, 0, 0.55)",
  wordGap: "0.28em",
  // Boxed captions: neighbouring word boxes touch to read as one bar.
  boxPadding: "0.04em 0.14em",
  boxRowGap: 8,
} as const;

export const BACKGROUND = {
  footageBlurPx: 6,
  footageDim: 0.58,
  footageZoomTo: 1.08,
  // Fallback when no footage exists: dark gradient with a faint red glow.
  gradient: `radial-gradient(120% 70% at 50% 30%, ${TINTS.redGlow} 0%, rgba(11, 11, 11, 0) 60%), linear-gradient(180deg, #141414 0%, ${COLORS.black} 100%)`,
  grainOpacity: 0.08,
  grainBaseFrequency: 0.9,
  grainOctaves: 2,
  // Number of distinct grain patterns cycled through (seeded, deterministic).
  grainVariants: 6,
} as const;

export const STAMP = {
  borderWidth: 10,
  paddingX: 40,
  paddingY: 8,
  radius: 14,
  checkSize: 96,
  rotationMythDeg: -9,
  rotationFactDeg: -3,
  scaleFrom: 2.6,
} as const;

export const ICON = {
  strokeWidth: 1.6,
  boldStrokeWidth: 3,
  sceneSize: 220,
  cardSize: 76,
  carSize: 150,
  buttonSize: 44,
} as const;

export const CARD = {
  paddingX: 36,
  paddingY: 30,
  radius: 28,
  gap: 32,
  indexWidth: 70,
} as const;

export const MOTION = {
  hookZoomFrom: 1.12,
  shakePx: 16,
  slideInPx: 90,
  riseInPx: 40,
  pulseScale: 0.06,
  wordPopScaleFrom: 0.7,
  // Caption words reach full opacity halfway through their pop spring.
  wordFadeInSpeed: 2,
} as const;

export const CTA = {
  logoPlateWidth: 560,
  logoPlatePadding: 36,
  logoPlateRadius: 32,
  buttonPaddingX: 44,
  buttonPaddingY: 22,
  buttonRadius: 999,
  buttonGap: 28,
  buttonBorderWidth: 4,
} as const;

// Brand assets bundled in public/.
export const BRAND_ASSETS = {
  // Official lockup (black type on transparent), shown on a white plate.
  logo: "brand/logo.png",
} as const;

// Copy that belongs to the series format, identical in every episode.
// Episode-specific copy always lives in data/episodes/*.json.
export const SERIES_COPY = {
  series: "MITOS ATAU FAKTA?",
  myth: "MITOS",
  fact: "FAKTA",
  reasons: "KENAPA?",
  save: "SAVE",
  follow: "FOLLOW",
  logoAlt: "Dokter Mobil",
} as const;

// Format copy of the "Jarang Diketahui" 3D explainer series (EP02 onward).
export const EXPLAINER_COPY = {
  series: "JARANG DIKETAHUI",
  slowMotion: "SLOW MOTION",
} as const;

// On-screen text of the 3D explainer. Text lives in the top band of the safe
// area; the picture keeps the middle and captions keep the bottom strip.
export const EXPLAINER = {
  page: "previz/ep02-3d.html",
  top: SAFE_AREA.y,
  blockPaddingX: 26,
  blockPaddingY: 2,
  blockGap: 12,
  tagSize: 30,
  tagGap: 26,
  figureSize: 300,
  figureUnitSize: 92,
  titleSize: 110,
  noteSize: 40,
  stepSize: 78,
  sparkSize: 210,
  sparkUnitSize: 72,
  causeSize: 84,
  effectSize: 96,
  ctaTop: SAFE_AREA.y + 20,
  ctaPlateWidth: 460,
  ctaGap: 30,
  pillSize: 52,
  textShadow: "0 8px 30px rgba(0, 0, 0, 0.55)",
  // Callout leader from a label to a point in the 3D picture.
  leaderWidth: 5,
  leaderGap: 14,
  leaderKnee: 56,
  leaderRingRadius: 30,
  leaderShadow: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7))",
  // Frames the leader takes to draw from the label to its ring.
  leaderDrawFrames: 10,
  // Text starts moving this many frames before its cue word, so it reads as
  // landing on the word instead of trailing it.
  leadFrames: 3,
  // Frames a block takes to wipe open, and to leave.
  enterFrames: 8,
  exitFrames: 6,
  // Stagger between stacked blocks that enter together.
  staggerFrames: 3,
} as const;

// Studio-only debug overlay styling.
export const DEBUG_OVERLAY = {
  unsafeFill: "rgba(227, 30, 36, 0.28)",
  gutterFill: "rgba(255, 255, 255, 0.06)",
  outline: COLORS.red,
  outlineWidth: 4,
  labelSize: 28,
} as const;

// Talking-head edit (src/compositions/TalkingHead.tsx). Positions are on the
// 1080x1920 canvas; text inside them stays within SAFE_AREA.
export const TALKING_HEAD = {
  // Punch-ins scale around the speaker's face (measured on the raw take).
  faceOriginX: 0.45,
  faceOriginY: 0.33,
  // Dark wash behind the end card so the logo plate reads on a white shirt.
  endScrim: `linear-gradient(180deg, rgba(11, 11, 11, 0) 0%, ${TINTS.blackDim} 38%, ${TINTS.blackSoft} 100%)`,
  endScrimTop: 820,
} as const;

// "TUNE UP / EXPRESS" label blocks.
export const TITLE_BLOCKS = {
  top: 900,
  fontSize: 184,
  paddingX: 30,
  paddingY: 4,
  lineGap: 14,
  // Text rises inside each block by this share of the line height.
  riseShare: 1.05,
} as const;

// Swinging red price tag.
export const PRICE_TAG = {
  left: SAFE_AREA.x + 4,
  top: 930,
  width: 780,
  height: 360,
  radius: 34,
  // The hole sits in the pointed left end; the tag pivots there.
  noseWidth: 96,
  holeRadius: 18,
  currencySize: 64,
  amountSize: 262,
  unitSize: 84,
  captionSize: 34,
  restDeg: -5,
  swingFromDeg: -34,
  slideFromPx: -820,
} as const;

// Split-screen explainer board (top) over the speaker (bottom).
export const BOARD = {
  height: 1120,
  fill: "#0e0e10",
  gridStep: 60,
  gridLine: "rgba(255, 255, 255, 0.045)",
  shadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
  eyebrowSize: 30,
  headingSize: 80,
  counterSize: 80,
  diagramTop: 440,
  diagramLeft: 40,
  diagramWidth: 1000,
  focusTop: 958,
  focusNameSize: 66,
  focusNoteSize: 36,
  focusIndexSize: 66,
  // Speaker framing inside the lower panel: scale around the face origin
  // (>= 1 so the frame stays full width) and move the face down to this y.
  speakerScale: 1.02,
  faceTargetY: 1372,
} as const;

// Engine cutaway drawing (viewBox units).
export const ENGINE_CARD = {
  labelSize: 32,
  viewWidth: 800,
  viewHeight: 430,
  stroke: 3,
  strokeBold: 5,
  fill: "#141416",
  line: "rgba(255, 255, 255, 0.85)",
  lineDim: "rgba(255, 255, 255, 0.32)",
  redFill: "rgba(227, 30, 36, 0.26)",
} as const;

// "CEPAT / MURAH MERIAH" illustrated cards.
export const BENEFIT_CARDS = {
  top: 820,
  width: 386,
  height: 480,
  gap: 20,
  radius: 34,
  art: 280,
  labelSize: 64,
  stroke: 9,
  shadow: "0 26px 60px rgba(0, 0, 0, 0.4)",
} as const;

// "Klik link" pill with cascading chevrons.
export const LINK_CUE = {
  top: 1180,
  fontSize: 58,
  paddingX: 48,
  paddingY: 24,
  radius: 999,
  chevronSize: 64,
  chevronGap: 10,
  chevronCount: 3,
} as const;

export const END_CARD = {
  plateTop: 1010,
  plateWidth: 520,
  taglineSize: 128,
  taglineGap: 44,
  checkSize: 104,
  checkStroke: 16,
} as const;

// On-screen text of the cinema format (EP03 onward). Text lives in the top
// band of the safe area; the caption keeps its strip at the bottom; the
// subject of each shot is framed in between.
export const CINEMA = {
  kickerTop: SAFE_AREA.y,
  kickerSize: 34,
  kickerSpacing: "0.22em",
  titleTop: SAFE_AREA.y + 62,
  titleSize: 112,
  titleGap: 6,
  labelSize: 96,
  labelGap: 10,
  noteSize: 40,
  noteGap: 22,
  calloutSize: 84,
  digitSize: 170,
  digitSubSize: 64,
  figureTop: SAFE_AREA.y + 70,
  figureSize: 300,
  figureAgeSize: 220,
  figureSubSize: 44,
  handleTop: 780,
  handleSize: 54,
  logoWidth: 440,
  logoPadding: 30,
  logoRadius: 28,
  lineWidth: 5,
  ringRadius: 120,
  // Horizontal stretch of the callout ring (frames a row of digits).
  ringAspect: 2.35,
  boxRadius: 14,
  shadow: "0 4px 28px rgba(0, 0, 0, 0.75), 0 1px 3px rgba(0, 0, 0, 0.8)",
  scrim: "linear-gradient(180deg, rgba(6, 6, 7, 0.72) 0%, rgba(6, 6, 7, 0.35) 22%, rgba(6, 6, 7, 0) 34%, rgba(6, 6, 7, 0) 62%, rgba(6, 6, 7, 0.55) 78%, rgba(6, 6, 7, 0.8) 100%)",
  ctaScrim: "rgba(6, 6, 7, 0.55)",
} as const;

// 2D paper format (EP05 onward): a whiteboard with paper cut-outs. The
// palette stays on brand (red, black, white) with paper, sticky-note and
// ink tones around it.
export const PAPER = {
  board: "#f5f4ef",
  boardSmudge: "rgba(120, 128, 140, 0.06)",
  card: "#fbf7ee",
  cardEdge: "#e9e0cc",
  kraft: "#d9b98a",
  sticky: "#ffd84d",
  stickyShadow: "rgba(120, 90, 0, 0.25)",
  tape: "rgba(236, 226, 196, 0.85)",
  ink: "#1d1d1f",
  inkBlue: "#2453a6",
  inkRed: COLORS.red,
  inkGreen: "#1f9a52",
  skin: "#f1c6a2",
  skinShade: "#dca482",
  hair: "#2b2220",
  denim: "#3a5a8c",
  shirt: "#f2f2f2",
  carRed: "#d8262c",
  carRedShade: "#a91b20",
  glass: "#a9d4f0",
  tire: "#262626",
  hub: "#c9ccd1",
  metal: "#9aa1aa",
  soot: "#3a3330",
  shadow: "rgba(40, 32, 20, 0.28)",
  // Paper cut filter: edge roughness and drop shadow.
  edgeFrequency: 0.04,
  edgeScale: 5,
  shadowX: 6,
  shadowY: 9,
  markerWidth: 12,
  titleSize: 118,
  labelSize: 64,
  noteSize: 44,
  stickySize: 52,
} as const;

// Story diorama (EP05 v2): two worlds. The rogue shop is dim and dirty
// green-grey; the Doktermobil shop is bright white with brand red.
export const STORY = {
  grimeWall: "#5d665e",
  grimeWallDark: "#3d443f",
  grimeFloor: "#3a3d38",
  grimeStain: "rgba(30, 26, 18, 0.35)",
  grimeLamp: "#ffd98a",
  grimeShadow: "rgba(10, 12, 10, 0.55)",
  cleanWall: "#f4f5f7",
  cleanWallShade: "#e3e6ea",
  cleanFloor: "#d9dde2",
  cleanFloorShine: "rgba(255, 255, 255, 0.55)",
  brandRed: COLORS.red,
  brandRedDark: "#a8151a",
  steel: "#a9b0b8",
  steelDark: "#6f7680",
  rubber: "#232323",
  engineAlu: "#b9bec5",
  engineDark: "#4b5058",
  hoseBlack: "#1f1f22",
  coolant: "#6fd3ff",
  smoke: "#d9d9d9",
  checkAmber: "#ffb300",
  screen: "#0e1a24",
  screenGreen: "#4dff9a",
  paperWhite: "#fffdf8",
  skin: "#e6b48f",
  skinShade: "#c99673",
  greyOverall: "#7c7f73",
  denim: "#3a5a8c",
  titleSize: 104,
  labelSize: 54,
} as const;
