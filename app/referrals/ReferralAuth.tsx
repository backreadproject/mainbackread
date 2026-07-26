"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
// Sign in, sign up, or join the programme. Three states in one component
// because they are one flow: a referrer needs an account, and an existing
// ReadProspects user already has one and only needs the entitlement.
export default function ReferralAuth({ mode }: { mode: "auth" | "join" }) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const input = {
    width: "100%", boxSizing: "border-box" as const, height: 38, background: T.card,
    color: T.heading, border: "1px solid " + T.border, borderRadius: T.rInput,
    padding: "0 11px", fontSize: 14, fontFamily: T.font,
  };
  const label = { display: "block", fontSize: 12.5, color: T.body, marginBottom: 5, marginTop: 12 };
  async function auth() {
    setBusy(true); setMsg("");
    const supabase = createClient();
    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) { setMsg(error.message); setBusy(false); return; }
      setMsg("Check your email to confirm, then sign in.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setMsg(error.message); setBusy(false); return; }
    window.location.reload();
  }
  async function join() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/referral/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim().toLowerCase(), displayName: name.trim(), payoutCurrency: currency }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(j.error || "Could not create your account."); setBusy(false); return; }
      window.location.reload();
    } catch {
      setMsg("Could not reach the server.");
      setBusy(false);
    }
  }
  return (
    <div style={{ maxWidth: 400 }}>
      {mode === "auth" ? (
        <>
          <div style={{ display: "flex", gap: 18, marginBottom: 4, fontSize: 13.5 }}>
            {(["signin", "signup"] as const).map((k) => (
              <button key={k} onClick={() => { setTab(k); setMsg(""); }}
                style={{ background: "none", border: "none", padding: "0 0 4px", cursor: "pointer", fontFamily: T.font,
                  fontSize: 13.5, fontWeight: tab === k ? 600 : 400, color: tab === k ? T.heading : T.muted,
                  borderBottom: tab === k ? "2px solid " + T.green : "2px solid transparent" }}>
                {k === "signin" ? "Sign in" : "Create an account"}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: "10px 0 0" }}>
            Already use ReadProspects? Sign in with the same email and password.
          </p>
          <label style={label}>Email</label>
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label style={label}>Password</label>
          <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && auth()} />
          <button onClick={auth} disabled={busy || !email.trim() || !password}
            style={{ width: "100%", marginTop: 16, height: 38, background: T.green, color: T.onAccent, border: "none",
              borderRadius: T.rBtn, fontSize: 14, fontWeight: 500, fontFamily: T.font, cursor: "pointer",
              opacity: busy ? 0.6 : 1 }}>
            {busy ? "Working..." : tab === "signin" ? "Sign in" : "Create account"}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.55, margin: 0 }}>
            Choose the link people will use. It cannot be changed later, so pick something you are happy to print.
          </p>
          <label style={label}>Your referral link</label>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid " + T.border, borderRadius: T.rInput, background: T.card, overflow: "hidden" }}>
            <span style={{ fontSize: 13, color: T.muted, whiteSpace: "nowrap", padding: "0 0 0 11px", flex: "none" }}>readprospects.com/?ref=</span>
            <input value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="yourname" maxLength={32}
              style={{ flex: 1, minWidth: 0, height: 38, border: "none", outline: "none", background: "transparent", color: T.heading, fontSize: 14, fontFamily: T.font, padding: "0 11px 0 2px" }} />
          </div>
          <label style={label}>Display name</label>
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="How we address you" />
          <label style={label}>Payout currency</label>
          <select style={{ ...input, height: 38 }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {["USD", "GBP", "EUR", "CAD", "NGN", "KES", "GHS", "ZAR"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={join} disabled={busy || code.trim().length < 3}
            style={{ width: "100%", marginTop: 18, height: 38, background: T.green, color: T.onAccent, border: "none",
              borderRadius: T.rBtn, fontSize: 14, fontWeight: 500, fontFamily: T.font, cursor: "pointer",
              opacity: busy || code.trim().length < 3 ? 0.6 : 1 }}>
            {busy ? "Creating..." : "Join the programme"}
          </button>
        </>
      )}
      {msg && <p style={{ fontSize: 13, color: T.dangerText, lineHeight: 1.5, margin: "14px 0 0" }}>{msg}</p>}
    </div>
  );
}