"use client";

import { T } from "@/lib/theme";
import type { Locale } from "@/lib/i18n";
import type { ObservedView } from "@/lib/observed";
import { Note } from "./Tabs";

/**
 * The Observed tab.
 *
 * Every number here is counted from signals. No model call, no cost, and
 * nothing that reads like a finding: the reasoning over these facts is the gap
 * analysis, which is a separate surface and says so.
 *
 * Sections appear as the data arrives. A profile with two readers shows the
 * strip and nothing else, which is the honest shape rather than an empty
 * skeleton pretending to be a report.
 */

const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function Head({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 500, color: T.heading, marginBottom: 9 }}>{children}</div>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.6 }}>{children}</p>;
}
function Rule() {
  return <div style={{ height: 1, background: T.border, margin: "16px 0" }} />;
}
function Foot({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: T.faint, margin: "11px 0 0", lineHeight: 1.6 }}>{children}</p>;
}

/** Minutes into something a person would say out loud. */
function duration(mins: number, fr: boolean): string {
  if (mins < 1) return fr ? "moins d\u2019une minute" : "under a minute";
  if (mins < 60) return Math.round(mins) + (fr ? " minutes" : " minutes");
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  const hours = h + (fr ? (h === 1 ? " heure" : " heures") : h === 1 ? " hour" : " hours");
  if (h < 48) return m ? hours + " " + m + (fr ? " min" : " min") : hours;
  const d = Math.round(h / 24);
  return d + (fr ? " jours" : " days");
}

export default function ObservedTab({
  locale,
  threshold,
  view,
  profileId,
}: {
  locale: Locale;
  threshold: number;
  view: ObservedView;
  profileId: string;
}) {
  const fr = locale === "fr";
  const { summary, opens, common } = view;
  const days = fr ? DAYS_FR : DAYS_EN;
  const engaged = summary.engaged;
  const short = Math.max(0, threshold - engaged);

  const c = {
    stripOpened: fr ? "Ont ouvert" : "Opened",
    stripEngaged: fr ? "Engag\u00e9s" : "Engaged",
    stripAsked: fr ? "Ont pos\u00e9 une question" : "Asked a question",
    stripOutcome: fr ? "R\u00e9sultats enregistr\u00e9s" : "Outcomes marked",

    whenH: fr ? "Quand vos lecteurs ouvrent vraiment" : "When your readers actually open",
    whenSub: fr
      ? " premi\u00e8res ouvertures. Vos lecteurs, pas une moyenne du secteur."
      : " first opens. Your readers, not a benchmark from someone else's data.",
    colDay: fr ? "Jour" : "Day",
    colOpens: fr ? "Premi\u00e8res ouvertures" : "First opens",
    weekend: fr ? "Week-end" : "Weekend",
    utc: fr
      ? "Les jours sont compt\u00e9s en UTC. Le fuseau qui compte est celui du lecteur, et nous ne le connaissons pas."
      : "Days are counted in UTC. The timezone that decided the behaviour is the reader's, and we do not know it.",
    median: fr ? "D\u00e9lai m\u00e9dian entre l\u2019envoi et la premi\u00e8re ouverture : " : "Median gap between send and first open is ",
    within: fr ? " lecteurs ont ouvert dans le quart d\u2019heure." : " opened within fifteen minutes.",
    measuredOn: fr ? " Mesur\u00e9 sur " : " Measured across ",
    measuredOnEnd: fr ? " lecteurs \u00e0 qui un envoi a \u00e9t\u00e9 fait." : " readers who were actually sent something.",
    noSend: fr
      ? "Aucun d\u00e9lai \u00e0 mesurer : ces lecteurs ont re\u00e7u un lien plut\u00f4t qu\u2019un envoi, donc il n\u2019y a pas de moment d\u2019envoi."
      : "No gap to measure: these readers were given a link rather than sent one, so there is no moment of sending.",

    commonH: fr ? "Ce que les lecteurs engag\u00e9s avaient en commun" : "What the engaged readers had in common",
    commonSub: fr
      ? "Compt\u00e9, pas interpr\u00e9t\u00e9. Ce que cela signifie est une autre question."
      : "Counted, not interpreted. What it means is a separate question.",
    rAsked: fr ? "Ont pos\u00e9 une question" : "Asked a question",
    rForward: fr ? "Ont transf\u00e9r\u00e9 \u00e0 un coll\u00e8gue" : "Forwarded to a colleague",
    rReturn: fr ? "Sont revenus une deuxi\u00e8me fois" : "Came back a second time",
    of: fr ? "sur" : "of",
    against: fr ? ", contre " : ", against ",
    ofThose: fr ? " des " : " of the ",
    notEngagedWord: fr ? " qui ne se sont pas engag\u00e9s" : " who did not engage",
    forwardsWord: fr ? " transferts, par " : " forwards, from ",
    readersWord: fr ? " lecteurs" : " readers",

    pageH: fr ? "O\u00f9 ils s\u2019arr\u00eatent" : "Where they stop",
    pageStop: fr ? "Se sont arr\u00eat\u00e9s \u00e0 la page " : "Stopped on page ",
    pageOf: fr ? " sur " : " of ",
    pageReaders: fr ? " lecteurs" : " readers",
    pageLong: fr ? ", de loin le plus long temps pass\u00e9 dans le document." : ", the longest dwell in the document by a wide margin.",
    pageClose: fr ? ", le plus long temps pass\u00e9, mais de peu." : ", the longest dwell, though not by much.",
    pageNote: fr
      ? "Une page o\u00f9 tout le monde s\u2019arr\u00eate est un fait sur le document, pas sur un lecteur. Une seule personne qui s\u2019attarde est une habitude."
      : "A page the whole cohort stops at is a fact about the document, not about any one reader. One person lingering is a habit.",

    rateH: fr ? "Taux de conclusion par persona" : "Close rate by persona",
    rateNone: fr
      ? "Aucun r\u00e9sultat enregistr\u00e9 pour l\u2019instant. Marquez des lecteurs comme gagn\u00e9s ou perdus et cette section commencera \u00e0 se remplir."
      : "No outcomes recorded yet. Mark readers won or lost and this section starts to fill.",
    rateFew: fr
      ? " r\u00e9sultats enregistr\u00e9s jusqu\u2019ici. En dessous de vingt nous n\u2019afficherons pas de taux : deux victoires de plus le d\u00e9placeraient de vingt points et vous planifieriez sur du bruit."
      : " outcomes marked so far. Under twenty we will not print a rate, because two more wins would move it twenty points and you would plan against noise.",

    shortT: engaged === 0
      ? (fr ? "Pas encore assez de lecteurs pour dire quoi que ce soit" : "Not enough readers to say anything yet")
      : (fr ? engaged + " lecteurs engag\u00e9s, " + short + " de plus avant de pouvoir conclure"
            : engaged + " engaged so far, " + short + " more before this can call anything"),
    shortD: engaged === 0
      ? (fr
        ? "Personne n\u2019a encore \u00e9t\u00e9 mesur\u00e9 contre ce profil. Liez-le \u00e0 un document et ses lecteurs commenceront \u00e0 compter ici."
        : "Nobody has been measured against this profile yet. Attach it to a document and its readers start counting here.")
      : (fr
        ? "Les chiffres ci-dessus sont r\u00e9els et compt\u00e9s. Ce qui manque, ce sont les motifs : en dessous de " + threshold + " lecteurs engag\u00e9s, deux personnes de plus d\u00e9placeraient n\u2019importe quelle conclusion."
        : "The counts above are real. What is missing is the pattern: under " + threshold + " engaged readers, two more people would move any conclusion."),
    gapH: fr ? "Analyse des \u00e9carts" : "Gap analysis",
    gapP: fr
      ? "Les chiffres de cette page sont compt\u00e9s. L\u2019analyse des \u00e9carts les lit c\u00f4te \u00e0 c\u00f4te avec ce que vous avez \u00e9crit et dit si les deux se ressemblent. C\u2019est la seule section de cette page qui raisonne plut\u00f4t que de compter."
      : "Everything on this page is counted. The gap analysis reads it beside what you wrote and says whether the two look like each other. It is the only part of this page that reasons rather than counts.",
    gapOpen: fr ? "Ouvrir l\u2019analyse des \u00e9carts" : "Open the gap analysis",
    fills: fr ? "Cela se remplit tout seul. Rien \u00e0 configurer." : "This fills in on its own. Nothing to configure.",
  };

  const tbl: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" };
  const th: React.CSSProperties = { background: T.soft, fontSize: 11.5, fontWeight: 500, color: T.muted, textAlign: "left", padding: "9px 14px", borderBottom: "1px solid " + T.border };
  const td: React.CSSProperties = { padding: "11px 14px", borderBottom: "1px solid " + T.border, fontSize: 13.5, color: T.body, verticalAlign: "middle" };
  const dt: React.CSSProperties = { color: T.muted };
  const dd: React.CSSProperties = { color: T.body, lineHeight: 1.6, margin: 0 };
  const kv: React.CSSProperties = { display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", gap: "10px 16px", fontSize: 13, margin: 0 };

  // Monday to Friday named, the weekend pooled: two readers on a Sunday is not
  // a Sunday pattern, and the mock draws it the same way.
  const weekend = opens.byDay[5] + opens.byDay[6];
  const rows: [string, number][] = [
    ...([0, 1, 2, 3, 4] as const).map((i) => [days[i], opens.byDay[i]] as [string, number]),
    [c.weekend, weekend],
  ];
  const peak = Math.max(1, ...rows.map(([, n]) => n));

  return (
    <>
      {summary.readers > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" }}>
          {([
            [summary.opened + " / " + summary.readers, c.stripOpened, T.green],
            [String(summary.engaged), c.stripEngaged, T.green],
            [String(summary.questioners), c.stripAsked, T.indigo],
            [String(summary.outcomesMarked), c.stripOutcome, T.amber],
          ] as [string, string, string][]).map(([v, l, tone], n) => (
            <div key={n} style={{ padding: "15px 18px", borderLeft: "3px solid " + tone }}>
              <div style={{ fontSize: 21, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {opens.firstOpens > 0 && (
        <>
          <Rule />
          <Head>{c.whenH}</Head>
          <Sub>{opens.firstOpens}{c.whenSub}</Sub>
          <table style={tbl}>
            <thead><tr>
              <th style={{ ...th, width: 150 }}>{c.colDay}</th>
              <th style={{ ...th, width: 130 }}>{c.colOpens}</th>
              <th style={th} />
            </tr></thead>
            <tbody>
              {rows.map(([label, n], i) => (
                <tr key={label} style={i === rows.length - 1 ? { } : undefined}>
                  <td style={td}>{label}</td>
                  <td style={{ ...td, fontVariantNumeric: "tabular-nums", color: n > 0 ? T.body : T.faint }}>{n}</td>
                  <td style={td}>
                    <div style={{
                      height: 8,
                      width: Math.round((n / peak) * 100) + "%",
                      minWidth: n > 0 ? 4 : 0,
                      background: n >= peak * 0.5 ? T.green : T.faint,
                    }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Foot>
            {opens.measured > 0 && opens.medianMinutes !== null ? (
              <>
                {c.median}{duration(opens.medianMinutes, fr)}.
                {opens.within15 > 0 ? " " + opens.within15 + c.within : ""}
                {c.measuredOn}{opens.measured}{c.measuredOnEnd}
              </>
            ) : c.noSend}
          </Foot>
          <Foot>{c.utc}</Foot>
        </>
      )}

      {common.engaged > 0 && (
        <>
          <Rule />
          <Head>{c.commonH}</Head>
          <Sub>{c.commonSub}</Sub>
          <dl style={kv}>
            <dt style={dt}>{c.rAsked}</dt>
            <dd style={dd}>
              {common.askedEngaged} {c.of} {common.engaged}
              {common.notEngaged > 0
                ? c.against + common.askedNotEngaged + c.ofThose + common.notEngaged + c.notEngagedWord
                : ""}
            </dd>
            {common.forwardsTotal > 0 && (
              <>
                <dt style={dt}>{c.rForward}</dt>
                <dd style={dd}>{common.forwardsTotal}{c.forwardsWord}{common.forwardedEngaged}{c.readersWord}</dd>
              </>
            )}
            <dt style={dt}>{c.rReturn}</dt>
            <dd style={dd}>{common.returnedEngaged} {c.of} {common.engaged}</dd>
          </dl>
        </>
      )}

      {common.pages.length > 0 && (
        <>
          <Rule />
          <Head>{c.pageH}</Head>
          <dl style={kv}>
            {common.pages.map((p) => (
              <div key={p.documentId} style={{ display: "contents" }}>
                <dt style={dt}>{p.title}</dt>
                <dd style={dd}>
                  {c.pageStop}{p.page}{p.pageCount ? c.pageOf + p.pageCount : ""}
                  {". " + p.readers + c.pageReaders}
                  {p.standout ? c.pageLong : c.pageClose}
                </dd>
              </div>
            ))}
          </dl>
          <div style={{ marginTop: 14 }}>
            <Note tone="indigo">{c.pageNote}</Note>
          </div>
        </>
      )}

      <Rule />
      <Head>{c.rateH}</Head>
      <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.65 }}>
        {summary.outcomesMarked === 0 ? c.rateNone : summary.outcomesMarked + c.rateFew}
      </p>

      <Rule />
      <Head>{c.gapH}</Head>
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px", lineHeight: 1.65, maxWidth: 620 }}>{c.gapP}</p>
      <a href={"/buyer-profiles/" + profileId + "/gap"} style={{
        height: 32, padding: "0 11px", border: "1px solid " + T.border, borderRadius: T.rBtn,
        background: T.card, fontSize: 13, color: T.body, fontFamily: T.font,
        display: "inline-flex", alignItems: "center", textDecoration: "none",
      }}>{c.gapOpen}</a>

      {engaged < threshold && (
        <>
          <Rule />
          <div style={{ padding: "18px 0 6px", textAlign: "center" }}>
            <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.shortT}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 10, lineHeight: 1.65, maxWidth: 470, marginLeft: "auto", marginRight: "auto" }}>
              {c.shortD}<br /><br />{c.fills}
            </div>
          </div>
        </>
      )}
    </>
  );
}
