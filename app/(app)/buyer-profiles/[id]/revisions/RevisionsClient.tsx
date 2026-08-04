"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { AnswerDiff } from "@/lib/revisions";

export type RevisionRow = {
  id: string;
  revision: number;
  source: "asserted" | "refined";
  refinedFrom: number | null;
  branch: "operating" | "startup";
  status: "draft" | "complete";
  isBaseline: boolean;
  createdAt: string;
  completedAt: string | null;
  headline: string;
  answered: number;
  questions: number;
  diff: AnswerDiff | null;
  answers: { q: string; a: string }[];
};

export default function RevisionsClient({
  profile,
  rows,
}: {
  profile: { id: string; name: string };
  rows: RevisionRow[];
}) {
  const locale = useLocale();
  const fr = locale === "fr";
  const [open, setOpen] = useState<string | null>(null);

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    title: fr ? "R\u00e9visions" : "Revisions",
    sub: fr
      ? "Les versions que vous avez \u00e9crites sont conserv\u00e9es d\u00e9finitivement. Celles que nous avons r\u00e9dig\u00e9es se placent \u00e0 c\u00f4t\u00e9 et ne les remplacent jamais."
      : "Versions you wrote are kept permanently. Versions we drafted sit beside them and never replace them.",
    colRev: fr ? "R\u00e9vision" : "Revision",
    colBy: fr ? "\u00c9crite par" : "Written by",
    colBase: fr ? "R\u00e9f\u00e9rence" : "Baseline",
    colChanged: fr ? "Ce que vous avez chang\u00e9" : "What you changed",
    colDate: fr ? "Date" : "Date",
    you: fr ? "Vous" : "You",
    drafted: fr ? "R\u00e9dig\u00e9e d\u2019apr\u00e8s les lecteurs" : "Drafted from readers",
    current: fr ? "R\u00e9f\u00e9rence actuelle" : "Current baseline",
    superseded: fr ? "Remplac\u00e9e" : "Superseded",
    neverBase: fr ? "Jamais une r\u00e9f\u00e9rence" : "Never a baseline",
    draft: fr ? "Brouillon, inachev\u00e9e" : "Draft, unfinished",
    first: fr ? "Premi\u00e8re version" : "First version",
    nothing: fr ? "Aucune r\u00e9ponse modifi\u00e9e" : "No answers changed",
    different: fr ? "Questions diff\u00e9rentes" : "A different set of questions",
    differentWhy: fr
      ? "L\u2019objectif ou la branche a chang\u00e9, donc les questions pos\u00e9es n\u2019\u00e9taient pas les m\u00eames."
      : "The objective or the evidence branch changed, so the questions asked were not the same ones.",
    changedWord: fr ? " modifi\u00e9es" : " changed",
    addedWord: fr ? " ajout\u00e9es" : " added",
    removedWord: fr ? " vid\u00e9es" : " emptied",
    show: fr ? "Voir les r\u00e9ponses" : "Show the answers",
    hide: fr ? "Masquer" : "Hide",
    answersH: fr ? "Les r\u00e9ponses, telles qu\u2019elles ont \u00e9t\u00e9 donn\u00e9es" : "The answers, as they were given",
    branchOp: fr ? "Avec des clients" : "With customers",
    branchSt: fr ? "Hypoth\u00e8se" : "Hypothesis",
    answeredOf: fr ? " r\u00e9ponses sur " : " answered of ",
    foot: fr
      ? "Les r\u00e9visions ne comptent pas dans votre limite de plan. Seuls les profils comptent."
      : "Revisions do not count against your plan limit. Only profiles do.",
    none: fr ? "Ce profil n\u2019a encore aucune r\u00e9vision." : "This profile has no revisions yet.",
    baselineNote: fr
      ? "L\u2019analyse des \u00e9carts mesure toujours contre la r\u00e9f\u00e9rence actuelle, c\u2019est-\u00e0-dire la derni\u00e8re version que vous avez \u00e9crite vous-m\u00eame. Une version que nous avons r\u00e9dig\u00e9e ne peut jamais devenir la r\u00e9f\u00e9rence, sinon la page finirait par \u00eatre d\u2019accord avec elle-m\u00eame."
      : "The gap analysis always measures against the current baseline, which is the last version you wrote yourself. A version we drafted can never become the baseline, or the page would end up agreeing with itself.",
  };

  const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" };
  const th: React.CSSProperties = { background: T.soft, fontSize: 11.5, fontWeight: 500, color: T.muted, textAlign: "left", padding: "9px 14px", borderBottom: "1px solid " + T.border };
  const td: React.CSSProperties = { padding: "13px 14px", borderBottom: "1px solid " + T.border, fontSize: 13.5, color: T.body, verticalAlign: "top", lineHeight: 1.55 };
  const btn: React.CSSProperties = {
    height: 27, padding: "0 9px", border: "1px solid " + T.border, borderRadius: T.rBtn,
    background: T.card, fontSize: 12, color: T.body, cursor: "pointer", fontFamily: T.font,
  };

  function when(iso: string): string {
    return new Date(iso).toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function changedCell(r: RevisionRow) {
    if (r.status === "draft") return <span style={{ color: T.faint }}>{c.draft}</span>;
    if (!r.diff) return <span style={{ color: T.faint }}>{c.first}</span>;
    if (r.diff.differentQuestions) {
      return (
        <>
          <span>{c.different}</span>
          <div style={{ fontSize: 12, color: T.faint, marginTop: 4, lineHeight: 1.55 }}>{c.differentWhy}</div>
        </>
      );
    }
    const parts: string[] = [];
    if (r.diff.changed.length) parts.push(r.diff.changed.length + c.changedWord);
    if (r.diff.added.length) parts.push(r.diff.added.length + c.addedWord);
    if (r.diff.removed.length) parts.push(r.diff.removed.length + c.removedWord);
    if (!parts.length) return <span style={{ color: T.faint }}>{c.nothing}</span>;

    const named = [...r.diff.changed, ...r.diff.added].slice(0, 3);
    return (
      <>
        <span>{parts.join(", ")}</span>
        {named.length > 0 && (
          <div style={{ fontSize: 12, color: T.faint, marginTop: 4, lineHeight: 1.55 }}>
            {named.join(" \u00b7 ")}
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, marginBottom: 9 }}>
          <a href="/buyer-profiles" style={{ color: "inherit", textDecoration: "none" }}>{c.back}</a>
          {" \u00b7 "}
          <a href={"/buyer-profiles/" + profile.id} style={{ color: "inherit", textDecoration: "none" }}>{profile.name}</a>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          {c.title}
        </h1>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "9px 0 0", lineHeight: 1.6, maxWidth: 720 }}>{c.sub}</p>

        {rows.length === 0 ? (
          <p style={{ fontSize: 14, color: T.muted, marginTop: 26 }}>{c.none}</p>
        ) : (
          <>
            <table style={{ ...tbl, marginTop: 24 }}>
              <thead><tr>
                <th style={{ ...th, width: 90 }}>{c.colRev}</th>
                <th style={{ ...th, width: 190 }}>{c.colBy}</th>
                <th style={{ ...th, width: 160 }}>{c.colBase}</th>
                <th style={th}>{c.colChanged}</th>
                <th style={{ ...th, width: 120 }}>{c.colDate}</th>
                <th style={{ ...th, width: 130 }} />
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...td, fontVariantNumeric: "tabular-nums", color: T.heading, fontWeight: 500 }}>
                      r{r.revision}
                      <div style={{ fontSize: 12, color: T.faint, fontWeight: 400, marginTop: 4 }}>
                        {r.branch === "operating" ? c.branchOp : c.branchSt}
                      </div>
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <i style={{ display: "inline-block", width: 6, height: 6, background: r.source === "asserted" ? T.green : T.indigo, marginRight: 7, verticalAlign: 1 }} />
                      {r.source === "asserted" ? c.you : c.drafted}
                      {r.refinedFrom !== null && (
                        <div style={{ fontSize: 12, color: T.faint, marginTop: 4 }}>{"r" + r.refinedFrom}</div>
                      )}
                    </td>
                    <td style={{ ...td, color: r.isBaseline ? T.body : T.faint }}>
                      {r.isBaseline ? c.current : r.source === "refined" ? c.neverBase : r.status === "draft" ? "\u2014" : c.superseded}
                    </td>
                    <td style={td}>{changedCell(r)}</td>
                    <td style={{ ...td, color: T.faint, whiteSpace: "nowrap" }}>{when(r.completedAt ?? r.createdAt)}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      {r.answers.length > 0 && (
                        <button style={btn} onClick={() => setOpen(open === r.id ? null : r.id)}>
                          {open === r.id ? c.hide : c.show}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {open && (() => {
              const r = rows.find((x) => x.id === open);
              if (!r) return null;
              return (
                <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 16 }}>
                  <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>
                    {"r" + r.revision + " \u00b7 " + c.answersH + " \u00b7 " + r.answered + c.answeredOf + r.questions}
                  </div>
                  <div style={{ padding: 16 }}>
                    {r.headline && (
                      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.heading, margin: "0 0 16px" }}>{r.headline}</p>
                    )}
                    <dl style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: "12px 16px", fontSize: 13, margin: 0 }}>
                      {r.answers.map((a, i) => (
                        <div key={i} style={{ display: "contents" }}>
                          <dt style={{ color: T.muted, lineHeight: 1.5 }}>{a.q}</dt>
                          <dd style={{ color: T.body, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{a.a}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              );
            })()}

            <div style={{ borderLeft: "3px solid " + T.indigo, background: "#F5F5FF", padding: "11px 14px", marginTop: 18, fontSize: 12.5, lineHeight: 1.6, color: "#2C2E9E" }}>
              {c.baselineNote}
            </div>

            <p style={{ fontSize: 12, color: T.faint, margin: "11px 0 0", lineHeight: 1.6 }}>{c.foot}</p>
          </>
        )}
      </main>
    </div>
  );
}
