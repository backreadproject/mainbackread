"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#1A1D21", PAPER = "#F7F6F3", READER = "#2F4A3F", MARK = "#C4442E", GRAPHITE = "#8A8778", RULE = "#E4E2DB";
const VOICE = "'Aeonik', Arial, sans-serif", SANS = "'Aeonik', Arial, sans-serif", MONO = "'Aeonik', Arial, sans-serif";

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
      setMsg(error ? error.message : "Account created. You're signed in.");
      if (!error) window.location.href = "/dashboard";
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else window.location.href = "/dashboard";
    }
    setBusy(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", fontFamily: SANS, color: INK }}>
      <style>{`
        .br-in{width:100%;padding:12px 14px;border:1px solid ${RULE};border-radius:2px;font-size:15px;font-family:${SANS};background:#fff;box-sizing:border-box;outline:none;transition:border-color .15s}
        .br-in:focus{border-color:${INK}}
        .br-sub{transition:opacity .15s}.br-sub:hover{opacity:.6}
        @media(max-width:820px){.br-left{display:none!important}}`}</style>

      {/* Left — the thesis, editorial */}
      <div className="br-left" style={{ background: INK, color: PAPER, padding: "56px 64px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: GRAPHITE }}>BackRead</div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <p style={{ fontFamily: VOICE, fontWeight: 300, fontSize: 44, lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0 }}>
            Every document you send is a conversation you're not in the room for.
          </p>
          <p style={{ fontFamily: VOICE, fontStyle: "normal", fontWeight: 300, fontSize: 22, lineHeight: 1.4, margin: "24px 0 0", color: "#C9C7BF" }}>
            BackRead puts you in the room.
          </p>
        </div>

        {/* The read-trace: a marginal rail that thickens with dwell */}
        <svg width="100%" height="80" style={{ position: "absolute", left: 0, bottom: 90, opacity: 0.5 }} aria-hidden="true">
          <defs><linearGradient id="rt" x1="0" x2="1"><stop offset="0" stopColor={MARK} stopOpacity="0"/><stop offset="0.5" stopColor={MARK}/><stop offset="1" stopColor={MARK} stopOpacity="0.2"/></linearGradient></defs>
          <path d="M64 40 Q 200 12, 320 40 T 620 34" stroke="url(#rt)" strokeWidth="2" fill="none"/>
          <circle cx="320" cy="40" r="4" fill={MARK}/>
        </svg>

        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: GRAPHITE, position: "relative", zIndex: 2 }}>
          The document reads the reader.
        </div>
      </div>

      {/* Right — the form, quiet */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 340 }}>
          <h1 style={{ fontFamily: VOICE, fontWeight: 400, fontSize: 30, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p style={{ fontSize: 14, color: GRAPHITE, margin: "0 0 28px" }}>
            {mode === "signin" ? "Pick up where your readers left off." : "Start reading your readers back."}
          </p>

          <label style={{ fontFamily: MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: GRAPHITE, display: "block", marginBottom: 6 }}>Email</label>
          <input className="br-in" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 16 }} />

          <label style={{ fontFamily: MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: GRAPHITE, display: "block", marginBottom: 6 }}>Password</label>
          <input className="br-in" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ marginBottom: 24 }} />

          <button onClick={submit} disabled={busy || !email || !password}
            style={{ width: "100%", padding: 13, background: INK, color: PAPER, border: "none", borderRadius: 2, fontSize: 14, fontWeight: 500, fontFamily: SANS, cursor: busy ? "default" : "pointer", opacity: busy || !email || !password ? 0.45 : 1, transition: "opacity .15s" }}>
            {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          {msg && <p style={{ fontSize: 13, color: MARK, marginTop: 14 }}>{msg}</p>}

          <p style={{ fontSize: 13, color: GRAPHITE, marginTop: 28, textAlign: "center" }}>
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button className="br-sub" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
              style={{ background: "none", border: "none", color: INK, fontWeight: 500, fontFamily: SANS, fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
