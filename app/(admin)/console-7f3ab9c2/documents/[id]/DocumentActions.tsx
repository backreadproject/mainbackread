"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import ConfirmDialog from "../../ConfirmDialog";
import { postJson, errMsg } from "@/lib/fetch-json";
export default function DocumentActions({ documentId, title, archived }: { documentId: string; title: string; archived: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function toggleArchive() {
    setBusy(true); setErr("");
    try {
      await postJson("/api/admin/delete-document", { documentId, action: archived ? "restore" : "archive" });
      router.refresh();
    } catch (e) {
      setErr(errMsg(e, "Failed."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flex: "none" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button onClick={toggleArchive} disabled={busy}
          style={{ height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Working..." : archived ? "Restore" : "Archive"}
        </button>
        <ConfirmDialog
          triggerLabel="Delete document"
          title="Delete this document?"
          body="This permanently removes the document, its file in storage, every recipient link, all signals and every reader conversation attached to it. The owner keeps their account. This cannot be undone."
          expected={title}
          confirmLabel="Delete permanently"
          onConfirm={async () => {
            try {
              await postJson("/api/admin/delete-document", { documentId, action: "delete", confirmText: title });
              setTimeout(() => router.push("/console-7f3ab9c2/documents"), 0);
              return { ok: true };
            } catch (e) {
              return { ok: false, error: errMsg(e, "Failed.") };
            }
          }}
        />
      </div>
      {err && <div style={{ maxWidth: 360, background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "10px 12px", fontSize: 13, color: T.dangerText, lineHeight: 1.5 }}>{err}</div>}
    </div>
  );
}