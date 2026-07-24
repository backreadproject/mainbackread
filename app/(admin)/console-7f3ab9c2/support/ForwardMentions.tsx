"use client";
import { useState } from "react";
import { T, microLabel } from "@/lib/theme";
import ConfirmDialog from "../ConfirmDialog";

type Mention = { signalId: string; recipientId: string; readerName: string; documentTitle: string; colleagueName: string; at: string };

export default function ForwardMentions() {
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function find() {
    if (!email.trim()) return;
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/erase-mentions", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), action: "find" }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    setSearched(email.trim());
    setMentions(j.mentions ?? []);
  }

  const mono = "'DM Mono', ui-monospace, monospace";

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 18, marginTop: 24 }}>
      <div style={{ ...microLabel, marginBottom: 6 }}>Forwarded colleagues</div>
      <p style={{ fontSize: 13, color: T.body, lineHeight: 1.5, margin: "0 0 14px" }}>
        People named when a reader forwarded a document. They have no account and no reader link, so this is the only way to erase them on request.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={email} onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && find()}
          placeholder="Their email address"
          style={{ flex: 1, background: "#fff", color: T.heading, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font }}
        />
        <button onClick={find} disabled={busy || !email.trim()} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy || !email.trim() ? 0.5 : 1 }}>
          {busy ? "Looking..." : "Find"}
        </button>
      </div>

      {searched && mentions.length === 0 && !busy && (
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>No forwards name {searched}.</p>
      )}

      {mentions.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: T.heading, margin: "0 0 10px" }}>
            {mentions.length} forward{mentions.length === 1 ? "" : "s"} name{mentions.length === 1 ? "s" : ""} <strong>{searched}</strong>.
          </p>
          <div style={{ marginBottom: 14 }}>
            {mentions.map((m, i) => (
              <div key={m.signalId} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderTop: i ? `1px solid ${T.borderSoft}` : "none", fontSize: 13 }}>
                <span style={{ color: T.heading }}>{m.readerName} forwarded <em>{m.documentTitle}</em>{m.colleagueName !== "unnamed" ? ` to ${m.colleagueName}` : ""}</span>
                <span style={{ color: T.muted, fontFamily: mono, fontSize: 11.5, flex: "none" }}>{new Date(m.at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
          <ConfirmDialog
            triggerLabel="Erase this person"
            title="Erase this person from every forward?"
            body="Their name and email are removed from each forward that mentions them. The forward itself stays, so the sender's counts remain accurate, but this person is no longer identifiable. This cannot be undone."
            expected={searched}
            confirmLabel="Erase permanently"
            onConfirm={async () => {
              const res = await fetch("/api/admin/erase-mentions", {
                method: "POST", headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: searched, action: "erase", confirmText: searched }),
              });
              if (res.ok) { setMentions([]); setMsg(`Erased ${searched} from all forwards.`); return { ok: true }; }
              const j = await res.json().catch(() => ({}));
              return { ok: false, error: j.error || "Failed." };
            }}
          />
        </>
      )}

      {msg && <p style={{ fontSize: 13, color: T.greenText, margin: "12px 0 0" }}>{msg}</p>}
    </div>
  );
}
