"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import ReportDialog from "./ReportDialog";
// Opens the report dialog. The download itself lives in the dialog, because a
// report now carries who wrote it and who it is for, and asking for that after
// the file has been built would be the wrong order.
export default function ReportButton({ documentId, recipientIds, label, compact = false }: {
  documentId: string;
  recipientIds?: string[];
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{
          height: compact ? 30 : 34,
          background: "transparent", color: T.heading,
          border: "1px solid " + T.border, borderRadius: T.rBtn,
          padding: compact ? "0 11px" : "0 14px",
          fontSize: compact ? 12.5 : 13.5, fontFamily: T.font,
          cursor: "pointer", whiteSpace: "nowrap",
        }}>
        {label ?? "Download report"}
      </button>
      {open && <ReportDialog documentId={documentId} recipientIds={recipientIds} onClose={() => setOpen(false)} />}
    </>
  );
}
