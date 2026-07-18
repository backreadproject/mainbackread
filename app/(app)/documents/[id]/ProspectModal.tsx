"use client";

import { useState } from "react";
import { T } from "@/lib/theme";

type NewRec = { id: string; label: string | null; share_token: string; created_at: string };

export default function ProspectModal({ documentId, onClose, onCreated }: {
  documentId: string;
  onClose: () => void;
  onCreated: (rec: NewRec, readUrl: string, emailInfo: { sent: boolean; warning?: string } | null) => void;
}) {
  const [step, setStep] = useState<"type" | "link" | "email">("type");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(mode: "link" | "email") {
    setError("");
    if (!firstName.trim() || !lastName.trim()) { setError("First and last name are required."); return; }
    if (mode === "email" && !email.trim()) { setError("Email is required to send."); return; }
    setBusy(true);
    const res = await fetch("/api/share-prospect", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId, mode, firstName, lastName, email: mode === "email" ? email : undefined }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Something went wrong."); setBusy(false); return; }
    onCreated(json.recipient, json.readUrl, mode === "email" ? { sent: !!json.emailSent, warning: json.emailWarning } : null);
  }

  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 };
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 6 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 26, width: 440, maxWidth: "100%", fontFamily: T.font, letterSpacing: T.tracking }}>
        <style>{`.t-in:focus{border-color:${T.green};outline:none}`}</style>

        {step === "type" && (
          <>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>Share with a prospect</h3>
            <p style={{ fontSize: 14, color: T.body, margin: "0 0 22px", lineHeight: 1.5 }}>Send this document to someone outside your team and track how they read it.</p>
            <button onClick={() => setStep("link")} style={choiceBtn}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={iconWrap}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1 M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg></span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.heading }}>Share as link</div>
                  <div style={{ fontSize: 13, color: T.body }}>Get a tracked link to send yourself</div>
                </div>
              </div>
            </button>
            <button onClick={() => setStep("email")} style={{ ...choiceBtn, marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={iconWrap}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z M4 6l8 6 8-6" /></svg></span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.heading }}>Send as email</div>
                  <div style={{ fontSize: 13, color: T.body }}>BackRead emails the link for you</div>
                </div>
              </div>
            </button>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={onClose} style={ghostBtn}>Cancel</button>
            </div>
          </>
        )}

        {(step === "link" || step === "email") && (
          <>
            <button onClick={() => { setStep("type"); setError(""); }} style={{ background: "none", border: "none", color: T.body, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 14, fontFamily: T.font }}>‹ Back</button>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>{step === "email" ? "Send as email" : "Share as link"}</h3>
            <p style={{ fontSize: 13, color: T.body, margin: "0 0 20px" }}>{step === "email" ? "We'll email the tracked link and record this reader." : "We'll create a tracked link labelled with this name."}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><span style={label}>First name</span><input className="t-in" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sarah" style={input} /></div>
              <div style={{ flex: 1 }}><span style={label}>Last name</span><input className="t-in" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Chen" style={input} /></div>
            </div>
            {step === "email" && (<><span style={label}>Email</span><input className="t-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@company.com" style={input} /></>)}
            {error && <p style={{ fontSize: 13, color: "#B42318", margin: "2px 0 12px" }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button onClick={onClose} style={ghostBtn}>Cancel</button>
              <button onClick={() => submit(step)} disabled={busy} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 20px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Working…" : step === "email" ? "Send" : "Create link"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const choiceBtn = { display: "block", width: "100%", background: "#fff", border: "1px solid #EAECEF", borderRadius: 12, padding: 16, cursor: "pointer", fontFamily: "inherit" };
const iconWrap = { width: 36, height: 36, borderRadius: 9, background: "#E7F6EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const ghostBtn = { background: "#fff", border: "1px solid #EAECEF", borderRadius: 8, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", color: "#0F1729", cursor: "pointer" };
