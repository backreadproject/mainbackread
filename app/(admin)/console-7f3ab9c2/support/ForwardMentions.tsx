"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import ConfirmDialog from "../ConfirmDialog";
import { postJson, errMsg } from "@/lib/fetch-json";
type Mention = {
  signalId: string | null;
  recipientId: string;
  readerName: string;
  documentTitle: string;
  colleagueName: string;
  at: string;
  kind: "mention" | "record";
};
// Named for what it does, not for one route into it. A data subject request
// arrives as an email address, so this searches everything that address touches:
// their own reader records, and any forward that named them.
export default function ForwardMentions() {
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState("");
  const [hits, setHits] = useState<Mention[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  // A silent failure showing "nothing found" is the worst possible answer on an
  // erasure tool: it reads as "nothing to erase" when the truth may be the
  // opposite, and someone acts on that.
  async function find() {
    if (!email.trim()) return;
    setBusy(true); setMsg(""); setErr(""); setHits([]);
    try {
      const j = await postJson<{ mentions?: Mention[] }>("/api/admin/erase-mentions", { email: email.trim(), action: "find" });
      setSearched(email.trim());
      setHits(j.mentions ?? []);
    } catch (e) {
      setSearched("");
      setErr(errMsg(e, "Could not run that search."));
    } finally {
      setBusy(false);
    }
  }
  const mono = "'DM Mono', ui-monospace, monospace";
  const records = hits.filter((h) => h.kind === "record");
  const mentions = hits.filter((h) => h.kind === "mention");
  const line = (h: Mention, i: number, len: number) => (
    <div key={(h.signalId ?? h.recipientId) + i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderBottom: i < len - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: T.heading, minWidth: 0 }}>
        <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: h.kind === "record" ? T.danger : T.amber }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {h.kind === "record"
            ? h.readerName + " on " + h.documentTitle
            : h.readerName + " forwarded " + h.documentTitle + (h.colleagueName && h.colleagueName !== "unnamed" ? " to " + h.colleagueName : "")}
        </span>
      </span>
      <span style={{ color: T.faint, fontFamily: mono, fontSize: 12, flex: "none" }}>{new Date(h.at).toLocaleDateString()}</span>
    </div>
  );
  return (
    <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginTop: 18 }}>
      <div style={{ padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body }}>Erase a reader</div>
      <div style={{ padding: 18 }}>
        <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: "0 0 14px" }}>
          Search an email address to find every record we hold for that person: reader links they were sent or forwarded, everything those links captured, and any forward that named them. Use this for a data subject erasure request.
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
        {!err && searched && hits.length === 0 && !busy && (
          <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>Nothing found for {searched}. No reader records and no forwards name that address.</p>
        )}
        {hits.length > 0 && (
          <>
            <p style={{ fontSize: 13.5, color: T.heading, margin: "0 0 10px" }}>
              {records.length} reader {records.length === 1 ? "record" : "records"} and {mentions.length} {mentions.length === 1 ? "forward" : "forwards"} for {searched}.
            </p>
            {records.length > 0 && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, margin: "0 0 8px" }}>Their own reader records</div>
                <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 14 }}>
                  {records.map((h, i) => line(h, i, records.length))}
                </div>
              </>
            )}
            {mentions.length > 0 && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, margin: "0 0 8px" }}>Forwards that named them</div>
                <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 14 }}>
                  {mentions.map((h, i) => line(h, i, mentions.length))}
                </div>
              </>
            )}
            <ConfirmDialog
              triggerLabel="Erase this person"
              title="Erase everything for this address?"
              body={"This deletes " + records.length + " reader " + (records.length === 1 ? "record" : "records") + " entirely, including every link, open, page dwell, question and conversation they captured. It also strips their name and email from " + mentions.length + " " + (mentions.length === 1 ? "forward" : "forwards") + " that named them, while keeping the forward event so senders' counts stay accurate. Senders' engagement figures for the affected documents will drop. This cannot be undone."}
              expected={searched}
              confirmLabel="Erase permanently"
              onConfirm={async () => {
                try {
                  await postJson("/api/admin/erase-mentions", { email: searched, action: "erase", confirmText: searched });
                  setHits([]);
                  setMsg("Erased every record for " + searched + ". A certificate is on the Erasures page.");
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