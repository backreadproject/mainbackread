"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { icpCopy } from "@/lib/icp-copy";
import type { Locale } from "@/lib/i18n";
import Blank from "../Blank";
import type { Row } from "./IcpClient";

function Sec({ h, sub, children }: { h: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 34 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: 0, letterSpacing: T.trackingTight }}>{h}</h2>
      {sub
        ? <div style={{ color: T.muted, fontSize: 13, marginTop: 2, marginBottom: 14, maxWidth: "56em", lineHeight: 1.55 }}>{sub}</div>
        : <div style={{ height: 14 }} />}
      {children}
    </div>
  );
}
function Card({ head, children }: { head?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" }}>
      {head && <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "8px 14px", fontSize: 12, fontWeight: 500, color: T.muted }}>{head}</div>}
      {children}
    </div>
  );
}
function Rw({ k, v, dot, last }: { k: string; v: React.ReactNode; dot?: string; last?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "190px minmax(0,1fr)", gap: 20, padding: "11px 14px", borderBottom: last ? "none" : "1px solid " + T.border }}>
      <div style={{ color: T.muted, fontSize: 13 }}>
        {dot && <span style={{ width: 6, height: 6, background: dot, display: "inline-block", marginRight: 7, verticalAlign: 1 }} />}
        {k}
      </div>
      <div style={{ color: T.body, lineHeight: 1.55 }}>{v}</div>
    </div>
  );
}
function List({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard }}>
      {items.map((x, i) => (
        <div key={i} style={{ padding: "12px 14px", borderBottom: i === items.length - 1 ? "none" : "1px solid " + T.border }}>
          <div style={{ color: T.heading, fontWeight: 500 }}>{x.t}</div>
          {x.d && <div style={{ color: T.muted, fontSize: 13, marginTop: 2, lineHeight: 1.55 }}>{x.d}</div>}
        </div>
      ))}
    </div>
  );
}
function Chips({ xs }: { xs: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {xs.map((x, i) => <span key={i} style={{ border: "1px solid " + T.border, borderRadius: T.rPill, padding: "2px 8px", fontSize: 12.5, color: T.body }}>{x}</span>)}
    </div>
  );
}
const STANCE_COLOUR: Record<string, string> = { signs: T.heading, champions: T.green, blocks: T.amber };

export default function IcpOutputView({
  row, locale, busy, phase, onEnrich, onAnalyse, onReanswer,
}: {
  row: Row; locale: Locale; busy: boolean; phase: "" | "record" | "analysis";
  onEnrich: (probes: { id: string; q: string; a: string }[]) => void;
  onAnalyse: () => void;
  onReanswer: () => void;
}) {
  const c = icpCopy(locale);
  const o = row.output;
  const [ans, setAns] = useState<Record<string, string>>({});
  if (!o) return <Blank title={c.noResult} hint={c.noResultHint} />;

  const stanceWord: Record<string, string> = { signs: c.stanceSigns, champions: c.stanceChampions, blocks: c.stanceBlocks };
  const hypothesis = o.kind === "hypothesis";
  const when = row.completed_at
    ? new Date(row.completed_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const btn = { font: "inherit", fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: T.rBtn, border: "1px solid " + T.border, background: T.card, color: T.heading, cursor: "pointer" } as const;
  const probes = o.probes ?? [];
  const anyAnswered = probes.some((p) => (ans[p.id] ?? "").trim().length > 0);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
        <span>
          <span style={{ width: 6, height: 6, background: hypothesis ? T.amber : T.green, display: "inline-block", marginRight: 7, verticalAlign: 1 }} />
          {c.asserted} &middot; r{row.revision}{hypothesis ? " \u00b7 " + c.hypothesisTag : ""}
        </span>
        {when && <span>{when}</span>}
        <span style={{ marginLeft: "auto" }}><button onClick={onReanswer} style={btn}>{c.reanswer}</button></span>
      </div>

      <div style={{ marginTop: 22, fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, lineHeight: 1.35, maxWidth: "30em" }}>
        {o.headline}
      </div>

      {!o.analysed && (
        <div style={{ marginTop: 26, borderLeft: "3px solid " + T.amber, padding: "2px 0 2px 14px", maxWidth: 640 }}>
          <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, marginBottom: 10 }}>
            {phase === "analysis" ? c.analysing : c.analysisFailed}
          </div>
          {phase !== "analysis" && (
            <button onClick={onAnalyse} disabled={busy}
              style={{ font: "inherit", fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: T.rBtn, border: "none", background: T.green, color: T.onAccent, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
              {c.runAnalysis}
            </button>
          )}
        </div>
      )}

      {/* Findings first. The definition is a record; this is the reason to open the page. */}
      {o.findings?.length > 0 && (
        <Sec h={c.hFindings} sub={c.sFindings}>
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard }}>
            {o.findings.map((f, i) => (
              <div key={i} style={{ padding: "14px", borderBottom: i === o.findings.length - 1 ? "none" : "1px solid " + T.border }}>
                <div style={{ color: T.heading, fontWeight: 500, lineHeight: 1.5 }}>{f.finding}</div>
                <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", gap: 12, marginTop: 8, fontSize: 13, lineHeight: 1.55 }}>
                  <div style={{ color: T.faint }}>{c.basisLabel}</div>
                  <div style={{ color: T.muted }}>{f.basis}</div>
                  <div style={{ color: T.faint }}>{c.soWhatLabel}</div>
                  <div style={{ color: T.body }}>{f.soWhat}</div>
                </div>
              </div>
            ))}
          </div>
        </Sec>
      )}

      {o.tensions?.length > 0 && (
        <Sec h={c.hTensions} sub={c.sTensions}>
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, borderLeft: "3px solid " + T.amber }}>
            {o.tensions.map((t, i) => (
              <div key={i} style={{ padding: "12px 14px", borderBottom: i === o.tensions.length - 1 ? "none" : "1px solid " + T.border }}>
                <div style={{ color: T.heading, fontWeight: 500, lineHeight: 1.5 }}>{t.observation}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 2, lineHeight: 1.55 }}>{t.why}</div>
              </div>
            ))}
          </div>
        </Sec>
      )}

      <Sec h={hypothesis ? c.hHypothesis : c.hDefinition} sub={hypothesis ? undefined : c.sDefinition}>
        <Card>{o.definition.map((d, i) => <Rw key={i} k={d.label} v={d.value} last={i === o.definition.length - 1} />)}</Card>
      </Sec>

      {o.triggers?.length > 0 && (
        <Sec h={c.hTriggers} sub={c.sTriggers}><List items={o.triggers.map((t) => ({ t: t.event, d: t.why }))} /></Sec>
      )}

      {o.committee?.length > 0 && (
        <Sec h={c.hCommittee} sub={c.sCommittee}>
          <Card head={c.committeeHead}>
            {o.committee.map((x, i) => (
              <Rw key={i} dot={STANCE_COLOUR[x.stance] ?? T.border} k={x.role + " \u2014 " + (stanceWord[x.stance] ?? x.stance)} v={x.cares} last={i === o.committee.length - 1} />
            ))}
          </Card>
        </Sec>
      )}

      {/* Visibly separate, because this is the one section not derived from them. */}
      {o.market?.length > 0 && (
        <Sec h={c.hMarket} sub={c.sMarket}>
          <div style={{ border: "1px dashed " + T.border, borderRadius: T.rCard }}>
            {o.market.map((m, i) => (
              <div key={i} style={{ padding: "12px 14px", borderBottom: i === o.market.length - 1 ? "none" : "1px dashed " + T.border }}>
                <div style={{ color: T.heading, lineHeight: 1.5 }}>{m.point}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>
                  <span style={{ color: T.faint }}>{c.cautionLabel} </span>{m.caution}
                </div>
              </div>
            ))}
          </div>
        </Sec>
      )}

      <Sec h={c.hFind} sub={c.sFind}>
        <Card>
          {o.find.titles.length > 0 && <Rw k={c.titleVariants} v={<Chips xs={o.find.titles} />} />}
          {o.find.seniority && <Rw k={c.seniority} v={o.find.seniority} />}
          {o.find.headcount && <Rw k={c.headcount} v={o.find.headcount} />}
          {o.find.techSignals.length > 0 && <Rw k={c.techSignals} v={<Chips xs={o.find.techSignals} />} />}
          <Rw k={c.communities} v={o.find.communities.length ? o.find.communities.join(" \u00b7 ") : c.noneNamed} last />
        </Card>
        {o.find.searchStrings.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {o.find.searchStrings.map((s, i) => (
              <div key={i} style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12.5, color: T.heading, background: T.soft, border: "1px solid " + T.border, borderRadius: T.rPill, padding: "7px 10px", overflowX: "auto", whiteSpace: "pre", marginTop: i ? 6 : 0 }}>{s}</div>
            ))}
          </div>
        )}
      </Sec>

      {o.disqualifiers?.length > 0 && (
        <Sec h={c.hDisq} sub={c.sDisq}><List items={o.disqualifiers.map((d) => ({ t: d.who, d: d.why }))} /></Sec>
      )}
      {o.angles?.length > 0 && (
        <Sec h={c.hAngles} sub={c.sAngles}>
          <Card>{o.angles.map((a, i) => <Rw key={i} k={a.persona} v={a.lead} last={i === o.angles.length - 1} />)}</Card>
        </Sec>
      )}
      {o.test?.length > 0 && (
        <Sec h={c.hTest} sub={c.sTest}><List items={o.test.map((t) => ({ t: t.step, d: t.detail }))} /></Sec>
      )}
      {o.unknowns?.length > 0 && (
        <Sec h={c.hUnknowns} sub={c.sUnknowns}><List items={o.unknowns.map((u) => ({ t: u.question, d: u.whyItMatters }))} /></Sec>
      )}

      {probes.length > 0 && (
        <Sec h={c.hProbes} sub={c.sProbes}>
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard }}>
            {probes.map((p, i) => (
              <div key={p.id} style={{ padding: "14px", borderBottom: i === probes.length - 1 ? "none" : "1px solid " + T.border }}>
                <div style={{ color: T.heading, fontWeight: 500, lineHeight: 1.5 }}>{p.q}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 2, lineHeight: 1.55 }}>{p.why}</div>
                <textarea
                  value={ans[p.id] ?? ""}
                  onChange={(e) => { const v = e.target.value; setAns((a) => ({ ...a, [p.id]: v })); }}
                  placeholder={c.probePlaceholder}
                  maxLength={4000}
                  style={{ width: "100%", maxWidth: 620, marginTop: 10, minHeight: 62, resize: "vertical", font: "inherit", fontSize: 14, lineHeight: 1.55, color: T.body, background: T.card, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "9px 11px" }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => onEnrich(probes.map((p) => ({ id: p.id, q: p.q, a: ans[p.id] ?? "" })))}
              disabled={busy || !anyAnswered}
              style={{ ...btn, border: "none", background: T.green, color: T.onAccent, opacity: busy || !anyAnswered ? 0.55 : 1, cursor: busy || !anyAnswered ? "default" : "pointer" }}>
              {busy ? c.rebuilding : c.rebuild}
            </button>
            <span style={{ fontSize: 12.5, color: T.muted, maxWidth: 520, lineHeight: 1.5 }}>{c.probesHint}</span>
          </div>
        </Sec>
      )}

      <div style={{ marginTop: 34, borderLeft: "3px solid " + T.amber, padding: "2px 0 2px 14px", maxWidth: 640 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, marginBottom: 4 }}>{c.hLimits}</div>
        <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, marginBottom: 8 }}>{o.limits}</div>
        <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6 }}>{c.limitsTail}</div>
      </div>
    </div>
  );
}