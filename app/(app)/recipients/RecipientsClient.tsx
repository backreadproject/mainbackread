"use client";
import { useState, useMemo } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Row = { id: string; label: string | null; documentTitle: string; createdAt: string; opened: boolean; questions: number; outcome: string | null };
type Stats = { total: number; opened: number; unopened: number; questions: number; escalated: number; won: number };
type Tone = "green" | "amber" | "indigo" | "neutral";
const COLS = "1.5fr 1.5fr 0.8fr 0.9fr 1fr";
export default function RecipientsClient({ rows, stats }: { rows: Row[]; stats: Stats }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const rp = getDict(locale).recipientsPage;
  const [filter, setFilter] = useState<"all" | "opened" | "unopened" | "won">("all");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    let r = rows;
    if (filter === "opened") r = r.filter((x) => x.opened);
    if (filter === "unopened") r = r.filter((x) => !x.opened);
    if (filter === "won") r = r.filter((x) => x.outcome === "won");
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((x) => (x.label ?? "unnamed reader").toLowerCase().includes(t) || x.documentTitle.toLowerCase().includes(t));
    return r;
  }, [rows, filter, q]);
  // Concluded states, shown in place of opened/new.
  const OUT: Record<string, { label: string; tone: string }> = {
    won: { label: fr ? "Gagn\u00e9" : "Won", tone: T.green },
    lost: { label: fr ? "Perdu" : "Lost", tone: T.faint },
    no_decision: { label: fr ? "Sans suite" : "No decision", tone: T.amber },
  };
  const toneRule: Record<Tone, string> = { green: T.green, amber: T.amber, indigo: T.indigo, neutral: T.border };
  const sel = { height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 10px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.body };
  const cells: [number, string, Tone][] = [
    [stats.opened, rp.statOpened + " \u00b7 " + stats.unopened + " " + rp.statNotYet, "green"],
    [stats.escalated, rp.statEscalated + " \u00b7 " + rp.statNeedReply, "amber"],
    [stats.questions, rp.statQuestions, "indigo"],
    [stats.won, fr ? "gagn\u00e9s" : "won", "green"],
  ];
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-row{transition:background .12s;text-decoration:none;color:inherit}.t-row:hover{background:var(--rp-hover)}.rc-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{rp.title}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{rp.subtitle}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "26px 0 16px", flexWrap: "wrap" }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ ...sel, minWidth: 170 }}>
            <option value="all">{rp.filterAll}</option>
            <option value="opened">{rp.filterOpened}</option>
            <option value="unopened">{rp.filterUnopened}</option>
            <option value="won">{fr ? "Gagn\u00e9s" : "Won"}</option>
          </select>
          <input className="rc-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder={rp.searchReaders} style={{ ...sel, width: 240 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card }} className="stat-strip">
          {cells.map(([v, l, tone], i) => (
            <div key={i} style={{ padding: "15px 18px", borderLeft: "3px solid " + toneRule[tone] }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 18, boxShadow: T.shadow }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>{rp.colReader}</span><span>{rp.colDocument}</span><span>{rp.colQuestions}</span><span>{rp.colShared}</span><span>{rp.colStatus}</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{rows.length === 0 ? rp.emptyNone : rp.emptyFilter}</p></div>
          ) : filtered.map((r, i) => (
            <a key={r.id} href={"/recipients/" + r.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "13px 18px", borderBottom: i < filtered.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
              <span className="data-cell dc-title" style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid " + T.border, paddingBottom: 1, justifySelf: "start", maxWidth: "100%" }}>{r.label || rp.unnamedReader}</span>
              <span className="data-cell" data-label={rp.colDocument} style={{ fontSize: 13.5, color: T.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.documentTitle}</span>
              <span className="data-cell" data-label={rp.colQuestions} style={{ fontSize: 13.5, color: r.questions > 0 ? T.heading : T.faint, fontWeight: r.questions > 0 ? 500 : 400, fontVariantNumeric: "tabular-nums" }}>{r.questions}</span>
              <span className="data-cell" data-label={rp.colShared} style={{ fontSize: 13.5, color: T.faint, whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString(fr ? "fr-FR" : undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="data-cell" data-label={rp.colStatus}>
                {r.outcome && OUT[r.outcome] ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontSize: 13.5, color: T.heading }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: OUT[r.outcome].tone }} />
                    {OUT[r.outcome].label}
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontSize: 13.5, color: T.heading }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: r.opened ? T.green : T.faint }} />
                    {r.opened ? rp.statusOpened : rp.statusNew}
                  </span>
                )}
              </span>
            </a>
          ))}
          {filtered.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "11px 18px", borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
              {filtered.length} {filtered.length === 1 ? rp.readerCountOne : rp.readerCountMany}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}