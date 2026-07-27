import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ReportOutput } from "@/lib/ai";
import type { AssembledReport } from "@/lib/report-data";
import type { Branding } from "@/lib/report-cache";
// The reading report.
//
// Built to the same rules as the erasure certificate, which is the densest
// thing in the product: a fixed-width label column, hairline dividers, one soft
// header strip per card, and no decoration. The certificate uses CSS grid for
// its label/value rows; react-pdf has no grid, so the same effect comes from a
// flex row with a fixed left column.
//
// THE PRIORITIES PAGE MUST READ ALONE. Someone will forward page two without
// the cover, so it repeats the document, the date and the author.
const C = {
  ink: "#101828", body: "#344054", muted: "#667085", faint: "#98A2B3",
  line: "#E4E7EC", lineSoft: "#EFF1F4", soft: "#F9FAFB",
  green: "#1F6F4A", greenText: "#14603C", greenSoft: "#ECF6F0", greenLine: "#CFE7DA",
  amber: "#B54708",
};
const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 44, fontSize: 9.5, color: C.body, fontFamily: "Helvetica", lineHeight: 1.5 },
  // Running header. The eyebrow says what the section is; the customer's own
  // text sits opposite it rather than above everything, so it never competes
  // with the section title.
  runHead: { position: "absolute", top: 22, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint },
  eyebrow: { fontSize: 7.5, color: C.faint, letterSpacing: 0.8 },
  h1: { fontSize: 20, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.22, letterSpacing: -0.3 },
  h2: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  sub: { fontSize: 9, color: C.muted, marginTop: 5 },
  mono: { fontSize: 8, color: C.muted, fontFamily: "Courier", marginBottom: 5 },
  // Masthead: who made this, before what it says.
  brandRow: { flexDirection: "row", alignItems: "center", paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line },
  logo: { width: 30, height: 30, marginRight: 10, objectFit: "contain" },
  brandName: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold" },
  metaRow: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 24 },
  metaCol: { flex: 1, paddingRight: 14 },
  metaK: { fontSize: 7, color: C.faint, letterSpacing: 0.7, marginBottom: 3 },
  metaV: { fontSize: 9.5, color: C.ink },
  // The card, straight from the certificate.
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 3, marginBottom: 12 },
  cardHead: { paddingVertical: 7, paddingHorizontal: 13, backgroundColor: C.soft, borderBottomWidth: 1, borderBottomColor: C.line, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.body },
  cardBody: { padding: 13 },
  row: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  rowLast: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 13 },
  rowK: { width: 132, fontSize: 8.5, color: C.muted, paddingRight: 10 },
  rowV: { flex: 1, fontSize: 9, color: C.ink },
  // Figures across the top of the cover.
  figures: { flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 3 },
  fig: { flex: 1, paddingVertical: 10, paddingHorizontal: 13, borderLeftWidth: 1, borderLeftColor: C.line },
  figFirst: { flex: 1, paddingVertical: 10, paddingHorizontal: 13 },
  figV: { fontSize: 15, color: C.ink, fontFamily: "Helvetica-Bold" },
  figK: { fontSize: 7.5, color: C.muted, marginTop: 2 },
  lead: { fontSize: 10, color: C.body, lineHeight: 1.6 },
  claim: { fontSize: 13, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.4 },
  // One priority. Bordered, not filled, so six of them do not become a wall.
  prio: { borderWidth: 1, borderColor: C.line, borderRadius: 3, marginBottom: 9 },
  prioTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 9, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  prioName: { fontSize: 10.5, color: C.ink, fontFamily: "Helvetica-Bold" },
  prioStat: { fontSize: 8, color: C.muted },
  prioWhy: { fontSize: 9, color: C.body, paddingHorizontal: 13, paddingTop: 9, lineHeight: 1.55 },
  action: { backgroundColor: C.greenSoft, borderTopWidth: 1, borderTopColor: C.greenLine, marginTop: 9, paddingVertical: 9, paddingHorizontal: 13 },
  actionK: { fontSize: 7, color: C.greenText, letterSpacing: 0.7, marginBottom: 3 },
  actionV: { fontSize: 9, color: C.ink, lineHeight: 1.5 },
  bullet: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  dot: { width: 2.5, height: 2.5, backgroundColor: C.green, borderRadius: 1.25, marginTop: 5, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 9, color: C.body, lineHeight: 1.55 },
  barRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  barK: { width: 42, fontSize: 8.5, color: C.muted },
  barTrack: { flex: 1, height: 4, backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderRadius: 1, marginRight: 9 },
  barV: { width: 96, fontSize: 8, color: C.body, textAlign: "right" },
  verdictBox: { backgroundColor: C.greenSoft, borderTopWidth: 1, borderTopColor: C.greenLine, paddingVertical: 9, paddingHorizontal: 13 },
  verdictK: { fontSize: 7, color: C.greenText, letterSpacing: 0.7, marginBottom: 3 },
  verdictH: { fontSize: 9.5, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.4, marginBottom: 4 },
  verdictR: { fontSize: 8.5, color: C.body, lineHeight: 1.5, marginBottom: 5 },
  quote: { borderLeftWidth: 1.5, borderLeftColor: C.greenLine, paddingLeft: 8, marginBottom: 4, fontSize: 8.5, color: C.body, lineHeight: 1.5 },
  foot: { position: "absolute", bottom: 26, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", fontSize: 7, color: C.faint },
  note: { fontSize: 8, color: C.faint, paddingHorizontal: 13, paddingTop: 8, lineHeight: 1.5 },
});
function mins(sec: number): string {
  if (sec <= 0) return "\u2014";
  if (sec < 60) return sec + "s";
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r ? m + "m " + r + "s" : m + "m";
}
export type ReportSections = { appendix: boolean; pageAttention: boolean; neverOpened: boolean };
export const ALL_SECTIONS: ReportSections = { appendix: true, pageAttention: true, neverOpened: true };
export function ReportDocument({ report, data, generatedFor, generatedAt, branding, sections = ALL_SECTIONS }: {
  report: ReportOutput;
  data: AssembledReport;
  generatedFor: string;
  generatedAt: Date;
  branding?: Branding;
  sections?: ReportSections;
}) {
  const opened = data.detail.filter((d) => d.opens > 0).length;
  const totalQ = data.detail.reduce((n, d) => n + d.questions.length, 0);
  const totalR = data.detail.reduce((n, d) => n + d.replies.length, 0);
  const dateStr = generatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const shown = data.detail.slice().filter((d) => sections.neverOpened || d.opens > 0)
    .sort((a, b) => (b.replies.length - a.replies.length) || (b.questions.length - a.questions.length) || (b.seconds - a.seconds));

  const Head = ({ label }: { label: string }) => (
    <View style={s.runHead} fixed>
      <Text style={s.eyebrow}>{label}</Text>
      <Text>{branding?.headerText ?? ""}</Text>
    </View>
  );
  const Foot = () => (
    <View style={s.foot} fixed>
      <Text>{branding?.footerText || data.documentTitle}</Text>
      <Text render={({ pageNumber, totalPages }) =>
        (branding?.signature === false ? "" : "Generated from ReadProspects   \u00b7   ") + pageNumber + " / " + totalPages
      } />
    </View>
  );
  const Row = ({ k, v, last }: { k: string; v: string; last?: boolean }) => (
    <View style={last ? s.rowLast : s.row}>
      <Text style={s.rowK}>{k}</Text>
      <Text style={s.rowV}>{v}</Text>
    </View>
  );

  return (
    <Document title={"Reading report \u2014 " + data.documentTitle} author={branding?.reporter || "ReadProspects"}>
      {/* Cover. Authored, then read. */}
      <Page size="A4" style={s.page}>
        <Head label="READING REPORT" />

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

        <Text style={s.mono}>{data.input.scope === "document" ? "EVERY READER" : shown.length + " SELECTED READERS"}</Text>
        <Text style={s.h1}>{data.documentTitle}</Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>{data.totalRecipients} recipients</Text>

        <View style={s.figures}>
          <View style={s.figFirst}><Text style={s.figV}>{data.totalRecipients}</Text><Text style={s.figK}>Recipients</Text></View>
          <View style={s.fig}><Text style={s.figV}>{opened}</Text><Text style={s.figK}>Opened it</Text></View>
          <View style={s.fig}><Text style={s.figV}>{totalQ}</Text><Text style={s.figK}>Questions</Text></View>
          <View style={s.fig}><Text style={s.figV}>{totalR}</Text><Text style={s.figK}>Replied</Text></View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={s.claim}>{report.headline}</Text>
          <Text style={[s.lead, { marginTop: 10 }]}>{report.summary}</Text>
        </View>

        {branding?.note ? (
          <View style={[s.card, { marginTop: 22 }]}>
            <Text style={s.cardHead}>Note</Text>
            <View style={s.cardBody}><Text style={{ fontSize: 9, color: C.body, lineHeight: 1.55 }}>{branding.note}</Text></View>
          </View>
        ) : null}

        <Foot />
      </Page>

      {/* What to do. Written to survive being forwarded alone. */}
      <Page size="A4" style={s.page}>
        <Head label="WHAT TO DO" />
        <Text style={s.h1}>
          {report.priorities.length === 0
            ? "Nothing here warrants action yet"
            : report.priorities.length + (report.priorities.length === 1 ? " reader worth acting on" : " readers worth acting on")}
        </Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>
          {data.documentTitle} {"\u00b7"} {dateStr}{branding?.reporter ? "  \u00b7  prepared by " + branding.reporter : ""}
        </Text>

        {report.priorities.length === 0 ? (
          <Text style={s.lead}>The signals do not support recommending a specific move. Acting on this would be guessing.</Text>
        ) : report.priorities.map((p, i) => {
          const d = data.detail.find((x) => x.name === p.reader);
          const stat = d ? d.opens + " opens" + (d.questions.length ? "  \u00b7  " + d.questions.length + " questions" : "") + (d.forwardedTo.length ? "  \u00b7  forwarded" : "") : "";
          return (
            <View key={i} style={s.prio} wrap={false}>
              <View style={s.prioTop}>
                <Text style={s.prioName}>{p.reader}</Text>
                <Text style={s.prioStat}>{stat}</Text>
              </View>
              <Text style={s.prioWhy}>{p.why}</Text>
              <View style={s.action}>
                <Text style={s.actionK}>DO THIS</Text>
                <Text style={s.actionV}>{p.action}</Text>
              </View>
            </View>
          );
        })}
        <Foot />
      </Page>

      {/* The document itself. */}
      <Page size="A4" style={s.page}>
        <Head label="THE DOCUMENT" />
        <Text style={s.h1}>How it was read</Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>{data.documentTitle} {"\u00b7"} {dateStr}</Text>

        {report.patterns.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardHead}>Patterns across readers</Text>
            {report.patterns.map((p, i) => (
              <View key={i} style={i === report.patterns.length - 1 ? [s.bullet, { borderBottomWidth: 0 }] : s.bullet}>
                <View style={s.dot} /><Text style={s.bulletText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {report.documentFindings.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardHead}>What the document is doing</Text>
            {report.documentFindings.map((f, i) => (
              <View key={i} style={i === report.documentFindings.length - 1 ? [s.bullet, { borderBottomWidth: 0 }] : s.bullet}>
                <View style={s.dot} /><Text style={s.bulletText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {sections.pageAttention && data.input.pageTotals.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardHead}>Where attention went</Text>
            {data.input.pageTotals.slice(0, 8).map((p, i, arr) => {
              const max = data.input.pageTotals[0].seconds || 1;
              return (
                <View key={p.page} style={i === arr.length - 1 ? [s.barRow, { borderBottomWidth: 0 }] : s.barRow}>
                  <Text style={s.barK}>Page {p.page}</Text>
                  <View style={s.barTrack}>
                    <View style={{ width: Math.max(2, Math.round((p.seconds / max) * 100)) + "%", height: "100%", backgroundColor: C.green }} />
                  </View>
                  <Text style={s.barV}>{mins(p.seconds)} {"\u00b7"} {p.readers} reader{p.readers === 1 ? "" : "s"}</Text>
                </View>
              );
            })}
            <Text style={[s.note, { paddingBottom: 9 }]}>
              Total time on each page across everyone who opened it. Dwell is a proxy for attention, not a statement of interest.
            </Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardHead}>What this cannot tell you</Text>
          <View style={s.cardBody}><Text style={{ fontSize: 9, color: C.body, lineHeight: 1.6 }}>{report.limits}</Text></View>
        </View>
        <Foot />
      </Page>

      {/* Appendix. The evidence. */}
      {sections.appendix ? (
        <Page size="A4" style={s.page}>
          <Head label="APPENDIX" />
          <Text style={s.h1}>Every reader</Text>
          <Text style={[s.sub, { marginBottom: 20 }]}>The evidence behind the findings, in full.</Text>

          {shown.map((d) => (
            <View key={d.id} style={s.card} wrap={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, paddingHorizontal: 13, backgroundColor: C.soft, borderBottomWidth: 1, borderBottomColor: C.line }}>
                <Text style={{ fontSize: 9.5, color: C.ink, fontFamily: "Helvetica-Bold" }}>{d.name}</Text>
                <Text style={{ fontSize: 7.5, color: C.muted }}>{[d.org, d.email].filter(Boolean).join("  \u00b7  ")}</Text>
              </View>
              <Row k="Opens" v={String(d.opens)} />
              <Row k="Time on the document" v={mins(d.seconds)} />
              <Row k="Questions asked" v={String(d.questions.length)} />
              <Row k="Forwarded to" v={d.forwardedTo.length ? d.forwardedTo.join(", ") : "\u2014"} last={d.replies.length === 0 && d.questions.length === 0 && d.opens > 0} />
              {d.opens === 0 && (
                <View style={s.rowLast}><Text style={s.rowK}>Status</Text><Text style={[s.rowV, { color: C.amber }]}>Never opened it</Text></View>
              )}
              {!d.verdict && d.opens > 0 && (
                <View style={{ paddingVertical: 8, paddingHorizontal: 13, borderTopWidth: 1, borderTopColor: C.lineSoft }}>
                  <Text style={{ fontSize: 8.5, color: C.muted, lineHeight: 1.5 }}>
                    No verdict has been run for this reader. Open them in ReadProspects and choose Read the reader to have their behaviour interpreted.
                  </Text>
                </View>
              )}
              {d.verdict && (
                <View style={s.verdictBox}>
                  <Text style={s.verdictK}>THE VERDICT {"\u00b7"} {d.verdict.confidence.toUpperCase()} CONFIDENCE</Text>
                  <Text style={s.verdictH}>{d.verdict.headline}</Text>
                  <Text style={s.verdictR}>{d.verdict.reasoning}</Text>
                  <Text style={{ fontSize: 8.5, color: C.greenText }}>Next: {d.verdict.nextAction}</Text>
                </View>
              )}
              {(d.replies.length > 0 || d.questions.length > 0) && (
                <View style={{ paddingHorizontal: 13, paddingTop: 9, paddingBottom: 4 }}>
                  {d.replies.map((r, i) => (
                    <View key={"r" + i} style={{ marginBottom: 6 }}>
                      <Text style={{ fontSize: 7, color: C.greenText, letterSpacing: 0.6, marginBottom: 2 }}>THEY REPLIED</Text>
                      <Text style={s.quote}>{r}</Text>
                    </View>
                  ))}
                  {d.questions.slice(0, 4).map((q, i) => (
                    <Text key={"q" + i} style={s.quote}>
                      {"\u201c" + q.text + "\u201d"}{q.page ? "  \u00b7  page " + q.page : ""}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
          <Foot />
        </Page>
      ) : null}
    </Document>
  );
}