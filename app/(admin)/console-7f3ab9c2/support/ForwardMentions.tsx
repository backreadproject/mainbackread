"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import ConfirmDialog from "../ConfirmDialog";
import { postJson, errMsg } from "@/lib/fetch-json";
type Mention = { signalId: string; recipientId: string; readerName: string; documentTitle: string; colleagueName: string; at: string };
export default function ForwardMentions() {
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  // This is an erasure tool. A silent failure showing "no forwards name X" is
  // the worst possible answer here: it reads as "nothing to erase" when the
  // truth may be the opposite, and someone acts on that.
  async function find() {
    if (!email.trim()) return;
    setBusy(true); setMsg(""); setErr(""); setMentions([]);
    try {
      const j = await postJson<{ mentions?: Mention[] }>("/api/admin/erase-mentions", { email: email.trim(), action: "find" });
      setSearched(email.trim());
      setMentions(j.mentions ?? []);
    } catch (e) {
      setSearched("");
      setErr(errMsg(e, "Could not run that search."));
    } finally {
      setBusy(false);
    }
  }
  const mono = "'DM Mono', ui-monospace, monospace";
  return (
    <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginTop: 18 }}>
      <div style={{ padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body }}>Forwarded colleagues</div>
      <div style={{ padding: 18 }}>
        <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: "0 0 14px" }}>
          People named when a reader forwarded a document. Each of them received their own reader link, so they may have opened it and generated signals of their own. Erasing removes their reader record along with everything it captured, and strips their details from the forward that named them.
        </p>
        <div style={{ display: "flex", gap: 9, marginBottom: 14 }}>
          <input className="fm-in" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && find()} placeholder="Their email address"
            style={{ flex: 1, height: 34, boxSizing: "border-box", background: T.card, color: T.heading, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font }} />
          <button onClick={find} disabled={busy || !email.trim()} style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy || !email.trim() ? 0.5 : 1 }}>
            {busy ? "Looking..." : "Find"}
          </button>
        </div>
        <style>{`.fm-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
        {err && <div style={{ background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, lineHeight: 1.5 }}>{err}</div>}
        {!err && searched && mentions.length === 0 && !busy && (
          <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>No forwards name {searched}.</p>
        )}
        {mentions.length > 0 && (
          <>
            <p style={{ fontSize: 13.5, color: T.heading, margin: "0 0 10px" }}>
              {mentions.length} forward{mentions.length === 1 ? "" : "s"} name{mentions.length === 1 ? "s" : ""} {searched}.
            </p>
            <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 14 }}>
              {mentions.map((m, i) => (
                <div key={m.signalId} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderBottom: i < mentions.length - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13 }}>
                  <span style={{ color: T.heading, minWidth: 0 }}>{m.readerName} forwarded {m.documentTitle}{m.colleagueName !== "unnamed" ? " to " + m.colleagueName : ""}</span>
                  <span style={{ color: T.faint, fontFamily: mono, fontSize: 12, flex: "none" }}>{new Date(m.at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <ConfirmDialog
              triggerLabel="Erase this person"
              title="Erase this person from every forward?"
              body="This removes their reader record entirely: their link, every open, page dwell, question and conversation it captured. It also strips their name and email from each forward that named them, while keeping the forward event itself so the sender's counts stay accurate. The sender's engagement figures for this document will drop accordingly. This cannot be undone."
              expected={searched}
              confirmLabel="Erase permanently"
              onConfirm={async () => {
                try {
                  await postJson("/api/admin/erase-mentions", { email: searched, action: "erase", confirmText: searched });
                  setMentions([]);
                  setMsg("Erased " + searched + " from all forwards.");
                  return { ok: true };
                } catch (e) {
                  return { ok: false, error: errMsg(e, "Failed.") };
                }
              }}
            />
          </>
        )}
        {msg && <p style={{ fontSize: 13.5, color: T.greenText, margin: "12px 0 0" }}>{msg}</p>}
      </div>
    </div>
  );
}