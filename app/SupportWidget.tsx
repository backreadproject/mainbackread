"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { T } from "@/lib/theme";
import { MessageCircle, X, ArrowRight, House, MessageSquare, LifeBuoy, ChevronRight, type LucideIcon } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/support-kb";

type Msg = { role: string; content: string; created_at?: string };
type Tab = "home" | "messages" | "help";

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
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function SupportWidget({ surface = "marketing", firstName }: { surface?: "marketing" | "app"; firstName?: string | null }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [session, setSession] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("new");
  const [hasEmail, setHasEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState("");
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
    } catch { /* offline; the next tick will try again */ }
  }, [session]);

  useEffect(() => { if (open && session) load(); }, [open, session, load]);

  // Poll while a person is involved and the panel is open.
  useEffect(() => {
    if (!open || !(status === "escalated" || status === "answered")) return;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [open, status, load]);

  useEffect(() => { if (tab === "messages") endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, tab]);

  async function send(text?: string) {
    const body = (text ?? draft).trim();
    if (!body || busy || !session) return;
    setTab("messages");
    setBusy(true); setErr(""); setDraft("");
    setMsgs((m) => [...m, { role: "user", content: body }]);
    try {
      const res = await fetch("/api/support", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionToken: session, message: body, surface, email: email.trim() || undefined }),
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

  const visible = msgs.filter((m) => !m.content.startsWith("[contact]"));
  const last = visible[visible.length - 1];
  const waiting = status === "escalated";
  const faqHits = search.trim()
    ? FAQ_ITEMS.filter((f) => (f.q + " " + f.a).toLowerCase().includes(search.trim().toLowerCase()))
    : FAQ_ITEMS;

  const bubble = { maxWidth: "84%", padding: "9px 12px", borderRadius: 13, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const };
  const card = { background: "#fff", borderRadius: 13, boxShadow: "0 2px 10px rgba(9,30,22,0.07)", padding: 14 };

  return (
    <>
      <style>{`
        .rp-sw-launch{transition:transform .16s, box-shadow .16s}
        .rp-sw-launch:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(11,122,75,0.34)}
        .rp-sw-in:focus{border-color:${T.green};outline:none}
        .rp-sw-panel{animation:rpSwIn .18s ease-out}
        .rp-sw-tab{transition:color .12s}
        .rp-sw-row{transition:background .12s;cursor:pointer}
        .rp-sw-row:hover{background:#FAFBFA}
        @keyframes rpSwIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @media(max-width:520px){.rp-sw-panel{width:calc(100vw - 24px) !important;height:calc(100vh - 120px) !important;right:12px !important;bottom:84px !important}}
      `}</style>

      {open && (
        <div className="rp-sw-panel" style={{ position: "fixed", right: 22, bottom: 88, width: 372, height: "min(560px, calc(100vh - 130px))", background: T.canvas, borderRadius: 16, boxShadow: "0 20px 60px rgba(9,30,22,0.24)", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 9998, fontFamily: T.font, letterSpacing: T.tracking }}>

          {/* HOME */}
          {tab === "home" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ background: T.sidebarGradient, padding: "26px 20px 34px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600 }}>ReadProspects</span>
                  <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, width: 26, height: 26, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={14} strokeWidth={2.2} />
                  </button>
                </div>
                <div style={{ marginTop: 22, color: "#fff", fontSize: 23, fontWeight: 700, letterSpacing: T.trackingTight, lineHeight: 1.3 }}>
                  {firstName ? `Hi ${firstName}` : "Hello"}
                  <div style={{ color: "rgba(255,255,255,0.6)" }}>How can we help?</div>
                </div>
              </div>

              <div style={{ padding: "0 14px 14px", marginTop: -18 }}>
                {last && (
                  <div className="rp-sw-row" onClick={() => setTab("messages")} style={{ ...card, marginBottom: 10 }}>
                    <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 6 }}>Recent message</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 26, height: 26, borderRadius: 13, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flex: "none" }}>
                        {last.role === "user" ? "You" : "RP"}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, color: T.heading, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{last.content}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{waiting ? "With the team" : ago(last.created_at)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rp-sw-row" onClick={() => setTab("messages")} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{last ? "Continue the conversation" : "Ask us anything"}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Answers now, a person when you need one</div>
                  </div>
                  <span style={{ color: T.green, flex: "none" }}>
                    <ArrowRight size={18} strokeWidth={2.2} />
                  </span>
                </div>

                <div style={{ ...card, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 8 }}>Common questions</div>
                  {FAQ_ITEMS.slice(0, 3).map((f, i) => (
                    <div key={i} className="rp-sw-row" onClick={() => { setTab("help"); setOpenFaq(i); }}
                      style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "8px 0", borderTop: i ? `1px solid ${T.borderSoft}` : "none", fontSize: 13, color: T.heading }}>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.q}</span>
                      <span style={{ color: T.muted, flex: "none" }}>
                        <ChevronRight size={14} strokeWidth={2.2} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES */}
          {tab === "messages" && (
            <>
              <div style={{ background: T.sidebarGradient, padding: "15px 18px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Messages</span>
                  <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, width: 26, height: 26, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={14} strokeWidth={2.2} />
                  </button>
                </div>
                <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 12.5, margin: "3px 0 0" }}>
                  {waiting ? "With the team. They will reply here or by email." : "Ask anything about ReadProspects."}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px" }}>
                {visible.length === 0 && !busy && (
                  <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, padding: "6px 2px" }}>
                    Ask about plans, how sharing works, what a verdict is, or anything else. If I cannot answer it, I will pass it to a person.
                  </div>
                )}
                {visible.map((m, i) =>
                  m.role === "note" ? (
                    <div key={i} style={{ textAlign: "center", fontSize: 11.5, color: T.muted, margin: "2px 0 9px" }}>{m.content}</div>
                  ) : (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 9 }}>
                      <div style={{ ...bubble, background: m.role === "user" ? T.green : "#fff", color: m.role === "user" ? "#fff" : T.heading, border: m.role === "user" ? "none" : `1px solid ${T.border}` }}>
                        {m.role === "human" && <div style={{ fontSize: 10.5, fontWeight: 700, color: T.greenText, marginBottom: 3 }}>ReadProspects team</div>}
                        {m.content}
                      </div>
                    </div>
                  )
                )}
                {busy && <div style={{ fontSize: 12.5, color: T.muted, padding: "2px 4px" }}>Thinking...</div>}
                {waiting && !hasEmail && surface === "marketing" && (
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
                <button onClick={() => send()} disabled={busy || !draft.trim()} aria-label="Send"
                  style={{ background: T.green, color: "#fff", border: "none", borderRadius: 20, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: busy || !draft.trim() ? 0.5 : 1 }}>
                  <ArrowRight size={16} strokeWidth={2.2} />
                </button>
              </div>
            </>
          )}

          {/* HELP */}
          {tab === "help" && (
            <>
              <div style={{ background: T.sidebarGradient, padding: "15px 18px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Help</span>
                  <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 7, width: 26, height: 26, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={14} strokeWidth={2.2} />
                  </button>
                </div>
                <input className="rp-sw-in" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for help"
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 9, padding: "9px 12px", fontSize: 13, fontFamily: T.font, background: "rgba(255,255,255,0.1)", color: "#fff" }} />
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 14px" }}>
                {faqHits.length === 0 && (
                  <div style={{ padding: "16px 2px" }}>
                    <p style={{ fontSize: 13, color: T.body, margin: "0 0 12px", lineHeight: 1.55 }}>Nothing here matches that. Ask us directly and we will answer.</p>
                    <button onClick={() => { setTab("messages"); setDraft(search); }} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 16px", fontSize: 13, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>Ask about this</button>
                  </div>
                )}
                {faqHits.map((f, i) => {
                  const idx = FAQ_ITEMS.indexOf(f);
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} style={{ background: "#fff", borderRadius: 11, marginBottom: 8, boxShadow: "0 1px 4px rgba(9,30,22,0.05)", overflow: "hidden" }}>
                      <div className="rp-sw-row" onClick={() => setOpenFaq(isOpen ? null : idx)}
                        style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "12px 13px", fontSize: 13, fontWeight: 600, color: T.heading }}>
                        <span style={{ minWidth: 0 }}>{f.q}</span>
                        <span style={{ color: T.muted, flex: "none", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                          <ChevronRight size={14} strokeWidth={2.2} />
                        </span>
                      </div>
                      {isOpen && <div style={{ padding: "0 13px 13px", fontSize: 13, color: T.body, lineHeight: 1.6 }}>{f.a}</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TABS */}
          <div style={{ display: "flex", borderTop: `1px solid ${T.border}`, background: "#fff", flexShrink: 0 }}>
            {([
              ["home", "Home", House],
              ["messages", "Messages", MessageSquare],
              ["help", "Help", LifeBuoy],
            ] as [Tab, string, LucideIcon][]).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className="rp-sw-tab"
                style={{ flex: 1, background: "none", border: "none", padding: "10px 0 11px", cursor: "pointer", fontFamily: T.font, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === id ? T.green : T.muted }}>
                <span style={{ position: "relative", display: "flex" }}>
                  <Icon size={21} strokeWidth={tab === id ? 2.9 : 2.5} />
                  {id === "messages" && waiting && <span style={{ position: "absolute", top: -2, right: -4, width: 7, height: 7, borderRadius: 4, background: "#F04438" }} />}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setOpen((v) => !v)} className="rp-sw-launch" aria-label="Support"
        style={{ position: "fixed", right: 22, bottom: 22, width: 54, height: 54, borderRadius: 27, background: T.green, border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(11,122,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        {open ? (
          <X size={21} color="#fff" strokeWidth={2.2} />
        ) : (
          <MessageCircle size={22} color="#fff" strokeWidth={1.9} />
        )}
      </button>
    </>
  );
}







