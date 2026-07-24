"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import LanguageSwitcher from "@/lib/LanguageSwitcher";

export default function LoginPage() {
  const locale = useLocale();
  const a = getDict(locale).auth;
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "company">("personal");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const canSubmit = mode === "signin" ? (!!email && !!password) : (!!email && !!password && !!firstName.trim() && !!lastName.trim());
  async function submit() {
    if (!canSubmit) return;
    setBusy(true); setMsg("");
    const supabase = createClient();
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName.trim()} ${lastName.trim()}` } },
      });
      if (error) { setMsg(error.message); setBusy(false); return; }
      if (data.user) {
        const profileRow: Record<string, unknown> = {
          id: data.user.id, first_name: firstName.trim(), last_name: lastName.trim(),
          account_type: accountType, updated_at: new Date().toISOString(),
        };
        if (accountType === "company") profileRow.trial_started_at = new Date().toISOString();
        await supabase.from("profiles").upsert(profileRow);
      }
      window.location.href = accountType === "company" ? "/members" : "/documents";
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMsg(error.message); }
      else {
        // Overview is the Intent Field and reads as empty with nothing to show,
        // so a user with no documents yet lands somewhere actionable instead.
        const { count } = await supabase.from("documents").select("id", { count: "exact", head: true });
        window.location.href = (count ?? 0) > 0 ? "/overview" : "/documents";
      }
    }
    setBusy(false);
  }
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "11px 13px", fontSize: 15, fontFamily: T.font, background: "#fff" };
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 7 };
  return (
    <div className="login-grid" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-cta:hover{background:#CDDD3E}.t-link:hover{opacity:.7}@media(max-width:820px){.t-hero{display:none!important}.login-grid{grid-template-columns:1fr!important}.login-form-pane{padding:20px 16px!important}}`}</style>
      <div className="t-hero" style={{ background: T.sidebarGradient, color: "#fff", padding: "56px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}><span style={{ color: T.brandGreen, fontSize: 20 }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{display:"inline-block",verticalAlign:"-0.1em",filter:"drop-shadow(0 0 3px rgba(51,230,162,0.55))"}}><circle cx="12" cy="12" r="9" stroke="#33E6A2" strokeWidth="2.4"/><circle cx="12" cy="12" r="3.5" fill="#33E6A2"/></svg></span><span style={{ fontSize: 20, fontWeight: 700, letterSpacing: T.trackingTight }}>ReadProspects</span></a>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0 }}>{a.heroTitleA}<br /><span style={{ color: T.brandGreen }}>{a.heroTitleB}</span></h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, margin: "20px 0 0", color: "rgba(255,255,255,0.72)" }}>{a.heroSub}</p>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{a.heroTagline}</div>
      </div>
      <div className="login-form-pane" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 40px", background: T.canvas, minHeight: "100vh", boxSizing: "border-box", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, right: 24 }}><LanguageSwitcher current={locale} dark={false} /></div>
        <div style={{ width: "100%", maxWidth: 356, boxSizing: "border-box", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: 26, boxShadow: "0 0 0 1px rgba(59,156,120,0.10), 0 8px 40px rgba(14,92,63,0.14), 0 2px 12px rgba(10,20,16,0.05)" }}>
          <h1 style={{ fontSize: 23, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 4px" }}>{mode === "signin" ? a.signinTitle : a.signupTitle}</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 18px" }}>{mode === "signin" ? a.signinSub : a.signupSub}</p>
          {mode === "signup" && (
            <div style={{ marginBottom: 12 }}>
              <span style={label}>{a.accountType}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {([["personal", a.personal], ["company", a.company]] as const).map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setAccountType(val as "personal" | "company")} style={{ flex: 1, padding: "10px 12px", borderRadius: T.rInput, border: `1px solid ${accountType === val ? T.green : T.border}`, background: accountType === val ? T.greenSoft : "#fff", color: accountType === val ? T.greenText : T.body, fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>{lbl}</button>
                ))}
              </div>
              {accountType === "company" && <p style={{ fontSize: 12, color: T.greenText, margin: "8px 0 0", lineHeight: 1.5 }}>{a.trialNote}</p>}
            </div>
          )}
          {mode === "signup" && (
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={label}>{a.firstName}</span>
                <input className="t-in" placeholder="Sarah" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={input} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={label}>{a.lastName}</span>
                <input className="t-in" placeholder="Chen" value={lastName} onChange={(e) => setLastName(e.target.value)} style={input} />
              </div>
            </div>
          )}
          <span style={label}>{a.email}</span>
          <input className="t-in" type="email" placeholder={a.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...input, marginBottom: 12 }} />
          <span style={label}>{a.password}</span>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <input className="t-in" type={showPassword ? "text" : "password"} placeholder={a.yourPassword} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ ...input, marginBottom: 0, paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 6, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
          <div style={{ textAlign: "right", marginBottom: 18 }}><a href="/forgot-password" className="t-link" style={{ fontSize: 13, color: T.body, textDecoration: "none" }}>{a.forgotLink}</a></div>
          <button onClick={submit} disabled={busy || !canSubmit} className="t-cta" style={{ width: "100%", padding: 13, background: "#D8E84A", color: "#08301F", border: "none", borderRadius: T.rBtn, fontSize: 15, fontWeight: 700, fontFamily: T.font, cursor: busy ? "default" : "pointer", opacity: busy || !canSubmit ? 0.5 : 1 }}>{busy ? a.working : mode === "signin" ? a.logIn : a.createAccount}</button>
          {msg && <p style={{ fontSize: 13, color: "#B42318", marginTop: 14 }}>{msg}</p>}
          <p style={{ fontSize: 13, color: T.body, marginTop: 22, textAlign: "center" }}>{mode === "signin" ? a.noAccount : a.haveAccount}<button className="t-link" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }} style={{ background: "none", border: "none", color: T.green, fontWeight: 600, fontFamily: T.font, fontSize: 13, cursor: "pointer" }}>{mode === "signin" ? a.signupSwitch : a.signinSwitch}</button></p>
        </div>
      </div>
    </div>
  );
}

