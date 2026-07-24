"use client";
import { Eye, MessageSquare } from "lucide-react";
import { T, microLabel, statTile, statTileInk, statTileSub } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
export default function ActivityClient({ events, stats }: { events: { text: string; at: string; kind: string }[]; stats: { total: number; opens: number; questions: number } }) {
  const locale = useLocale();
  const ap = getDict(locale).activityPage;
  function ago(iso: string) { const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return ap.justNow; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`; }
  const stat = (label: string, value: number, tone: "green" | "amber" | "indigo" | "neutral" = "neutral") => (<div style={statTile(tone)}><div style={{ ...microLabel, color: statTileSub(tone), marginBottom: 8 }}>{label}</div><div style={{ fontSize: 27, fontWeight: 600, color: statTileInk(tone), letterSpacing: "-0.04em", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{value}</div></div>);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "26px 30px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{ap.title}</h1>
          <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{ap.subtitle}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>{stat(ap.events, stats.total, "neutral")}{stat(ap.opens, stats.opens, "green")}{stat(ap.questions, stats.questions, "amber")}</div>
        {events.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 40, textAlign: "center" }}><p style={{ fontSize: 15, color: T.body, margin: 0 }}>{ap.empty}</p></div>
        ) : (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden" }}>
            {events.map((e, i) => (
              <div key={i} className="data-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < events.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {e.kind === "opened" ? <Eye size={14} strokeWidth={1.9} /> : <MessageSquare size={14} strokeWidth={1.9} />}
                </span>
                <span style={{ fontSize: 15, color: T.heading, flex: 1 }}>{e.text}</span>
                <span style={{ fontSize: 13, color: T.muted, flexShrink: 0 }}>{ago(e.at)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}







