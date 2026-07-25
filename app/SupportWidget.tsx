"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { T } from "@/lib/theme";
import { MessageCircle, X, ArrowRight, ChevronRight } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/support-kb";
import { fetchJson, postJson, errMsg } from "@/lib/fetch-json";
type Msg = { role: string; content: string; created_at?: string };
const KEY = "rp_support_session";
function getSession(): string {
  if (typeof window === "undefined") return "";
  let t = window.localStorage.getItem(KEY);
  if (!t || t.length < 20) {
    t = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
    window.localStorage.setItem(KEY, t);
  }
  return t;
}
function ago(iso?: string): string {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}
// One panel, not three tabs. The Home/Messages/Help split is Intercom's shape,
// designed for a company with a support department; this is one person. The
// conversation is the product, so it is what opens, and the common questions sit
// in the same panel behind one toggle instead of a second destination.
export default function SupportWidget({ surface = "marketing", firstName }: { surface?: "marketing" | "app"; firstName?: string | null }) {
  const [open, setOpen] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [session, setSession] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("new");
  const [hasEmail, setHasEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setSession(getSession()); }, []);
  const load = useCallback(async () => {
    if (!session) return;
    try {
      const j = await fetchJson<{ messages?: Msg[]; status?: string; hasEmail?: boolean }>("/api/support?session=" + encodeURIComponent(session), {}, 20000);
      setMsgs(j.messages ?? []);
      setStatus(j.status ?? "new");
      setHasEmail(!!j.hasEmail);
    } catch { /* offline; the next tick will try again */ }
  }, [session]);
  useEffect(() => { if (open && session) load(); }, [open, session, load]);
  // Poll while a person is involved and the panel is open.
  useEffect(() => {
    if (!open || !(status === "escalated" || status === "answered")) return;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [open, status, load]);
  useEffect(() => { if (!showFaq) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, showFaq]);
  async function send(text?: string) {
    const body = (text ?? draft).trim();
    if (!body || busy || !session) return;
    setShowFaq(false);
    setBusy(true); setErr(""); setDraft("");
    setMsgs((m) => [...m, { role: "user", content: body }]);
    try {
      const j = await postJson<{ answer?: string; escalate?: boolean }>("/api/support", { sessionToken: session, message: body, surface, email: email.trim() || undefined });
      if (j.answer) setMsgs((m) => [...m, { role: "assistant", content: j.answer as string }]);
      if (j.escalate) setStatus("escalated");
    } catch (e) {
      setErr(errMsg(e, "That did not go through."));
    } finally {
      setBusy(false);
    }
  }
  async function saveEmail() {
    const e = email.trim();
    if (!e || !e.includes("@")) { setErr("That does not look like an email address."); return; }
    setErr("");
    try {
      await postJson("/api/support", { sessionToken: session, message: "[contact] " + e, surface, email: e });
      setHasEmail(true);
      load();
    } catch (ex) {
      setErr(errMsg(ex, "Could not save that address."));
    }
  }
  const visible = msgs.filter((m) => !m.content.startsWith("[contact]"));
  const waiting = status === "escalated";
  const empty = visible.length === 0 && !busy;
  const head = { padding: "10px 14px", background: T.soft, borderBottom: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 } as const;
  const iconBtn = { background: "transparent", border: "1px solid " + T.border, borderRadius: 4, width: 24, height: 24, color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } as const;
  const bubble = { maxWidth: "86%", padding: "9px 12px", borderRadius: T.rCard, fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const };
  const field = { flex: 1, minWidth: 0, height: 32, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading } as const;
  const linkBtn = { background: "none", border: "none", padding: 0, fontSize: 12.5, fontFamily: T.font, color: T.greenText, cursor: "pointer", borderBottom: "1px solid " + T.greenBorder, flexShrink: 0 } as const;  return (
    <>
      <style>{`
        .rp-sw-in:focus{outline:none;border-color:var(--rp-green)}
        .rp-sw-row{transition:background .12s;cursor:pointer}
        .rp-sw-row:hover{background:var(--rp-hover)}
        .rp-sw-launch{transition:background .12s}
        .rp-sw-launch:hover{background:var(--rp-green-hover)}
        @media(max-width:520px){
          .rp-sw-panel{
            position:fixed !important;
            top:10px !important; bottom:70px !important;
            left:10px !important; right:10px !important;
            width:auto !important; max-width:none !important;
            height:auto !important; max-height:none !important;
          }
          .rp-sw-longtitle{display:none}
          .rp-sw-shorttitle{display:inline}
          .rp-sw-faqlong{display:none}
          .rp-sw-faqshort{display:inline}
        }
        .rp-sw-shorttitle{display:none}
        .rp-sw-faqshort{display:none}
      `}</style>
      {open && (
        <div className="rp-sw-panel" style={{ position: "fixed", right: 22, bottom: 76, width: 366, height: "min(540px, calc(100dvh - 130px))", background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 9998, fontFamily: T.font, letterSpacing: T.tracking }}>
          <div style={head}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {waiting && <i style={{ width: 6, height: 6, borderRadius: 2, background: T.amber, flexShrink: 0 }} />}
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {showFaq ? "Questions" : waiting ? "With the team" : (
                  <>
                    <span className="rp-sw-longtitle">ReadProspects support</span>
                    <span className="rp-sw-shorttitle">Support</span>
                  </>
                )}
              </span>
            </span>
            <button onClick={() => setShowFaq((v) => !v)} style={{ ...linkBtn, marginLeft: "auto" }}>
              {showFaq ? "Back to chat" : (
                <>
                  <span className="rp-sw-faqlong">Common questions</span>
                  <span className="rp-sw-faqshort">Questions</span>
                </>
              )}
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close" title="Close" style={iconBtn}>
              <X size={13} strokeWidth={2} />
            </button>
          </div>

          {showFaq ? (
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              {FAQ_ITEMS.map((f, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 8, overflow: "hidden" }}>
                    <div className="rp-sw-row" onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "11px 12px", fontSize: 13, color: T.heading }}>
                      <span style={{ minWidth: 0 }}>{f.q}</span>
                      <span style={{ color: T.faint, flex: "none", display: "flex", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                        <ChevronRight size={14} strokeWidth={2} />
                      </span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 12px 12px", fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                        {f.a}
                        <div style={{ marginTop: 10 }}>
                          <button onClick={() => { setShowFaq(false); setDraft(f.q); }} style={linkBtn}>Ask about this instead</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px" }}>
              {empty && (
                <>
                  <p style={{ fontSize: 13.5, color: T.heading, margin: "0 0 4px", lineHeight: 1.55 }}>
                    {firstName ? "Hi " + firstName + "." : "Hello."} Ask anything about ReadProspects.
                  </p>
                  <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px", lineHeight: 1.55 }}>
                    Plans, how sharing works, what a verdict means. If I cannot answer it, a person will.
                  </p>
                  <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard }}>
                    {FAQ_ITEMS.slice(0, 4).map((f, i) => (
                      <div key={i} className="rp-sw-row" onClick={() => send(f.q)}
                        style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "10px 12px", borderTop: i ? "1px solid " + T.borderSoft : "none", fontSize: 13, color: T.heading }}>
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.q}</span>
                        <span style={{ color: T.faint, flex: "none", display: "flex" }}><ArrowRight size={13} strokeWidth={2} /></span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {waiting && !empty && (
                <div style={{ fontSize: 12.5, color: T.muted, textAlign: "center", margin: "0 0 12px", lineHeight: 1.5 }}>
                  A person has this. They will reply here or by email.
                </div>
              )}
              {visible.map((m, i) =>
                m.role === "note" ? (
                  <div key={i} style={{ textAlign: "center", fontSize: 12.5, color: T.faint, margin: "2px 0 10px" }}>{m.content}</div>
                ) : (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 9 }}>
                    <div style={{ ...bubble, background: m.role === "user" ? T.green : T.card, color: m.role === "user" ? T.onAccent : T.heading, border: m.role === "user" ? "none" : "1px solid " + T.border }}>
                      {m.role === "human" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted, marginBottom: 4 }}>
                          <i style={{ width: 6, height: 6, borderRadius: 2, background: T.green }} />ReadProspects team
                        </div>
                      )}
                      {m.content}
                      {m.created_at && <div style={{ fontSize: 11, color: m.role === "user" ? "rgba(255,255,255,0.7)" : T.faint, marginTop: 4 }}>{ago(m.created_at)}</div>}
                    </div>
                  </div>
                )
              )}
              {busy && <div style={{ fontSize: 13, color: T.muted, padding: "2px 4px" }}>Thinking...</div>}
              {waiting && !hasEmail && surface === "marketing" && (
                <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: 12, marginTop: 6 }}>
                  <div style={{ fontSize: 12.5, color: T.body, fontWeight: 600, marginBottom: 7 }}>Where should we reply?</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input className="rp-sw-in" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEmail()} placeholder="you@company.com" style={field} />
                    <button onClick={saveEmail} style={{ height: 32, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", flexShrink: 0 }}>Save</button>
                  </div>
                </div>
              )}
              {err && <div style={{ background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "10px 12px", fontSize: 13, color: T.dangerText, marginTop: 8, lineHeight: 1.5 }}>{err}</div>}
              <div ref={endRef} />
            </div>
          )}

          {!showFaq && (
            <div style={{ borderTop: "1px solid " + T.border, padding: 11, display: "flex", gap: 8, background: T.card, flexShrink: 0 }}>
              <input className="rp-sw-in" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={waiting ? "Add anything else" : "Ask a question"} maxLength={600} style={field} />
              <button onClick={() => send()} disabled={busy || !draft.trim()} aria-label="Send" title="Send"
                style={{ height: 32, width: 32, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: busy || !draft.trim() ? 0.5 : 1 }}>
                <ArrowRight size={15} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Not the universal glowing circle. A small labelled control that reads as
          part of the app rather than a bolted-on chatbot. */}
      <button onClick={() => setOpen((v) => !v)} className="rp-sw-launch" aria-label="Support"
        style={{ position: "fixed", right: 22, bottom: "calc(22px + env(safe-area-inset-bottom, 0px))", height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, fontFamily: T.font, cursor: "pointer", boxShadow: T.overlayShadow, zIndex: 9999 }}>
        {open ? <X size={15} strokeWidth={2} /> : <MessageCircle size={15} strokeWidth={2} />}
        <span>{open ? "Close" : "Support"}</span>
        {!open && waiting && <i style={{ width: 6, height: 6, borderRadius: 2, background: T.amber, marginLeft: 1 }} />}
      </button>
    </>
  );
}