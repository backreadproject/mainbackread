"use client";
import { T, microLabel } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

type Stats = { documents: number; recipients: number; reads: number; questions: number };
type Ev = { text: string; at: string; kind: string };

export default function OverviewClient({ stats, recentEvents, hasData }: { stats: Stats; recentEvents: Ev[]; hasData: boolean }) {
  const locale = useLocale();
  const o = getDict(locale).overviewPage;
  function greeting() { const h = new Date().getHours(); if (h < 12) return o.goodMorning; if (h < 18) return o.goodAfternoon; return o.goodEvening; }
  function ago(iso: string) { const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return o.justNow; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`; }
  const today = new Date().toLocaleDateString(locale === "fr" ? "fr-FR" : undefined, { weekday: "long", month: "short", day: "numeric" });
  const ICONS = {
    doc: "M5 3h8l4 4v14H5z M13 3v4h4",
    users: "M8 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M22 20a6 6 0 00-4-5.6",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z",
    msg: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  };
  const StatCard = ({ icon, label, value, sub }: { icon: string; label: string; value: number; sub: string }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, marginBottom: 2 }}>{value}</div>
      <div style={{ ...microLabel, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{greeting()}</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{o.subtitle}</p>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, color: T.muted }}>{today}</div></div>
        </div>

        {!hasData ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 56, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.doc} /></svg></div>
            <p style={{ fontSize: 17, fontWeight: 700, color: T.heading, margin: "0 0 6px", letterSpacing: T.trackingTight }}>{o.emptyTitle}</p>
            <p style={{ fontSize: 14, color: T.body, margin: "0 0 20px" }}>{o.emptyBody}</p>
            <a href="/documents" style={{ display: "inline-block", background: T.green, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: T.rBtn, textDecoration: "none" }}>{o.addDocumentArrow} &rarr;</a>
          </div>
        ) : (<>
          <div className="stat-grid" style={{ marginBottom: 22 }}>
            <StatCard icon={ICONS.doc} label={o.statDocuments} value={stats.documents} sub={o.statDocumentsSub} />
            <StatCard icon={ICONS.users} label={o.statRecipients} value={stats.recipients} sub={o.statRecipientsSub} />
            <StatCard icon={ICONS.eye} label={o.statReads} value={stats.reads} sub={o.statReadsSub} />
            <StatCard icon={ICONS.msg} label={o.statQuestions} value={stats.questions} sub={o.statQuestionsSub} />
          </div>

          <div className="two-col">
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{o.recentActivity}</span>
                <a href="/activity" style={{ fontSize: 13, color: T.green, textDecoration: "none", fontWeight: 600 }}>{o.seeAll}</a>
              </div>
              {recentEvents.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", fontSize: 14, color: T.muted }}>{o.noActivity}</div>
              ) : recentEvents.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 18px", borderBottom: i < recentEvents.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{e.kind === "opened" ? <path d={ICONS.eye} /> : <path d={ICONS.msg} />}</svg></span>
                  <span style={{ fontSize: 14, color: T.heading, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text}</span>
                  <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>{ago(e.at)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 22 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{o.quickActions}</span>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="/documents" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: `1px solid ${T.border}`, borderRadius: 10, textDecoration: "none" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14 M5 12h14" /></svg></span>
                  <div><div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{o.qaAddDoc}</div><div style={{ fontSize: 12, color: T.muted }}>{o.qaAddDocSub}</div></div>
                </a>
                <a href="/recipients" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: `1px solid ${T.border}`, borderRadius: 10, textDecoration: "none" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.users} /></svg></span>
                  <div><div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{o.qaViewRecipients}</div><div style={{ fontSize: 12, color: T.muted }}>{o.qaViewRecipientsSub}</div></div>
                </a>
              </div>
            </div>
          </div>
        </>)}
      </main>
    </div>
  );
}
