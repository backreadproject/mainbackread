"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { postJson, errMsg } from "@/lib/fetch-json";
// A payout moves requested -> approved -> paid, or is rejected. Marking it paid
// asks for the transfer reference, because "we sent it" with no evidence is not
// a record anyone can act on later.
export default function PayoutActions({ withdrawalId, status }: { withdrawalId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ref, setRef] = useState("");
  const [asking, setAsking] = useState<"paid" | "reject" | null>(null);

  async function run(action: "approve" | "paid" | "reject") {
    setBusy(true); setMsg("");
    try {
      await postJson("/api/admin/payout", { withdrawalId, action, reason: ref });
      setAsking(null); setRef("");
      router.refresh();
    } catch (e) { setMsg(errMsg(e, "Could not update the payout.")); }
    setBusy(false);
  }

  const btn = (bg: string, fg: string) => ({
    height: 30, background: bg, color: fg, border: bg === "transparent" ? "1px solid " + T.border : "none",
    borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontFamily: T.font, cursor: "pointer", whiteSpace: "nowrap" as const,
  });

  if (asking) {
    return (
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <input value={ref} onChange={(e) => setRef(e.target.value)}
          placeholder={asking === "paid" ? "Transfer reference" : "Why"}
          style={{ height: 30, width: 170, background: T.card, color: T.heading, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 9px", fontSize: 12.5, fontFamily: T.font }} />
        <button onClick={() => run(asking)} disabled={busy} style={btn(asking === "paid" ? T.green : T.danger, "#fff")}>
          {busy ? "..." : "Confirm"}
        </button>
        <button onClick={() => { setAsking(null); setRef(""); setMsg(""); }} style={{ ...btn("transparent", T.muted), border: "none" }}>Cancel</button>
        {msg && <span style={{ fontSize: 12, color: T.dangerText, width: "100%", textAlign: "right", lineHeight: 1.5 }}>{msg}</span>}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 7, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
      {status === "requested" && (
        <button onClick={() => run("approve")} disabled={busy} style={btn(T.green, T.onAccent)}>{busy ? "..." : "Approve"}</button>
      )}
      {(status === "approved" || status === "processing") && (
        <button onClick={() => setAsking("paid")} style={btn(T.green, T.onAccent)}>Mark paid</button>
      )}
      {status !== "paid" && (
        <button onClick={() => setAsking("reject")} style={btn("transparent", T.dangerText)}>Reject</button>
      )}
      {msg && <span style={{ fontSize: 12, color: T.dangerText, width: "100%", textAlign: "right", lineHeight: 1.5 }}>{msg}</span>}
    </div>
  );
}