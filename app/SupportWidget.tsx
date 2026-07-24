"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { T } from "@/lib/theme";

type Msg = { role: string; content: string; created_at?: string };

const KEY = "rp_support_session";

function getSession(): string {
  if (typeof window === "undefined") return "";
  let t = window.localStorage.getItem(KEY);
  if (!t || t.length < 20) {
    // Long and random: this token is the only thing protecting the conversation.
    t = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
    window.localStorage.setItem(KEY, t);
  }
  return t;
}

export default function SupportWidget({ surface = "marketing" }: { surface?: "marketing" | "app" }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("new");
  const [hasEmail, setHasEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSession(getSession()); }, []);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/support?session=${encodeURIComponent(session)}`);
      const j = await res.json();
      setMsgs(j.messages ?? []);
      setStatus(j.status ?? "new");
      setHasEmail(!!j.hasEmail);
    } catch { /* offline, try again on the next tick */ }
  }, [session]);

  useEffect(() => { if (open && session) load(); }, [open, session, load]);

  // Poll only while a person is involved and the panel is open. No point otherwise.
  useEffect(() => {
    if (!open || !(status === "escalated" || status === "answered")) return;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [open, status, load]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send() {
    const text = draft.trim();
    if (!text || busy || !session) return;
    setBusy(true); setErr(""); setDraft("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/support", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionToken: session, message: text, surface, email: email.trim() || undefined }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error || "That did not go through."); setBusy(false); return; }
      if (j.answer) setMsgs((m) => [...m, { role: "assistant", content: j.answer }]);
      if (j.escalate) setStatus("escalated");
    } catch {
      setErr("That did not go through. Check your connection.");
    }
    setBusy(false);
  }

  async function saveEmail() {
    const e = email.trim();
    if (!e || !e.includes("@")) { setErr("That does not look like an email address."); return; }
    setErr("");
    await fetch("/api/support", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionToken: session, message: `[contact] ${e}`, surface, email: e }),
    });
    setHasEmail(true);
    load();
  }

  const waiting = status === "escalated";
  const bubble = { maxWidth: "84%", padding: "9px 12px", borderRadius: 13, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const };

  return (
    <>
      <style>{`
        .rp-sw-launch{transition:transform .16s, box-shadow .16s}
        .rp-sw-launch:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(11,122,75,0.34)}
        .rp-sw-in:focus{border-color:${T.green};outline:none}
        .rp-sw-panel{animation:rpSwIn .18s ease-out}
        @keyframes rpSwIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @media(max-width:520px){.rp-sw-panel{width:calc(100vw - 24px) !important;height:calc(100vh - 120px) !important;right:12px !important}}
      `}</style>

      {open && (
        <div className="rp-sw-panel" style={{ position: "fixed", right: 22, bottom: 92, width: 366, height: 520, background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(9,30,22,0.24)", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 9998, fontFamily: T.font, letterSpacing: T.tracking }}>

          <div style={{ background: T.sidebarGradient, padding: "16px 18px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>ReadProspects</span>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, width: 26, height: 26, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 12.5, margin: "4px 0 0" }}>
              {waiting ? "Passed to a person. They will reply here or by email." : "Ask anything about ReadProspects."}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", background: T.canvas }}>
            {msgs.length === 0 && !busy && (
              <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, padding: "6px 2px" }}>
                Ask about plans, how sharing works, what a verdict is, or anything else. If I cannot answer it, I will pass it to a person.
              </div>
            )}
            {msgs.filter((m) => !m.content.startsWith("[contact]")).map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 9 }}>
                <div style={{ ...bubble, background: m.role === "user" ? T.green : "#fff", color: m.role === "user" ? "#fff" : T.heading, border: m.role === "user" ? "none" : `1px solid ${T.border}` }}>
                  {m.role === "human" && <div style={{ fontSize: 10.5, fontWeight: 700, color: T.greenText, marginBottom: 3 }}>ReadProspects team</div>}
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div style={{ fontSize: 12.5, color: T.muted, padding: "2px 4px" }}>Thinking...</div>}
            {waiting && !hasEmail && (
              <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginTop: 6 }}>
                <div style={{ fontSize: 12.5, color: T.heading, fontWeight: 600, marginBottom: 6 }}>Where should we reply?</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input className="rp-sw-in" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
                    style={{ flex: 1, minWidth: 0, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: T.font }} />
                  <button onClick={saveEmail} style={{ background: T.green, color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>Save</button>
                </div>
              </div>
            )}
            {err && <div style={{ fontSize: 12.5, color: "#B42318", padding: "4px 2px" }}>{err}</div>}
            <div ref={endRef} />
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, padding: 11, display: "flex", gap: 8, background: "#fff", flexShrink: 0 }}>
            <input className="rp-sw-in" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={waiting ? "Add anything else..." : "Ask a question..."} maxLength={600}
              style={{ flex: 1, minWidth: 0, border: `1px solid ${T.border}`, borderRadius: 20, padding: "9px 14px", fontSize: 13.5, fontFamily: T.font, background: T.canvas }} />
            <button onClick={send} disabled={busy || !draft.trim()} aria-label="Send"
              style={{ background: T.green, color: "#fff", border: "none", borderRadius: 20, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: busy || !draft.trim() ? 0.5 : 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen((v) => !v)} className="rp-sw-launch" aria-label="Support"
        style={{ position: "fixed", right: 22, bottom: 22, width: 54, height: 54, borderRadius: 27, background: T.green, border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(11,122,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        {open ? (
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        )}
      </button>
    </>
  );
}
