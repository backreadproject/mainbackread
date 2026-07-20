"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import LanguageSwitcher from "@/lib/LanguageSwitcher";

const INK = "#0F1729", CANVAS = "#F8F9FA", CARD = "#FFFFFF", GREEN = "#0B7A4B", BRAND = "#1FA971", SLATE = "#475569", LINE = "#EAECEF", RED = "#DC2626";
const LEMON = "#D8E84A";
const DM = "var(--font-dm-sans), system-ui, sans-serif";
const GLOW = "0 0 0 1px rgba(59,156,120,0.10), 0 8px 40px rgba(14,92,63,0.14), 0 2px 12px rgba(10,20,16,0.05)";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const a = getDict(locale).auth;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!email) return;
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setMsg(error.message);
    else setSent(true);
    setBusy(false);
  }
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, fontFamily: DM, background: "#fff", outline: "none" };
  return (
    <div style={{ minHeight: "100vh", background: CANVAS, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DM, color: INK, padding: "24px 16px", boxSizing: "border-box", position: "relative" }}>
      <style>{`.fx-in:focus{border-color:${GREEN}}.fx-cta:hover{background:#CDDD3E}.fx-link:hover{opacity:.7}`}</style>
      <div style={{ position: "absolute", top: 20, right: 24 }}><LanguageSwitcher current={locale} dark={false} /></div>
      <div style={{ width: "100%", maxWidth: 360, boxSizing: "border-box", background: CARD, borderRadius: 16, padding: 30, boxShadow: GLOW }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", marginBottom: 22 }}>
          <span style={{ color: BRAND, fontSize: 20 }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg></span>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>ReadProspects</span>
        </a>
        {sent ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 8px" }}>{a.forgotSentTitle}</h1>
            <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.5, margin: "0 0 20px" }}>{a.forgotSentBody}</p>
            <a href="/login" className="fx-link" style={{ fontSize: 14, color: GREEN, textDecoration: "none", fontWeight: 600 }}>{a.backToSignin}</a>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 4px" }}>{a.forgotTitle}</h1>
            <p style={{ fontSize: 14, color: SLATE, margin: "0 0 22px" }}>{a.forgotSub}</p>
            <input className="fx-in" type="email" placeholder={a.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...input, marginBottom: 18 }} />
            <button onClick={submit} disabled={busy || !email} className="fx-cta" style={{ width: "100%", padding: 13, background: LEMON, color: "#08301F", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: DM, cursor: busy ? "default" : "pointer", opacity: busy || !email ? 0.5 : 1, transition: "background .15s" }}>
              {busy ? a.forgotSending : a.forgotBtn}
            </button>
            {msg && <p style={{ fontSize: 13, color: RED, marginTop: 14 }}>{msg}</p>}
            <p style={{ fontSize: 13, color: SLATE, marginTop: 22, textAlign: "center" }}>
              {a.rememberedIt} <a href="/login" className="fx-link" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>{a.signinSwitch}</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
