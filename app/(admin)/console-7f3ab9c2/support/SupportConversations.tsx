"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { postJson, errMsg } from "@/lib/fetch-json";
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
    try {
      await postJson("/api/admin/support-action", { conversationId: conv.id, action, message });
      setDraft("");
      router.refresh();
    } catch (e) {
      setErr(errMsg(e, "Failed."));
    } finally {
      setBusy(false);
    }
  }
  const statusOf = (status: string): [string, string] => {
    const map: Record<string, [string, string]> = {
      escalated: [T.amber, "needs you"],
      answered: [T.indigo, "answered"],
      bot: [T.faint, "bot only"],
      closed: [T.faint, "closed"],
    };
    return map[status] ?? map.bot;
  };
  const state = (status: string) => {
    const [dot, label] = statusOf(status);
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted, flex: "none", whiteSpace: "nowrap" }}>
        <i style={{ width: 6, height: 6, borderRadius: 2, background: dot }} />{label}
      </span>
    );
  };
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  if (conversations.length === 0) {
    return (
      <div style={{ ...card, marginTop: 18 }}>
        <div style={head}>Conversations</div>
        <div style={{ padding: 40, textAlign: "center" }}><p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>Nobody has used the support chat yet.</p></div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 18 }}>
      <div className="sc-grid" style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: 14, alignItems: "start" }}>
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={head}>Conversations</div>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {conversations.map((c, i) => (
              <button key={c.id} onClick={() => { setOpenId(c.id); setErr(""); }} className="sc-item"
                style={{ display: "block", width: "100%", textAlign: "left", background: c.id === openId ? T.greenSoft : T.card, border: "none", borderBottom: i < conversations.length - 1 ? "1px solid " + T.borderSoft : "none", padding: "11px 13px", cursor: "pointer", fontFamily: T.font }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: c.id === openId ? 600 : 400, color: c.id === openId ? T.greenText : T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name || c.email || "Anonymous visitor"}
                  </span>
                  {state(c.status)}
                </div>
                <div style={{ fontSize: 11.5, color: T.faint, fontFamily: mono }}>
                  {c.surface} {"\u00b7"} {new Date(c.last_message_at).toLocaleDateString()} {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", minHeight: 360, maxHeight: 520 }}>
          {!conv ? (
            <div style={{ padding: 40, textAlign: "center", fontSize: 13.5, color: T.muted }}>Pick a conversation.</div>
          ) : (
            <>
              <div style={{ ...head, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conv.name || "Anonymous visitor"}
                  <span style={{ color: T.muted, fontWeight: 400 }}> {"\u00b7"} {conv.email || "no email on file"} {"\u00b7"} {conv.surface}</span>
                </span>
                {conv.status !== "closed" && (
                  <button onClick={() => call("close")} disabled={busy} style={{ height: 28, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer", flex: "none" }}>Close</button>
                )}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                {conv.messages.filter((m) => !m.content.startsWith("[contact]")).map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-start" : "flex-end", marginBottom: 9 }}>
                    <div style={{ maxWidth: "82%", padding: "9px 12px", borderRadius: T.rCard, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      background: m.role === "human" ? T.green : T.card,
                      color: m.role === "human" ? T.onAccent : T.heading,
                      border: m.role === "human" ? "none" : "1px solid " + T.border }}>
                      {m.role === "assistant" && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.muted, marginBottom: 4 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: T.indigo }} />Bot</div>}
                      {m.role === "human" && <div style={{ fontSize: 11.5, color: T.onAccent, marginBottom: 4 }}>You</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              {err && <div style={{ background: T.dangerSoft, borderTop: "1px solid " + T.dangerBorder, padding: "10px 16px", fontSize: 13, color: T.dangerText }}>{err}</div>}
              <div style={{ borderTop: "1px solid " + T.border, padding: 12, display: "flex", gap: 8, flexShrink: 0 }}>
                <textarea className="sc-in" value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
                  placeholder={conv.email ? "Your reply. Sent here and by email." : "Your reply. No email on file, so they will only see it in the chat."}
                  style={{ flex: 1, minWidth: 0, boxSizing: "border-box", border: "1px solid " + T.border, borderRadius: T.rInput, padding: "9px 11px", fontSize: 13, fontFamily: T.font, resize: "vertical", background: T.card, color: T.heading, lineHeight: 1.55 }} />
                <button onClick={() => call("reply", draft)} disabled={busy || !draft.trim()}
                  style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", flex: "none", alignSelf: "flex-end", opacity: busy || !draft.trim() ? 0.5 : 1 }}>
                  {busy ? "Sending..." : "Reply"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`.sc-in:focus{outline:none;border-color:var(--rp-green)}.sc-item{transition:background .12s}@media (max-width: 900px){ .sc-grid{ grid-template-columns: minmax(0, 1fr) !important; } }`}</style>
    </div>
  );
}