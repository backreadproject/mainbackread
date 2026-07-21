"use client";
import { useState, useMemo } from "react";
import { T, microLabel } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Row = { id: string; label: string | null; documentTitle: string; createdAt: string; opened: boolean; questions: number };
type Stats = { total: number; opened: number; unopened: number; questions: number; escalated: number };
const ICONS = { users: "M8 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M22 20a6 6 0 00-4-5.6", eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z", msg: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", alert: "M12 9v4 M12 17h.01 M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L14 3.9a2 2 0 00-3.4 0z" };
function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: number; sub: string }) {
  return (<div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 16 }}>
    <div style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg></div>
    <div style={{ ...microLabel, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.heading, marginBottom: 4, letterSpacing: T.trackingTight }}>{value}</div>
    <div style={{ fontSize: 12, color: T.muted }}>{sub}</div>
  </div>);
}
export default function RecipientsClient({ rows, stats }: { rows: Row[]; stats: Stats }) {
  const locale = useLocale();
  const rp = getDict(locale).recipientsPage;
  const [filter, setFilter] = useState<"all" | "opened" | "unopened">("all");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    let r = rows;
    if (filter === "opened") r = r.filter((x) => x.opened);
    if (filter === "unopened") r = r.filter((x) => !x.opened);
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((x) => (x.label ?? "unnamed reader").toLowerCase().includes(t) || x.documentTitle.toLowerCase().includes(t));
    return r;
  }, [rows, filter, q]);
  const seg = (key: typeof filter, label: string) => (<button onClick={() => setFilter(key)} style={{ background: filter === key ? T.green : "transparent", color: filter === key ? "#fff" : T.body, fontSize: 13, fontWeight: filter === key ? 600 : 500, padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: T.font }}>{label}</button>);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-row{transition:background .12s;text-decoration:none;color:inherit}.t-row:hover{background:#FCFCFD}.t-in:focus{border-color:${T.green};outline:none}`}</style>
      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ display: "inline-flex", gap: 4, background: "#EDEFF2", padding: 4, borderRadius: 9, marginBottom: 22 }}>{seg("all", rp.filterAll)}{seg("opened", rp.filterOpened)}{seg("unopened", rp.filterUnopened)}</div>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{rp.title}</h1>
          <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{rp.subtitle}</p>
        </div>
        <div className="stat-grid" style={{ marginBottom: 22 }}>
          <StatCard icon={ICONS.users} label={rp.statTotalReaders} value={stats.total} sub={`${stats.total} ${rp.statShared}`} />
          <StatCard icon={ICONS.eye} label={rp.statOpened} value={stats.opened} sub={`${stats.unopened} ${rp.statNotYet}`} />
          <StatCard icon={ICONS.msg} label={rp.statQuestions} value={stats.questions} sub={rp.statAskedTotal} />
          <StatCard icon={ICONS.alert} label={rp.statEscalated} value={stats.escalated} sub={rp.statNeedReply} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.muted }}>{filtered.length} {filtered.length === 1 ? rp.readerCountOne : rp.readerCountMany}</span>
            <input className="t-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder={rp.searchReaders} style={{ marginLeft: "auto", width: 220, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "7px 11px", fontSize: 13, fontFamily: T.font, background: "#fff" }} />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}><p style={{ fontSize: 15, color: T.body, margin: 0 }}>{rows.length === 0 ? rp.emptyNone : rp.emptyFilter}</p></div>
          ) : (<>
            <div className="row-head" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 0.8fr 0.7fr 0.9fr", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
              <span>{rp.colReader}</span><span>{rp.colDocument}</span><span>{rp.colQuestions}</span><span>{rp.colShared}</span><span>{rp.colStatus}</span>
            </div>
            {filtered.map((r, i) => (
              <a key={r.id} href={`/recipients/${r.id}`} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 0.8fr 0.7fr 0.9fr", gap: 12, padding: "15px 18px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                <span className="data-cell dc-title" style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label || rp.unnamedReader}</span>
                <span className="data-cell" data-label={rp.colDocument} style={{ fontSize: 14, color: T.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.documentTitle}</span>
                <span className="data-cell" data-label={rp.colQuestions} style={{ fontSize: 14, color: r.questions > 0 ? T.heading : T.muted, fontWeight: r.questions > 0 ? 600 : 400 }}>{r.questions}</span>
                <span className="data-cell" data-label={rp.colShared} style={{ fontSize: 14, color: T.body }}>{new Date(r.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : undefined, { day: "numeric", month: "short" })}</span>
                <span className="data-cell" data-label={rp.colStatus}><span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: r.opened ? T.pillPosBg : T.pillNeutralBg, color: r.opened ? T.pillPosText : T.pillNeutralText }}>{r.opened ? rp.statusOpened : rp.statusNew}</span></span>
              </a>
            ))}
          </>)}
        </div>
      </main>
    </div>
  );
}


