"use client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Tone = "green" | "amber" | "indigo" | "neutral";
export default function ActivityClient({ events, stats }: { events: { text: string; at: string; kind: string }[]; stats: { total: number; opens: number; questions: number } }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const ap = getDict(locale).activityPage;
  function ago(iso: string) { const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return ap.justNow; if (s < 3600) return Math.floor(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; return Math.floor(s / 86400) + "d"; }
  const toneRule: Record<Tone, string> = { green: T.green, amber: T.amber, indigo: T.indigo, neutral: T.border };
  const cells: [number, string, Tone][] = [
    [stats.total, ap.events, "neutral"],
    [stats.opens, ap.opens, "green"],
    [stats.questions, ap.questions, "indigo"],
  ];
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}`}</style>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{ap.title}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{ap.subtitle}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginTop: 26 }} className="stat-strip">
          {cells.map(([v, l, tone], i) => (
            <div key={i} style={{ padding: "15px 18px", borderLeft: "3px solid " + toneRule[tone] }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 18, boxShadow: T.shadow }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body }}>
            <span>{fr ? "\u00c9v\u00e9nement" : "Event"}</span><span>{fr ? "Quand" : "When"}</span>
          </div>
          {events.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{ap.empty}</p></div>
          ) : events.map((e, i) => (
            <div key={i} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "13px 18px", borderBottom: i < events.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 13.5, color: T.heading, minWidth: 0 }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: e.kind === "opened" ? T.green : T.indigo }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text}</span>
              </span>
              <span style={{ fontSize: 13.5, color: T.faint, whiteSpace: "nowrap" }}>{ago(e.at)}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}