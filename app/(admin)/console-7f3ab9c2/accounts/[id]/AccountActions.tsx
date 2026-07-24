"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { T } from "@/lib/theme";
import ConfirmDialog from "../../ConfirmDialog";

export default function AccountActions({ targetUserId, email, suspended }: { targetUserId: string; email: string; suspended: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/admin/user-action", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetUserId, action, ...extra }),
    });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok, ...j } as { ok: boolean; error?: string; link?: string };
  }

  async function toggleSuspend() {
    setBusy(true); setMsg("");
    const r = await call("suspend", { suspended: !suspended });
    setBusy(false);
    if (!r.ok) setMsg(r.error || "Failed."); else router.refresh();
  }

  async function resetLink() {
    setBusy(true); setMsg(""); setLink("");
    const r = await call("reset");
    setBusy(false);
    if (!r.ok) setMsg(r.error || "Failed."); else setLink(r.link || "");
  }

  async function doDelete() {
    const r = await call("delete", { confirmText: email });
    if (r.ok) { router.push("/console-7f3ab9c2/accounts"); return { ok: true }; }
    return { ok: false, error: r.error || "Failed." };
  }

  const btn = { background: "var(--rp-card)", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={resetLink} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>Reset link</button>
        <button onClick={toggleSuspend} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>{suspended ? "Unsuspend" : "Suspend"}</button>
        <ConfirmDialog
          triggerLabel="Delete account"
          title="Delete this account?"
          body="This permanently removes the user, every document they own, all recipients, signals and reader conversations, plus their profile and notifications. If this person created an organization, that organization and all of its data goes too. It cannot be undone."
          expected={email}
          confirmLabel="Delete permanently"
          onConfirm={doDelete}
        />
      </div>
      {msg && <span style={{ fontSize: 12, color: "var(--rp-danger-text)" }}>{msg}</span>}
      {link && (
        <div style={{ maxWidth: 420, background: T.greenSoft, border: "1px solid var(--rp-green-border)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.greenText, marginBottom: 4 }}>One-time password reset link</div>
          <div style={{ fontSize: 11, color: T.body, wordBreak: "break-all", fontFamily: "ui-monospace, monospace" }}>{link}</div>
        </div>
      )}
    </div>
  );
}
