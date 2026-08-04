"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import type { Locale } from "@/lib/i18n";
import type { IcpProfile } from "@/lib/icp-profile";
import { PLATFORMS, criteriaFor, nothingToSearchOn, type PlatformId, type ProspectFilters } from "@/lib/search-criteria";

/**
 * The three basis tiers. Every claim the passes produce already carries
 * source: stated | inferred | market, so this is the presentation of something
 * the data already knows rather than a new classification.
 *
 * Stated is what the customer told us. Where to find them is reasoned from it
 * and from public fact. Observed comes from readers, and starts empty and says
 * so, because a tab that pretends to know is worse than one that admits it.
 */

const EMPTY_FILTERS: ProspectFilters = {
  titles: [], excludeTitles: [], headcount: "", industries: [], excludeIndustries: [],
  geographies: [], technologies: [], keywords: [], hiringSignals: [], fundingStages: [], searchStrings: [],
};

export function Tier({
  tone, name, basis, right, children,
}: {
  tone: string; name: string; basis: string; right?: string; children: React.ReactNode;
}) {
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

function Rule() {
  return <div style={{ height: 1, background: T.border, margin: "16px 0" }} />;
}

function Kv({ items }: { items: { k: string; v: string }[] }) {
  if (!items.length) return null;
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr)", gap: "10px 16px", fontSize: 13, margin: 0 }}>
      {items.map((x, i) => (
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

export function StatedTab({ p, locale }: { p: IcpProfile; locale: Locale }) {
  const fr = locale === "fr";
  const rec = p.record;
  const people = p.people;
  const demand = p.demand;

  const c = {
    market: fr ? "D\u00e9finition du march\u00e9" : "Market definition",
    triggers: fr ? "\u00c9v\u00e9nements d\u00e9clencheurs" : "Trigger events",
    committee: fr ? "Comit\u00e9 d\u2019achat" : "Buying committee",
    committeeSub: fr
      ? "Ils n\u2019ach\u00e8tent pas de la m\u00eame fa\u00e7on, et un profil moyenn\u00e9 entre eux ne correspond \u00e0 personne."
      : "They do not buy the same way, and a profile averaged across them fits nobody.",
    segments: fr ? "Populations" : "Populations",
    segmentsSub: fr
      ? "Deux populations moyenn\u00e9es en une seule produisent un profil qui ne d\u00e9crit personne."
      : "Two populations averaged into one produce a profile that describes nobody.",
    disq: fr ? "Disqualificateurs" : "Disqualifiers",
    angles: fr ? "Angles de message" : "Messaging angles",
    pains: fr ? "Ce que \u00e7a leur co\u00fbte" : "What it costs them",
    objections: fr ? "Objections" : "Objections",
    colRole: fr ? "R\u00f4le" : "Role",
    colStance: fr ? "Dans l\u2019affaire" : "Role in the deal",
    colCares: fr ? "Ce qui compte pour eux" : "What they care about",
    colWho: fr ? "Qui" : "Who",
    colWhy: fr ? "Pourquoi" : "Why",
    colPersona: fr ? "Persona" : "Persona",
    colLead: fr ? "Ouvrir avec" : "Lead with",
    untested: fr
      ? "Rien sur cette page n\u2019a \u00e9t\u00e9 test\u00e9. C\u2019est une reformulation soign\u00e9e de ce que vous croyez. L\u2019onglet Observ\u00e9 est l\u00e0 o\u00f9 cela sera v\u00e9rifi\u00e9."
      : "Nothing on this page has been tested. It is a careful restatement of what you believe. The Observed tab is where it gets checked.",
    nothing: fr ? "Cette section n\u2019a pas encore \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9e." : "This section has not been generated yet.",
  };

  const STANCE: Record<string, string> = {
    signs: fr ? "Signe" : "Signs",
    champions: fr ? "Porte le projet" : "Champions",
    blocks: fr ? "Bloque" : "Blocks",
  };

  if (!rec) return <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>{c.nothing}</p>;

  return (
    <>
      {rec.headline && (
        <p style={{ fontSize: 15, lineHeight: 1.7, color: T.heading, margin: "0 0 16px" }}>{rec.headline}</p>
      )}

      {rec.definition.length > 0 && (
        <>
          <Head>{c.market}</Head>
          <Kv items={rec.definition.map((d) => ({ k: d.label, v: d.value }))} />
        </>
      )}

      {rec.triggers.length > 0 && (
        <>
          <Rule />
          <Head>{c.triggers}</Head>
          <Kv items={rec.triggers.map((t) => ({ k: t.event, v: t.why }))} />
        </>
      )}

      {people && people.segments.length > 1 && (
        <>
          <Rule />
          <Head>{c.segments}</Head>
          <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.6 }}>{c.segmentsSub}</p>
          <Kv items={people.segments.map((s) => ({ k: s.name, v: s.howTheyDiffer || s.who }))} />
        </>
      )}

      {rec.committee.length > 0 && (
        <>
          <Rule />
          <Head>{c.committee}</Head>
          <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.6 }}>{c.committeeSub}</p>
          <table style={tbl}>
            <thead><tr><th style={th}>{c.colRole}</th><th style={th}>{c.colStance}</th><th style={th}>{c.colCares}</th></tr></thead>
            <tbody>
              {rec.committee.map((m, i) => (
                <tr key={i}>
                  <td style={{ ...td, color: T.heading, fontWeight: 500 }}>{m.role}</td>
                  <td style={td}>{STANCE[m.stance] ?? m.stance}</td>
                  <td style={td}>{m.cares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {demand && demand.objections.length > 0 && (
        <>
          <Rule />
          <Head>{c.objections}</Head>
          <Kv items={demand.objections.slice(0, 5).map((o) => ({ k: o.objection, v: o.realConcern }))} />
        </>
      )}

      {rec.disqualifiers.length > 0 && (
        <>
          <Rule />
          <Head>{c.disq}</Head>
          <Kv items={rec.disqualifiers.map((d) => ({ k: d.who, v: d.why }))} />
        </>
      )}

      {rec.angles.length > 0 && (
        <>
          <Rule />
          <Head>{c.angles}</Head>
          <Kv items={rec.angles.map((a) => ({ k: a.persona, v: a.lead }))} />
        </>
      )}

      <Rule />
      <Note tone="amber">{c.untested}</Note>
    </>
  );
}

export function FindTab({ p, locale }: { p: IcpProfile; locale: Locale }) {
  const fr = locale === "fr";
  const [platform, setPlatform] = useState<PlatformId>("apollo");
  const [copied, setCopied] = useState(false);

  const act = p.activation;
  const filters: ProspectFilters = act
    ? ({ ...EMPTY_FILTERS, ...act.prospectFilters } as ProspectFilters)
    : EMPTY_FILTERS;

  const c = {
    noKey: fr
      ? "Nous ne nous connectons \u00e0 aucun de ces comptes. Rien n\u2019est lanc\u00e9 en votre nom, aucun cr\u00e9dit n\u2019est d\u00e9pens\u00e9, et nous ne d\u00e9tenons jamais votre cl\u00e9. Vous obtenez les crit\u00e8res, dans la langue de chaque plateforme, et vous les lancez."
      : "We never connect to your account on any of these. Nothing is run on your behalf, no credits are spent, and we never hold a key of yours. You get the criteria, in that platform's own language, and you run it.",
    empty: fr
      ? "Aucun crit\u00e8re de recherche n\u2019a encore \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9. Lancez la section Activation dans l\u2019onglet \u00c9nonc\u00e9."
      : "No search criteria have been generated yet. Run the activation section first.",
    copy: fr ? "Copier pour cette plateforme" : "Copy for this platform",
    copied: fr ? "Copi\u00e9" : "Copied",
    field: fr ? "Champ" : "Field",
    value: fr ? "Valeur" : "Value",
    why: fr ? "Pourquoi" : "Why",
    step: fr ? "\u00c9tape" : "Step",
    doThis: fr ? "\u00c0 faire" : "Do this",
    withWhat: fr ? "Avec" : "With",
    noHour: fr
      ? "Nous ne vous disons pas la meilleure heure ni le meilleur jour pour envoyer. Personne ne peut le savoir \u00e0 partir d\u2019un formulaire, et les chiffres que d\u2019autres outils affichent pour cela sont du folklore. Le moment o\u00f9 vos propres lecteurs ouvrent est un fait, et il est dans l\u2019onglet Observ\u00e9."
      : "We do not tell you the best hour or weekday to send. Nobody can know that from a form, and the numbers other tools print for it are folklore. When your own readers actually open is a fact, and it is on the Observed tab.",
    where: fr ? "O\u00f9 les trouver" : "Where to find them",
    signals: fr ? "Signaux observables" : "Observable signals",
    signalsSub: fr
      ? "Un d\u00e9clencheur que vous ne pouvez pas d\u00e9tecter est un souhait."
      : "A trigger you cannot detect is a wish.",
  };

  if (nothingToSearchOn(filters)) {
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
            border: "1px solid " + (platform === x.id ? T.green : T.border),
            borderRadius: 4,
            background: platform === x.id ? "#F2F8F5" : T.card,
            color: platform === x.id ? T.green : T.body,
            fontWeight: platform === x.id ? 500 : 400,
            padding: "6px 11px", fontSize: 12.5, cursor: "pointer",
          }}>{x.label}</button>
        ))}
        <button onClick={() => void copy()} style={{
          marginLeft: "auto", border: "1px solid " + T.border, borderRadius: T.rBtn,
          background: T.card, color: T.body, padding: "6px 11px", fontSize: 12.5, cursor: "pointer",
        }}>{copied ? c.copied : c.copy}</button>
      </div>

      <Head>{crit.label}</Head>
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.6 }}>{crit.note}</p>

      {crit.rows.length > 0 && (
        <table style={tbl}>
          <thead>
            <tr>
              <th style={{ ...th, width: isClay ? 60 : 230 }}>{isClay ? c.step : c.field}</th>
              <th style={th}>{isClay ? c.doThis : c.value}</th>
              {!isClay && <th style={{ ...th, width: 250 }}>{c.why}</th>}
              {isClay && <th style={th}>{c.withWhat}</th>}
            </tr>
          </thead>
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

      {crit.footer && (
        <p style={{ fontSize: 12, color: T.faint, marginTop: 11, lineHeight: 1.6 }}>{crit.footer}</p>
      )}

      {p.market && p.market.detectableSignals.length > 0 && (
        <>
          <Rule />
          <Head>{c.signals}</Head>
          <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.6 }}>{c.signalsSub}</p>
          <table style={tbl}>
            <thead><tr><th style={th}>{fr ? "Signal" : "Signal"}</th><th style={th}>{fr ? "O\u00f9 c\u2019est visible" : "Where visible"}</th><th style={th}>{fr ? "Ce que \u00e7a veut dire" : "What it means"}</th></tr></thead>
            <tbody>
              {p.market.detectableSignals.map((s, i) => (
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

      <Rule />
      <Note tone="amber">{c.noHour}</Note>
    </>
  );
}

export function ObservedTab({ locale, threshold }: { locale: Locale; threshold: number }) {
  const fr = locale === "fr";
  const c = {
    t: fr ? "Pas encore assez de lecteurs pour dire quoi que ce soit" : "Not enough readers to say anything yet",
    d: fr
      ? "Personne n\u2019a encore \u00e9t\u00e9 mesur\u00e9 contre ce profil. En dessous d\u2019environ " + threshold + " lecteurs engag\u00e9s, tout motif ici serait du bruit, et en afficher un serait pire que de ne rien afficher."
      : "Nobody has been measured against this profile yet. Under about " + threshold + " engaged readers, any pattern here would be noise, and printing one would be worse than printing nothing.",
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
      <div style={{ padding: "22px 0", textAlign: "center" }}>
        <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.t}</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 10, lineHeight: 1.65, maxWidth: 470, marginLeft: "auto", marginRight: "auto" }}>
          {c.d}
          <br /><br />
          {c.d2}
        </div>
      </div>
      <Rule />
      <Head>{c.will}</Head>
      <Kv items={c.items.map(([k, v]) => ({ k, v }))} />
    </>
  );
}
