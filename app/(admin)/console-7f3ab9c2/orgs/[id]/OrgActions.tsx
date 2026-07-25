"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { T } from "@/lib/theme";
import ConfirmDialog from "../../ConfirmDialog";
import { postJson, errMsg } from "@/lib/fetch-json";
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
  const [err, setErr] = useState("");
  async function call(body: Record<string, unknown>) {
    return postJson("/api/admin/org-action", body);
  }
  const small = { height: 28, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer", flex: "none" } as const;
  // These used to be alert(): the only browser dialog left in the app, and it
  // cannot be styled, dismissed by keyboard consistently, or read in place.
  const inlineErr = err ? (
    <span style={{ fontSize: 12.5, color: T.dangerText, marginRight: 8 }}>{err}</span>
  ) : null;
  if (mode === "member") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", flex: "none" }}>
        {inlineErr}
        <button
          onClick={async () => {
            setBusy(true); setErr("");
            try { await call({ action: "removeMember", memberId }); router.refresh(); }
            catch (e) { setErr(errMsg(e, "Failed.")); }
            finally { setBusy(false); }
          }}
          disabled={busy} style={{ ...small, color: T.dangerText, borderColor: T.dangerBorder, opacity: busy ? 0.6 : 1 }}
          title={"Remove " + (memberLabel ?? "member")}
        >
          {busy ? "Removing..." : "Remove"}
        </button>
      </span>
    );
  }
  if (mode === "invite") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", flex: "none" }}>
        {inlineErr}
        <button
          onClick={async () => {
            setBusy(true); setErr("");
            try { await call({ action: "revokeInvite", inviteId }); router.refresh(); }
            catch (e) { setErr(errMsg(e, "Failed.")); }
            finally { setBusy(false); }
          }}
          disabled={busy} style={{ ...small, opacity: busy ? 0.6 : 1 }}
          title={"Revoke invite to " + (inviteLabel ?? "")}
        >
          {busy ? "Revoking..." : "Revoke"}
        </button>
      </span>
    );
  }
  // organizations_created_by_fkey is ON DELETE CASCADE, so this takes every
  // document in the org with it, including ones owned by individual members.
  // The copy has to say that plainly.
  return (
    <ConfirmDialog
      triggerLabel="Delete organization"
      title="Delete this organization?"
      body={"This permanently removes the organization and everything inside it: " + documentCount + " document" + (documentCount === 1 ? "" : "s") + " including documents owned by individual members, " + projectCount + " project" + (projectCount === 1 ? "" : "s") + ", " + memberCount + " membership" + (memberCount === 1 ? "" : "s") + ", all pending invitations and access grants. Member user accounts themselves are kept. This cannot be undone."}
      expected={orgName}
      confirmLabel="Delete permanently"
      onConfirm={async () => {
        try {
          await call({ action: "deleteOrg", orgId, confirmText: orgName });
          setTimeout(() => router.push("/console-7f3ab9c2/orgs"), 0);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: errMsg(e, "Failed.") };
        }
      }}
    />
  );
}