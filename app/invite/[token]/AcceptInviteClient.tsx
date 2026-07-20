"use client";

import { useState, useEffect } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

export default function AcceptInviteClient({ token }: { token: string }) {
  const locale = useLocale();
  const iv = getDict(locale).invitePage;
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading");
  const [info, setInfo] = useState<{ email: string; firstName: string; orgName: string } | null>(null);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState(""); const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/accept-invite?token=${token}`).then((r) => r.json()).then((d) => {
      if (d.valid) { setInfo({ email: d.email, firstName: d.firstName, orgName: d.orgName }); setState("valid"); }
      else { setReason(d.reason ?? "invalid"); setState("invalid"); }
    }).catch(() => setState("invalid"));
  }, [token]);

  async function accept() {
    if (password.length < 8) { setError(iv.passwordTooShort); return; }
    setBusy(true); setError("");
    const res = await fetch("/api/accept-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? iv.somethingWrong); setBusy(false); return; }
    // Account created; send them to login to sign in.
    window.location.href = "/login?joined=1";
  }

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, padding: 20 }}>
      <div style={{ width: 400, maxWidth: "100%", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ color: T.brandGreen, fontSize: 20 }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "-0.1em" }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="currentColor" /></svg></span>
          <span style={{ fontSize: 20, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight }}>ReadProspects</span>
        </div>
        {children}
      </div>
    </div>
  );

  if (state === "loading") return shell(<p style={{ fontSize: 15, color: T.body }}>{iv.checking}</p>);

  if (state === "invalid") {
    const messages: Record<string, string> = {
      expired: iv.expired,
      used: iv.used,
      invalid: iv.invalid,
    };
    return shell(<>
      <h1 style={{ fontSize: 21, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 8px" }}>{iv.unavailableTitle}</h1>
      <p style={{ fontSize: 15, color: T.body, lineHeight: 1.5, margin: "0 0 20px" }}>{messages[reason] ?? messages.invalid}</p>
      <a href="/login" style={{ display: "inline-block", background: T.green, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: T.rBtn, textDecoration: "none" }}>{iv.goToSignIn}</a>
    </>);
  }

  return shell(<>
    <h1 style={{ fontSize: 21, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 6px" }}>{iv.joinPrefix} {info?.orgName}</h1>
    <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 22px" }}>{iv.hiPrefix} {info?.firstName}{iv.setPasswordBodyA}<strong style={{ color: T.heading }}>{info?.email}</strong>{iv.setPasswordBodyB}</p>
    <span style={{ fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 7 }}>{iv.choosePassword}</span>
    <div style={{ position: "relative", marginBottom: 16 }}>
      <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && accept()} placeholder={iv.atLeast8} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "11px 44px 11px 13px", fontSize: 15, fontFamily: T.font, background: "#fff" }} />
      <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 6, color: T.muted, lineHeight: 0 }}>
        {showPw ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
      </button>
    </div>
    <button onClick={accept} disabled={busy || password.length < 8} style={{ width: "100%", background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: 13, fontSize: 15, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy || password.length < 8 ? 0.5 : 1 }}>{busy ? iv.creatingAccount : iv.acceptAndJoin}</button>
    {error && <p style={{ fontSize: 13, color: "#B42318", marginTop: 14 }}>{error}</p>}
  </>);
}
