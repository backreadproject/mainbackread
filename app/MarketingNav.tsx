"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BRAND = "#1FA971", GREEN = "#0B7A4B", CLOUD = "rgba(255,255,255,0.72)";
const DM = "var(--font-dm-sans), system-ui, sans-serif";

const CircleMark = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg>
);

export default function MarketingNav({ activePricing = false }: { activePricing?: boolean }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);

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
      position: "sticky", top: 0, zIndex: 50, fontFamily: DM,
      background: scrolled ? "rgba(8,32,25,0.72)" : "transparent",
      backdropFilter: scrolled ? "saturate(180%) blur(12px)" : "none",
      WebkitBackdropFilter: scrolled ? "saturate(180%) blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
      transition: "background .25s ease, border-color .25s ease, backdrop-filter .25s ease",
    }}>
      <style>{`.mn-cta{transition:background .15s}.mn-cta:hover{background:#0A6A41}.mn-links a:hover{color:#fff}.mn-signin{transition:background .15s}.mn-signin:hover{background:rgba(255,255,255,0.08)}@media(max-width:820px){.mn-links{display:none!important}}`}</style>
      <nav style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ color: "#fff", fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}><span style={{ color: BRAND }}><CircleMark /></span>BackRead</a>
        <div className="mn-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/#how" style={link}>How it works</a>
          <a href="/#why" style={link}>Why BackRead</a>
          <a href="/pricing" style={{ ...link, color: activePricing ? "#fff" : CLOUD, fontWeight: activePricing ? 600 : 400 }}>Pricing</a>
        </div>
        {authed === null ? (
          <span style={{ width: 160 }} />
        ) : authed ? (
          <a href="/overview" className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>Open app →</a>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/login" className="mn-signin" style={{ color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 8, textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)" }}>Sign in</a>
            <a href="/login" className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>Start free</a>
          </div>
        )}
      </nav>
    </div>
  );
}
