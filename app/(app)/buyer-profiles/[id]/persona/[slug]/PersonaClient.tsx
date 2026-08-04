"use client";

import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { ObservedSummary } from "@/lib/observed";
import { Tier, Note } from "../../Tabs";

/** Names are what a persona has; there is no id in the schema. A slug keeps the
 *  URL readable and survives a reorder, which an index would not. */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "persona";
}

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
};

export default function PersonaClient({
  profile,
  persona,
  siblings,
  summary,
  totalReaders,
}: {
  profile: { id: string; name: string; threshold: number };
  persona: PersonaView;
  siblings: { name: string; slug: string }[];
  summary: ObservedSummary;
  totalReaders: number;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const ROLE: Record<string, string> = {
    champion: fr ? "Champion" : "Champion",
    "economic buyer": fr ? "Acheteur \u00e9conomique" : "Economic buyer",
    blocker: fr ? "Bloqueur" : "Blocker",
    user: fr ? "Utilisateur" : "User",
    "technical evaluator": fr ? "\u00c9valuateur technique" : "Technical evaluator",
  };

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    matched: fr ? "lecteurs correspondants" : "readers matched",
    ofTotal: fr ? "sur" : "of",
    bStated: fr
      ? "D\u00e9duit de vos r\u00e9ponses. Les champs que nous ne pouvions pas fonder sont absents plut\u00f4t que devin\u00e9s."
      : "Derived from your answers. Fields we could not ground are absent rather than guessed.",
    bObserved: fr
      ? "Des lecteurs qui ont r\u00e9ellement ouvert vos documents"
      : "From readers who actually opened your documents",
    stated: fr ? "\u00c9nonc\u00e9" : "Stated",
    observed: fr ? "Observ\u00e9" : "Observed",
    lTitles: fr ? "Variantes d\u2019intitul\u00e9" : "Title variants",
    lReports: fr ? "Rattach\u00e9 \u00e0" : "Reports to",
    lMeasured: fr ? "\u00c9valu\u00e9 sur" : "Measured on",
    lWants: fr ? "Ce qu\u2019ils veulent" : "What they want",
    lFears: fr ? "Ce qu\u2019ils craignent" : "What they fear",
    lBudget: fr ? "Pouvoir de d\u00e9cision budg\u00e9taire" : "Budget authority",
    lObjection: fr ? "L\u2019objection qu\u2019ils soul\u00e8vent" : "Objection they raise",
    lResponds: fr ? "Ce \u00e0 quoi ils r\u00e9agissent" : "What they respond to",
    lLoses: fr ? "Ce qui les perd" : "What loses them",
    lGathers: fr ? "O\u00f9 ils se retrouvent" : "Where they gather",
    gathersNote: fr ? "D\u2019apr\u00e8s vos r\u00e9ponses, non d\u00e9duit." : "From your answers, not inferred.",
    refusal: fr
      ? "Nous ne g\u00e9n\u00e9rons pas ce que cette personne \u00e9coute, cherche sur Google ou fait sur LinkedIn. Ces champs figurent dans tous les outils de persona et aucun n\u2019est connu. Si cela compte, demandez-le \u00e0 l\u2019une d\u2019elles et mettez-le dans vos r\u00e9ponses, o\u00f9 ce sera marqu\u00e9 comme venant de vous."
      : "We do not generate what this person listens to, Googles, or does on LinkedIn. Those fields appear in every persona tool and none of them are known. If it matters, ask one of them and put it in your answers, where it will be labelled as yours.",
    oOpened: fr ? "Ont ouvert" : "Opened",
    oEngaged: fr ? "Engag\u00e9s" : "Engaged",
    oAsked: fr ? "Ont pos\u00e9 une question" : "Asked a question",
    oForwarded: fr ? "Ont transf\u00e9r\u00e9" : "Forwarded",
    oReplied: fr ? "Ont r\u00e9pondu" : "Replied",
    oOutcome: fr ? "R\u00e9sultats enregistr\u00e9s" : "Outcomes marked",
    questionsWord: fr ? "questions" : "questions",
    forwardsWord: fr ? "transferts" : "forwards",
    noneT: fr ? "Aucun lecteur ne correspond encore \u00e0 ce persona" : "No reader matches this persona yet",
    noneD: fr
      ? "Personne parmi vos lecteurs n\u2019a de fonction enregistr\u00e9e correspondant \u00e0 ce persona. Cela peut vouloir dire que vous ne l\u2019atteignez pas, ou simplement que la fonction n\u2019a pas \u00e9t\u00e9 renseign\u00e9e au moment de l\u2019ajout."
      : "None of your readers has a recorded role matching this persona. That can mean you are not reaching them, or simply that nobody recorded a role when the reader was added.",
    noneD2: fr
      ? "L\u2019absence de correspondance est une r\u00e9ponse, pas une erreur. C\u2019est exactement ce sur quoi l\u2019analyse d\u2019\u00e9cart se construit."
      : "No match is an answer rather than an error. It is exactly what the gap analysis is built from.",
    noRate: fr
      ? "R\u00e9sultats enregistr\u00e9s : trop peu pour calculer un taux. Deux victoires de plus le d\u00e9placeraient de vingt points, et vous planifieriez sur du bruit."
      : "Too few outcomes to call a rate. Two more wins would move it twenty points and you would plan against noise.",
    matchNote: fr
      ? "La correspondance se fait sur les fonctions enregistr\u00e9es par vous \u00e0 l\u2019ajout du lecteur, jamais devin\u00e9e \u00e0 partir d\u2019un mod\u00e8le."
      : "Matched on the roles you recorded when the reader was added, never guessed at by a model.",
  };

  const rows: [string, string, string?][] = [
    [c.lTitles, persona.titleVariants.join(", ")],
    [c.lReports, persona.reportsTo],
    [c.lMeasured, persona.measuredOn],
    [c.lWants, persona.wants],
    [c.lFears, persona.afraidOf],
    [c.lBudget, persona.budgetAuthority],
    [c.lObjection, persona.objectionTheyRaise],
    [c.lResponds, persona.respondsTo],
    [c.lLoses, persona.losesThem],
    [c.lGathers, persona.gathersAt.join(", "), c.gathersNote],
  ];
  const present = rows.filter(([, v]) => v && v.trim());

  const link: React.CSSProperties = { color: T.muted, textDecoration: "none", fontSize: 12.5 };
  const sel: React.CSSProperties = {
    height: 34,
    boxSizing: "border-box",
    border: "1px solid " + T.border,
    borderRadius: T.rBtn,
    padding: "0 10px",
    fontSize: 13.5,
    fontFamily: T.font,
    background: T.card,
    color: T.body,
    cursor: "pointer",
  };
  const dt: React.CSSProperties = { fontSize: 13, color: T.muted };
  const dd: React.CSSProperties = { fontSize: 13, color: T.body, lineHeight: 1.6, margin: 0 };

  const matched = summary.readers;

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ marginBottom: 9 }}>
          <a href="/buyer-profiles" style={link}>{c.back}</a>
          <span style={{ ...link, margin: "0 6px" }}>{"\u00b7"}</span>
          <a href={"/buyer-profiles/" + profile.id} style={link}>{profile.name}</a>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          {persona.name}
        </h1>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "7px 0 0", lineHeight: 1.55 }}>
          {(ROLE[persona.roleInDeal] ?? persona.roleInDeal) || "\u2014"}
          {" \u00b7 "}
          {matched} {c.matched}
          {totalReaders > 0 ? " " + c.ofTotal + " " + totalReaders : ""}
        </p>

        {siblings.length > 1 && (
          <div style={{ margin: "22px 0 18px" }}>
            <select
              value={slugify(persona.name)}
              onChange={(e) => router.push("/buyer-profiles/" + profile.id + "/persona/" + e.target.value)}
              style={{ ...sel, minWidth: 240 }}
            >
              {siblings.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: siblings.length > 1 ? 0 : 24 }}>
          <Tier tone={T.faint} name={c.stated} basis={c.bStated}>
            <dl style={{ display: "grid", gridTemplateColumns: "200px minmax(0,1fr)", gap: "10px 16px", margin: 0 }}>
              {present.map(([label, value, note]) => (
                <div key={label} style={{ display: "contents" }}>
                  <dt style={dt}>{label}</dt>
                  <dd style={dd}>
                    {value}
                    {note && <span style={{ color: T.faint }}>{" " + note}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <div style={{ height: 1, background: T.border, margin: "16px 0" }} />
            <Note tone="amber">{c.refusal}</Note>
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
                <p style={{ fontSize: 13, color: T.muted, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>{c.noneD}</p>
                <p style={{ fontSize: 13, color: T.muted, marginTop: 10, lineHeight: 1.65, maxWidth: 560 }}>{c.noneD2}</p>
              </>
            ) : (
              <>
                <dl style={{ display: "grid", gridTemplateColumns: "200px minmax(0,1fr)", gap: "10px 16px", margin: 0 }}>
                  <dt style={dt}>{c.oOpened}</dt>
                  <dd style={dd}>{summary.opened} {c.ofTotal} {matched}</dd>
                  <dt style={dt}>{c.oEngaged}</dt>
                  <dd style={dd}>{summary.engaged}</dd>
                  <dt style={dt}>{c.oAsked}</dt>
                  <dd style={dd}>
                    {summary.questioners}
                    {summary.questions > 0 ? ", " + summary.questions + " " + c.questionsWord : ""}
                  </dd>
                  <dt style={dt}>{c.oForwarded}</dt>
                  <dd style={dd}>
                    {summary.forwarders}
                    {summary.forwards > 0 ? ", " + summary.forwards + " " + c.forwardsWord : ""}
                  </dd>
                  <dt style={dt}>{c.oReplied}</dt>
                  <dd style={dd}>{summary.replies}</dd>
                  <dt style={dt}>{c.oOutcome}</dt>
                  <dd style={dd}>
                    {summary.outcomesMarked}
                    {summary.won > 0 ? ", " + summary.won + (fr ? " gagn\u00e9" : " won") : ""}
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
