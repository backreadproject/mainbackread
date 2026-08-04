"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import type { Locale } from "@/lib/i18n";
import type { Profile } from "@/lib/buyer-profile";
import type { ObservedSummary } from "@/lib/observed";
import { PLATFORMS, criteriaFor, nothingToSearchOn, type PlatformId, type ProspectFilters } from "@/lib/search-criteria";
import { personaSlug } from "@/lib/persona-match";

/**
 * The three basis tiers, as approved.
 *
 * Stated is what the customer told us. Where to find them is reasoned from it
 * and from public fact. Observed comes from readers, starts empty, and says so:
 * a tab that pretends to know is worse than one that admits it does not.
 */

const EMPTY_FILTERS: ProspectFilters = {
  titles: [], excludeTitles: [], headcount: "", industries: [], excludeIndustries: [],
  geographies: [], technologies: [], keywords: [], hiringSignals: [], fundingStages: [], searchStrings: [],
};

export function Tier({
  tone, name, basis, right, children,
}: { tone: string; name: string; basis: string; right?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid " + T.border, background: T.soft, flexWrap: "wrap" }}>
        <i style={{ width: 6, height: 6, borderRadius: 2, background: tone, flex: "none" }} />
        <span style={{ fontSize: 13.5, fontWeight: 500, color: T.heading }}>{name}</span>
        <span style={{ fontSize: 12, color: T.muted }}>{basis}</span>
        {right && <span style={{ marginLeft: "auto", fontSize: 12, color: T.faint }}>{right}</span>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export function Note({ tone, children }: { tone: "amber" | "indigo" | "green"; children: React.ReactNode }) {
  const map = {
    amber: { b: T.amber, bg: "#FFFBF5", c: "#7A3D0A" },
    indigo: { b: T.indigo, bg: "#F5F5FF", c: "#2C2E9E" },
    green: { b: T.green, bg: "#F2F8F5", c: "#155238" },
  }[tone];
  return (
    <div style={{ borderLeft: "3px solid " + map.b, background: map.bg, padding: "11px 14px", fontSize: 12.5, lineHeight: 1.6, color: map.c }}>
      {children}
    </div>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 500, color: T.heading, marginBottom: 9 }}>{children}</div>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.6 }}>{children}</p>;
}
function Rule() {
  return <div style={{ height: 1, background: T.border, margin: "16px 0" }} />;
}
function Kv({ items }: { items: { k: string; v: string }[] }) {
  const rows = items.filter((x) => x.v && x.v.trim());
  if (!rows.length) return null;
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr)", gap: "10px 16px", fontSize: 13, margin: 0 }}>
      {rows.map((x, i) => (
        <div key={i} style={{ display: "contents" }}>
          <dt style={{ color: T.muted }}>{x.k}</dt>
          <dd style={{ color: T.body, lineHeight: 1.6, margin: 0 }}>{x.v}</dd>
        </div>
      ))}
    </dl>
  );
}

const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" };
const th: React.CSSProperties = { background: T.soft, fontSize: 11.5, fontWeight: 500, color: T.muted, textAlign: "left", padding: "9px 14px", borderBottom: "1px solid " + T.border };
const td: React.CSSProperties = { padding: "13px 14px", borderBottom: "1px solid " + T.border, fontSize: 13.5, verticalAlign: "top", color: T.body, lineHeight: 1.55 };
const btn: React.CSSProperties = { height: 27, padding: "0 9px", border: "1px solid " + T.border, borderRadius: T.rBtn, background: T.card, fontSize: 12, color: T.body, cursor: "pointer", fontFamily: T.font };

/* ---------------------------------------------------------------- */

export function StatedTab({
  p, locale, attachedDoc, profileId,
}: { p: Profile; locale: Locale; attachedDoc: { id: string; title: string } | null; profileId: string }) {
  const fr = locale === "fr";
  const m = p.market;
  const pe = p.people;

  const c = {
    nothing: fr ? "Cette section n\u2019a pas encore \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9e." : "This section has not been generated yet.",
    market: fr ? "D\u00e9finition du march\u00e9" : "Market definition",
    reallyTrue: fr ? "Ce qui doit vraiment \u00eatre vrai" : "What actually has to be true",
    triggers: fr ? "\u00c9v\u00e9nements d\u00e9clencheurs" : "Trigger events",
    populations: fr ? "Populations" : "Populations",
    populationsSub: fr
      ? "Deux populations moyenn\u00e9es en une seule produisent un profil qui ne d\u00e9crit personne."
      : "Two populations averaged into one produce a profile that describes nobody.",
    personas: fr ? "Personas" : "Personas",
    personasSub: fr
      ? "Ils n\u2019ach\u00e8tent pas de la m\u00eame fa\u00e7on, et un profil moyenn\u00e9 entre eux ne correspond \u00e0 personne."
      : "They do not buy the same way, and a profile averaged across them fits nobody.",
    disq: fr ? "Disqualificateurs" : "Disqualifiers",
    angles: fr ? "Angles de message" : "Messaging angles",
    never: fr ? "Ne jamais ouvrir avec" : "Never lead with",
    objection: fr ? "Objection attendue" : "Objection you will get",
    limits: fr ? "Ce que ceci ne peut pas vous dire" : "What this cannot tell you",
    colPersona: fr ? "Persona" : "Persona",
    colRole: fr ? "R\u00f4le dans l\u2019affaire" : "Role in the deal",
    colFear: fr ? "Ce qu\u2019ils craignent" : "What they are afraid of",
    colMove: fr ? "\u00c9volution" : "Movement",
    open: fr ? "Ouvrir" : "Open",
    moveNote: fr
      ? "La colonne \u00c9volution se remplit une fois que des lecteurs ont \u00e9t\u00e9 mesur\u00e9s contre ce profil."
      : "The movement column fills once readers have been measured against this profile.",
    untested: fr
      ? "Rien sur cette page n\u2019a \u00e9t\u00e9 test\u00e9. C\u2019est une reformulation soign\u00e9e de ce que vous croyez. L\u2019onglet Observ\u00e9 est l\u00e0 o\u00f9 cela sera v\u00e9rifi\u00e9."
      : "Nothing on this page has been tested. It is a careful restatement of what you believe. The Observed tab is where it gets checked.",
  };

  const ROLE: Record<string, string> = {
    champion: fr ? "Porte le projet" : "Champion",
    "economic buyer": fr ? "Acheteur \u00e9conomique" : "Economic buyer",
    blocker: fr ? "Bloque" : "Blocker",
    user: fr ? "Utilisateur" : "User",
    "technical evaluator": fr ? "\u00c9valuateur technique" : "Technical evaluator",
  };

  if (!m) return <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>{c.nothing}</p>;


  return (
    <>
      {m.headline && <p style={{ fontSize: 15, lineHeight: 1.7, color: T.heading, margin: "0 0 18px" }}>{m.headline}</p>}

      <Head>{c.market}</Head>
      <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{m.definition}</p>

      {m.reallyTrue && (
        <>
          <Rule />
          <Head>{c.reallyTrue}</Head>
          <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.65, margin: 0 }}>{m.reallyTrue}</p>
        </>
      )}

      {m.triggers.length > 0 && (
        <>
          <Rule />
          <Head>{c.triggers}</Head>
          <Kv items={m.triggers.map((t) => ({ k: t.event, v: t.why }))} />
        </>
      )}

      {pe && pe.populations.length > 1 && (
        <>
          <Rule />
          <Head>{c.populations}</Head>
          <Sub>{c.populationsSub}</Sub>
          <Kv items={pe.populations.map((s) => ({ k: s.name, v: s.howTheyDiffer }))} />
        </>
      )}

      {pe && pe.personas.length > 0 && (
        <>
          <Rule />
          <Head>{c.personas}</Head>
          <Sub>{c.personasSub}</Sub>
          <table style={tbl}>
            <thead><tr>
              <th style={th}>{c.colPersona}</th><th style={th}>{c.colRole}</th>
              <th style={th}>{c.colFear}</th><th style={{ ...th, width: 110 }}>{c.colMove}</th><th style={{ ...th, width: 70 }} />
            </tr></thead>
            <tbody>
              {pe.personas.map((x) => (
                <tr key={x.name}>
                  <td style={{ ...td, fontWeight: 500 }}>
                    <a href={"/buyer-profiles/" + profileId + "/persona/" + personaSlug(x.name)}
                       className="dc-title" style={{ textDecoration: "none" }}>{x.name}</a>
                  </td>
                  <td style={td}>{ROLE[x.roleInDeal] ?? x.roleInDeal}</td>
                  <td style={td}>{x.afraidOf}</td>
                  <td style={{ ...td, color: T.faint }}>{"\u2014"}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <a href={"/buyer-profiles/" + profileId + "/persona/" + personaSlug(x.name)}
                       style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>{c.open}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: T.faint, marginTop: 11, lineHeight: 1.6 }}>{c.moveNote}</p>
        </>
      )}

      {m.disqualifiers.length > 0 && (
        <>
          <Rule />
          <Head>{c.disq}</Head>
          <Kv items={m.disqualifiers.map((d) => ({ k: d.who, v: d.why }))} />
        </>
      )}

      {pe && (pe.angles.length > 0 || pe.neverLeadWith || pe.expectedObjection) && (
        <>
          <Rule />
          <Head>{c.angles}</Head>
          <Kv items={[
            ...pe.angles.map((a) => ({ k: (fr ? "Pour " : "To ") + a.forPersona, v: a.leadWith })),
            { k: c.never, v: pe.neverLeadWith },
            { k: c.objection, v: pe.expectedObjection },
          ]} />
        </>
      )}

      {m.limits.length > 0 && (
        <>
          <Rule />
          <Head>{c.limits}</Head>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: T.body, lineHeight: 1.7 }}>
            {m.limits.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </>
      )}

      <Rule />
      <Note tone="amber">{c.untested}</Note>
    </>
  );
}

/* ---------------------------------------------------------------- */

export function FindTab({ p, locale }: { p: Profile; locale: Locale }) {
  const fr = locale === "fr";
  const [platform, setPlatform] = useState<PlatformId>("apollo");
  const [copied, setCopied] = useState(false);

  const filters: ProspectFilters = p.find
    ? ({ ...EMPTY_FILTERS, ...p.find.filters } as ProspectFilters)
    : EMPTY_FILTERS;

  const c = {
    noKey: fr
      ? "Nous ne nous connectons \u00e0 aucun de ces comptes. Rien n\u2019est lanc\u00e9 en votre nom, aucun cr\u00e9dit n\u2019est d\u00e9pens\u00e9, et nous ne d\u00e9tenons jamais votre cl\u00e9. Vous obtenez les crit\u00e8res, dans la langue de chaque plateforme, et vous les lancez."
      : "We never connect to your account on any of these. Nothing is run on your behalf, no credits are spent, and we never hold a key of yours. You get the criteria, in that platform's own language, and you run it.",
    empty: fr ? "Aucun crit\u00e8re n\u2019a encore \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9." : "No search criteria have been generated yet.",
    copy: fr ? "Copier pour cette plateforme" : "Copy for this platform",
    copied: fr ? "Copi\u00e9" : "Copied",
    field: fr ? "Champ" : "Field",
    value: fr ? "Valeur" : "Value",
    why: fr ? "Pourquoi" : "Why",
    step: fr ? "\u00c9tape" : "Step",
    doThis: fr ? "\u00c0 faire" : "Do this",
    withWhat: fr ? "Avec" : "With",
    cal: fr ? "Calendriers de travail" : "Working calendars",
    calSub: fr ? "Calendrier et droit, pas des conseils sur les heures d\u2019envoi." : "Calendar and law, not advice about send times.",
    colMarket: fr ? "March\u00e9" : "Market",
    colWeek: fr ? "Semaine de travail" : "Working week",
    colQuiet: fr ? "P\u00e9riodes creuses" : "Quiet periods",
    colBudget: fr ? "Cycle budg\u00e9taire" : "Budget cycle",
    sig: fr ? "Signaux observables" : "Observable signals",
    sigSub: fr ? "Un d\u00e9clencheur que vous ne pouvez pas d\u00e9tecter est un souhait." : "A trigger you cannot detect is a wish.",
    colSig: fr ? "Signal" : "Signal",
    colWhere: fr ? "O\u00f9 c\u2019est visible" : "Where visible",
    colMeans: fr ? "Ce que \u00e7a veut dire" : "What it means",
    noHour: fr
      ? "Nous ne vous disons pas la meilleure heure ni le meilleur jour pour envoyer. Personne ne peut le savoir \u00e0 partir d\u2019un formulaire, et les chiffres que d\u2019autres outils affichent pour cela sont du folklore. Le moment o\u00f9 vos propres lecteurs ouvrent est un fait, et il est dans l\u2019onglet Observ\u00e9."
      : "We do not tell you the best hour or weekday to send. Nobody can know that from a form, and the numbers other tools print for it are folklore. When your own readers actually open is a fact, and it is on the Observed tab.",
  };

  if (!p.find || nothingToSearchOn(filters)) {
    return (
      <>
        <Note tone="green">{c.noKey}</Note>
        <div style={{ marginTop: 16, fontSize: 13.5, color: T.muted }}>{c.empty}</div>
      </>
    );
  }

  const crit = criteriaFor(platform, filters, locale);
  const isClay = platform === "clay";

  async function copy() {
    const lines = [crit.label, ""];
    for (const r of crit.rows) lines.push(r.field + ": " + r.value);
    for (const b of crit.blocks) lines.push("", b.label, b.code);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard refused, nothing useful to say */ }
  }

  return (
    <>
      <Note tone="green">{c.noKey}</Note>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "16px 0 14px" }}>
        {PLATFORMS.map((x) => (
          <button key={x.id} onClick={() => setPlatform(x.id)} style={{
            border: "1px solid " + (platform === x.id ? T.green : T.border), borderRadius: 4,
            background: platform === x.id ? "#F2F8F5" : T.card,
            color: platform === x.id ? T.green : T.body,
            fontWeight: platform === x.id ? 500 : 400,
            padding: "6px 11px", fontSize: 12.5, cursor: "pointer", fontFamily: T.font,
          }}>{x.label}</button>
        ))}
        <button onClick={() => void copy()} style={{ ...btn, marginLeft: "auto", height: 30 }}>
          {copied ? c.copied : c.copy}
        </button>
      </div>

      <Head>{crit.label}</Head>
      <Sub>{crit.note}</Sub>

      {crit.rows.length > 0 && (
        <table style={tbl}>
          <thead><tr>
            <th style={{ ...th, width: isClay ? 60 : 230 }}>{isClay ? c.step : c.field}</th>
            <th style={th}>{isClay ? c.doThis : c.value}</th>
            <th style={{ ...th, width: 250 }}>{isClay ? c.withWhat : c.why}</th>
          </tr></thead>
          <tbody>
            {crit.rows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...td, fontFamily: isClay ? T.font : "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: isClay ? 13.5 : 12 }}>{r.field}</td>
                <td style={{ ...td, fontFamily: isClay ? T.font : "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: isClay ? 13.5 : 12, whiteSpace: "pre-wrap" }}>{r.value}</td>
                <td style={{ ...td, color: T.faint, fontSize: 12.5, whiteSpace: "pre-wrap" }}>{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {crit.blocks.map((b, i) => (
        <div key={i} style={{ marginTop: 16 }}>
          <Head>{b.label}</Head>
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, background: T.soft, padding: "13px 14px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.75, color: T.body, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {b.code}
          </div>
        </div>
      ))}

      {crit.footer && <p style={{ fontSize: 12, color: T.faint, marginTop: 11, lineHeight: 1.6 }}>{crit.footer}</p>}

      {p.find.signals.length > 0 && (
        <>
          <Rule />
          <Head>{c.sig}</Head>
          <Sub>{c.sigSub}</Sub>
          <table style={tbl}>
            <thead><tr><th style={th}>{c.colSig}</th><th style={th}>{c.colWhere}</th><th style={th}>{c.colMeans}</th></tr></thead>
            <tbody>
              {p.find.signals.map((s, i) => (
                <tr key={i}>
                  <td style={{ ...td, color: T.heading }}>{s.signal}</td>
                  <td style={td}>{s.whereVisible}</td>
                  <td style={td}>{s.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {p.find.calendars.length > 0 && (
        <>
          <Rule />
          <Head>{c.cal}</Head>
          <Sub>{c.calSub}</Sub>
          <table style={tbl}>
            <thead><tr>
              <th style={th}>{c.colMarket}</th><th style={th}>{c.colWeek}</th>
              <th style={th}>{c.colQuiet}</th><th style={th}>{c.colBudget}</th>
            </tr></thead>
            <tbody>
              {p.find.calendars.map((x, i) => (
                <tr key={i}>
                  <td style={{ ...td, color: T.heading }}>{x.market}</td>
                  <td style={td}>{x.workingWeek}</td>
                  <td style={td}>{x.quietPeriods}</td>
                  <td style={{ ...td, color: T.faint }}>{x.budgetCycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <Rule />
      <Note tone="amber">{c.noHour}</Note>
    </>
  );
}

/* ---------------------------------------------------------------- */

export function ObservedTab({ locale, threshold, summary }: { locale: Locale; threshold: number; summary: ObservedSummary }) {
  const fr = locale === "fr";
  const engaged = summary.engaged;
  const short = Math.max(0, threshold - engaged);
  const c = {
    t: engaged === 0
      ? (fr ? "Pas encore assez de lecteurs pour dire quoi que ce soit" : "Not enough readers to say anything yet")
      : (fr ? engaged + " lecteurs engag\u00e9s, " + short + " de plus avant de pouvoir conclure"
            : engaged + " engaged so far, " + short + " more before this can call anything"),
    d: engaged === 0
      ? (fr
        ? "Personne n\u2019a encore \u00e9t\u00e9 mesur\u00e9 contre ce profil. En dessous d\u2019environ " + threshold + " lecteurs engag\u00e9s, tout motif ici serait du bruit, et en afficher un serait pire que de ne rien afficher."
        : "Nobody has been measured against this profile yet. Under about " + threshold + " engaged readers, any pattern here would be noise, and printing one would be worse than printing nothing.")
      : (fr
        ? "Les chiffres ci-dessus sont r\u00e9els et compt\u00e9s. Ce qui manque, ce sont les motifs : en dessous de " + threshold + " lecteurs engag\u00e9s, deux personnes de plus d\u00e9placeraient n\u2019importe quelle conclusion, et nous ne l\u2019afficherons pas."
        : "The counts above are real. What is missing is the pattern: under " + threshold + " engaged readers, two more people would move any conclusion, so we will not print one."),
    d2: fr ? "Cela se remplit tout seul. Rien \u00e0 configurer." : "This fills in on its own. Nothing to configure.",
    will: fr ? "Ce qui appara\u00eetra ici" : "What will appear here",
    items: [
      [fr ? "Quand ils ouvrent" : "When they open", fr ? "Les jours et heures o\u00f9 vos lecteurs ont r\u00e9ellement ouvert, pas une moyenne du secteur." : "The days and hours your readers actually opened, not a benchmark from someone else's data."],
      [fr ? "Ce qu\u2019ont fait les lecteurs engag\u00e9s" : "What engaged readers did", fr ? "Ce que les lecteurs pass\u00e9s la page trois avaient en commun, que les autres n\u2019avaient pas." : "What the ones who read past page three had in common that the rest did not."],
      [fr ? "Taux de conclusion par persona" : "Close rate by persona", fr ? "Une fois assez d\u2019issues marqu\u00e9es gagn\u00e9es ou perdues." : "Once enough outcomes are marked won or lost."],
      [fr ? "Analyse des \u00e9carts" : "Gap analysis", fr ? "Si les personnes qui s\u2019engagent sont celles que vous disiez viser." : "Whether the people engaging are the people you said you were targeting."],
    ] as [string, string][],
  };

  return (
    <>
      {summary.readers > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", marginBottom: 4 }}>
          {([
            [summary.opened + " / " + summary.readers, fr ? "Ont ouvert" : "Opened", T.green],
            [String(summary.engaged), fr ? "Engag\u00e9s" : "Engaged", T.green],
            [String(summary.questioners), fr ? "Ont pos\u00e9 une question" : "Asked a question", T.indigo],
            [String(summary.outcomesMarked), fr ? "R\u00e9sultats enregistr\u00e9s" : "Outcomes marked", T.amber],
          ] as [string, string, string][]).map(([v, l, tone], n) => (
            <div key={n} style={{ padding: "15px 18px", borderLeft: "3px solid " + tone }}>
              <div style={{ fontSize: 21, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "22px 0", textAlign: "center" }}>
        <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.t}</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 10, lineHeight: 1.65, maxWidth: 470, marginLeft: "auto", marginRight: "auto" }}>
          {c.d}<br /><br />{c.d2}
        </div>
      </div>
      <Rule />
      <Head>{c.will}</Head>
      <Kv items={c.items.map(([k, v]) => ({ k, v }))} />
    </>
  );
}
