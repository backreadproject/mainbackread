"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#0A0E17", CANVAS = "#FBFBFA", CARD = "#FFFFFF", BLUE = "#1D4ED8", SLATE = "#475569", LINE = "#E7EBF2", GREEN = "#059669", RED = "#DC2626";
const INTER = "var(--font-dm-sans), system-ui, sans-serif";

export default function ForgotPasswordPage() {
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

  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, fontFamily: INTER, background: "#fff", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: CANVAS, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, color: INK, padding: 40 }}>
      <style>{`.fx-in:focus{border-color:${BLUE}}.fx-cta:hover{box-shadow:0 8px 22px rgba(45,107,255,0.32)}.fx-link:hover{opacity:.7}`}</style>
      <div style={{ width: 360, background: CARD, borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(11,18,32,0.04), 0 12px 40px rgba(11,18,32,0.08)" }}>
        {sent ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 8px" }}>Check your inbox</h1>
            <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.5, margin: "0 0 20px" }}>If an account exists for {email}, a reset link is on its way. The link opens a page where you set a new password.</p>
            <a href="/login" className="fx-link" style={{ fontSize: 14, color: BLUE, textDecoration: "none", fontWeight: 400 }}>Back to sign in</a>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 4px" }}>Reset your password</h1>
            <p style={{ fontSize: 14, color: SLATE, margin: "0 0 22px" }}>We'll email you a link to set a new one.</p>
            <input className="fx-in" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...input, marginBottom: 18 }} />
            <button onClick={submit} disabled={busy || !email} className="fx-cta" style={{ width: "100%", padding: 13, background: BLUE, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 400, fontFamily: INTER, cursor: busy ? "default" : "pointer", opacity: busy || !email ? 0.5 : 1, boxShadow: "0 4px 12px rgba(45,107,255,0.25)", transition: "box-shadow .15s" }}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
            {msg && <p style={{ fontSize: 13, color: RED, marginTop: 14 }}>{msg}</p>}
            <p style={{ fontSize: 13, color: SLATE, marginTop: 22, textAlign: "center" }}>
              Remembered it? <a href="/login" className="fx-link" style={{ color: BLUE, textDecoration: "none", fontWeight: 400 }}>Sign in</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
