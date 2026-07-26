"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
// Downloads the reading report.
//
// Not postJson: the response is a PDF, not JSON. The blob is turned into a
// temporary object URL and clicked, which is the only way to trigger a download
// from a POST without navigating away from the page.
export default function ReportButton({ documentId, recipientIds, label, compact = false }: {
  documentId: string;
  recipientIds?: string[];
  label?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function download() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId, recipientIds: recipientIds ?? undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error || "Could not build the report.");
        setBusy(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // The filename the server set in content-disposition is not readable from
      // a blob, so it is rebuilt here. Close enough, and the server name still
      // applies if the customer saves from a PDF viewer instead.
      a.download = "reading report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("Could not reach the server.");
    }
    setBusy(false);
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
      <button onClick={download} disabled={busy}
        style={{
          height: compact ? 30 : 34,
          background: "transparent", color: T.heading,
          border: "1px solid " + T.border, borderRadius: T.rBtn,
          padding: compact ? "0 11px" : "0 14px",
          fontSize: compact ? 12.5 : 13.5, fontFamily: T.font,
          cursor: busy ? "wait" : "pointer", whiteSpace: "nowrap", opacity: busy ? 0.6 : 1,
        }}>
        {busy ? "Building the report..." : (label ?? "Download report")}
      </button>
      {msg && <span style={{ fontSize: 12, color: T.dangerText, lineHeight: 1.5, maxWidth: 320 }}>{msg}</span>}
    </span>
  );
}