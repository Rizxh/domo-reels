// The one place the toon format takes its brand from: sign, CTA card, subtitles, label font, workshop colours.
// Each project ships its own copy (domo-reels: Doktermobil, satuseo-reels: SATUSEO); the rest of src/toon is shared.
import { COLORS, FONTS } from "../lib/brand";

export const TOON_BRAND = {
  /** the name the CTA line ends with ("… di Doktermobil") */
  name: "Doktermobil",
  /** logo for the sign (public/), its pixel aspect, and the sign board colours */
  logo: "brand/logo.png",
  logoAspect: 1139 / 540,
  /** optional word mark painted next to an icon-only logo (empty: the logo already has the name) */
  signText: "",
  signFrame: "#E31E24",
  signFill: "#ffffff",
  signInk: "#0B0B0B",
  /** the shop / office front: wall and the fascia band */
  wall: "#f3f1ec",
  fascia: "#E31E24",
  /** staff uniform (the mechanic / consultant card) */
  uniform: "#E31E24",
  colors: {
    primary: COLORS.red, // the ask's second line, the CTA button
    ink: COLORS.black, // headlines, the eyebrow pill
    paper: COLORS.white, // the card
    onPrimary: COLORS.white, // text on the button
    highlight: "#FFD60A", // subtitle keywords
    muted: "#6a6d75", // the tagline
  },
  fonts: { headline: FONTS.headline, body: FONTS.body, headlineUpper: true, headlineWeight: 400, headlineScale: 1 },
  /** font family name for canvas-drawn labels (must be loaded by the page) */
  canvasFont: "Poppins",
  cta: { button: "KLIK LINK DI BIO", tagline: "Spesialis AC & Tune Up · Pasti Beres" },
} as const;
