// ReadProspects design system â€” Termii-inspired. Single source of truth.
// Every screen imports from here so the look stays consistent by construction.

export const T = {
  // Sidebar (dark green gradient, darker top -> lighter bottom)
  sidebarGradient: "linear-gradient(180deg, #082019 0%, #0B2E22 55%, #0E3A2C 100%)",
  sidebarHover: "rgba(255,255,255,0.06)",
  sidebarActive: "#164535",
  sidebarText: "rgba(255,255,255,0.72)",
  sidebarTextActive: "#FFFFFF",
  sidebarSection: "#6B8578",
  sidebarCard: "#143D2E",

  // Brand
  brandGreen: "#1FA971",

  // Content surfaces
  canvas: "#EEF4F0",
  card: "#FFFFFF",
  border: "#E7ECEA",
  borderSoft: "#EDF2EF",

  // Text
  heading: "#0F1729",
  body: "#475467",
  muted: "#98A2B3",

  // Accent (green)
  green: "#0B7A4B",
  greenHover: "#0A6A41",
  greenSoft: "#E7F6EF",
  greenText: "#067647",
  darkBtn: "#101828",

  // Pills
  pillNeutralBg: "#F2F4F7",
  pillNeutralText: "#475467",
  pillPosBg: "#E7F6EF",
  pillPosText: "#067647",

  // Type
  font: "var(--font-dm-sans), system-ui, sans-serif",
  tracking: "-0.011em",
  trackingTight: "-0.02em",

  // Radius
  rCard: 14,
  rBtn: 8,
  rPill: 16,
  rInput: 8,

  // Elevation (soft, layered)
  shadow: "0 1px 2px rgba(11,40,28,0.05), 0 10px 28px rgba(13,60,40,0.06)",
  shadowSm: "0 1px 2px rgba(11,40,28,0.05), 0 4px 14px rgba(13,60,40,0.05)",
};

// Reusable style fragments
export const microLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: T.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

export const pageHeading = {
  fontSize: 26,
  fontWeight: 700,
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
  fontWeight: 600,
  fontFamily: T.font,
  cursor: "pointer",
  padding: "10px 16px",
  boxShadow: "0 4px 14px rgba(11,122,75,0.22)",
};

// ---- Termii structural component styles ----
export const statCard = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: T.rCard,
  padding: 16,
  boxShadow: T.shadowSm,
};

export const tableHeader = {
  ...microLabel,
};

export const infoBanner = {
  background: T.greenSoft,
  border: "1px solid #C7EBD8",
  borderRadius: 10,
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: 8,
};
