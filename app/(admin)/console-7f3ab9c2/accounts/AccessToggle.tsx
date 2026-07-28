"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { postJson, errMsg } from "@/lib/fetch-json";

/**
 * The door, on the accounts page header.
 *
 * A state rather than an action: closing it makes every unapproved account
 * pending, including accounts created afterwards. Opening it needs no per-account
 * work, which is what makes this reversible in one click.
 */
export default function AccessToggle({ inviteOnly, pendingCount }: { inviteOnly: boolean; pendingCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function flip() {
    setBusy(true); setMsg("");
    try {
      await postJson("/api/admin/access", { inviteOnly: !inviteOnly });
      router.refresh();
    } catch (e) { setMsg(errMsg(e, "Failed.")); }
    finally { setBusy(false); }
  }

  return (
    <div style={{
      border: "1px solid " + (inviteOnly ? T.amberBorder : T.border),
      background: inviteOnly ? T.amberSoft : T.card,
      borderRadius: T.rCard, padding: "12px 16px", margin: "22px 0 0",
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0, flex: "1 1 22em" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.heading }}>
          {inviteOnly ? "Invite only" : "Open to everyone"}
        </div>
        <div style={{ fontSize: 13, color: inviteOnly ? T.amberText : T.muted, marginTop: 2, lineHeight: 1.5 }}>
          {inviteOnly
            ? "New accounts can sign up and sign in, but see a waiting page until you approve them."
              + (pendingCount > 0 ? " " + pendingCount + " waiting." : " Nobody waiting.")
            : "Anyone who signs up can use the product immediately."}
        </div>
      </div>
      <button onClick={flip} disabled={busy}
        style={{
          height: 34, flex: "none", borderRadius: T.rBtn, padding: "0 13px",
          fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: busy ? "default" : "pointer",
          border: inviteOnly ? "1px solid " + T.border : "none",
          background: inviteOnly ? T.card : T.green,
          color: inviteOnly ? T.heading : T.onAccent,
          opacity: busy ? 0.6 : 1,
        }}>
        {busy ? "Working" : inviteOnly ? "Open to everyone" : "Close to invite only"}
      </button>
      {msg && <div style={{ flexBasis: "100%", fontSize: 13, color: T.dangerText }}>{msg}</div>}
    </div>
  );
}