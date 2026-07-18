"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NIGHT = "#082019", BRAND = "#1FA971", GREEN = "#0B7A4B", CLOUD = "rgba(255,255,255,0.72)";
const DM = "var(--font-dm-sans), system-ui, sans-serif";

const CircleMark = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg>
);

export default function MarketingNav({ activePricing = false }: { activePricing?: boolean }) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "20px 32px" } as const;
  const link = { color: CLOUD, fontSize: 15, textDecoration: "none" } as const;

  return (
    <div style={{ background: NIGHT, fontFamily: DM }}>
      <style>{`.mn-cta{transition:background .15s}.mn-cta:hover{background:#0A6A41}.mn-links a:hover{color:#fff}@media(max-width:820px){.mn-links{display:none!important}}`}</style>
      <nav style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ color: "#fff", fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}><span style={{ color: BRAND }}><CircleMark /></span>BackRead</a>
        <div className="mn-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/#how" style={link}>How it works</a>
          <a href="/#why" style={link}>Why BackRead</a>
          <a href="/pricing" style={{ ...link, color: activePricing ? "#fff" : CLOUD, fontWeight: activePricing ? 600 : 400 }}>Pricing</a>
          {authed === false && <a href="/login" style={link}>Sign in</a>}
        </div>
        {/* Auth-aware CTA. Null state renders nothing to avoid a flash. */}
        {authed === null ? (
          <span style={{ width: 96 }} />
        ) : authed ? (
          <a href="/overview" className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>Open app →</a>
        ) : (
          <a href="/login" className="mn-cta" style={{ background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>Start free</a>
        )}
      </nav>
    </div>
  );
}
