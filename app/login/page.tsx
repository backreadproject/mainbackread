"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import LanguageSwitcher from "@/lib/LanguageSwitcher";
function LoginForm() {
  const locale = useLocale();
  const a = getDict(locale).auth;
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "organization">("personal");
  // ?plan= and ?signup=1 come from the pricing cards. A visitor who already
  // chose a tier should not be asked to choose again; one arriving cold at this
  // page still gets the personal-or-company choice.
  const params = useSearchParams();
  const urlPlan = params.get("plan") ?? "";
  const knownPlan = ["free", "personal", "team", "business"].includes(urlPlan) ? urlPlan : "";
  const planIsOrg = knownPlan === "team" || knownPlan === "business";
  const [mode, setMode] = useState<"signin" | "signup">(params.get("signup") === "1" || knownPlan ? "signup" : "signin");
  const [workspaceName, setWorkspaceName] = useState("");
  const type: "personal" | "organization" = knownPlan ? (planIsOrg ? "organization" : "personal") : accountType;
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const canSubmit = mode === "signin" ? (!!email && !!password) : (!!email && !!password && !!firstName.trim() && !!lastName.trim() && (type !== "organization" || !!workspaceName.trim()));
  async function submit() {
    if (!canSubmit) return;
    setBusy(true); setMsg("");
    const supabase = createClient();
    if (mode === "signup") {
      // Referral code, set as a cookie by middleware when someone arrived via ?ref=.
      // It also goes into user_metadata below, because that is part of the auth
      // record and cannot be lost the way the profile upsert can.
      const refCode = (document.cookie.match(/(?:^|;\s*)rp_ref=([a-z0-9-]{3,32})/) || [])[1] || null;
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/login", data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName.trim()} ${lastName.trim()}`, account_type: type, plan: knownPlan || (type === "organization" ? "team" : "free"), ...(type === "organization" ? { workspace_name: workspaceName.trim() } : {}), ...(refCode ? { ref_code: refCode } : {}) } },
      });
      if (error) { setMsg(error.message); setBusy(false); return; }
      if (data.user) {
        const profileRow: Record<string, unknown> = {
          id: data.user.id, first_name: firstName.trim(), last_name: lastName.trim(),
          account_type: type, updated_at: new Date().toISOString(),
        };
        // trial_started_at, plan, the organization and the membership are all set
        // by the on_auth_user_created trigger, atomically with the auth user.
        // Attribution is resolved server-side: the code has to become a referrer id,
        // and only the service role can read the referrers table. Best effort here,
        // because user_metadata already carries the code as the durable record.
        if (refCode) {
          try {
            await fetch("/api/referral/attribute", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ code: refCode, userId: data.user?.id ?? null, email: email.trim() }),
            });
          } catch { /* non-fatal: metadata is the fallback */ }
        }
        const { error: upErr } = await supabase.from("profiles").upsert(profileRow);
        // Not fatal: the trigger has already created the row, so this only fills
        // in details. But a silent failure here is what concealed a broken
        // account_type for months, so it is at least logged now.
        if (upErr) console.warn("[signup] profile detail upsert failed:", upErr.message);
      }
      // With email confirmation enabled, signUp returns a user but no session.
      // Going into the app would bounce off the auth check and read as a failed
      // signup, so an unconfirmed account is told where the link went instead.
      if (!data.session) {
        window.location.href = "/check-email?email=" + encodeURIComponent(email.trim());
        return;
      }
      window.location.href = "/documents";
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
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "11px 13px", fontSize: 15, fontFamily: T.font, background: T.card, color: T.heading };
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 7 };
  // The hero is a brand panel, not app chrome. It stays deep green in both
  // themes, which is why it uses the hero tokens rather than the sidebar ones.
  return (
    <div className="login-grid" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-cta:hover{background:var(--rp-lime-hover)}.t-link:hover{opacity:.7}@media(max-width:820px){.t-hero{display:none!important}.login-grid{grid-template-columns:1fr!important}.login-form-pane{padding:20px 16px!important}}`}</style>
      <div className="t-hero" style={{ background: "var(--rp-hero-bg)", color: "var(--rp-hero-ink)", padding: "56px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}><circle cx="12" cy="12" r="9" stroke="var(--rp-hero-mark)" strokeWidth="2.4"/><circle cx="12" cy="12" r="3.5" fill="var(--rp-hero-mark)"/></svg><span style={{ fontSize: 20, fontWeight: 600, letterSpacing: T.trackingTight }}>ReadProspects</span></a>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0 }}>{a.heroTitleA}<br /><span style={{ color: "var(--rp-hero-mark)" }}>{a.heroTitleB}</span></h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, margin: "20px 0 0", color: "var(--rp-hero-sub)" }}>{a.heroSub}</p>
        </div>
        <div style={{ fontSize: 13, color: "var(--rp-hero-sub)" }}>{a.heroTagline}</div>
      </div>
      <div className="login-form-pane" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 40px", background: T.canvas, minHeight: "100vh", boxSizing: "border-box", position: "relative" }}>
        <div style={{ position: "absolute", top: 20, right: 24 }}><LanguageSwitcher current={locale} dark={false} /></div>
        <div style={{ width: "100%", maxWidth: 356, boxSizing: "border-box", background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 26, boxShadow: T.shadow }}>
          <h1 style={{ fontSize: 23, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 4px" }}>{mode === "signin" ? a.signinTitle : a.signupTitle}</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 18px" }}>{mode === "signin" ? a.signinSub : a.signupSub}</p>
          {mode === "signup" && !knownPlan && (
            <div style={{ marginBottom: 12 }}>
              <span style={label}>{a.accountType}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {([["personal", a.personal], ["organization", a.company]] as const).map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setAccountType(val as "personal" | "organization")} style={{ flex: 1, padding: "10px 12px", borderRadius: T.rInput, border: `1px solid ${accountType === val ? T.green : T.border}`, background: accountType === val ? T.greenSoft : T.card, color: accountType === val ? T.greenText : T.body, fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>{lbl}</button>
                ))}
              </div>
              {accountType === "organization" && <p style={{ fontSize: 12, color: T.greenText, margin: "8px 0 0", lineHeight: 1.5 }}>{a.trialNote}</p>}
            </div>
          )}
          {mode === "signup" && knownPlan && (
            <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px", lineHeight: 1.5 }}>
              {planIsOrg
                ? "Starting your 7-day " + (knownPlan === "team" ? "Team" : "Business") + " trial. No card needed."
                : knownPlan === "personal" ? "Setting up your Personal plan." : "Setting up your free account."}
            </p>
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
          {mode === "signup" && type === "organization" && (
            <div style={{ marginBottom: 12 }}>
              <span style={label}>{a.workspaceName}</span>
              <input className="t-in" placeholder={a.workspacePlaceholder} value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)} style={input} />
              <p style={{ fontSize: 12, color: T.muted, margin: "6px 0 0", lineHeight: 1.5 }}>{a.workspaceNote}</p>
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
          <button onClick={submit} disabled={busy || !canSubmit} className="t-cta" style={{ width: "100%", padding: 13, background: "var(--rp-lime)", color: "var(--rp-lime-ink)", border: "none", borderRadius: T.rBtn, fontSize: 15, fontWeight: 600, fontFamily: T.font, cursor: busy ? "default" : "pointer", opacity: busy || !canSubmit ? 0.5 : 1 }}>{busy ? a.working : mode === "signin" ? a.logIn : a.createAccount}</button>
          {msg && <p style={{ fontSize: 13, color: "var(--rp-danger-text)", marginTop: 14 }}>{msg}</p>}
          <p style={{ fontSize: 13, color: T.body, marginTop: 22, textAlign: "center" }}>{mode === "signin" ? a.noAccount : a.haveAccount}<button className="t-link" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }} style={{ background: "none", border: "none", color: T.green, fontWeight: 600, fontFamily: T.font, fontSize: 13, cursor: "pointer" }}>{mode === "signin" ? a.signupSwitch : a.signinSwitch}</button></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
