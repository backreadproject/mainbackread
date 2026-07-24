"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { T } from "@/lib/theme";
import ConfirmDialog from "../../ConfirmDialog";

export default function DocumentActions({ documentId, title, archived }: { documentId: string; title: string; archived: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleArchive() {
    setBusy(true);
    await fetch("/api/admin/delete-document", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId, mode: "archive", archived: !archived }),
    });
    setBusy(false);
    router.refresh();
  }

  async function doDelete() {
    const res = await fetch("/api/admin/delete-document", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId, mode: "delete", confirmText: title }),
    });
    if (res.ok) { router.push("/console-7f3ab9c2/documents"); return { ok: true }; }
    const j = await res.json().catch(() => ({}));
    return { ok: false, error: j.error || "Failed." };
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <button onClick={toggleArchive} disabled={busy} style={{ background: "var(--rp-card)", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        {archived ? "Restore" : "Archive"}
      </button>
      <ConfirmDialog
        triggerLabel="Delete"
        title="Delete this document?"
        body="This removes the document, every recipient, all their signals, and the full reader conversation. It cannot be undone."
        expected={title}
        confirmLabel="Delete permanently"
        onConfirm={doDelete}
      />
    </div>
  );
}
