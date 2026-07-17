"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setMsg("");
    const supabase = createClient();
    if (mode === "signup") { const { error } = await supabase.auth.signUp({ email, password }); if (error) setMsg(error.message); else window.location.href = "/overview"; }
    else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setMsg(error.message); else window.location.href = "/overview"; }
    setBusy(false);
  }
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "11px 13px", fontSize: 15, fontFamily: T.font, background: "#fff" };
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 7 };
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-cta:hover{background:${T.greenHover}}.t-link:hover{opacity:.7}@media(max-width:820px){.t-hero{display:none!important}}`}</style>
      <div className="t-hero" style={{ background: T.sidebarGradient, color: "#fff", padding: "56px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: T.brandGreen, fontSize: 20 }}>â—‰</span><span style={{ fontSize: 20, fontWeight: 700, letterSpacing: T.trackingTight }}>BackRead</span></div>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0 }}>Every document reaches.<br /><span style={{ color: T.brandGreen }}>Every reader, understood.</span></h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, margin: "20px 0 0", color: "rgba(255,255,255,0.72)" }}>Send a document that answers questions, watches how it's read, and tells you what to do next.</p>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>The document reads the reader.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: T.canvas }}>
        <div style={{ width: 356, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 32 }}>
          <h1 style={{ fontSize: 23, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 4px" }}>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 24px" }}>{mode === "signin" ? "Log in to access your account." : "Start reading your readers back."}</p>
          <span style={label}>Work email</span>
          <input className="t-in" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...input, marginBottom: 16 }} />
          <span style={label}>Password</span>
          <input className="t-in" type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...input, marginBottom: 10 }} />
          <div style={{ textAlign: "right", marginBottom: 18 }}><a href="/forgot-password" className="t-link" style={{ fontSize: 13, color: T.body, textDecoration: "none" }}>Forgot password?</a></div>
          <button onClick={submit} disabled={busy || !email || !password} className="t-cta" style={{ width: "100%", padding: 13, background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, fontSize: 15, fontWeight: 600, fontFamily: T.font, cursor: busy ? "default" : "pointer", opacity: busy || !email || !password ? 0.5 : 1 }}>{busy ? "One momentâ€¦" : mode === "signin" ? "Log in" : "Create account"}</button>
          {msg && <p style={{ fontSize: 13, color: "#B42318", marginTop: 14 }}>{msg}</p>}
          <p style={{ fontSize: 13, color: T.body, marginTop: 22, textAlign: "center" }}>{mode === "signin" ? "New here? " : "Have an account? "}<button className="t-link" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }} style={{ background: "none", border: "none", color: T.green, fontWeight: 600, fontFamily: T.font, fontSize: 13, cursor: "pointer" }}>{mode === "signin" ? "Create an account" : "Log in"}</button></p>
        </div>
      </div>
    </div>
  );
}
