"use client";

import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { personaSlug } from "@/lib/persona-match";
import type { ObservedSummary } from "@/lib/observed";
import { Tier, Note } from "../../Tabs";

export type PersonaView = {
  name: string;
  roleInDeal: string;
  afraidOf: string;
  titleVariants: string[];
  reportsTo: string;
  measuredOn: string;
  wants: string;
  budgetAuthority: string;
  objectionTheyRaise: string;
  respondsTo: string;
  losesThem: string;
  gathersAt: string[];
  /** From PeopleOutput.angles, matched on the persona name. */
  leadWith: string;
};

export default function PersonaClient({
  profile,
  persona,
  siblings,
  summary,
  totalReaders,
  attachedDoc,
}: {
  profile: { id: string; name: string; threshold: number };
  persona: PersonaView;
  siblings: { name: string; slug: string }[];
  summary: ObservedSummary;
  totalReaders: number;
  attachedDoc: { id: string; title: string } | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const ROLE: Record<string, string> = {
    champion: fr ? "Porte le projet" : "Champion",
    "economic buyer": fr ? "Acheteur \u00e9conomique" : "Economic buyer",
    blocker: fr ? "Bloque" : "Blocker",
    user: fr ? "Utilisateur" : "User",
    "technical evaluator": fr ? "\u00c9valuateur technique" : "Technical evaluator",
  };

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    matched: fr ? "lecteurs correspondants" : "readers matched",
    of: fr ? "sur" : "of",
    stated: fr ? "\u00c9nonc\u00e9" : "Stated",
    observed: fr ? "Observ\u00e9" : "Observed",
    bStated: fr
      ? "D\u00e9duit de vos r\u00e9ponses. Les champs que nous ne pouvions pas fonder sont absents plut\u00f4t que devin\u00e9s."
      : "Derived from your answers. Fields we could not ground are absent rather than guessed.",
    bObserved: fr
      ? "Des lecteurs qui ont r\u00e9ellement ouvert vos documents"
      : "From readers who actually opened your documents",
    variantTarget: fr ? "Utiliser comme cible de variante A/B" : "Use as A/B variant target",
    lVariants: fr ? "Variantes de titre" : "Title variants",
    lReports: fr ? "Rattach\u00e9 \u00e0" : "Reports to",
    lMeasured: fr ? "\u00c9valu\u00e9 sur" : "Measured on",
    lWants: fr ? "Ce qu\u2019ils veulent" : "What they want",
    lFears: fr ? "Ce qu\u2019ils craignent" : "What they fear",
    lBudget: fr ? "Pouvoir d\u2019achat" : "Budget authority",
    lObjection: fr ? "Objection qu\u2019ils soul\u00e8vent" : "Objection they raise",
    lResponds: fr ? "Ce \u00e0 quoi ils r\u00e9agissent" : "What they respond to",
    lLoses: fr ? "Ce qui les perd" : "What loses them",
    lLead: fr ? "Ouvrir avec" : "Lead with",
    lGathers: fr ? "O\u00f9 ils se retrouvent" : "Where they gather",
    noGather: fr
      ? "Aucun lieu nomm\u00e9 dans vos r\u00e9ponses. Nous n\u2019en inventons pas : envoyer quelqu\u2019un dans une communaut\u00e9 o\u00f9 son acheteur n\u2019est pas co\u00fbte une semaine."
      : "None named in your answers. We do not invent one: sending someone to a community their buyer is not in costs a week.",
    notGenerated: fr
      ? "Nous ne g\u00e9n\u00e9rons pas ce que cette personne \u00e9coute, cherche sur Google ou fait sur LinkedIn. Ces champs existent dans tous les outils de persona et aucun n\u2019est connu."
      : "We do not generate what this person listens to, Googles, or does on LinkedIn. Those fields appear in every persona tool and none of them are known.",
    oOpened: fr ? "Ont ouvert" : "Opened",
    oEngaged: fr ? "Engag\u00e9s" : "Engaged",
    oAsked: fr ? "Ont pos\u00e9 une question" : "Asked a question",
    oForwarded: fr ? "Ont transf\u00e9r\u00e9" : "Forwarded",
    oOutcome: fr ? "R\u00e9sultats enregistr\u00e9s" : "Outcomes marked",
    questionsWord: fr ? "questions au total" : "questions in all",
    forwardsWord: fr ? "transferts au total" : "forwards in all",
    won: fr ? "gagn\u00e9" : "won",
    noneT: fr ? "Aucun lecteur ne correspond encore \u00e0 ce persona" : "No reader matches this persona yet",
    noneD: fr
      ? "Aucun de vos lecteurs n\u2019a de fonction enregistr\u00e9e correspondant \u00e0 ce persona. Cela peut vouloir dire que vous ne l\u2019atteignez pas, ou simplement que personne n\u2019a renseign\u00e9 de fonction au moment d\u2019ajouter le lecteur."
      : "None of your readers has a recorded role matching this persona. That can mean you are not reaching them, or simply that nobody recorded a role when the reader was added.",
    noneD2: fr
      ? "L\u2019absence de correspondance est une r\u00e9ponse, pas une erreur. C\u2019est exactement ce sur quoi l\u2019analyse d\u2019\u00e9cart se construit."
      : "No match is an answer rather than an error. It is exactly what the gap analysis is built from.",
    noRate: fr
      ? "Trop peu d\u2019issues pour calculer un taux. Deux victoires de plus le d\u00e9placeraient de vingt points, et vous planifieriez sur du bruit."
      : "Too few outcomes to call a rate. Two more wins would move it twenty points and you would plan against noise.",
    matchNote: fr
      ? "La correspondance se fait sur les fonctions que vous avez enregistr\u00e9es en ajoutant le lecteur, jamais devin\u00e9e par un mod\u00e8le."
      : "Matched on the roles you recorded when the reader was added, never guessed at by a model.",
  };

  const stated: { k: string; v: string }[] = [
    { k: c.lVariants, v: persona.titleVariants.join(", ") },
    { k: c.lReports, v: persona.reportsTo },
    { k: c.lMeasured, v: persona.measuredOn },
    { k: c.lWants, v: persona.wants },
    { k: c.lFears, v: persona.afraidOf },
    { k: c.lBudget, v: persona.budgetAuthority },
    { k: c.lObjection, v: persona.objectionTheyRaise },
    { k: c.lResponds, v: persona.respondsTo },
    { k: c.lLoses, v: persona.losesThem },
    { k: c.lLead, v: persona.leadWith },
    // The one row that prints when empty: silence here would read as "we did
    // not bother" rather than "you named none and we will not invent one".
    { k: c.lGathers, v: persona.gathersAt.length ? persona.gathersAt.join(", ") : c.noGather },
  ].filter((x) => x.v && x.v.trim());

  const btn: React.CSSProperties = {
    height: 32, padding: "0 11px", border: "1px solid " + T.border, borderRadius: T.rBtn,
    background: T.card, fontSize: 13, color: T.body, cursor: "pointer", fontFamily: T.font,
  };
  const dt: React.CSSProperties = { color: T.muted };
  const dd: React.CSSProperties = { color: T.body, lineHeight: 1.6, margin: 0 };
  const kv: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "180px minmax(0,1fr)", gap: "10px 16px", fontSize: 13, margin: 0,
  };

  const matched = summary.readers;

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, marginBottom: 9 }}>
          <a href="/buyer-profiles" style={{ color: "inherit", textDecoration: "none" }}>{c.back}</a>
          {" \u00b7 "}
          <a href={"/buyer-profiles/" + profile.id} style={{ color: "inherit", textDecoration: "none" }}>{profile.name}</a>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          {persona.name}
        </h1>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "7px 0 0", lineHeight: 1.55 }}>
          {(ROLE[persona.roleInDeal] ?? persona.roleInDeal) || "\u2014"}
          {" \u00b7 "}
          {matched} {c.matched}
          {totalReaders > 0 ? " " + c.of + " " + totalReaders : ""}
        </p>

        {(siblings.length > 1 || attachedDoc) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "22px 0 18px", flexWrap: "wrap" }}>
            {siblings.length > 1 && (
              <select
                value={personaSlug(persona.name)}
                onChange={(e) => router.push("/buyer-profiles/" + profile.id + "/persona/" + e.target.value)}
                style={{ ...btn, cursor: "pointer", paddingRight: 24, minWidth: 220 }}
              >
                {siblings.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            )}
            {attachedDoc && (
              <a href={"/documents/" + attachedDoc.id} style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                {c.variantTarget}
              </a>
            )}
          </div>
        )}

        <div style={{ marginTop: siblings.length > 1 || attachedDoc ? 0 : 24 }}>
          <Tier tone={T.faint} name={c.stated} basis={c.bStated}>
            <dl style={kv}>
              {stated.map((x) => (
                <div key={x.k} style={{ display: "contents" }}>
                  <dt style={dt}>{x.k}</dt>
                  <dd style={dd}>{x.v}</dd>
                </div>
              ))}
            </dl>
            <div style={{ height: 1, background: T.border, margin: "16px 0" }} />
            <Note tone="amber">{c.notGenerated}</Note>
          </Tier>

          <Tier
            tone={matched > 0 ? T.green : T.faint}
            name={c.observed}
            basis={c.bObserved}
            right={matched > 0 ? matched + " " + c.matched : undefined}
          >
            {matched === 0 ? (
              <>
                <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.noneT}</div>
                <p style={{ fontSize: 13, color: T.muted, margin: "8px 0 0", lineHeight: 1.65, maxWidth: 560 }}>{c.noneD}</p>
                <p style={{ fontSize: 13, color: T.muted, margin: "10px 0 0", lineHeight: 1.65, maxWidth: 560 }}>{c.noneD2}</p>
              </>
            ) : (
              <>
                <dl style={kv}>
                  <dt style={dt}>{c.oOpened}</dt>
                  <dd style={dd}>{summary.opened} {c.of} {matched}</dd>
                  <dt style={dt}>{c.oEngaged}</dt>
                  <dd style={dd}>{summary.engaged}</dd>
                  <dt style={dt}>{c.oAsked}</dt>
                  <dd style={dd}>
                    {summary.questioners}
                    {summary.questions > summary.questioners ? ", " + summary.questions + " " + c.questionsWord : ""}
                  </dd>
                  <dt style={dt}>{c.oForwarded}</dt>
                  <dd style={dd}>
                    {summary.forwarders}
                    {summary.forwards > summary.forwarders ? ", " + summary.forwards + " " + c.forwardsWord : ""}
                  </dd>
                  <dt style={dt}>{c.oOutcome}</dt>
                  <dd style={dd}>
                    {summary.outcomesMarked}
                    {summary.won > 0 ? ", " + summary.won + " " + c.won : ""}
                  </dd>
                </dl>
                {summary.outcomesMarked > 0 && summary.outcomesMarked < profile.threshold && (
                  <div style={{ marginTop: 14 }}>
                    <Note tone="amber">{c.noRate}</Note>
                  </div>
                )}
              </>
            )}
            <div style={{ height: 1, background: T.border, margin: "16px 0" }} />
            <p style={{ fontSize: 12, color: T.faint, margin: 0, lineHeight: 1.6 }}>{c.matchNote}</p>
          </Tier>
        </div>
      </main>
    </div>
  );
}
