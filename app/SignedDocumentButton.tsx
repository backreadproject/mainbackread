"use client";
import { useState } from "react";

// Downloading the signed document.
//
// A fetch rather than an <a href>, because the route answers 409 until every
// signer is in and 500 if the original has gone. A link would open a blank tab
// showing raw JSON; this shows a sentence.
//
// Two callers, two credentials: the sender passes documentId and is checked by
// RLS, a signer passes their share token. Neither can see the other's.
export default function SignedDocumentButton({
  documentId, token, title, label, variant = "primary",
}: {
  documentId?: string;
  token?: string;
  title?: string;
  label?: string;
  variant?: "primary" | "quiet";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function get() {
    setBusy(true); setErr("");
    try {
      const q = token ? "token=" + encodeURIComponent(token) : "documentId=" + encodeURIComponent(documentId ?? "");
      const res = await fetch("/api/signed-document?" + q);
      if (!res.ok) {
        let msg = "Could not build the signed document.";
        try { msg = (await res.json()).error ?? msg; } catch { /* non-JSON body */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (title || "document").replace(/[^\w\- ]+/g, "").slice(0, 60) + " (signed).pdf";
      document.body.appendChild(a); a.click(); a.remove();
      // Revoked late: Safari cancels the download if the object URL dies first.
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not download.");
    } finally {
      setBusy(false);
    }
  }

  const primary = {
    height: 34, padding: "0 16px", background: "#1F6F4A", color: "#fff",
    border: "none", borderRadius: 6, fontSize: 13.5, fontWeight: 500,
  } as const;
  const quiet = {
    height: 34, padding: "0 14px", background: "transparent", color: "#101828",
    border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13.5, fontWeight: 400,
  } as const;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <button type="button" onClick={get} disabled={busy}
        style={{ ...(variant === "primary" ? primary : quiet), cursor: busy ? "default" : "pointer",
                 fontFamily: "inherit", whiteSpace: "nowrap", opacity: busy ? 0.65 : 1 }}>
        {busy ? "Preparing..." : (label ?? "Download signed document")}
      </button>
      {err && <span style={{ fontSize: 12.5, color: "#B42318" }}>{err}</span>}
    </span>
  );
}