// ReadProspects design system. Single source of truth.
// Direction: Notion warmth with Attio density. Every screen imports from here
// so the look stays consistent by construction.
//
// Two rules that this palette exists to enforce:
//   1. No pure white, no pure grey. Every surface carries a trace of the brand hue.
//   2. Hierarchy comes from size and weight, never from opacity. Faded text is
//      unreadable at normal screen brightness even when it looks fine in a mockup.
export const T = {
  // Sidebar (warm dark green, darker top -> lighter bottom)
  sidebarGradient: "linear-gradient(180deg, #082019 0%, #0B2E22 55%, #0E3A2C 100%)",
  sidebarHover: "rgba(255,255,255,0.06)",
  sidebarActive: "#164535",
  sidebarText: "#B4C6BC",
  sidebarTextActive: "#FFFFFF",
  sidebarSection: "#6B8578",
  sidebarCard: "#143D2E",
  // Brand
  brandGreen: "#26714F",
  // Content surfaces
  canvas: "#FDFCFA",
  card: "#FFFFFF",
  border: "#ECE7E0",
  borderSoft: "#F5F2EC",
  hover: "#FAF8F4",
  soft: "#F5F2EC",
  // Text
  heading: "#1E1A16",
  body: "#4B443C",
  muted: "#7E766C",
  // Accent (green)
  green: "#26714F",
  greenHover: "#1F5E42",
  greenSoft: "#E9F3EE",
  greenText: "#1A5439",
  greenBorder: "#D9E8E0",
  darkBtn: "#24201B",
  // Meaning tints. Green healthy, amber attention, indigo spread, neutral inert.
  amberSoft: "#FBF1E3",
  amberText: "#7A4C13",
  indigoSoft: "#ECEDF7",
  indigoText: "#38377A",
  // Pills
  pillNeutralBg: "#F5F2EC",
  pillNeutralText: "#4B443C",
  pillPosBg: "#E9F3EE",
  pillPosText: "#1A5439",
  // Type
  font: "var(--font-dm-sans), system-ui, sans-serif",
  tracking: "-0.008em",
  trackingTight: "-0.03em",
  // Radius
  rCard: 12,
  rBtn: 9,
  rPill: 6,
  rInput: 9,
  // Elevation. Brand-tinted, never neutral black.
  shadow: "0 1px 2px rgba(30,26,22,0.04), 0 6px 16px -10px rgba(30,26,22,0.10)",
  shadowSm: "0 1px 2px rgba(30,26,22,0.04)",
};
// Reusable style fragments
export const microLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: T.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
};
export const pageHeading = {
  fontSize: 27,
  fontWeight: 600,
  color: T.heading,
  letterSpacing: T.trackingTight,
  margin: 0,
};
export const cardStyle = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: T.rCard,
  boxShadow: T.shadow,
};
export const primaryBtn = {
  background: T.green,
  color: "#fff",
  border: "none",
  borderRadius: T.rBtn,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: T.font,
  cursor: "pointer",
  padding: "10px 18px",
  boxShadow: "0 1px 2px rgba(38,113,79,0.3)",
};
// ---- structural component styles ----
export const statCard = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: T.rCard,
  padding: 16,
  boxShadow: T.shadowSm,
};
// A stat tile where the colour carries meaning. Pass one of the four tones.
export const statTile = (tone: "green" | "amber" | "indigo" | "neutral" = "neutral") => ({
  background: tone === "green" ? T.greenSoft : tone === "amber" ? T.amberSoft : tone === "indigo" ? T.indigoSoft : T.soft,
  borderRadius: T.rCard,
  padding: "16px 17px",
});
export const statTileInk = (tone: "green" | "amber" | "indigo" | "neutral" = "neutral") =>
  tone === "green" ? T.greenText : tone === "amber" ? T.amberText : tone === "indigo" ? T.indigoText : T.heading;
// Secondary text on a tinted tile. A real colour, never the ink at reduced opacity:
// faded text reads as out of focus on a coloured surface.
export const statTileSub = (tone: "green" | "amber" | "indigo" | "neutral" = "neutral") =>
  tone === "green" ? "#3D7A5C" : tone === "amber" ? "#96682B" : tone === "indigo" ? "#5C5B96" : T.muted;
export const tableHeader = {
  ...microLabel,
};
export const infoBanner = {
  background: T.greenSoft,
  border: `1px solid ${T.greenBorder}`,
  borderRadius: 10,
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: 8,
};



