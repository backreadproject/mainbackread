"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { Grouped, Account } from "@/lib/accounts";

// Who is reading this, grouped into the companies behind them.
//
// A SUMMARY, not a second list. The recipients list below already names every
// reader; this answers a different question -- is a company forming around this
// document -- and if it out-scrolls the thing it summarises it has failed at
// that job. So accounts are one line each, expandable, and the readers who
// belong to nobody are a count rather than eleven rows.
//
// The panel says HOW each group was established, because the two are different
// claims. A shared domain is an inference from an email address. A forward
// chain is a fact we watched happen, and it is the one a competitor without
// forwarding cannot produce at all.
export default function AccountsPanel({ grouped }: { grouped: Grouped }) {
  const fr = useLocale() === "fr";
  const [open, setOpen] = useState<string | null>(null);
  const { accounts, individuals } = grouped;

  // Nothing has grouped and nobody is reading: say nothing at all.
  if (accounts.length === 0 && individuals.length === 0) return null;

  const C = {
    title: fr ? "Qui lit ceci" : "Who is reading this",
    readers: fr ? "lecteurs" : "readers",
    reader: fr ? "lecteur" : "reader",
    byForward: fr ? "par transfert" : "by forward",
    viaDomain: fr ? "m\u00eame domaine" : "shared domain",
    viaForward: fr ? "cha\u00eene de transfert" : "forward chain",
    onTheirOwn: fr ? "sur des adresses personnelles, sans coll\u00e8gue visible" : "on personal addresses, with no colleague we can see",
    others: fr ? "autres lecteurs" : "other readers",
    other: fr ? "autre lecteur" : "other reader",
    empty: fr
      ? "Aucun regroupement pour l\u2019instant. Une organisation appara\u00eet quand deux lecteurs partagent un domaine d\u2019entreprise, ou quand l\u2019un transf\u00e8re \u00e0 l\u2019autre."
      : "Nothing has grouped yet. An account appears when two readers share a company domain, or when one forwards to another.",
    forwarded: fr ? "transf\u00e9r\u00e9" : "forwarded",
    asked: fr ? "questions" : "asked",
    opens: fr ? "ouvertures" : "opens",
  };

  const row = (a: Account) => {
    const isOpen = open === a.key;
    return (
      <div key={a.key} style={{ borderTop: "1px solid " + T.borderSoft }}>
        <button onClick={() => setOpen(isOpen ? null : a.key)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", background: "transparent",
            border: "none", cursor: "pointer", fontFamily: T.font, textAlign: "left", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: T.heading }}>{a.label}</span>
          <span style={{ fontSize: 12.5, color: T.muted }}>
            {a.readers.length} {a.readers.length === 1 ? C.reader : C.readers}
            {a.byForward > 0 ? ", " + a.byForward + " " + C.byForward : ""}
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: T.muted }}>
            <i style={{ width: 5, height: 5, borderRadius: 2, background: a.basis === "forward" ? T.green : T.faint, flex: "none" }} />
            {a.basis === "forward" ? C.viaForward : C.viaDomain}
          </span>
        </button>
        {isOpen && a.readers.map((r) => (
          <a key={r.id} href={"/recipients/" + r.id}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 18px 8px 32px", textDecoration: "none",
              color: "inherit", borderTop: "1px solid " + T.borderSoft }}>
            <span style={{ fontSize: 13, color: T.heading }}>{r.name}</span>
            {r.forwardedBy && <span style={{ fontSize: 11, color: T.muted, border: "1px solid " + T.border, borderRadius: 4, padding: "0 5px" }}>{C.forwarded}</span>}
            <span style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 12, color: T.muted, fontVariantNumeric: "tabular-nums" }}>
              {r.questions > 0 && <span>{r.questions} {C.asked}</span>}
              <span style={{ color: r.opens > 0 ? T.body : T.faint }}>{r.opens} {C.opens}</span>
            </span>
          </a>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1040, padding: "0 28px" }}>
      <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 }}>
        <div style={{ padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body }}>
          {C.title}
        </div>
        {accounts.length === 0 ? (
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, margin: 0, padding: "14px 18px" }}>{C.empty}</p>
        ) : accounts.map(row)}
        {individuals.length > 0 && (
          <div style={{ padding: "11px 18px", borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
            {individuals.length} {individuals.length === 1 ? C.other : C.others} {C.onTheirOwn}.
          </div>
        )}
      </div>
    </div>
  );
}