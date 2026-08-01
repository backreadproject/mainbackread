"use client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { Grouped, Account, GroupableReader } from "@/lib/accounts";

// Who is reading this, grouped into the companies behind them.
//
// The panel says HOW each group was established, because the two are different
// claims. A domain group is an inference from an email address. A forward group
// is a fact we watched happen -- and it is the one a competitor without
// forwarding cannot produce at all.
//
// Readers who belong to no group are NOT hidden and NOT an error. A personal
// address with no chain genuinely has no company behind it, and saying so is
// more useful than inventing one.
export default function AccountsPanel({ grouped }: { grouped: Grouped }) {
  const fr = useLocale() === "fr";
  const C = {
    title: fr ? "Qui lit ceci" : "Who is reading this",
    accounts: fr ? "Organisations" : "Accounts",
    readers: fr ? "lecteurs" : "readers",
    reader: fr ? "lecteur" : "reader",
    byForward: fr ? "par transfert" : "by forward",
    viaDomain: fr ? "m\u00eame domaine" : "shared domain",
    viaForward: fr ? "cha\u00eene de transfert" : "forward chain",
    individuals: fr ? "Lecteurs isol\u00e9s" : "On their own",
    individualsHint: fr
      ? "Adresses personnelles ou lecteurs sans coll\u00e8gue connu. Il n\u2019y a pas d\u2019entreprise \u00e0 rattacher."
      : "Personal addresses, or readers with no colleague we can see. There is no company to place them with.",
    empty: fr
      ? "Personne ne s\u2019est encore regroup\u00e9. Les organisations apparaissent quand deux lecteurs partagent un domaine d\u2019entreprise, ou quand l\u2019un transf\u00e8re \u00e0 l\u2019autre."
      : "Nobody has grouped yet. An account appears when two readers share a company domain, or when one forwards to another.",
    asked: fr ? "questions" : "asked",
    opened: fr ? "ouvertures" : "opens",
    replied: fr ? "A r\u00e9pondu" : "Replied",
    forwarded: fr ? "transf\u00e9r\u00e9" : "forwarded",
  };

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body };

  const line = (r: GroupableReader, indent: boolean) => (
    <a key={r.id} href={"/recipients/" + r.id}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", paddingLeft: indent ? 34 : 18,
        borderTop: "1px solid " + T.borderSoft, textDecoration: "none", color: "inherit" }}>
      <span style={{ fontSize: 13.5, color: T.heading, borderBottom: "1px solid " + T.border, paddingBottom: 1 }}>{r.name}</span>
      {r.forwardedBy && (
        <span style={{ fontSize: 11.5, color: T.muted, border: "1px solid " + T.border, borderRadius: 4, padding: "1px 6px" }}>{C.forwarded}</span>
      )}
      <span style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 12.5, color: T.muted, fontVariantNumeric: "tabular-nums" }}>
        {r.replied && <span style={{ color: T.greenText }}>{C.replied}</span>}
        {r.questions > 0 && <span>{r.questions} {C.asked}</span>}
        <span style={{ color: r.opens > 0 ? T.body : T.faint }}>{r.opens} {C.opened}</span>
      </span>
    </a>
  );

  const block = (a: Account) => (
    <div key={a.key}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderTop: "1px solid " + T.border, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight }}>{a.label}</span>
        <span style={{ fontSize: 12.5, color: T.muted }}>
          {a.readers.length} {a.readers.length === 1 ? C.reader : C.readers}
          {a.byForward > 0 ? ", " + a.byForward + " " + C.byForward : ""}
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: T.muted }}>
          <i style={{ width: 5, height: 5, borderRadius: 2, background: a.basis === "forward" ? T.green : T.faint, flex: "none" }} />
          {a.basis === "forward" ? C.viaForward : C.viaDomain}
        </span>
      </div>
      {a.readers.map((r) => line(r, true))}
    </div>
  );

  const { accounts, individuals } = grouped;
  if (accounts.length === 0 && individuals.length === 0) return null;

  return (
    <div style={card}>
      <div style={head}>{C.title}</div>
      {accounts.length === 0 ? (
        <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: 0, padding: 18 }}>{C.empty}</p>
      ) : accounts.map(block)}
      {individuals.length > 0 && (
        <>
          <div style={{ padding: "12px 18px", borderTop: "1px solid " + T.border }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: T.body }}>{C.individuals} <span style={{ color: T.faint, fontWeight: 400 }}>{individuals.length}</span></div>
            <p style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, margin: "4px 0 0" }}>{C.individualsHint}</p>
          </div>
          {individuals.map((r) => line(r, false))}
        </>
      )}
    </div>
  );
}