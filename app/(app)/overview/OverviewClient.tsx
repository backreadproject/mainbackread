"use client";
import { T, microLabel } from "@/lib/theme";

function greeting() { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 18) return "Good afternoon"; return "Good evening"; }
function ago(iso: string) { const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }

type Stats = { documents: number; recipients: number; reads: number; questions: number };
type Ev = { text: string; at: string; kind: string };

export default function OverviewClient({ stats, recentEvents, hasData }: { stats: Stats; recentEvents: Ev[]; hasData: boolean }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
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
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>Here's how your documents are being read today.</p>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, color: T.muted }}>{today}</div></div>
        </div>

        {!hasData ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 56, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.doc} /></svg></div>
            <p style={{ fontSize: 17, fontWeight: 700, color: T.heading, margin: "0 0 6px", letterSpacing: T.trackingTight }}>No documents yet</p>
            <p style={{ fontSize: 14, color: T.body, margin: "0 0 20px" }}>Add your first document and share a tracked link to start reading your readers.</p>
            <a href="/documents" style={{ display: "inline-block", background: T.green, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: T.rBtn, textDecoration: "none" }}>Add a document →</a>
          </div>
        ) : (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
            <StatCard icon={ICONS.doc} label="Documents" value={stats.documents} sub="shared" />
            <StatCard icon={ICONS.users} label="Recipients" value={stats.recipients} sub="total readers" />
            <StatCard icon={ICONS.eye} label="Reads" value={stats.reads} sub="opened so far" />
            <StatCard icon={ICONS.msg} label="Questions" value={stats.questions} sub="asked" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>Recent activity</span>
                <a href="/activity" style={{ fontSize: 13, color: T.green, textDecoration: "none", fontWeight: 600 }}>See all</a>
              </div>
              {recentEvents.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", fontSize: 14, color: T.muted }}>No reads or questions yet.</div>
              ) : recentEvents.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 18px", borderBottom: i < recentEvents.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{e.kind === "opened" ? <path d={ICONS.eye} /> : <path d={ICONS.msg} />}</svg></span>
                  <span style={{ fontSize: 14, color: T.heading, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text}</span>
                  <span style={{ fontSize: 12, color: T.muted, flexShrink: 0 }}>{ago(e.at)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 22 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>Quick actions</span>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="/documents" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: `1px solid ${T.border}`, borderRadius: 10, textDecoration: "none" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14 M5 12h14" /></svg></span>
                  <div><div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>Add a document</div><div style={{ fontSize: 12, color: T.muted }}>Upload a PDF to share</div></div>
                </a>
                <a href="/recipients" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: `1px solid ${T.border}`, borderRadius: 10, textDecoration: "none" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.users} /></svg></span>
                  <div><div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>View recipients</div><div style={{ fontSize: 12, color: T.muted }}>See who's reading</div></div>
                </a>
              </div>
            </div>
          </div>
        </>)}
      </main>
    </div>
  );
}
