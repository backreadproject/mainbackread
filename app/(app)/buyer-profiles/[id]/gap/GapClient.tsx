"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { ObservedSummary } from "@/lib/observed";
import type { Refusal } from "@/lib/gap-input";
import type { GapOutput } from "@/lib/ai/tasks/gap";
import { Tier, Note } from "../Tabs";

export type GapRun = {
  id: string | null;
  engaged: number;
  readers: number;
  identified: number;
  output: GapOutput;
  created_at: string;
};

const MOVE_TONE: Record<string, string> = {
  holding: T.green,
  weaker: T.amber,
  contradicted: T.danger,
  "never appeared": T.amber,
  "no evidence": T.faint,
};

export default function GapClient({
  profile,
  revision,
  summary,
  refusal,
  latest,
  previous,
}: {
  profile: { id: string; name: string; threshold: number };
  revision: number | null;
  summary: ObservedSummary;
  refusal: Refusal | null;
  latest: GapRun | null;
  previous: GapRun | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    titleGap: fr ? "Vos lecteurs ne sont pas d\u2019accord avec vous" : "Your readers disagree with you",
    titleAgree: fr ? "Vos lecteurs correspondent \u00e0 ce que vous avez d\u00e9crit" : "Your readers match what you described",
    titleNone: fr ? "Comparaison avec vos lecteurs" : "Measured against your readers",
    sub: fr
      ? "Mesur\u00e9 contre la r\u00e9vision "
      : "Measured against revision ",
    subEnd: fr
      ? ", la derni\u00e8re version que vous avez \u00e9crite vous-m\u00eame. Nous ne mesurons jamais contre une version que nous avons g\u00e9n\u00e9r\u00e9e, sinon cette page serait d\u2019accord avec elle-m\u00eame ind\u00e9finiment."
      : ", the last version you wrote yourself. We never measure against a version we generated, or this page would agree with itself forever.",
    subNoRev: fr
      ? "Rien n\u2019a encore \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9 pour ce profil."
      : "Nothing has been generated for this profile yet.",

    finding: fr ? "Constat" : "Finding",
    findingBasis: fr ? " lecteurs engag\u00e9s. Au-del\u00e0 du point o\u00f9 ceci serait du bruit." : " engaged readers. Past the point where this is noise.",
    ran: fr ? "Analys\u00e9 le " : "Run on ",

    tblStated: fr ? "Ce que vous avez dit" : "What you said",
    tblObserved: fr ? "Ce qui s\u2019est pass\u00e9" : "What happened",
    tblMove: fr ? "\u00c9volution" : "Movement",
    mHolding: fr ? "Se maintient" : "Holding",
    mWeaker: fr ? "Plus faible qu\u2019annonc\u00e9" : "Weaker than stated",
    mContra: fr ? "Contredit" : "Contradicted",
    mNever: fr ? "Jamais apparu" : "Never appeared",
    mNone: fr ? "Aucune preuve" : "No evidence",

    changedH: fr ? "Ce qui a chang\u00e9 depuis la derni\u00e8re fois" : "What changed since last check",
    changedThen: fr ? "Alors" : "Then",
    changedNow: fr ? "Aujourd\u2019hui" : "Today",
    engagedWord: fr ? " lecteurs engag\u00e9s, " : " engaged readers, ",
    identifiedWord: fr ? " avec une fonction ou une entreprise enregistr\u00e9e." : " with a role or company recorded.",
    firstRun: fr
      ? "Premi\u00e8re analyse. Il n\u2019y a rien \u00e0 comparer pour l\u2019instant : la prochaine dira ce qui a boug\u00e9."
      : "First run. There is nothing to compare it against yet; the next one will say what moved.",

    notH: fr ? "Ce que ceci ne vous dit pas" : "What this does not tell you",
    actH: fr ? "Si vous voulez agir" : "If you want to act on it",
    actP: fr
      ? "Rien ici ne modifie votre profil tout seul. Un syst\u00e8me qui r\u00e9\u00e9crirait discr\u00e8tement ce que vous croyez, \u00e0 partir de donn\u00e9es qu\u2019il a lui-m\u00eame collect\u00e9es, serait d\u2019accord avec lui-m\u00eame en deux r\u00e9visions et cesserait de valoir la peine d\u2019\u00eatre ouvert."
      : "Nothing here changes your profile on its own. A system that quietly rewrote what you believe, using data it collected itself, would agree with itself within two revisions and stop being worth opening.",
    reanswer: fr ? "Re-r\u00e9pondre aux questions" : "Re-answer the questions",
    reanswerP: fr
      ? "Vous \u00e9crivez la nouvelle version. Elle devient une nouvelle r\u00e9vision \u00e9crite par vous, et remet \u00e0 z\u00e9ro ce contre quoi cette page compare."
      : "You write the new version. That becomes a new revision written by you, and resets the baseline this page compares against.",

    run: fr ? "Lancer la comparaison" : "Run the comparison",
    rerun: fr ? "Relancer" : "Check again",
    running: fr ? "Analyse en cours\u2026" : "Comparing\u2026",
    never: fr
      ? "Cette comparaison n\u2019a pas encore \u00e9t\u00e9 lanc\u00e9e. Elle lit ce que vous avez \u00e9crit, puis ce que vos lecteurs ont fait, et dit si les deux se ressemblent."
      : "This comparison has not been run yet. It reads what you wrote, then what your readers did, and says whether the two look like each other.",

    rNoRevT: fr ? "Rien \u00e0 comparer pour l\u2019instant" : "Nothing to compare yet",
    rNoRevD: fr
      ? "Ce profil n\u2019a pas encore de version termin\u00e9e. R\u00e9pondez aux questions et g\u00e9n\u00e9rez-le, puis liez-le \u00e0 un document."
      : "This profile has no finished version yet. Answer the questions and generate it, then attach it to a document.",
    rThreshT: fr ? "Pas encore assez de lecteurs engag\u00e9s" : "Not enough engaged readers yet",
    rThreshD: fr ? "Vous en avez " : "You have ",
    rThreshD2: fr ? " sur les " : " of the ",
    rThreshD3: fr
      ? " requis. En dessous de ce seuil, deux personnes de plus d\u00e9placeraient n\u2019importe quelle conclusion, et une conclusion qui bouge \u00e0 chaque nouveau lecteur n\u2019en est pas une."
      : " needed. Below it, two more people would move any conclusion, and a conclusion that moves with every new reader is not one.",
    rIdT: fr ? "Nous en savons trop peu sur vos lecteurs" : "We know too little about your readers",
    rIdD: fr ? "Vous avez assez de lecteurs engag\u00e9s, mais seulement " : "You have enough engaged readers, but only ",
    rIdD2: fr ? " sur " : " of ",
    rIdD3: fr
      ? " ont une fonction ou une entreprise enregistr\u00e9e. Cette page compare le type de personnes que vous avez d\u00e9crit au type de personnes qui se sont engag\u00e9es, et sans cela il n\u2019y a rien \u00e0 comparer."
      : " have a role or company recorded. This page compares the kind of people you described against the kind who engaged, and without that there is nothing to compare.",
    rIdFix: fr
      ? "Ajoutez une fonction \u00e0 vos lecteurs existants depuis la page Destinataires, ou renseignez-la en ajoutant les prochains."
      : "Add a role to your existing readers from the Recipients page, or record one as you add the next few.",
    toRecipients: fr ? "Aller aux destinataires" : "Go to recipients",
    failed: fr ? "\u00c9chec de la comparaison." : "The comparison failed.",
  };

  const MOVE_LABEL: Record<string, string> = {
    holding: c.mHolding,
    weaker: c.mWeaker,
    contradicted: c.mContra,
    "never appeared": c.mNever,
    "no evidence": c.mNone,
  };

  const btn: React.CSSProperties = {
    height: 32, padding: "0 11px", border: "1px solid " + T.border, borderRadius: T.rBtn,
    background: T.card, fontSize: 13, color: T.body, cursor: "pointer", fontFamily: T.font,
  };
  const primary: React.CSSProperties = { ...btn, background: T.green, borderColor: T.green, color: T.onAccent, fontWeight: 500, padding: "0 14px" };
  const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" };
  const th: React.CSSProperties = { background: T.soft, fontSize: 11.5, fontWeight: 500, color: T.muted, textAlign: "left", padding: "9px 14px", borderBottom: "1px solid " + T.border };
  const td: React.CSSProperties = { padding: "12px 14px", borderBottom: "1px solid " + T.border, fontSize: 13.5, color: T.body, verticalAlign: "top", lineHeight: 1.55 };

  async function run(refresh: boolean) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/gap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, refresh }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error || c.failed); return; }
      router.refresh();
    } catch {
      setError(c.failed);
    } finally {
      setBusy(false);
    }
  }

  const out = latest?.output ?? null;
  // Bound once, so every read below is on a value the compiler has narrowed.
  const title = !out ? c.titleNone : out.agrees ? c.titleAgree : c.titleGap;

  function when(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, marginBottom: 9 }}>
          <a href="/buyer-profiles" style={{ color: "inherit", textDecoration: "none" }}>{c.back}</a>
          {" \u00b7 "}
          <a href={"/buyer-profiles/" + profile.id} style={{ color: "inherit", textDecoration: "none" }}>{profile.name}</a>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.25 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "9px 0 0", lineHeight: 1.6, maxWidth: 720 }}>
          {revision !== null ? c.sub + revision + c.subEnd : c.subNoRev}
        </p>

        {error && <p style={{ fontSize: 13.5, color: T.dangerText, margin: "16px 0 0" }}>{error}</p>}

        <div style={{ marginTop: 24 }}>
          {refusal ? (
            <Tier tone={T.faint} name={c.finding} basis={""}>
              {refusal.kind === "no-revision" && (
                <>
                  <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.rNoRevT}</div>
                  <p style={{ fontSize: 13, color: T.muted, margin: "9px 0 0", lineHeight: 1.65, maxWidth: 600 }}>{c.rNoRevD}</p>
                </>
              )}
              {refusal.kind === "below-threshold" && (
                <>
                  <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.rThreshT}</div>
                  <p style={{ fontSize: 13, color: T.muted, margin: "9px 0 0", lineHeight: 1.65, maxWidth: 600 }}>
                    {c.rThreshD}{refusal.engaged}{c.rThreshD2}{refusal.threshold}{c.rThreshD3}
                  </p>
                </>
              )}
              {refusal.kind === "too-few-identified" && (
                <>
                  <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.rIdT}</div>
                  <p style={{ fontSize: 13, color: T.muted, margin: "9px 0 0", lineHeight: 1.65, maxWidth: 620 }}>
                    {c.rIdD}{refusal.identified}{c.rIdD2}{refusal.readers}{c.rIdD3}
                  </p>
                  <p style={{ fontSize: 13, color: T.muted, margin: "10px 0 0", lineHeight: 1.65, maxWidth: 620 }}>{c.rIdFix}</p>
                  <div style={{ marginTop: 16 }}>
                    <a href="/recipients" style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>{c.toRecipients}</a>
                  </div>
                </>
              )}
            </Tier>
          ) : !latest || !latest.output ? (
            <Tier tone={T.faint} name={c.finding} basis={""}>
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.65, maxWidth: 620 }}>{c.never}</p>
              <div style={{ marginTop: 16 }}>
                <button style={{ ...primary, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void run(false)}>
                  {busy ? c.running : c.run}
                </button>
              </div>
            </Tier>
          ) : (
            <>
              <Tier
                tone={latest.output.agrees ? T.green : T.danger}
                name={c.finding}
                basis={latest.engaged + c.findingBasis}
                right={c.ran + when(latest.created_at)}
              >
                <p style={{ fontSize: 15, lineHeight: 1.7, color: T.heading, margin: "0 0 14px" }}>{latest.output.headline}</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: T.body, margin: 0, whiteSpace: "pre-wrap" }}>{latest.output.finding}</p>

                {latest.output.claims.length > 0 && (
                  <>
                    <div style={{ height: 1, background: T.border, margin: "18px 0" }} />
                    <table style={tbl}>
                      <thead><tr>
                        <th style={th}>{c.tblStated}</th>
                        <th style={th}>{c.tblObserved}</th>
                        <th style={{ ...th, width: 170 }}>{c.tblMove}</th>
                      </tr></thead>
                      <tbody>
                        {latest.output.claims.map((x, i) => (
                          <tr key={i}>
                            <td style={td}>{x.stated}</td>
                            <td style={td}>{x.observed}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>
                              <i style={{ display: "inline-block", width: 6, height: 6, background: MOVE_TONE[x.movement] ?? T.faint, marginRight: 7, verticalAlign: 1 }} />
                              {MOVE_LABEL[x.movement] ?? x.movement}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                <div style={{ height: 1, background: T.border, margin: "18px 0" }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: T.heading, marginBottom: 9 }}>{c.changedH}</div>
                {previous ? (
                  <dl style={{ display: "grid", gridTemplateColumns: "160px minmax(0,1fr)", gap: "10px 16px", fontSize: 13, margin: 0 }}>
                    <dt style={{ color: T.muted }}>{c.changedThen}</dt>
                    <dd style={{ color: T.body, margin: 0, lineHeight: 1.6 }}>
                      {when(previous.created_at)}: {previous.engaged}{c.engagedWord}{previous.identified}{c.identifiedWord}
                    </dd>
                    <dt style={{ color: T.muted }}>{c.changedNow}</dt>
                    <dd style={{ color: T.body, margin: 0, lineHeight: 1.6 }}>
                      {latest.engaged}{c.engagedWord}{latest.identified}{c.identifiedWord}
                    </dd>
                  </dl>
                ) : (
                  <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.65 }}>{c.firstRun}</p>
                )}

                <div style={{ height: 1, background: T.border, margin: "18px 0" }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: T.heading, marginBottom: 9 }}>{c.notH}</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: T.body, margin: 0, whiteSpace: "pre-wrap" }}>{latest.output.doesNotTell}</p>

                <div style={{ height: 1, background: T.border, margin: "18px 0" }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: T.heading, marginBottom: 9 }}>{c.actH}</div>
                <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: 15, maxWidth: 520 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.heading }}>{c.reanswer}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6, lineHeight: 1.55 }}>{c.reanswerP}</div>
                  <div style={{ marginTop: 12 }}>
                    <a href={"/buyer-profiles/" + profile.id} style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                      {c.reanswer}
                    </a>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <Note tone="amber">{c.actP}</Note>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <button style={{ ...btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void run(true)}>
                    {busy ? c.running : c.rerun}
                  </button>
                </div>
              </Tier>
            </>
          )}
        </div>

        <p style={{ fontSize: 12, color: T.faint, margin: "4px 0 0", lineHeight: 1.6 }}>
          {summary.readers}
          {fr ? " lecteurs mesur\u00e9s contre ce profil, dont " : " readers measured against this profile, "}
          {summary.engaged}
          {fr ? " engag\u00e9s." : " of them engaged."}
        </p>
      </main>
    </div>
  );
}
