"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { T } from "@/lib/theme";
import ConfirmDialog from "../../ConfirmDialog";

export default function OrgActions({
  orgId, orgName, mode = "org", memberId, memberLabel, inviteId, inviteLabel,
  documentCount = 0, memberCount = 0, projectCount = 0,
}: {
  orgId: string; orgName: string; mode?: "org" | "member" | "invite";
  memberId?: string; memberLabel?: string; inviteId?: string; inviteLabel?: string;
  documentCount?: number; memberCount?: number; projectCount?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/org-action", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok, error: j.error as string | undefined };
  }

  const small = { background: "var(--rp-card)", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "6px 12px", fontSize: 13, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;

  if (mode === "member") {
    return (
      <button
        onClick={async () => { setBusy(true); const r = await call({ action: "removeMember", memberId }); setBusy(false); if (r.ok) router.refresh(); else alert(r.error || "Failed."); }}
        disabled={busy} style={{ ...small, color: "var(--rp-danger-text)", borderColor: "var(--rp-danger-border)", opacity: busy ? 0.6 : 1, flex: "none" }}
        title={`Remove ${memberLabel ?? "member"}`}
      >
        {busy ? "Removing..." : "Remove"}
      </button>
    );
  }

  if (mode === "invite") {
    return (
      <button
        onClick={async () => { setBusy(true); const r = await call({ action: "revokeInvite", inviteId }); setBusy(false); if (r.ok) router.refresh(); else alert(r.error || "Failed."); }}
        disabled={busy} style={{ ...small, opacity: busy ? 0.6 : 1, flex: "none" }}
        title={`Revoke invite to ${inviteLabel ?? ""}`}
      >
        {busy ? "Revoking..." : "Revoke"}
      </button>
    );
  }

  return (
    <ConfirmDialog
      triggerLabel="Delete organization"
      title="Delete this organization?"
      body={`This permanently removes the organization and everything inside it: ${documentCount} document${documentCount === 1 ? "" : "s"} (including documents owned by individual members), ${projectCount} project${projectCount === 1 ? "" : "s"}, ${memberCount} membership${memberCount === 1 ? "" : "s"}, all pending invitations and access grants. Member user accounts themselves are kept. This cannot be undone.`}
      expected={orgName}
      confirmLabel="Delete permanently"
      onConfirm={async () => {
        const r = await call({ action: "deleteOrg", orgId, confirmText: orgName });
        if (r.ok) { router.push("/console-7f3ab9c2/orgs"); return { ok: true }; }
        return { ok: false, error: r.error || "Failed." };
      }}
    />
  );
}

