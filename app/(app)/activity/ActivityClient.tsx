"use client";
import { T, microLabel } from "@/lib/theme";
function ago(iso: string) { const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }
export default function ActivityClient({ events, stats }: { events: { text: string; at: string; kind: string }[]; stats: { total: number; opens: number; questions: number } }) {
  const stat = (label: string, value: number) => (<div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "14px 16px", flex: 1 }}><div style={{ ...microLabel, marginBottom: 6 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight }}>{value}</div></div>);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 760, padding: "26px 30px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>Activity</h1>
          <p style={{ fontSize: 14, color: T.body, margin: 0 }}>Everything your readers have done, newest first.</p>
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>{stat("Events", stats.total)}{stat("Opens", stats.opens)}{stat("Questions", stats.questions)}</div>
        {events.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 40, textAlign: "center" }}><p style={{ fontSize: 15, color: T.body, margin: 0 }}>No activity yet. Share a document, and reads and questions show up here.</p></div>
        ) : (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden" }}>
            {events.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < events.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{e.kind === "opened" ? <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z" /> : <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />}</svg>
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
