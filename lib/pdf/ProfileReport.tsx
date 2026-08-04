import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Branding } from "@/lib/report-cache";
import type { Profile } from "@/lib/buyer-profile";
import type { ObservedView } from "@/lib/observed";
import type { GapOutput } from "@/lib/ai/tasks/gap";
import type { PlatformCriteria } from "@/lib/search-criteria";

/**
 * The buyer profile, as a document somebody forwards.
 *
 * Built to the same rules as the reading report and the erasure certificate:
 * fixed label column, hairline dividers, one soft header strip per card, no
 * decoration.
 *
 * THE BASIS LABEL IS PRINTED ON EVERY SECTION. On screen the three tiers are
 * tabs, and a tab is a thing you are standing in. A printed page has no tabs,
 * and somebody will forward page four without the cover, so each section says
 * for itself whether it is what the customer asserted, what was reasoned from
 * public fact, or what their readers actually did.
 *
 * Nothing here is generated at render time. Every section already exists: the
 * stated passes were run when the profile was built, the criteria are a
 * deterministic mapping, the counts come from signals, and the gap analysis is
 * whatever was last stored. So this costs no model call and needs no cache.
 */

const C = {
  ink: "#101828", body: "#344054", muted: "#667085", faint: "#98A2B3",
  line: "#E4E7EC", lineSoft: "#EFF1F4", soft: "#F9FAFB",
  green: "#1F6F4A", greenText: "#14603C", greenSoft: "#ECF6F0", greenLine: "#CFE7DA",
  amber: "#B54708", amberSoft: "#FFFBF5", amberLine: "#F2D5A8",
  indigo: "#3538CD", indigoSoft: "#F5F5FF", indigoLine: "#D4D4F5",
  danger: "#B42318", dangerSoft: "#FEF3F2", dangerLine: "#F2B8B4",
};

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 44, fontSize: 9.5, color: C.body, fontFamily: "Helvetica", lineHeight: 1.5 },
  runHead: { position: "absolute", top: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint },
  eyebrow: { fontSize: 7.5, color: C.faint, letterSpacing: 0.8 },
  h1: { fontSize: 20, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.22, letterSpacing: -0.3 },
  h2: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 8, marginTop: 16 },
  sub: { fontSize: 9, color: C.muted, marginTop: 5 },
  mono: { fontSize: 8, color: C.muted, fontFamily: "Courier", marginBottom: 5 },
  code: { fontSize: 7.5, color: C.body, fontFamily: "Courier", lineHeight: 1.6 },

  brandRow: { flexDirection: "row", alignItems: "center", paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  logo: { width: 30, height: 30, marginRight: 10, objectFit: "contain" },
  brandName: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold" },
  metaRow: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 24 },
  metaCol: { flex: 1, paddingRight: 14 },
  metaK: { fontSize: 7, color: C.faint, letterSpacing: 0.7, marginBottom: 3 },
  metaV: { fontSize: 9.5, color: C.ink },

  card: { borderWidth: 1, borderColor: C.line, borderRadius: 3, marginBottom: 12 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, paddingHorizontal: 13, backgroundColor: C.soft, borderBottomWidth: 1, borderBottomColor: C.line },
  cardTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.body },
  cardBody: { padding: 13 },
  row: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  rowLast: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 13 },
  rowK: { width: 132, fontSize: 8.5, color: C.muted, paddingRight: 10 },
  rowV: { flex: 1, fontSize: 9, color: C.ink },

  /** The basis label. Small, and on every section, because the page it is on
   *  will be read without the one before it. */
  basis: { fontSize: 6.5, letterSpacing: 0.7, paddingVertical: 2, paddingHorizontal: 5, borderWidth: 1, borderRadius: 2 },

  figures: { flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 3 },
  fig: { flex: 1, paddingVertical: 10, paddingHorizontal: 13, borderLeftWidth: 1, borderLeftColor: C.line },
  figFirst: { flex: 1, paddingVertical: 10, paddingHorizontal: 13 },
  figV: { fontSize: 15, color: C.ink, fontFamily: "Helvetica-Bold" },
  figK: { fontSize: 7.5, color: C.muted, marginTop: 2 },

  lead: { fontSize: 10, color: C.body, lineHeight: 1.6 },
  claim: { fontSize: 13, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.4 },
  para: { fontSize: 9, color: C.body, lineHeight: 1.6 },

  bullet: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  dot: { width: 2.5, height: 2.5, backgroundColor: C.green, borderRadius: 1.25, marginTop: 5, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 9, color: C.body, lineHeight: 1.55 },

  th: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 13, backgroundColor: C.soft, borderBottomWidth: 1, borderBottomColor: C.line },
  thText: { fontSize: 7, color: C.muted, letterSpacing: 0.6 },
  td: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  tdText: { fontSize: 8.5, color: C.body, lineHeight: 1.5 },

  barRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  barK: { width: 62, fontSize: 8.5, color: C.muted },
  barTrack: { flex: 1, height: 4, backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderRadius: 1, marginRight: 9 },
  barV: { width: 44, fontSize: 8, color: C.body, textAlign: "right" },

  callout: { paddingVertical: 9, paddingHorizontal: 13, borderLeftWidth: 2, marginBottom: 12 },
  calloutText: { fontSize: 8.5, lineHeight: 1.55 },

  note: { fontSize: 8, color: C.faint, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 9, lineHeight: 1.5 },
  foot: { position: "absolute", bottom: 26, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", fontSize: 7, color: C.faint },
});

export type ProfileSections = {
  market: boolean;
  personas: boolean;
  criteria: boolean;
  calendars: boolean;
  evidence: boolean;
  gap: boolean;
};

export const ALL_PROFILE_SECTIONS: ProfileSections = {
  market: true, personas: true, criteria: true, calendars: true, evidence: true, gap: true,
};

export type ProfileReportData = {
  profileName: string;
  objectiveLabel: string;
  revision: number | null;
  /** Whether the customer had customers when they wrote it. */
  hypothesis: boolean;
  profile: Profile;
  observed: ObservedView;
  gap: GapOutput | null;
  gapAt: string | null;
  threshold: number;
  documentTitles: string[];
  platforms: PlatformCriteria[];
};

type BasisKind = "stated" | "public" | "observed";

const BASIS_STYLE: Record<BasisKind, { label: string; color: string; bg: string; border: string }> = {
  stated: { label: "STATED", color: C.muted, bg: C.soft, border: C.line },
  public: { label: "PUBLIC FACT", color: C.indigo, bg: C.indigoSoft, border: C.indigoLine },
  observed: { label: "OBSERVED", color: C.greenText, bg: C.greenSoft, border: C.greenLine },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function duration(mins: number): string {
  if (mins < 1) return "under a minute";
  if (mins < 60) return Math.round(mins) + " minutes";
  const h = Math.floor(mins / 60);
  if (h < 48) return h + (h === 1 ? " hour" : " hours");
  return Math.round(h / 24) + " days";
}

export function ProfileReport({
  data, generatedAt, branding, sections = ALL_PROFILE_SECTIONS,
}: {
  data: ProfileReportData;
  generatedAt: Date;
  branding?: Branding;
  sections?: ProfileSections;
}) {
  const { profile: p, observed, gap } = data;
  const m = p.market;
  const pe = p.people;
  const find = p.find;
  const dateStr = generatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const Head = ({ label }: { label: string }) => (
    <View style={s.runHead} fixed>
      <Text style={s.eyebrow}>{label}</Text>
      <Text>{branding?.headerText ?? ""}</Text>
    </View>
  );

  const Foot = () => (
    <View style={s.foot} fixed>
      <Text>{branding?.footerText || data.profileName}</Text>
      <Text render={({ pageNumber, totalPages }) =>
        (branding?.signature === false ? "" : "Generated from ReadProspects   \u00b7   ") + pageNumber + " / " + totalPages
      } />
    </View>
  );

  const Card = ({ title, basis, children }: { title: string; basis: BasisKind; children: React.ReactNode }) => {
    const b = BASIS_STYLE[basis];
    return (
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={[s.basis, { color: b.color, backgroundColor: b.bg, borderColor: b.border }]}>{b.label}</Text>
        </View>
        {children}
      </View>
    );
  };

  const Row = ({ k, v, last }: { k: string; v: string; last?: boolean }) => (
    <View style={last ? s.rowLast : s.row}>
      <Text style={s.rowK}>{k}</Text>
      <Text style={s.rowV}>{v}</Text>
    </View>
  );

  const Callout = ({ tone, children }: { tone: "amber" | "indigo" | "green"; children: string }) => {
    const map = {
      amber: { bg: C.amberSoft, line: C.amber, text: "#7A3D0A" },
      indigo: { bg: C.indigoSoft, line: C.indigo, text: "#2C2E9E" },
      green: { bg: C.greenSoft, line: C.green, text: C.greenText },
    }[tone];
    return (
      <View style={[s.callout, { backgroundColor: map.bg, borderLeftColor: map.line }]}>
        <Text style={[s.calloutText, { color: map.text }]}>{children}</Text>
      </View>
    );
  };

  const weekend = observed.opens.byDay[5] + observed.opens.byDay[6];
  const dayRows: [string, number][] = [
    ...([0, 1, 2, 3, 4] as const).map((i) => [DAYS[i], observed.opens.byDay[i]] as [string, number]),
    ["Weekend", weekend],
  ];
  const peak = Math.max(1, ...dayRows.map(([, n]) => n));

  const showEvidence = sections.evidence && observed.summary.readers > 0;
  const showGap = sections.gap && Boolean(gap);
  const showCriteria = sections.criteria && data.platforms.length > 0;
  const showCalendars = sections.calendars && Boolean(find?.calendars.length);

  return (
    <Document title={"Buyer profile \u2014 " + data.profileName} author={branding?.reporter || "ReadProspects"}>

      {/* Cover. Who made it, what it is, and what the labels mean. */}
      <Page size="A4" style={s.page}>
        <Head label="BUYER PROFILE" />

        {(branding?.logoUrl || branding?.companyName) && (
          <View style={s.brandRow}>
            {branding?.logoUrl ? <Image style={s.logo} src={branding.logoUrl} /> : null}
            {branding?.companyName ? <Text style={s.brandName}>{branding.companyName}</Text> : null}
          </View>
        )}

        <View style={s.metaRow}>
          {branding?.reporter ? (
            <View style={s.metaCol}><Text style={s.metaK}>PREPARED BY</Text><Text style={s.metaV}>{branding.reporter}</Text></View>
          ) : null}
          {branding?.recipient ? (
            <View style={s.metaCol}>
              <Text style={s.metaK}>
                {branding.recipientKind === "department" ? "FOR THE TEAM"
                  : branding.recipientKind === "organisation" ? "FOR"
                  : "PREPARED FOR"}
              </Text>
              <Text style={s.metaV}>{branding.recipient}</Text>
            </View>
          ) : null}
          <View style={s.metaCol}><Text style={s.metaK}>DATE</Text><Text style={s.metaV}>{dateStr}</Text></View>
        </View>

        <Text style={s.mono}>BUYER PROFILE</Text>
        <Text style={s.h1}>{data.profileName}</Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>
          {data.objectiveLabel}
          {data.revision !== null ? ". Revision " + data.revision + ", written by the sender" : ""}
          {data.hypothesis ? ". Written before there were paying customers, so it is a hypothesis." : ""}
        </Text>

        {observed.summary.readers > 0 && (
          <View style={s.figures}>
            <View style={s.figFirst}><Text style={s.figV}>{observed.summary.readers}</Text><Text style={s.figK}>Readers</Text></View>
            <View style={s.fig}><Text style={s.figV}>{observed.summary.opened}</Text><Text style={s.figK}>Opened</Text></View>
            <View style={s.fig}><Text style={s.figV}>{observed.summary.engaged}</Text><Text style={s.figK}>Engaged</Text></View>
            <View style={s.fig}><Text style={s.figV}>{observed.summary.questioners}</Text><Text style={s.figK}>Asked a question</Text></View>
          </View>
        )}

        {m?.headline ? (
          <View style={{ marginTop: 24 }}>
            <Text style={s.claim}>{m.headline}</Text>
          </View>
        ) : null}

        {branding?.note ? (
          <Card title="Note" basis="stated">
            <View style={s.cardBody}><Text style={s.para}>{branding.note}</Text></View>
          </Card>
        ) : null}

        <View style={[s.card, { marginTop: 22 }]}>
          <View style={s.cardHead}><Text style={s.cardTitle}>What the labels mean</Text></View>
          <View style={s.cardBody}>
            <Text style={s.para}>
              Every section in this report carries its basis. Sections marked STATED come from what
              {branding?.companyName ? " " + branding.companyName : " the sender"} described. Sections marked PUBLIC FACT are
              reasoned from that. Sections marked OBSERVED come from readers who opened the documents this profile
              is attached to.
            </Text>
            <Text style={[s.para, { marginTop: 8, color: C.muted }]}>
              The labels are printed on every section rather than once here, because a page that is forwarded on its
              own still has to say what it is.
            </Text>
          </View>
        </View>

        <Foot />
      </Page>

      {/* Stated. What the sender believes. */}
      {sections.market && m ? (
        <Page size="A4" style={s.page}>
          <Head label="STATED" />
          <Text style={s.h1}>The market, as described</Text>
          <Text style={[s.sub, { marginBottom: 20 }]}>{data.profileName} {"\u00b7"} {dateStr}</Text>

          <Card title="Market definition" basis="stated">
            <View style={s.cardBody}><Text style={s.para}>{m.definition}</Text></View>
          </Card>

          {m.reallyTrue ? (
            <Card title="What actually has to be true" basis="stated">
              <View style={s.cardBody}><Text style={s.para}>{m.reallyTrue}</Text></View>
            </Card>
          ) : null}

          {m.triggers.length > 0 && (
            <Card title="Trigger events" basis="stated">
              {m.triggers.map((t, i) => (
                <Row key={i} k={t.event} v={t.why} last={i === m.triggers.length - 1} />
              ))}
            </Card>
          )}

          {m.disqualifiers.length > 0 && (
            <Card title="Disqualifiers" basis="stated">
              {m.disqualifiers.map((d, i) => (
                <Row key={i} k={d.who} v={d.why} last={i === m.disqualifiers.length - 1} />
              ))}
            </Card>
          )}

          {m.limits.length > 0 && (
            <Card title="What this cannot tell you" basis="stated">
              {m.limits.map((l, i) => (
                <View key={i} style={i === m.limits.length - 1 ? [s.bullet, { borderBottomWidth: 0 }] : s.bullet}>
                  <View style={s.dot} /><Text style={s.bulletText}>{l}</Text>
                </View>
              ))}
            </Card>
          )}

          <Callout tone="amber">
            Nothing on this page has been tested against anybody. It is a careful restatement of what the sender
            believes, which is the right place to start and the wrong place to stop.
          </Callout>

          <Foot />
        </Page>
      ) : null}

      {/* Personas and angles. */}
      {sections.personas && pe && pe.personas.length > 0 ? (
        <Page size="A4" style={s.page}>
          <Head label="STATED" />
          <Text style={s.h1}>The people</Text>
          <Text style={[s.sub, { marginBottom: 20 }]}>
            {pe.personas.length === 1 ? "One persona" : pe.personas.length + " personas"}
            {". They do not buy the same way, and a profile averaged across them fits nobody."}
          </Text>

          {pe.populations.length > 1 && (
            <Card title="Populations" basis="stated">
              {pe.populations.map((x, i) => (
                <Row key={i} k={x.name} v={x.howTheyDiffer} last={i === pe.populations.length - 1} />
              ))}
            </Card>
          )}

          {pe.personas.map((x) => (
            <View key={x.name} style={s.card} wrap={false}>
              <View style={s.cardHead}>
                <Text style={s.cardTitle}>{x.name} {"\u00b7"} {x.roleInDeal}</Text>
                <Text style={[s.basis, { color: C.muted, backgroundColor: C.soft, borderColor: C.line }]}>STATED</Text>
              </View>
              <Row k="Title variants" v={x.titleVariants.join(", ") || "\u2014"} />
              {x.reportsTo ? <Row k="Reports to" v={x.reportsTo} /> : null}
              {x.measuredOn ? <Row k="Measured on" v={x.measuredOn} /> : null}
              {x.wants ? <Row k="What they want" v={x.wants} /> : null}
              <Row k="What they fear" v={x.afraidOf} />
              {x.budgetAuthority ? <Row k="Budget authority" v={x.budgetAuthority} /> : null}
              {x.objectionTheyRaise ? <Row k="Objection they raise" v={x.objectionTheyRaise} /> : null}
              {x.respondsTo ? <Row k="What they respond to" v={x.respondsTo} /> : null}
              {x.losesThem ? <Row k="What loses them" v={x.losesThem} /> : null}
              <Row
                k="Where they gather"
                v={x.gathersAt.length ? x.gathersAt.join(", ") : "None named. We do not invent one."}
                last
              />
            </View>
          ))}

          {(pe.angles.length > 0 || pe.neverLeadWith) && (
            <Card title="Messaging angles" basis="stated">
              {pe.angles.map((a, i) => (
                <Row key={i} k={"To " + a.forPersona} v={a.leadWith} />
              ))}
              {pe.neverLeadWith ? <Row k="Never lead with" v={pe.neverLeadWith} /> : null}
              {pe.expectedObjection ? <Row k="Objection you will get" v={pe.expectedObjection} last /> : null}
            </Card>
          )}

          <Foot />
        </Page>
      ) : null}

      {/* Where to find them. */}
      {(showCriteria || showCalendars) ? (
        <Page size="A4" style={s.page}>
          <Head label="PUBLIC FACT" />
          <Text style={s.h1}>Where to find them</Text>
          <Text style={[s.sub, { marginBottom: 20 }]}>
            Reasoned from the personas and the markets above. The reasoning is shown so it can be disagreed with.
          </Text>

          <Callout tone="green">
            ReadProspects never connects to an account on any of these platforms. Nothing is run on anyone&apos;s behalf,
            no credits are spent, and no key is ever held. These are the criteria, in each platform&apos;s own language,
            to be run by whoever is building the list.
          </Callout>

          {showCriteria && data.platforms.map((plat) => (
            <View key={plat.id} style={s.card} wrap={false}>
              <View style={s.cardHead}>
                <Text style={s.cardTitle}>{plat.label}</Text>
                <Text style={[s.basis, { color: C.indigo, backgroundColor: C.indigoSoft, borderColor: C.indigoLine }]}>PUBLIC FACT</Text>
              </View>
              {plat.note ? <Text style={[s.note, { paddingBottom: 0 }]}>{plat.note}</Text> : null}
              {plat.rows.length > 0 && (
                <>
                  <View style={[s.th, { marginTop: 8 }]}>
                    <Text style={[s.thText, { width: 130 }]}>FIELD</Text>
                    <Text style={[s.thText, { flex: 1 }]}>VALUE</Text>
                  </View>
                  {plat.rows.map((r, i) => (
                    <View key={i} style={i === plat.rows.length - 1 && !plat.blocks.length ? s.rowLast : s.td}>
                      <Text style={[s.code, { width: 130, paddingRight: 8 }]}>{r.field}</Text>
                      <Text style={[s.code, { flex: 1 }]}>{r.value}</Text>
                    </View>
                  ))}
                </>
              )}
              {plat.blocks.map((b, i) => (
                <View key={i} style={{ paddingHorizontal: 13, paddingTop: 9, paddingBottom: i === plat.blocks.length - 1 ? 11 : 0 }}>
                  <Text style={[s.thText, { marginBottom: 4 }]}>{b.label.toUpperCase()}</Text>
                  <View style={{ backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderRadius: 2, padding: 8 }}>
                    <Text style={s.code}>{b.code}</Text>
                  </View>
                </View>
              ))}
              {plat.footer ? <Text style={s.note}>{plat.footer}</Text> : null}
            </View>
          ))}

          {showCalendars && find && (
            <Card title="Working calendars" basis="public">
              <View style={s.th}>
                <Text style={[s.thText, { width: 90 }]}>MARKET</Text>
                <Text style={[s.thText, { flex: 1 }]}>QUIET PERIODS</Text>
                <Text style={[s.thText, { width: 110 }]}>BUDGET CYCLE</Text>
              </View>
              {find.calendars.map((cal, i) => (
                <View key={i} style={i === find.calendars.length - 1 ? s.rowLast : s.td}>
                  <Text style={[s.tdText, { width: 90, color: C.ink }]}>{cal.market}</Text>
                  <Text style={[s.tdText, { flex: 1, paddingRight: 8 }]}>{cal.quietPeriods}</Text>
                  <Text style={[s.tdText, { width: 110, color: C.muted }]}>{cal.budgetCycle}</Text>
                </View>
              ))}
            </Card>
          )}

          {find && find.signals.length > 0 && (
            <Card title="Signals visible from outside" basis="public">
              {find.signals.map((sig, i) => (
                <Row key={i} k={sig.signal} v={sig.whereVisible + ". " + sig.meaning} last={i === find.signals.length - 1} />
              ))}
            </Card>
          )}

          <Callout tone="amber">
            This report does not name a best hour or weekday to send. Nobody can know that from a form, and the
            numbers other tools print for it are folklore. When these readers actually opened is on the next page,
            and that is a fact.
          </Callout>

          <Foot />
        </Page>
      ) : null}

      {/* Observed. What the readers did. */}
      {showEvidence ? (
        <Page size="A4" style={s.page}>
          <Head label="OBSERVED" />
          <Text style={s.h1}>What the readers did</Text>
          <Text style={[s.sub, { marginBottom: 20 }]}>
            {observed.summary.readers} readers across {data.documentTitles.length}
            {data.documentTitles.length === 1 ? " document" : " documents"} {"\u00b7"} {dateStr}
          </Text>

          <View style={s.figures}>
            <View style={s.figFirst}><Text style={s.figV}>{observed.summary.opened}</Text><Text style={s.figK}>Opened</Text></View>
            <View style={s.fig}><Text style={s.figV}>{observed.summary.engaged}</Text><Text style={s.figK}>Engaged</Text></View>
            <View style={s.fig}><Text style={s.figV}>{observed.summary.questioners}</Text><Text style={s.figK}>Asked a question</Text></View>
            <View style={s.fig}><Text style={s.figV}>{observed.summary.outcomesMarked}</Text><Text style={s.figK}>Outcomes marked</Text></View>
          </View>

          {observed.opens.firstOpens > 0 && (
            <View style={[s.card, { marginTop: 16 }]}>
              <View style={s.cardHead}>
                <Text style={s.cardTitle}>When they opened</Text>
                <Text style={[s.basis, { color: C.greenText, backgroundColor: C.greenSoft, borderColor: C.greenLine }]}>OBSERVED</Text>
              </View>
              {dayRows.map(([label, n], i) => (
                <View key={label} style={i === dayRows.length - 1 ? [s.barRow, { borderBottomWidth: 0 }] : s.barRow}>
                  <Text style={s.barK}>{label}</Text>
                  <View style={s.barTrack}>
                    <View style={{ width: Math.max(n > 0 ? 2 : 0, Math.round((n / peak) * 100)) + "%", height: "100%", backgroundColor: n >= peak * 0.5 ? C.green : C.faint }} />
                  </View>
                  <Text style={s.barV}>{n}</Text>
                </View>
              ))}
              <Text style={s.note}>
                {observed.opens.firstOpens} first opens, counted in UTC.
                {observed.opens.medianMinutes !== null
                  ? " Median gap between send and first open is " + duration(observed.opens.medianMinutes) + ", measured across " + observed.opens.measured + " readers who were sent something."
                  : " No send times to measure against: these readers were given a link rather than sent one."}
              </Text>
            </View>
          )}

          {observed.common.engaged > 0 && (
            <Card title="What the engaged readers had in common" basis="observed">
              <Row
                k="Asked a question"
                v={observed.common.askedEngaged + " of " + observed.common.engaged + " engaged"
                  + (observed.common.notEngaged > 0
                    ? ", against " + observed.common.askedNotEngaged + " of the " + observed.common.notEngaged + " who did not engage"
                    : "")}
              />
              {observed.common.forwardsTotal > 0 && (
                <Row k="Forwarded to a colleague" v={observed.common.forwardsTotal + " forwards, from " + observed.common.forwardedEngaged + " readers"} />
              )}
              <Row k="Came back a second time" v={observed.common.returnedEngaged + " of " + observed.common.engaged} last={observed.common.pages.length === 0} />
              {observed.common.pages.map((pg, i) => (
                <Row
                  key={pg.documentId}
                  k={"Stopped in " + pg.title}
                  v={"Page " + pg.page + (pg.pageCount ? " of " + pg.pageCount : "") + ". " + pg.readers + " readers"
                    + (pg.standout ? ", the longest dwell in the document by a wide margin." : ", the longest dwell, though not by much.")}
                  last={i === observed.common.pages.length - 1}
                />
              ))}
            </Card>
          )}

          <Card title="Close rate by persona" basis="observed">
            <View style={s.cardBody}>
              <Text style={s.para}>
                {observed.summary.outcomesMarked === 0
                  ? "No outcomes recorded yet. Mark readers won or lost and this section starts to fill."
                  : observed.summary.outcomesMarked + " outcomes marked so far. Under twenty no rate is printed, because two more wins would move it twenty points."}
              </Text>
            </View>
          </Card>

          {observed.summary.engaged < data.threshold && (
            <Callout tone="indigo">
              {observed.summary.engaged + " engaged readers, and " + data.threshold + " are needed before any pattern "
                + "here is worth acting on. The counts above are real; what is missing is the confidence that they "
                + "would survive two more people arriving."}
            </Callout>
          )}

          <Foot />
        </Page>
      ) : null}

      {/* The gap. */}
      {showGap && gap ? (
        <Page size="A4" style={s.page}>
          <Head label="OBSERVED" />
          <Text style={s.h1}>{gap.agrees ? "The readers match the description" : "The readers disagree with the description"}</Text>
          <Text style={[s.sub, { marginBottom: 20 }]}>
            Measured against revision {data.revision ?? "\u2014"}, the last version the sender wrote themselves
            {data.gapAt ? ". Run on " + new Date(data.gapAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : ""}
          </Text>

          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>Finding</Text>
              <Text style={[s.basis, { color: C.greenText, backgroundColor: C.greenSoft, borderColor: C.greenLine }]}>OBSERVED</Text>
            </View>
            <View style={s.cardBody}>
              <Text style={[s.claim, { fontSize: 11 }]}>{gap.headline}</Text>
              <Text style={[s.para, { marginTop: 9 }]}>{gap.finding}</Text>
            </View>
          </View>

          {gap.claims.length > 0 && (
            <Card title="Claim by claim" basis="observed">
              <View style={s.th}>
                <Text style={[s.thText, { flex: 1 }]}>WHAT WAS SAID</Text>
                <Text style={[s.thText, { flex: 1 }]}>WHAT HAPPENED</Text>
                <Text style={[s.thText, { width: 82 }]}>MOVEMENT</Text>
              </View>
              {gap.claims.map((x, i) => (
                <View key={i} style={i === gap.claims.length - 1 ? s.rowLast : s.td}>
                  <Text style={[s.tdText, { flex: 1, paddingRight: 8 }]}>{x.stated}</Text>
                  <Text style={[s.tdText, { flex: 1, paddingRight: 8 }]}>{x.observed}</Text>
                  <Text style={[s.tdText, { width: 82, color: x.movement === "contradicted" ? C.danger : x.movement === "holding" ? C.greenText : C.muted }]}>
                    {x.movement}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          <Card title="What this does not tell you" basis="observed">
            <View style={s.cardBody}><Text style={s.para}>{gap.doesNotTell}</Text></View>
          </Card>

          <Callout tone="amber">
            Nothing here changes the profile on its own. A system that quietly rewrote what somebody believes, using
            data it collected itself, would agree with itself within two revisions and stop being worth opening.
          </Callout>

          <Foot />
        </Page>
      ) : null}
    </Document>
  );
}
