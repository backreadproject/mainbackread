"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// Governing one reader's link.
//
// Two separate things, deliberately not merged. An EXPIRY is a decision made in
// advance -- a proposal with pricing in it should not stay open forever, and the
// sender sets that when they share. A WITHDRAWAL is a decision made now, usually
// because something changed.
//
// Neither erases anything. The opens, questions and verdict are the customer's
// record of what happened, and a sender who withdraws a link because a deal went
// elsewhere still needs the history that told them so.
const PERIODS = [1, 7, 14, 30, 90] as const;

export default function LinkControls({
  recipientId, expiresAt, revokedAt, onChange,
}: {
  recipientId: string;
  expiresAt: string | null;
  revokedAt: string | null;
  onChange: (next: { expiresAt?: string | null; revokedAt?: string | null }) => void;
}) {
  const fr = useLocale() === "fr";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  const C = {
    expires: fr ? "Expire" : "Expires",
    never: fr ? "Jamais" : "Never",
    setExpiry: fr ? "D\u00e9finir" : "Set",
    clear: fr ? "Retirer" : "Clear",
    withdraw: fr ? "Retirer l\u2019acc\u00e8s" : "Withdraw access",
    restore: fr ? "R\u00e9tablir" : "Restore",
    withdrawn: fr ? "Acc\u00e8s retir\u00e9" : "Access withdrawn",
    expired: fr ? "Lien expir\u00e9" : "Link expired",
    keepsHistory: fr
      ? "La lecture d\u00e9j\u00e0 enregistr\u00e9e est conserv\u00e9e."
      : "Everything they already read stays recorded.",
    day: fr ? "1 jour" : "1 day",
    days: (n: number) => (fr ? n + " jours" : n + " days"),
    failed: fr ? "Impossible d\u2019enregistrer." : "Could not save that.",
  };

  const gone = !!revokedAt;
  const past = !!expiresAt && new Date(expiresAt) < new Date();

  async function send(body: Record<string, unknown>) {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/link", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipientId, ...body }),
      });
      const raw = await res.text();
      let json: { expiresAt?: string | null; revoked?: boolean; error?: string } = {};
      try { json = JSON.parse(raw); } catch { throw new Error("Server returned " + res.status + "."); }
      if (!res.ok) throw new Error(json.error ?? C.failed);
      if ("revoked" in json) onChange({ revokedAt: json.revoked ? new Date().toISOString() : null });
      else onChange({ expiresAt: json.expiresAt ?? null });
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : C.failed);
    } finally { setBusy(false); }
  }

  const link = { background: "none", border: "none", padding: 0, fontSize: 12.5, fontFamily: T.font,
    color: T.greenText, cursor: "pointer", borderBottom: "1px solid " + T.greenBorder } as const;
  const chip = { height: 26, padding: "0 9px", fontSize: 12, fontFamily: T.font, color: T.heading,
    background: T.card, border: "1px solid " + T.border, borderRadius: 4, cursor: "pointer" } as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: T.muted }}>
      {gone || past ? (
        <>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: T.heading }}>
            <i style={{ width: 6, height: 6, borderRadius: 2, background: T.dangerText, flex: "none" }} />
            {gone ? C.withdrawn : C.expired}
          </span>
          <span style={{ color: T.faint }}>{C.keepsHistory}</span>
          <button onClick={() => send(gone ? { action: "restore" } : { action: "expiry", days: null })}
            disabled={busy} style={{ ...link, marginLeft: "auto" }}>{C.restore}</button>
        </>
      ) : (<>
        <span>{C.expires}</span>
        <span style={{ color: T.heading }}>
          {expiresAt
            ? new Date(expiresAt).toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
            : C.never}
        </span>
        {open ? (
          <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
            {PERIODS.map((d) => (
              <button key={d} onClick={() => send({ action: "expiry", days: d })} disabled={busy} style={chip}>
                {d === 1 ? C.day : C.days(d)}
              </button>
            ))}
            {expiresAt && (
              <button onClick={() => send({ action: "expiry", days: null })} disabled={busy} style={chip}>{C.clear}</button>
            )}
          </span>
        ) : (
          <button onClick={() => setOpen(true)} disabled={busy} style={link}>{C.setExpiry}</button>
        )}
        <button onClick={() => send({ action: "revoke" })} disabled={busy}
          style={{ ...link, marginLeft: "auto", color: T.dangerText, borderBottomColor: T.dangerBorder }}>
          {C.withdraw}
        </button>
      </>)}
      {err && <span style={{ color: T.dangerText, width: "100%" }}>{err}</span>}
    </div>
  );
}