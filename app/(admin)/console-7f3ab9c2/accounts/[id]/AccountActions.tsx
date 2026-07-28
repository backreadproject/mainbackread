"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { T } from "@/lib/theme";
import ConfirmDialog from "../../ConfirmDialog";
import { postJson, errMsg } from "@/lib/fetch-json";
export default function AccountActions({ targetUserId, email, suspended, approved, createdOrg = null, createdOrgMembers = 0 }: { targetUserId: string; email: string; createdOrg?: string | null; createdOrgMembers?: number; suspended: boolean; approved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  async function call(action: string, extra: Record<string, unknown> = {}) {
    return postJson<{ link?: string }>("/api/admin/user-action", { targetUserId, action, ...extra });
  }
  async function toggleApprove() {
    setBusy(true); setMsg("");
    try { await call("approve", { approved: !approved }); router.refresh(); }
    catch (e) { setMsg(errMsg(e, "Failed.")); }
    finally { setBusy(false); }
  }
  async function toggleSuspend() {
    setBusy(true); setMsg("");
    try { await call("suspend", { suspended: !suspended }); router.refresh(); }
    catch (e) { setMsg(errMsg(e, "Failed.")); }
    finally { setBusy(false); }
  }
  async function resetLink() {
    setBusy(true); setMsg(""); setLink("");
    try { const r = await call("reset"); setLink(r.link || ""); }
    catch (e) { setMsg(errMsg(e, "Failed.")); }
    finally { setBusy(false); }
  }
  // Returns before navigating. Pushing inside onConfirm left the dialog sitting
  // over a page that was already unmounting.
  async function doDelete(): Promise<{ ok: boolean; error?: string }> {
    try {
      await call("delete", { confirmText: email });
      setTimeout(() => router.push("/console-7f3ab9c2/accounts"), 0);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errMsg(e, "Failed.") };
    }
  }
  const btn = { height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flex: "none" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={toggleApprove} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1, ...(approved ? {} : { background: T.green, color: T.onAccent, border: "none" }) }}>
          {approved ? "Revoke access" : "Approve"}
        </button>
        <button onClick={resetLink} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>Reset link</button>
        <button onClick={toggleSuspend} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>{suspended ? "Unsuspend" : "Suspend"}</button>
        <ConfirmDialog
          triggerLabel="Delete account"
          title="Delete this account?"
          body={(createdOrg ? "This also deletes the organization " + createdOrg + " and every document inside it, including documents owned by the other " + Math.max(0, createdOrgMembers - 1) + " member" + (createdOrgMembers === 2 ? "" : "s") + ". That is automatic and cannot be undone. " : "") + "This permanently removes the user, every document they own, all recipients, signals and reader conversations, plus their profile and notifications. It cannot be undone."}
          expected={email}
          confirmLabel="Delete permanently"
          onConfirm={doDelete}
        />
      </div>
      {msg && <div style={{ maxWidth: 420, background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "10px 12px", fontSize: 13, color: T.dangerText, lineHeight: 1.5 }}>{msg}</div>}
      {link && (
        <div style={{ maxWidth: 420, background: T.greenSoft, border: "1px solid " + T.greenBorder, borderRadius: T.rCard, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: T.greenText, marginBottom: 4 }}>One-time password reset link</div>
          <div style={{ fontSize: 11.5, color: T.body, wordBreak: "break-all", fontFamily: "ui-monospace, monospace" }}>{link}</div>
        </div>
      )}
    </div>
  );
}