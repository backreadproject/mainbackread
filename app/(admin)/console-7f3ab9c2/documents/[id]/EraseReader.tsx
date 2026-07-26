"use client";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../../ConfirmDialog";

export default function EraseReader({ recipientId, expected }: { recipientId: string; expected: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      triggerLabel="Erase"
      title="Erase this reader?"
      body="This permanently removes the reader and everything recorded about them: every open, page dwell, question, forward, and their full conversation with the document. The sender loses them from their history. Use this for a data subject erasure request. It cannot be undone."
      expected={expected}
      confirmLabel="Erase permanently"
      onConfirm={async () => {
        const res = await fetch("/api/admin/erase-reader", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ recipientId, confirmText: expected }),
        });
        if (res.ok) { router.refresh(); return { ok: true }; }
        const j = await res.json().catch(() => ({}));
        return { ok: false, error: j.error || "Failed." };
      }}
    />
  );
}
