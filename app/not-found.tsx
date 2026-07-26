import Link from "next/link";
import { T } from "@/lib/theme";

// Rendered in three places: the marketing site, the app, and the admin console
// (requireAdminPage calls notFound() so the hidden path never confirms it exists).
// Kept neutral so it reads correctly in all three.
export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: T.canvas, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: T.font, letterSpacing: T.tracking, color: T.heading, padding: 40, textAlign: "center" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 13, background: T.greenSoft, marginBottom: 20 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></svg>
      </span>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>404</div>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: T.trackingTight, color: T.heading, margin: "0 0 10px" }}>This page went dark.</h1>
      <p style={{ fontSize: 16, color: T.body, margin: "0 0 26px", maxWidth: 420, lineHeight: 1.55 }}>The link may be broken, or the page may have moved.</p>
      <Link href="/" style={{ background: T.green, color: "var(--rp-on-accent)", fontSize: 15, fontWeight: 600, padding: "11px 22px", borderRadius: T.rBtn, textDecoration: "none", boxShadow: "0 4px 14px rgba(11,122,75,0.22)" }}>Take me home</Link>
    </div>
  );
}
