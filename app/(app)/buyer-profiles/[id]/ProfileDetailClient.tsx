"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { questionsFor, SELLS_ID, type IcpBranchId } from "@/lib/icp-questions";
import { PASSES, emptyProfile, type IcpProfile, type Pass } from "@/lib/icp-profile";
import IcpForm from "../IcpForm";
import Report from "../../buyer-profile/report/Report";

/**
 * One buyer profile. Everything here is scoped to a profile id, which is what
 * lets a workspace hold several: the old page assumed exactly one lineage and
 * asked the API for "the" draft.
 */

type Row = {
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

type QA = { id: string; q: string; a: string };
type Stored = { sells: string; customerCount: number | null; items: QA[]; probes: QA[] };

function readAnswers(v: unknown): Stored {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Stored>;
  return {
    sells: typeof o.sells === "string" ? o.sells : "",
    customerCount: typeof o.customerCount === "number" ? o.customerCount : null,
    items: Array.isArray(o.items) ? o.items : [],
    probes: Array.isArray(o.probes) ? o.probes : [],
  };
}

export default function ProfileDetailClient({
  profile,
  documents,
  entitled,
}: {
  profile: { id: string; name: string; objective: string; cadence: string; threshold: number };
  documents: { id: string; title: string }[];
  entitled: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Row | null>(null);
  const [current, setCurrent] = useState<Row | null>(null);
  const [error, setError] = useState("");

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [count, setCount] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"" | "record" | "analysis">("");
  const [running, setRunning] = useState<Pass | null>(null);

  const dirty = useRef(false);

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    loading: fr ? "Chargement\u2026" : "Loading\u2026",
    selectorH: fr ? "Avez-vous des preuves, ou une hypoth\u00e8se ?" : "Do you have evidence, or a hypothesis?",
    selectorP: fr
      ? "Cela d\u00e9cide des questions pos\u00e9es. Aucune r\u00e9ponse n\u2019est pire. L\u2019une est simplement honn\u00eate sur le fait qu\u2019elle n\u2019est pas test\u00e9e."
      : "This decides which questions get asked. Neither answer is worse. One is just honest about being untested.",
    opH: fr ? "Nous avons des clients" : "We have customers",
    opP: fr
      ? "Cinq clients payants ou plus. Nous poserons des questions sur des cas pr\u00e9cis, y compris ceux qui se sont mal pass\u00e9s, parce qu\u2019ils pr\u00e9disent mieux qu\u2019une description."
      : "Five or more paying customers. We will ask about specific ones, including the bad fits, because those predict better than a description.",
    stH: fr ? "Pas encore, ou seulement quelques-uns" : "Not yet, or only a handful",
    stP: fr
      ? "Le r\u00e9sultat est marqu\u00e9 comme une hypoth\u00e8se et porte un test de deux semaines : qui interroger, quoi demander, ce qui l\u2019invaliderait."
      : "Output is labelled a hypothesis and carries a two week test: who to talk to, what to ask, what would prove it wrong.",
    start: fr ? "Commencer" : "Start",
    starting: fr ? "Un instant\u2026" : "Starting\u2026",
    resumed: fr ? "Brouillon repris." : "Picked up where you left off.",
    mismatch: fr
      ? "Ce brouillon a \u00e9t\u00e9 commenc\u00e9 sur l\u2019autre branche. Terminez-le ou supprimez-le."
      : "That draft was started on the other branch. Finish it or discard it.",
    revision: fr ? "R\u00e9vision" : "Revision",
    asserted: fr ? "\u00e9crite par vous" : "written by you",
    refined: fr ? "propos\u00e9e" : "drafted for you",
    reanswer: fr ? "Tout re-r\u00e9pondre" : "Re-answer everything",
    settings: fr ? "R\u00e9glages" : "Settings",
    attached: fr ? "Li\u00e9 \u00e0" : "Attached to",
    notAttached: fr
      ? "Ce profil n\u2019est li\u00e9 \u00e0 aucun document, donc aucun lecteur n\u2019est mesur\u00e9 contre lui."
      : "This profile is not attached to any document, so no reader is being measured against it.",
    honest: fr
      ? "Ce qui suit vient de vos r\u00e9ponses et de faits publics. Rien n\u2019a encore \u00e9t\u00e9 test\u00e9 contre vos lecteurs."
      : "What follows comes from your answers and from public fact. Nothing here has been tested against your readers yet.",
    nothing: fr ? "Rien encore" : "Nothing here yet",
    errLoad: fr ? "Impossible de charger ce profil." : "Could not load this profile.",
    gate: fr
      ? "Les profils d\u2019acheteur sont disponibles \u00e0 partir du plan Personal."
      : "Buyer profiles are on the Personal plan and above.",
    seePlans: fr ? "Voir les plans" : "See plans",
  };

  const OBJ: Record<string, string> = {
    outbound: fr ? "Vente sortante" : "Outbound sales",
    client: fr ? "Prospection client" : "Client prospecting",
    investor: fr ? "Recherche d\u2019investisseurs" : "Investor prospecting",
    partnership: fr ? "Partenariats" : "Partnerships",
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/icp?profileId=" + profile.id);
      const json = (await res.json()) as { draft?: Row | null; current?: Row | null; error?: string };
      if (!res.ok) { setError(json.error || c.errLoad); return; }
      setDraft(json.draft ?? null);
      setCurrent(json.current ?? null);
      if (json.draft) {
        const st = readAnswers(json.draft.answers);
        const map: Record<string, string> = { [SELLS_ID]: st.sells };
        for (const it of st.items) map[it.id] = it.a;
        setAnswers(map);
        setCount(st.customerCount);
      }
    } catch {
      setError(c.errLoad);
    } finally {
      setLoading(false);
    }
  }, [profile.id, c.errLoad]);

  useEffect(() => { void load(); }, [load]);

  async function post<R>(body: Record<string, unknown>): Promise<R | null> {
    const res = await fetch("/api/icp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as R & { error?: string };
    if (!res.ok) { setError(json.error || c.errLoad); return null; }
    setError("");
    return json;
  }

  async function start(branch: IcpBranchId) {
    setBusy(true);
    const r = await post<{ profile: Row; resumed: boolean; branchMismatch?: boolean }>({
      action: "start", profileId: profile.id, branch,
    });
    setBusy(false);
    if (!r) return;
    setDraft(r.profile);
    const st = readAnswers(r.profile.answers);
    const map: Record<string, string> = { [SELLS_ID]: st.sells };
    for (const it of st.items) map[it.id] = it.a;
    setAnswers(map);
    setCount(st.customerCount);
    setStep(0);
  }

  /** Writes the current answers back. Called on step change and before generate. */
  const flush = useCallback(async () => {
    if (!draft || !dirty.current) return;
    const qs = questionsFor(draft.branch, locale);
    const items: QA[] = qs
      .filter((q) => q.id !== SELLS_ID)
      .map((q) => ({ id: q.id, q: q.q, a: answers[q.id] ?? "" }));
    const r = await post<{ profile: Row }>({
      action: "save",
      id: draft.id,
      sells: answers[SELLS_ID] ?? "",
      customerCount: count,
      answers: items,
    });
    if (r) { setDraft(r.profile); setSavedAt(Date.now()); dirty.current = false; }
  }, [draft, answers, count, locale]);

  async function runPass(id: string, pass?: Pass) {
    setRunning(pass ?? PASSES[0]);
    const r = await post<{ profile: Row; next: Pass | null; done: boolean }>({ action: "run", id, pass });
    setRunning(null);
    if (!r) return null;
    setCurrent(r.profile);
    setDraft(null);
    return r;
  }

  async function generate() {
    if (!draft) return;
    setBusy(true);
    setPhase("record");
    await flush();
    const first = await runPass(draft.id, "record");
    if (!first) { setBusy(false); setPhase(""); return; }
    setPhase("analysis");
    let next = first.next;
    while (next) {
      const r = await runPass(first.profile.id, next);
      if (!r) break;
      next = r.next;
    }
    setBusy(false);
    setPhase("");
  }

  async function runAll() {
    if (!current) return;
    setBusy(true);
    const prof = current.output ?? emptyProfile();
    let next: Pass | null = PASSES.find((p) => !prof.done.includes(p)) ?? null;
    while (next) {
      const r = await runPass(current.id, next);
      if (!r) break;
      next = r.next;
    }
    setBusy(false);
  }

  async function discard() {
    if (!draft) return;
    setBusy(true);
    await post({ action: "discard", id: draft.id });
    setBusy(false);
    setDraft(null);
    setAnswers({});
    setCount(null);
    void load();
  }

  const sel: React.CSSProperties = {
    height: 32, boxSizing: "border-box", border: "1px solid " + T.border,
    borderRadius: T.rBtn, padding: "0 11px", fontSize: 13, fontFamily: T.font,
    background: T.card, color: T.body, cursor: "pointer",
  };
  const chip: React.CSSProperties = {
    border: "1px solid " + T.border, borderRadius: 4, background: T.soft,
    padding: "2px 7px", fontSize: 11.5, color: T.body, whiteSpace: "nowrap",
  };

  const header = (
    <>
      <a href="/buyer-profiles" style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-block", marginBottom: 14 }}>
        {"\u2039 " + c.back}
      </a>
      <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
        {profile.name}
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 0", flexWrap: "wrap" }}>
        <span style={chip}>{OBJ[profile.objective] ?? profile.objective}</span>
        {current && (
          <span style={{ fontSize: 13, color: T.muted }}>
            {c.revision} {current.revision} &middot; {current.source === "asserted" ? c.asserted : c.refined}
          </span>
        )}
        {documents.length > 0 ? (
          <span style={{ fontSize: 13, color: T.muted }}>
            {c.attached} {documents.length}
          </span>
        ) : null}
      </div>
    </>
  );

  if (!entitled) {
    return (
      <div style={{ fontFamily: T.font, color: T.body, minHeight: "100vh" }}>
        <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
          {header}
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: 30, marginTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: T.muted, margin: "0 0 16px" }}>{c.gate}</p>
            <a href="/billing" style={{ ...sel, background: T.green, borderColor: T.green, color: T.onAccent, textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "0 14px" }}>
              {c.seePlans}
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        {header}

        {error && (
          <p style={{ fontSize: 13.5, color: T.dangerText, margin: "18px 0 0" }}>{error}</p>
        )}

        {loading ? (
          <p style={{ fontSize: 14, color: T.muted, marginTop: 26 }}>{c.loading}</p>
        ) : draft ? (
          <div style={{ marginTop: 26 }}>
            <IcpForm
              branch={draft.branch}
              locale={locale}
              step={step}
              setStep={(n) => { void flush(); setStep(n); }}
              answers={answers}
              setAnswers={(fn) => { dirty.current = true; setAnswers(fn); }}
              count={count}
              setCount={(n) => { dirty.current = true; setCount(n); }}
              savedAt={savedAt}
              busy={busy}
              phase={phase}
              onFlush={flush}
              onGenerate={() => void generate()}
              onDiscard={() => void discard()}
            />
          </div>
        ) : current && current.output ? (
          <div style={{ marginTop: 26 }}>
            {documents.length === 0 && (
              <div style={{ borderLeft: "3px solid " + T.amber, background: "#FFFBF5", padding: "11px 14px", marginBottom: 18, fontSize: 12.5, lineHeight: 1.6, color: "#7A3D0A" }}>
                {c.notAttached}
              </div>
            )}
            <div style={{ borderLeft: "3px solid " + T.indigo, background: "#F5F5FF", padding: "11px 14px", marginBottom: 18, fontSize: 12.5, lineHeight: 1.6, color: "#2C2E9E" }}>
              {c.honest}
            </div>
            <Report
              profile={current.output}
              locale={locale}
              busy={busy}
              running={running}
              onRun={(p) => void runPass(current.id, p)}
              onRunAll={() => void runAll()}
            />
            <div style={{ marginTop: 22 }}>
              <button style={sel} onClick={() => void start(current.branch)}>{c.reanswer}</button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: "0 0 6px" }}>{c.selectorH}</h2>
            <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 16px", lineHeight: 1.6, maxWidth: 640 }}>{c.selectorP}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12, maxWidth: 760 }}>
              {([["operating", c.opH, c.opP], ["startup", c.stH, c.stP]] as const).map(([b, h, p]) => (
                <button key={b} disabled={busy} onClick={() => void start(b as IcpBranchId)} style={{
                  border: "1px solid " + T.border, borderRadius: T.rCard, background: T.card,
                  padding: 16, textAlign: "left", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
                }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.heading }}>{h}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: T.muted, marginTop: 7, lineHeight: 1.55 }}>{p}</span>
                </button>
              ))}
            </div>
            {busy && <p style={{ fontSize: 13, color: T.muted, marginTop: 14 }}>{c.starting}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
