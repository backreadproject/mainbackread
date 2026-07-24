"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, microLabel } from "@/lib/theme";

type Msg = { id: string; role: string; content: string; created_at: string };
type Conv = {
  id: string; email: string | null; name: string | null; surface: string; status: string;
  last_message_at: string; escalated_at: string | null; messages: Msg[];
};

export default function SupportConversations({ conversations }: { conversations: Conv[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(conversations[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const conv = conversations.find((c) => c.id === openId) ?? null;
  const mono = "'DM Mono', ui-monospace, monospace";

  async function call(action: string, message?: string) {
    if (!conv) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/admin/support-action", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId: conv.id, action, message }),
    });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setErr(j.error || "Failed."); return; }
    setDraft("");
    router.refresh();
  }

  const pill = (status: string) => {
    const map: Record<string, [string, string, string]> = {
      escalated: ["#FEF0C7", "#B54708", "needs you"],
      answered: ["#E6EEFB", "#2563EB", "answered"],
      bot: [T.pillNeutralBg, T.body, "bot only"],
      closed: [T.pillNeutralBg, T.muted, "closed"],
    };
    const [bg, fg, label] = map[status] ?? map.bot;
    return <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: T.rPill, background: bg, color: fg, flex: "none" }}>{label}</span>;
  };

  if (conversations.length === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 22, marginTop: 24 }}>
        <div style={{ ...microLabel, marginBottom: 6 }}>Conversations</div>
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Nobody has used the support chat yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ ...microLabel, marginBottom: 10 }}>Conversations</div>
      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: 14, alignItems: "start" }}>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden", maxHeight: 520, overflowY: "auto" }}>
          {conversations.map((c, i) => (
            <button key={c.id} onClick={() => { setOpenId(c.id); setErr(""); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: c.id === openId ? T.greenSoft : "#fff", border: "none", borderTop: i ? `1px solid ${T.border}` : "none", padding: "11px 13px", cursor: "pointer", fontFamily: T.font }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name || c.email || "Anonymous visitor"}
                </span>
                {pill(c.status)}
              </div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: mono }}>
                {c.surface} {"\u00b7"} {new Date(c.last_message_at).toLocaleDateString()} {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </button>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, display: "flex", flexDirection: "column", minHeight: 360, maxHeight: 520 }}>
          {!conv ? (
            <div style={{ padding: 22, fontSize: 13, color: T.muted }}>Pick a conversation.</div>
          ) : (
            <>
              <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{conv.name || "Anonymous visitor"}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, fontFamily: mono }}>
                    {conv.email || "no email on file"} {"\u00b7"} {conv.surface} site
                  </div>
                </div>
                {conv.status !== "closed" && (
                  <button onClick={() => call("close")} disabled={busy} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer", flex: "none" }}>Close</button>
                )}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", background: T.canvas }}>
                {conv.messages.filter((m) => !m.content.startsWith("[contact]")).map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-start" : "flex-end", marginBottom: 9 }}>
                    <div style={{ maxWidth: "80%", padding: "9px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      background: m.role === "user" ? "#fff" : m.role === "human" ? T.green : "#EEF4FF",
                      color: m.role === "human" ? "#fff" : T.heading,
                      border: m.role === "user" ? `1px solid ${T.border}` : "none" }}>
                      {m.role === "assistant" && <div style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", marginBottom: 3 }}>BOT</div>}
                      {m.role === "human" && <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 3 }}>YOU</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              {err && <p style={{ fontSize: 12.5, color: "#B42318", margin: 0, padding: "8px 16px 0" }}>{err}</p>}

              <div style={{ borderTop: `1px solid ${T.border}`, padding: 12, display: "flex", gap: 8 }}>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
                  placeholder={conv.email ? "Your reply. Sent here and by email." : "Your reply. No email on file, so they will only see it in the chat."}
                  style={{ flex: 1, minWidth: 0, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 11px", fontSize: 13, fontFamily: T.font, resize: "vertical", background: "#fff" }} />
                <button onClick={() => call("reply", draft)} disabled={busy || !draft.trim()}
                  style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, fontFamily: T.font, cursor: "pointer", flex: "none", alignSelf: "flex-end", opacity: busy || !draft.trim() ? 0.5 : 1 }}>
                  {busy ? "Sending..." : "Reply"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
