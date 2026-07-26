"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { postJson, errMsg } from "@/lib/fetch-json";
// Grant and revoke console access. Two modes in one component because they are
// the same conversation with the same endpoint.
//
// Revoke requires typing the person's email exactly, matching every other
// destructive confirmation in this console. Removing someone's access is not
// destructive to data, but it is the kind of thing that should not happen from
// a stray click on the wrong row.
const ROLES: [string, string, string][] = [
  ["support", "Support", "Diagnose accounts and answer the support queue. No deletes, no plan changes, no message content."],
  ["finance", "Finance", "Plans, subscriptions and payouts. No document access at all."],
  ["compliance", "Compliance", "Erasures, certificates, the audit log, and reader message content."],
  ["engineering", "Engineering", "Ingestion and OCR health. Read only."],
  ["owner", "Owner", "Everything, including deletes and granting access. Give sparingly."],
];
export default function TeamForm(props:
  | { mode: "grant" }
  | { mode: "revoke"; userId: string; email: string; disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);

  const input = {
    width: "100%", boxSizing: "border-box" as const, height: 36, background: T.card, color: T.heading,
    border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font,
  };
  const label = { display: "block", fontSize: 12.5, color: T.body, marginBottom: 5, marginTop: 12 };

  async function grant() {
    setBusy(true); setMsg("");
    try {
      await postJson("/api/admin/console-role", { action: "grant", email, role, note });
      setEmail(""); setNote(""); setMsg("");
      router.refresh();
    } catch (e) { setMsg(errMsg(e, "Could not grant access.")); }
    setBusy(false);
  }
  async function revoke() {
    if (props.mode !== "revoke") return;
    setBusy(true); setMsg("");
    try {
      await postJson("/api/admin/console-role", { action: "revoke", userId: props.userId, confirmText: confirm });
      setOpen(false); setConfirm("");
      router.refresh();
    } catch (e) { setMsg(errMsg(e, "Could not revoke access.")); }
    setBusy(false);
  }

  if (props.mode === "revoke") {
    if (props.disabled) {
      return <span style={{ fontSize: 12, color: T.faint, whiteSpace: "nowrap" }}>you</span>;
    }
    if (!open) {
      return (
        <button onClick={() => setOpen(true)}
          style={{ height: 30, background: "transparent", color: T.dangerText, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontFamily: T.font, cursor: "pointer", whiteSpace: "nowrap" }}>
          Revoke
        </button>
      );
    }
    return (
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={props.email}
          style={{ ...input, height: 30, width: 190, fontSize: 12.5 }} />
        <button onClick={revoke} disabled={busy || confirm.trim().toLowerCase() !== props.email.toLowerCase()}
          style={{ height: 30, background: T.danger, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontFamily: T.font, cursor: "pointer", opacity: busy || confirm.trim().toLowerCase() !== props.email.toLowerCase() ? 0.5 : 1 }}>
          {busy ? "..." : "Confirm"}
        </button>
        <button onClick={() => { setOpen(false); setConfirm(""); setMsg(""); }}
          style={{ height: 30, background: "transparent", color: T.muted, border: "none", fontSize: 12.5, fontFamily: T.font, cursor: "pointer" }}>
          Cancel
        </button>
        {msg && <span style={{ fontSize: 12, color: T.dangerText, width: "100%", textAlign: "right" }}>{msg}</span>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 460 }}>
      <label style={label}>Their email</label>
      <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
      <label style={label}>Role</label>
      <select style={{ ...input, height: 36 }} value={role} onChange={(e) => setRole(e.target.value)}>
        {ROLES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
      <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.55, margin: "7px 0 0" }}>
        {ROLES.find(([id]) => id === role)?.[2]}
      </p>
      <label style={label}>Note</label>
      <input style={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Who they are, or why" />
      <button onClick={grant} disabled={busy || !email.includes("@")}
        style={{ marginTop: 16, height: 36, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 15px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy || !email.includes("@") ? 0.6 : 1 }}>
        {busy ? "Granting..." : "Grant access"}
      </button>
      {msg && <p style={{ fontSize: 13, color: T.dangerText, lineHeight: 1.5, margin: "12px 0 0" }}>{msg}</p>}
    </div>
  );
}