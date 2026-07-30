"use client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const E = getDict(useLocale()).chrome;
  return (
    <div style={{ minHeight: "100vh", background: T.canvas, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: T.font, letterSpacing: T.tracking, color: T.heading, padding: 40, textAlign: "center" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 13, background: T.greenSoft, marginBottom: 20 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
      </span>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: T.trackingTight, color: T.heading, margin: "0 0 10px" }}>{E.errorH}</h1>
      <p style={{ fontSize: 16, color: T.body, margin: "0 0 26px", maxWidth: 420, lineHeight: 1.55 }}>{E.errorB}</p>
      <button onClick={reset} style={{ background: T.green, color: "var(--rp-on-accent)", fontSize: 15, fontWeight: 600, padding: "11px 22px", borderRadius: T.rBtn, border: "none", cursor: "pointer", fontFamily: T.font, boxShadow: "0 4px 14px rgba(11,122,75,0.22)" }}>{E.tryAgain}</button>
    </div>
  );
}
