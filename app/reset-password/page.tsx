"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#0A0E17", CANVAS = "#FBFBFA", CARD = "#FFFFFF", BLUE = "#1D4ED8", SLATE = "#475569", LINE = "#E7EBF2", GREEN = "#059669", RED = "#DC2626";
const INTER = "var(--font-dm-sans), system-ui, sans-serif";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  // When the email link is followed, Supabase establishes a recovery session.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    if (pw.length < 6) { setMsg("Use at least 6 characters."); return; }
    if (pw !== pw2) { setMsg("Passwords don't match."); return; }
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setMsg(error.message); setBusy(false); return; }
    setDone(true); setBusy(false);
    setTimeout(() => { window.location.href = "/documents"; }, 1400);
  }

  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, fontFamily: INTER, background: "#fff", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: CANVAS, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, color: INK, padding: 40 }}>
      <style>{`.fx-in:focus{border-color:${BLUE}}.fx-cta:hover{box-shadow:0 8px 22px rgba(45,107,255,0.32)}`}</style>
      <div style={{ width: 360, background: CARD, borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(11,18,32,0.04), 0 12px 40px rgba(11,18,32,0.08)" }}>
        {done ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 8px" }}>Password updated</h1>
            <p style={{ fontSize: 14, color: SLATE, margin: 0 }}>Taking you to your documents…</p>
          </>
        ) : !ready ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 8px" }}>Opening your reset link…</h1>
            <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.5, margin: "0 0 16px" }}>If this doesn't clear in a moment, the link may have expired. Request a new one.</p>
            <a href="/forgot-password" style={{ fontSize: 14, color: BLUE, textDecoration: "none", fontWeight: 400 }}>Request a new link</a>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 4px" }}>Set a new password</h1>
            <p style={{ fontSize: 14, color: SLATE, margin: "0 0 22px" }}>Choose something you'll remember.</p>
            <input className="fx-in" type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ ...input, marginBottom: 12 }} />
            <input className="fx-in" type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...input, marginBottom: 18 }} />
            <button onClick={submit} disabled={busy} className="fx-cta" style={{ width: "100%", padding: 13, background: BLUE, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 400, fontFamily: INTER, cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1, boxShadow: "0 4px 12px rgba(45,107,255,0.25)", transition: "box-shadow .15s" }}>
              {busy ? "Updating…" : "Update password"}
            </button>
            {msg && <p style={{ fontSize: 13, color: RED, marginTop: 14 }}>{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
}
