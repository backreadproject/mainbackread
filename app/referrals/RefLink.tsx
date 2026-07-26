"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
// The link, with copy. The referrer's most-used control, so it sits first.
export default function RefLink({ code, marketing }: { code: string; marketing: string }) {
  const [copied, setCopied] = useState(false);
  const url = "https://" + marketing + "/?ref=" + code;
  return (
    <div style={{ background: T.card, border: "1px solid " + T.greenBorder, borderRadius: T.rCard, padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.greenText, marginBottom: 8 }}>Your referral link</div>
      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
        <code style={{ flex: 1, minWidth: 0, fontSize: 13, color: T.heading, background: T.soft, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "9px 11px", overflowWrap: "anywhere", fontFamily: "ui-monospace, monospace" }}>{url}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
          style={{ height: 36, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 15px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", whiteSpace: "nowrap" }}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: T.muted, margin: "10px 0 0", lineHeight: 1.5 }}>
        Works on any ReadProspects page. Add <code style={{ fontFamily: "ui-monospace, monospace" }}>?ref={code}</code> to
        a pricing or article link and it still counts.
      </p>
    </div>
  );
}