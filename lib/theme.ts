// ReadProspects design system. Single source of truth.
// Direction: sharp. Flat surfaces, one hairline border, no shadow, no gradient,
// near-black on white. Definition comes from edges, not from atmosphere.
//
// Every colour here is a CSS variable, not a hex. The values live in
// app/globals.css under :root (light) and html.dark (dark). That is what lets
// one theme object serve both modes: an inline style bakes its value at render
// and a hex cannot flip, but var(--x) resolves in the browser and can.
export const T = {
  sidebarGradient: "var(--rp-side-bg)",
  sidebarBg: "var(--rp-side-bg)",
  sidebarBorder: "var(--rp-side-border)",
  sidebarHover: "var(--rp-side-hover)",
  sidebarActive: "var(--rp-side-active)",
  sidebarText: "var(--rp-side-text)",
  sidebarTextActive: "var(--rp-side-text-active)",
  sidebarSection: "var(--rp-side-section)",
  sidebarCard: "var(--rp-side-card)",
  sidebarCardBorder: "var(--rp-side-card-border)",
  sidebarBrand: "var(--rp-side-brand)",
  sidebarMark: "var(--rp-side-mark)",
  brandGreen: "var(--rp-green)",
  canvas: "var(--rp-canvas)",
  card: "var(--rp-card)",
  border: "var(--rp-border)",
  borderSoft: "var(--rp-border-soft)",
  hover: "var(--rp-hover)",
  soft: "var(--rp-soft)",
  heading: "var(--rp-heading)",
  body: "var(--rp-body)",
  muted: "var(--rp-muted)",
  faint: "var(--rp-faint)",
  green: "var(--rp-green)",
  greenHover: "var(--rp-green-hover)",
  greenSoft: "var(--rp-green-soft)",
  greenText: "var(--rp-green-text)",
  greenBorder: "var(--rp-green-border)",
  darkBtn: "var(--rp-dark-btn)",
  // Text or icon on a filled accent. White in both themes, which is why it must
  // not be written as #fff: a raw #fff in a background slot would refuse to flip.
  onAccent: "var(--rp-on-accent)",
  amber: "var(--rp-amber)",
  amberSoft: "var(--rp-amber-soft)",
  amberText: "var(--rp-amber-text)",
  amberBorder: "var(--rp-amber-border)",
  indigo: "var(--rp-indigo)",
  indigoSoft: "var(--rp-indigo-soft)",
  indigoText: "var(--rp-indigo-text)",
  indigoBorder: "var(--rp-indigo-border)",
  danger: "var(--rp-danger)",
  dangerHover: "var(--rp-danger-hover)",
  dangerSoft: "var(--rp-danger-soft)",
  dangerText: "var(--rp-danger-text)",
  dangerBorder: "var(--rp-danger-border)",
  pillNeutralBg: "var(--rp-soft)",
  pillNeutralText: "var(--rp-body)",
  pillPosBg: "var(--rp-green-soft)",
  pillPosText: "var(--rp-green-text)",
  scrim: "var(--rp-scrim)",
  overlayShadow: "var(--rp-overlay-shadow)",
  font: "var(--font-dm-sans), system-ui, sans-serif",
  tracking: "normal",
  trackingTight: "-0.021em",
  rCard: 6,
  rBtn: 6,
  rPill: 4,
  rInput: 6,
  // Sharp means no elevation on page furniture. Both keys resolve to none, so
  // the 44 existing boxShadow call sites go flat without a single edit.
  shadow: "var(--rp-shadow)",
  shadowSm: "var(--rp-shadow)",
};
export const microLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: T.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
};
export const pageHeading = {
  fontSize: 26,
  fontWeight: 600,
  color: T.heading,
  letterSpacing: T.trackingTight,
  margin: 0,
};
export const cardStyle = {
  background: T.card,
  border: "1px solid " + T.border,
  borderRadius: T.rCard,
  boxShadow: T.shadow,
};
export const primaryBtn = {
  background: T.green,
  color: T.onAccent,
  border: "none",
  borderRadius: T.rBtn,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: T.font,
  cursor: "pointer",
  padding: "9px 16px",
  boxShadow: T.shadow,
};
export const secondaryBtn = {
  background: T.card,
  color: T.body,
  border: "1px solid " + T.border,
  borderRadius: T.rBtn,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: T.font,
  cursor: "pointer",
  padding: "9px 16px",
};
export const dangerBtn = {
  background: T.danger,
  color: T.onAccent,
  border: "none",
  borderRadius: T.rBtn,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: T.font,
  cursor: "pointer",
  padding: "9px 16px",
};
export const statCard = {
  background: T.card,
  border: "1px solid " + T.border,
  borderRadius: T.rCard,
  padding: 16,
  boxShadow: T.shadow,
};
export type Tone = "green" | "amber" | "indigo" | "neutral";
const toneRule: Record<Tone, string> = {
  green: T.green,
  amber: T.amber,
  indigo: T.indigo,
  neutral: T.border,
};
// The tone appears once, as a 3px rule down the left edge. The old tinted wash
// is gone: four coloured blocks in a row read as decoration and blur the
// numbers sitting on them.
export const statTile = (tone: Tone = "neutral") => ({
  background: T.card,
  border: "1px solid " + T.border,
  borderLeft: "3px solid " + toneRule[tone],
  borderRadius: T.rCard,
  padding: "15px 17px",
});
export const statTileInk = (_tone: Tone = "neutral") => T.heading;
export const statTileSub = (_tone: Tone = "neutral") => T.muted;
export const tableHeader = {
  fontSize: 12.5,
  fontWeight: 600,
  color: T.body,
  background: T.soft,
};
export const infoBanner = {
  background: T.greenSoft,
  border: "1px solid " + T.greenBorder,
  borderRadius: T.rCard,
  padding: "11px 15px",
  display: "flex",
  alignItems: "center",
  gap: 8,
};
export const overlayStyle = {
  background: T.card,
  border: "1px solid " + T.border,
  borderRadius: T.rCard,
  boxShadow: T.overlayShadow,
};