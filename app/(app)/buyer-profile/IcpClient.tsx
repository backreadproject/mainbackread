"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "@/lib/theme";
import { fetchJson, postJson, errMsg } from "@/lib/fetch-json";
import { questionsFor, type IcpBranchId } from "@/lib/icp-questions";
import { icpCopy } from "@/lib/icp-copy";
import { emptyProfile, nextPass, PASSES, type IcpProfile, type Pass } from "@/lib/icp-profile";
import type { Locale } from "@/lib/i18n";
import IcpForm from "./IcpForm";
import Report from "./report/Report";

export type Row = {
  id: string;
  branch: IcpBranchId;
  source: "asserted" | "refined";
  revision: number;
  status: "draft" | "complete";
  answers: unknown;
  output: IcpProfile | null;
  created_at: string;
  completed_at: string | null;
};
type Stored = { sells: string; customerCount: number | null; items: { id: string; q: string; a: string }[]; probes: { id: string; q: string; a: string }[] };

function readStored(v: unknown): Stored {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Stored>;
  return {
    sells: typeof o.sells === "string" ? o.sells : "",
    customerCount: typeof o.customerCount === "number" ? o.customerCount : null,
    items: Array.isArray(o.items) ? o.items : [],
    probes: Array.isArray(o.probes) ? o.probes : [],
  };
}
function readProfile(v: unknown): IcpProfile {
  const o = v as IcpProfile | null;
  return o && typeof o === "object" && Array.isArray(o.done) ? o : emptyProfile();
}

export default function IcpClient({ enabled, planName, locale }: { enabled: boolean; planName: string; locale: Locale }) {
  const c = icpCopy(locale);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"selector" | "form" | "output">("selector");
  const [draft, setDraft] = useState<Row | null>(null);
  const [current, setCurrent] = useState<Row | null>(null);
  const [shared, setShared] = useState(false);
  const [branch, setBranch] = useState<IcpBranchId>("operating");
  const [pick, setPick] = useState<"many" | "few" | "none">("many");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState<Pass | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const options = [
    { key: "many" as const, branch: "operating" as IcpBranchId, h: c.optManyH, p: c.optManyP },
    { key: "few" as const, branch: "startup" as IcpBranchId, h: c.optFewH, p: c.optFewP },
    { key: "none" as const, branch: "startup" as IcpBranchId, h: c.optNoneH, p: c.optNoneP },
  ];

  const hydrate = useCallback((row: Row) => {
    const s = readStored(row.answers);
    const map: Record<string, string> = {};
    for (const it of s.items) map[it.id] = it.a;
    setAnswers(map); setCount(s.customerCount); setBranch(row.branch);
    setDraft(row); setStep(0); setView("form");
  }, []);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    (async () => {
      try {
        const r = await fetchJson<{ draft: Row | null; current: Row | null; scope: string }>("/api/icp");
        setShared(r.scope === "org");
        setCurrent(r.current);
        if (r.draft) hydrate(r.draft);
        else if (r.current) setView("output");
        else setView("selector");
      } catch (e) { setMsg(errMsg(e, c.errLoad)); }
      finally { setLoading(false); }
    })();
  }, [enabled, hydrate, c.errLoad]);

  const latest = useRef({ answers, count, id: null as string | null, branch, locale });
  latest.current = { answers, count, id: draft?.id ?? null, branch, locale };

  const flush = useCallback(async () => {
    const { answers: a, count: cc, id, branch: b, locale: lo } = latest.current;
    if (!id) return;
    try {
      await postJson("/api/icp", {
        action: "save", id,
        sells: a["sells"] ?? "",
        customerCount: cc,
        answers: questionsFor(b, lo).map((q) => ({ id: q.id, q: q.q, a: a[q.id] ?? "" })),
      });
      setSavedAt(Date.now());
    } catch { /* silent: the next keystroke retries, and every commit point flushes first */ }
  }, []);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!draft) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [answers, count, draft, flush]);
  useEffect(() => () => { void flush(); }, [flush]);

  /** One request per pass. Each saves server-side as it lands, so a failure at
   *  pass five keeps the four that worked and leaves a retry on the page. */
  async function runPass(id: string, pass?: Pass): Promise<Row | null> {
    setRunning(pass ?? null);
    try {
      const r = await postJson<{ profile: Row }>("/api/icp", { action: "run", id, pass }, 120000);
      setCurrent(r.profile);
      return r.profile;
    } catch (e) {
      setMsg(errMsg(e, c.errBuild));
      return null;
    } finally { setRunning(null); }
  }

  async function runAll(id: string) {
    setBusy(true); setMsg("");
    try {
      await flush();
      let row: Row | null = null;
      for (let n = 0; n < PASSES.length; n++) {
        const prof = readProfile(row?.output ?? current?.output ?? null);
        const next = nextPass(prof);
        if (!next) break;
        row = await runPass(id, next);
        if (!row) break;          // stop on the first failure; the rest stay runnable
        if (n === 0) { setDraft(null); setView("output"); }
      }
    } finally { setBusy(false); }
  }

  async function one(id: string, pass: Pass) {
    setBusy(true); setMsg("");
    try { await runPass(id, pass); } finally { setBusy(false); }
  }

  async function start(b: IcpBranchId) {
    setBusy(true); setMsg("");
    try {
      const r = await postJson<{ profile: Row; resumed: boolean; branchMismatch?: boolean }>("/api/icp", { action: "start", branch: b });
      if (r.resumed && r.branchMismatch) setMsg(c.resumeOtherBranch);
      hydrate(r.profile);
    } catch (e) { setMsg(errMsg(e, c.errStart)); }
    finally { setBusy(false); }
  }

  async function discard() {
    if (!draft) return;
    setBusy(true);
    try {
      await postJson("/api/icp", { action: "discard", id: draft.id });
      setDraft(null); setAnswers({}); setCount(null); setMsg("");
      setView(current ? "output" : "selector");
    } catch (e) { setMsg(errMsg(e, c.errDiscard)); }
    finally { setBusy(false); }
  }

  const title = { fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight } as const;
  const sub = { color: T.muted, marginTop: 5, fontSize: 13.5 } as const;
  const btn = { font: "inherit", fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: T.rBtn, border: "1px solid " + T.border, background: T.card, color: T.heading, cursor: "pointer" } as const;

  if (!enabled) {
    return (
      <div style={{ padding: "30px 34px", maxWidth: 720 }}>
        <div style={title}>{c.title}</div>
        <div style={{ marginTop: 24, borderLeft: "3px solid " + T.amber, padding: "2px 0 2px 14px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, marginBottom: 4 }}>{c.gateHead.replace("{plan}", planName)}</div>
          <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, maxWidth: 560 }}>
            {c.gateBody} <a href="/billing" style={{ color: T.greenText, fontWeight: 500 }}>{c.seePlans}</a>
          </div>
        </div>
      </div>
    );
  }

  const prof = readProfile(current?.output ?? null);

  return (
    <div style={{ padding: "30px 34px 80px", maxWidth: 940 }}>
      <div style={title}>{c.title}</div>
      <div style={sub}>
        {view === "selector" && c.subSelector}
        {view === "form" && c.subForm}
        {view === "output" && (current?.branch === "startup" ? c.subHypothesis : c.subDefinition)}
        {shared && view !== "form" ? c.sharedSuffix : ""}
      </div>

      {msg && (
        <div style={{ marginTop: 16, borderLeft: "3px solid " + T.amber, padding: "2px 0 2px 14px", fontSize: 13.5, color: T.body, maxWidth: 620 }}>{msg}</div>
      )}

      {loading ? (
        <div style={{ marginTop: 28, fontSize: 13, color: T.muted }}>{c.loading}</div>
      ) : view === "selector" ? (
        <div style={{ marginTop: 34 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: 0, letterSpacing: T.trackingTight }}>{c.askCustomers}</h2>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>{c.askCustomersSub}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginTop: 22 }}>
            {options.map((o) => {
              const on = pick === o.key;
              return (
                <button key={o.key} onClick={() => { setPick(o.key); setBranch(o.branch); }}
                  style={{
                    textAlign: "left", cursor: "pointer", font: "inherit", padding: 16,
                    background: T.card, color: T.body,
                    border: "1px solid " + (on ? T.green : T.border), borderRadius: T.rCard,
                    boxShadow: on ? "inset 0 0 0 1px " + T.green : "none",
                  }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: on ? T.greenText : T.muted }}>{on ? c.selected : "\u00a0"}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: "6px 0 5px", letterSpacing: T.trackingTight }}>{o.h}</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55 }}>{o.p}</div>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={() => void start(branch)} disabled={busy}
              style={{ ...btn, border: "none", background: T.green, color: T.onAccent, opacity: busy ? 0.6 : 1 }}>
              {busy ? c.starting : c.startN(questionsFor(branch, locale).length)}
            </button>
            {current && <button onClick={() => setView("output")} style={btn}>{c.backToProfile}</button>}
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: T.muted }}>{c.timeHint}</span>
          </div>
          <div style={{ marginTop: 34, borderLeft: "3px solid " + T.amber, padding: "2px 0 2px 14px", maxWidth: 620 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, marginBottom: 4 }}>{c.whyFiveH}</div>
            <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6 }}>{c.whyFiveP}</div>
          </div>
        </div>
      ) : view === "form" && draft ? (
        <IcpForm
          branch={branch} locale={locale} step={step} setStep={setStep}
          answers={answers} setAnswers={setAnswers}
          count={count} setCount={setCount}
          savedAt={savedAt} busy={busy} phase={running ? "analysis" : ""}
          onFlush={flush} onGenerate={() => void runAll(draft.id)} onDiscard={discard}
        />
      ) : current ? (
        <>
          <div style={{ display: "flex", gap: "6px 14px", alignItems: "center", flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
            <span>
              <span style={{ width: 6, height: 6, background: current.branch === "startup" ? T.amber : T.green, display: "inline-block", marginRight: 7, verticalAlign: 1 }} />
              {c.asserted} &middot; r{current.revision}{current.branch === "startup" ? " \u00b7 " + c.hypothesisTag : ""}
            </span>
            <span style={{ marginLeft: "auto" }}>
              <button onClick={() => void start(current.branch)} style={btn}>{c.reanswer}</button>
            </span>
          </div>
          <Report
            profile={prof} locale={locale} busy={busy} running={running}
            onRun={(p) => void one(current.id, p)}
            onRunAll={() => void runAll(current.id)}
          />
        </>
      ) : (
        <div style={{ marginTop: 28, fontSize: 13, color: T.muted }}>{c.nothingYet}</div>
      )}
    </div>
  );
}