"use client";
import { useState, useEffect } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import { fetchJson, postJson, errMsg } from "@/lib/fetch-json";
export default function AcceptInviteClient({ token }: { token: string }) {
  const locale = useLocale();
  const iv = getDict(locale).invitePage;
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading");
  const [info, setInfo] = useState<{ email: string; firstName: string; orgName: string } | null>(null);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState(""); const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    fetchJson<{ valid?: boolean; email?: string; firstName?: string; orgName?: string; reason?: string }>("/api/accept-invite?token=" + encodeURIComponent(token), {}, 20000)
      .then((d) => {
        if (!alive) return;
        if (d.valid) { setInfo({ email: d.email ?? "", firstName: d.firstName ?? "", orgName: d.orgName ?? "" }); setState("valid"); }
        else { setReason(d.reason ?? "invalid"); setState("invalid"); }
      })
      .catch(() => { if (alive) setState("invalid"); });
    return () => { alive = false; };
  }, [token]);
  async function accept() {
    if (password.length < 8) { setError(iv.passwordTooShort); return; }
    setBusy(true); setError("");
    try {
      await postJson("/api/accept-invite", { token, password });
      // Account created; send them to login to sign in.
      window.location.href = "/login?joined=1";
    } catch (e) {
      setError(errMsg(e, iv.somethingWrong));
      setBusy(false);
    }
  }
  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.canvas, fontFamily: T.font, letterSpacing: T.tracking, padding: 20 }}>
      <div style={{ width: 400, maxWidth: "100%", background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" stroke={T.green} strokeWidth="2.4" />
            <circle cx="12" cy="12" r="3.5" fill={T.green} />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight }}>ReadProspects</span>
        </div>
        {children}
      </div>
    </div>
  );
  if (state === "loading") return shell(<p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>{iv.checking}</p>);
  if (state === "invalid") {
    const messages: Record<string, string> = { expired: iv.expired, used: iv.used, invalid: iv.invalid };
    return shell(<>
      <h1 style={{ fontSize: 19, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 7px" }}>{iv.unavailableTitle}</h1>
      <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>{messages[reason] ?? messages.invalid}</p>
      <a href="/login" style={{ display: "inline-flex", alignItems: "center", height: 34, background: T.green, color: T.onAccent, fontSize: 13.5, fontWeight: 500, padding: "0 13px", borderRadius: T.rBtn, textDecoration: "none" }}>{iv.goToSignIn}</a>
    </>);
  }
  return shell(<>
    <h1 style={{ fontSize: 19, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 7px" }}>{iv.joinPrefix} {info?.orgName}</h1>
    <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>{iv.hiPrefix} {info?.firstName}{iv.setPasswordBodyA}<span style={{ color: T.heading }}>{info?.email}</span>{iv.setPasswordBodyB}</p>
    <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 }}>{iv.choosePassword}</span>
    <div style={{ position: "relative", marginBottom: 16 }}>
      <input className="iv-in" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && accept()} placeholder={iv.atLeast8}
        style={{ width: "100%", height: 34, boxSizing: "border-box", border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 40px 0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading }} />
      <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 5, color: T.muted, lineHeight: 0 }}>
        {showPw ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
      </button>
      <style>{`.iv-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
    </div>
    <button onClick={accept} disabled={busy || password.length < 8} style={{ width: "100%", height: 38, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, fontSize: 14, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy || password.length < 8 ? 0.5 : 1 }}>{busy ? iv.creatingAccount : iv.acceptAndJoin}</button>
    {error && <div style={{ marginTop: 14, background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, lineHeight: 1.5 }}>{error}</div>}
  </>);
}