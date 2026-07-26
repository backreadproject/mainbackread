import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ReportOutput } from "@/lib/ai";
import type { AssembledReport } from "@/lib/report-data";
import type { Branding } from "@/lib/report-cache";
// The report a customer forwards to their own boss.
//
// Built with the app's own tokens so it looks like the product rather than like
// a generated attachment. Helvetica is used deliberately: registering Inter
// would mean shipping font files and a network fetch at render time, and a
// report that fails to render because a font 404d is worse than one set in a
// standard face.
//
// THE PRIORITIES PAGE MUST READ ALONE. Someone will forward page two to a
// colleague without the cover, so each priority carries the name, the reason
// and the action in one block rather than referring back.
const C = {
  ink: "#101828", body: "#344054", muted: "#667085", faint: "#98A2B3",
  line: "#E4E7EC", soft: "#F9FAFB", green: "#1F6F4A", greenText: "#14603C",
  greenSoft: "#ECF6F0", greenLine: "#CFE7DA", amber: "#B54708",
};
const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48, fontSize: 10, color: C.body, fontFamily: "Helvetica", lineHeight: 1.5 },
  eyebrow: { fontSize: 8, color: C.faint, letterSpacing: 0.9, marginBottom: 8 },
  h1: { fontSize: 22, color: C.ink, fontFamily: "Helvetica-Bold", lineHeight: 1.25, marginBottom: 10 },
  h2: { fontSize: 12, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 10, marginTop: 4 },
  sub: { fontSize: 10, color: C.muted, marginBottom: 22 },
  lead: { fontSize: 11, color: C.body, lineHeight: 1.65 },
  rule: { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 18 },
  statRow: { flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 4 },
  stat: { flex: 1, padding: 11, borderLeftWidth: 1, borderLeftColor: C.line },
  statFirst: { flex: 1, padding: 11 },
  statV: { fontSize: 16, color: C.ink, fontFamily: "Helvetica-Bold" },
  statL: { fontSize: 8, color: C.muted, marginTop: 2 },
  prio: { borderWidth: 1, borderColor: C.greenLine, borderRadius: 4, padding: 13, marginBottom: 10 },
  prioName: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  prioWhy: { fontSize: 9.5, color: C.body, marginBottom: 8 },
  actionBox: { backgroundColor: C.greenSoft, borderRadius: 3, padding: 9 },
  actionK: { fontSize: 7.5, color: C.greenText, letterSpacing: 0.8, marginBottom: 3 },
  actionV: { fontSize: 9.5, color: C.ink, lineHeight: 1.5 },
  bullet: { flexDirection: "row", marginBottom: 6 },
  dot: { width: 3, height: 3, backgroundColor: C.green, borderRadius: 1.5, marginTop: 5, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 9.5, color: C.body, lineHeight: 1.55 },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: 12, marginBottom: 9 },
  rName: { fontSize: 10.5, color: C.ink, fontFamily: "Helvetica-Bold" },
  rOrg: { fontSize: 8.5, color: C.muted, marginBottom: 7 },
  meta: { flexDirection: "row", marginBottom: 7 },
  metaCell: { marginRight: 22 },
  metaV: { fontSize: 11, color: C.ink, fontFamily: "Helvetica-Bold" },
  metaL: { fontSize: 7.5, color: C.muted },
  quote: { borderLeftWidth: 2, borderLeftColor: C.greenLine, paddingLeft: 8, marginBottom: 5, fontSize: 9, color: C.body, lineHeight: 1.5 },
  limits: { backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderRadius: 4, padding: 12 },
  foot: { position: "absolute", bottom: 30, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.faint },
  brandRow: { flexDirection: "row", alignItems: "center", paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.line },
  metaRow: { flexDirection: "row", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 30 },
  metaCol: { flex: 1, paddingRight: 16 },
  logo: { width: 34, height: 34, marginRight: 11, objectFit: "contain" },
  brandName: { fontSize: 12, color: C.ink, fontFamily: "Helvetica-Bold" },
  forBox: { borderTopWidth: 1, borderTopColor: C.line, marginTop: 26, paddingTop: 14, flexDirection: "row" },
  forCell: { marginRight: 34 },
  forK: { fontSize: 7.5, color: C.faint, letterSpacing: 0.8, marginBottom: 3 },
  forV: { fontSize: 10, color: C.ink },
  note: { backgroundColor: C.soft, borderLeftWidth: 2, borderLeftColor: C.greenLine, padding: 11, marginTop: 16, fontSize: 9.5, color: C.body, lineHeight: 1.55 },
});
function mins(sec: number): string {
  if (sec < 60) return sec + "s";
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return r ? m + "m " + r + "s" : m + "m";
}
const Foot = ({ title }: { title: string }) => (
  <View style={s.foot} fixed>
    <Text>{title}</Text>
    <Text render={({ pageNumber, totalPages }) => pageNumber + " of " + totalPages} />
  </View>
);
export type ReportSections = {
  appendix: boolean;
  pageAttention: boolean;
  neverOpened: boolean;
};
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
  const footTitle = data.documentTitle + "  \u00b7  " + dateStr + (generatedFor ? "  \u00b7  " + generatedFor : "");

  return (
    <Document title={"Reading report \u2014 " + data.documentTitle} author="ReadProspects">
      {/* Cover. One claim, the numbers behind it, and the prose. */}
      <Page size="A4" style={s.page}>
        {(branding?.logoUrl || branding?.companyName) && (
          <View style={s.brandRow}>
            {branding?.logoUrl ? <Image style={s.logo} src={branding.logoUrl} /> : null}
            {branding?.companyName ? <Text style={s.brandName}>{branding.companyName}</Text> : null}
          </View>
        )}
        <View style={s.metaRow}>
          {branding?.reporter ? (
            <View style={s.metaCol}>
              <Text style={s.forK}>PREPARED BY</Text>
              <Text style={s.forV}>{branding.reporter}</Text>
            </View>
          ) : null}
          {branding?.recipient ? (
            <View style={s.metaCol}>
              <Text style={s.forK}>
                {branding.recipientKind === "department" ? "FOR THE TEAM"
                  : branding.recipientKind === "organisation" ? "FOR"
                  : "PREPARED FOR"}
              </Text>
              <Text style={s.forV}>{branding.recipient}</Text>
            </View>
          ) : null}
          <View style={s.metaCol}>
            <Text style={s.forK}>DATE</Text>
            <Text style={s.forV}>{dateStr}</Text>
          </View>
        </View>
        <Text style={s.eyebrow}>READING REPORT</Text>
        <Text style={s.h1}>{data.documentTitle}</Text>
        <Text style={s.sub}>
          {data.input.scope === "document" ? "Every reader" : data.detail.length + " selected readers"}
          {"  \u00b7  "}{dateStr}
        </Text>

        <View style={s.statRow}>
          <View style={s.statFirst}><Text style={s.statV}>{data.totalRecipients}</Text><Text style={s.statL}>Recipients</Text></View>
          <View style={s.stat}><Text style={s.statV}>{opened}</Text><Text style={s.statL}>Opened it</Text></View>
          <View style={s.stat}><Text style={s.statV}>{totalQ}</Text><Text style={s.statL}>Questions asked</Text></View>
          <View style={s.stat}><Text style={s.statV}>{totalR}</Text><Text style={s.statL}>Replied</Text></View>
        </View>

        <View style={s.rule} />
        <Text style={[s.h1, { fontSize: 15 }]}>{report.headline}</Text>
        <Text style={s.lead}>{report.summary}</Text>

        {branding?.note ? <Text style={s.note}>{branding.note}</Text> : null}



        <Foot title={footTitle} />
      </Page>

      {/* Priorities. Written to survive being forwarded on its own. */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>WHAT TO DO</Text>
        <Text style={[s.h1, { fontSize: 16 }]}>
          {report.priorities.length === 0
            ? "Nothing here warrants action yet."
            : report.priorities.length + (report.priorities.length === 1 ? " reader worth acting on" : " readers worth acting on")}
        </Text>
        <Text style={s.sub}>{data.documentTitle} {"\u00b7"} {dateStr}{branding?.reporter ? "  \u00b7  prepared by " + branding.reporter : ""}</Text>

        {report.priorities.length === 0 ? (
          <Text style={s.lead}>
            The signals so far do not support recommending a specific move. Acting on this would be guessing.
          </Text>
        ) : report.priorities.map((p, i) => (
          <View key={i} style={s.prio} wrap={false}>
            <Text style={s.prioName}>{p.reader}</Text>
            <Text style={s.prioWhy}>{p.why}</Text>
            <View style={s.actionBox}>
              <Text style={s.actionK}>DO THIS</Text>
              <Text style={s.actionV}>{p.action}</Text>
            </View>
          </View>
        ))}
        <Foot title={footTitle} />
      </Page>

      {/* What the document did to people. */}
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>THE DOCUMENT</Text>
        <Text style={[s.h1, { fontSize: 16 }]}>How it was read</Text>

        {report.patterns.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={s.h2}>Patterns across readers</Text>
            {report.patterns.map((p, i) => (
              <View key={i} style={s.bullet}><View style={s.dot} /><Text style={s.bulletText}>{p}</Text></View>
            ))}
          </View>
        )}

        {report.documentFindings.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={s.h2}>What the document itself is doing</Text>
            {report.documentFindings.map((f, i) => (
              <View key={i} style={s.bullet}><View style={s.dot} /><Text style={s.bulletText}>{f}</Text></View>
            ))}
          </View>
        )}

        {sections.pageAttention && data.input.pageTotals.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={s.h2}>Where attention went</Text>
            {data.input.pageTotals.slice(0, 8).map((p) => {
              const max = data.input.pageTotals[0].seconds || 1;
              return (
                <View key={p.page} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                  <Text style={{ width: 46, fontSize: 9, color: C.muted }}>Page {p.page}</Text>
                  <View style={{ flex: 1, height: 5, backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderRadius: 2, marginRight: 9 }}>
                    <View style={{ width: Math.max(2, Math.round((p.seconds / max) * 100)) + "%", height: "100%", backgroundColor: C.green }} />
                  </View>
                  <Text style={{ width: 92, fontSize: 8.5, color: C.body, textAlign: "right" }}>
                    {mins(p.seconds)} {"\u00b7"} {p.readers} reader{p.readers === 1 ? "" : "s"}
                  </Text>
                </View>
              );
            })}
            <Text style={{ fontSize: 8, color: C.faint, marginTop: 6, lineHeight: 1.5 }}>
              Total time on each page across everyone who opened it. Dwell is a proxy for attention, not a statement of interest.
            </Text>
          </View>
        )}

        <View style={s.limits}>
          <Text style={{ fontSize: 8, color: C.muted, letterSpacing: 0.8, marginBottom: 4 }}>WHAT THIS CANNOT TELL YOU</Text>
          <Text style={{ fontSize: 9, color: C.body, lineHeight: 1.55 }}>{report.limits}</Text>
        </View>
        <Foot title={footTitle} />
      </Page>

      {/* Every reader, in full. The evidence behind everything above. */}
      {sections.appendix ? (
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>APPENDIX</Text>
        <Text style={[s.h1, { fontSize: 16 }]}>Every reader</Text>
        <Text style={s.sub}>The evidence behind the findings, in full.</Text>

        {data.detail
          .slice()
          .filter((d) => sections.neverOpened || d.opens > 0)
          .sort((a, b) => (b.replies.length - a.replies.length) || (b.questions.length - a.questions.length) || (b.seconds - a.seconds))
          .map((d) => (
            <View key={d.id} style={s.card} wrap={false}>
              <Text style={s.rName}>{d.name}</Text>
              <Text style={s.rOrg}>{[d.org, d.email].filter(Boolean).join("  \u00b7  ") || "No address on file"}</Text>
              <View style={s.meta}>
                <View style={s.metaCell}><Text style={s.metaV}>{d.opens}</Text><Text style={s.metaL}>opens</Text></View>
                <View style={s.metaCell}><Text style={s.metaV}>{mins(d.seconds)}</Text><Text style={s.metaL}>on the document</Text></View>
                <View style={s.metaCell}><Text style={s.metaV}>{d.questions.length}</Text><Text style={s.metaL}>questions</Text></View>
                <View style={s.metaCell}><Text style={s.metaV}>{d.forwardedTo.length}</Text><Text style={s.metaL}>forwards</Text></View>
              </View>
              {d.replies.map((r, i) => (
                <View key={"r" + i} style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 7.5, color: C.greenText, letterSpacing: 0.6, marginBottom: 2 }}>THEY REPLIED</Text>
                  <Text style={s.quote}>{r}</Text>
                </View>
              ))}
              {d.questions.slice(0, 4).map((q, i) => (
                <Text key={"q" + i} style={s.quote}>
                  {"\u201c" + q.text + "\u201d"}{q.page ? "  \u00b7  page " + q.page : ""}
                </Text>
              ))}
              {d.opens === 0 && (
                <Text style={{ fontSize: 9, color: C.amber }}>Never opened it.</Text>
              )}
            </View>
          ))}
        <Foot title={footTitle} />
      </Page>
      ) : null}
    </Document>
  );
}