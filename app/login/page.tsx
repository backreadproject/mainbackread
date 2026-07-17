"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#0B1220", CANVAS = "#F4F6FA", CARD = "#FFFFFF", BLUE = "#2D6BFF", BLUE_DEEP = "#1B47B8", SLATE = "#64748B", LINE = "#E7EBF2", RED = "#DC2626", GREEN = "#10B981";
const AEON = "'Moderat', 'Inter', sans-serif";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setMsg("");
    const supabase = createClient();
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message); else window.location.href = "/documents";
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else window.location.href = "/documents";
    }
    setBusy(false);
  }

  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 15, fontFamily: AEON, background: "#fff", outline: "none" };
  const label = { fontSize: 13, fontWeight: 400, color: SLATE, display: "block", marginBottom: 7 };

  return (
    <div style={{ minHeight: "100vh", background: CANVAS, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", fontFamily: AEON, color: INK }}>
      <style>{`.fx-in:focus{border-color:${BLUE}}
        .fx-cta{transition:box-shadow .15s,transform .1s}.fx-cta:hover{box-shadow:0 8px 22px rgba(45,107,255,0.35)}.fx-cta:active{transform:translateY(1px)}
        .fx-link{transition:opacity .15s}.fx-link:hover{opacity:.7}
        @media(max-width:820px){.fx-hero{display:none!important}}`}</style>

      <div className="fx-hero" style={{ background: `linear-gradient(150deg, ${BLUE} 0%, ${BLUE_DEEP} 100%)`, color: "#fff", padding: "56px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-0.01em" }}>BackRead</div>
        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: 38, fontWeight: 400, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}>Every document you send is a conversation you're not in the room for.</p>
          <p style={{ fontSize: 19, lineHeight: 1.5, margin: "20px 0 0", color: "rgba(255,255,255,0.82)" }}>BackRead puts you in the room.</p>
        </div>
        <svg width="100%" height="70" style={{ position: "absolute", left: 0, bottom: 100, opacity: 0.4 }} aria-hidden="true">
          <defs><linearGradient id="rt" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" /><stop offset="1" stopColor={GREEN} stopOpacity="0.5" /></linearGradient></defs>
          <path d="M60 36 Q 200 10, 320 36 T 620 30" stroke="url(#rt)" strokeWidth="2.5" fill="none" />
          <circle cx="320" cy="36" r="4" fill="#fff" />
        </svg>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", position: "relative", zIndex: 2 }}>The document reads the reader.</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 348, background: CARD, borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(11,18,32,0.04), 0 12px 40px rgba(11,18,32,0.08)" }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 4px" }}>{mode === "signin" ? "Sign in" : "Create your account"}</h1>
          <p style={{ fontSize: 14, color: SLATE, margin: "0 0 24px" }}>{mode === "signin" ? "Pick up where your readers left off." : "Start reading your readers back."}</p>

          <span style={label}>Email</span>
          <input className="fx-in" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...input, marginBottom: 16 }} />
          <span style={label}>Password</span>
          <input className="fx-in" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...input, marginBottom: 22 }} />

          <div style={{ textAlign: "right", marginBottom: 16, marginTop: -8 }}>
            <a href="/forgot-password" style={{ fontSize: 13, color: SLATE, textDecoration: "none" }}>Forgot password?</a>
          </div>
          <button onClick={submit} disabled={busy || !email || !password} className="fx-cta"
            style={{ width: "100%", padding: 13, background: BLUE, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 400, fontFamily: AEON, cursor: busy ? "default" : "pointer", opacity: busy || !email || !password ? 0.5 : 1, boxShadow: "0 4px 12px rgba(45,107,255,0.25)" }}>
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {msg && <p style={{ fontSize: 13, color: RED, marginTop: 14 }}>{msg}</p>}

          <p style={{ fontSize: 13, color: SLATE, marginTop: 24, textAlign: "center" }}>
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button className="fx-link" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
              style={{ background: "none", border: "none", color: BLUE, fontWeight: 400, fontFamily: AEON, fontSize: 13, cursor: "pointer" }}>
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
