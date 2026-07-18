"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
const BRAND = "#1FA971", GREEN = "#0B7A4B", NIGHT = "#082019", CLOUD = "rgba(255,255,255,0.72)";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const CircleMark = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg>
);
export default function MarketingNav({ activePricing = false }: { activePricing?: boolean }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const link = { color: CLOUD, fontSize: 15, textDecoration: "none" } as const;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, fontFamily: DM,
      background: scrolled || menuOpen ? "rgba(8,32,25,0.92)" : "transparent",
      backdropFilter: scrolled || menuOpen ? "saturate(180%) blur(12px)" : "none",
      WebkitBackdropFilter: scrolled || menuOpen ? "saturate(180%) blur(12px)" : "none",
      borderBottom: scrolled || menuOpen ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
      transition: "background .25s ease, border-color .25s ease, backdrop-filter .25s ease",
    }}>
      <style>{`
        .mn-cta{transition:background .15s}.mn-cta:hover{background:#0A6A41}
        .mn-links a:hover{color:#fff}
        .mn-signin{transition:background .15s}.mn-signin:hover{background:rgba(255,255,255,0.08)}
        .mn-hamburger{display:none}
        .mn-mobile-only{display:none}
        @media(max-width:820px){
          .mn-links{display:none!important}
          .mn-desktop-only{display:none!important}
          .mn-hamburger{display:flex!important}
          .mn-mobile-only{display:flex!important}
        }
      `}</style>
      <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ color: "#fff", fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}><span style={{ color: BRAND }}><CircleMark /></span>BackRead</a>

        {/* Desktop center links */}
        <div className="mn-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/#how" style={link}>How it works</a>
          <a href="/#why" style={link}>Why BackRead</a>
          <a href="/pricing" style={{ ...link, color: activePricing ? "#fff" : CLOUD, fontWeight: activePricing ? 600 : 400 }}>Pricing</a>
        </div>

        {/* Desktop right side: full auth buttons */}
        <div className="mn-desktop-only" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {authed === null ? (
            <span style={{ width: 160 }} />
          ) : authed ? (
            <a href="/overview" className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>Open app</a>
          ) : (
            <>
              <a href="/login" className="mn-signin" style={{ color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)" }}>Sign in</a>
              <a href="/login" className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>Start free</a>
            </>
          )}
        </div>

        {/* Mobile right side: single Sign in + hamburger */}
        <div className="mn-mobile-only" style={{ alignItems: "center", gap: 10 }}>
          {authed ? (
            <a href="/overview" className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>Open app</a>
          ) : (
            <a href="/login" className="mn-signin" style={{ color: "#fff", fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)" }}>Sign in</a>
          )}
          <button className="mn-hamburger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" style={{ alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", cursor: "pointer" }}>
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mn-mobile-only" style={{ flexDirection: "column", padding: "8px 32px 20px", gap: 4, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <a href="/#how" onClick={() => setMenuOpen(false)} style={{ color: CLOUD, fontSize: 16, textDecoration: "none", padding: "12px 0" }}>How it works</a>
          <a href="/#why" onClick={() => setMenuOpen(false)} style={{ color: CLOUD, fontSize: 16, textDecoration: "none", padding: "12px 0" }}>Why BackRead</a>
          <a href="/pricing" onClick={() => setMenuOpen(false)} style={{ color: activePricing ? "#fff" : CLOUD, fontWeight: activePricing ? 600 : 400, fontSize: 16, textDecoration: "none", padding: "12px 0" }}>Pricing</a>
          {!authed && <a href="/login" onClick={() => setMenuOpen(false)} className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 15, fontWeight: 600, padding: "12px", borderRadius: 8, textDecoration: "none", textAlign: "center", marginTop: 8 }}>Start free</a>}
        </div>
      )}
    </div>
  );
}
