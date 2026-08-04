"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { questionsFor, SELLS_ID, type IcpBranchId } from "@/lib/icp-questions";
import { PASSES, type IcpProfile, type Pass } from "@/lib/icp-profile";
import IcpForm from "../IcpForm";
import { Tier, Note, StatedTab, FindTab, ObservedTab } from "./Tabs";

type Row = {
  id: string;
  branch: IcpBranchId;
  source: "asserted" | "refined";
  revision: number;
  status: "draft" | "complete";
  answers: unknown;
  output: IcpProfile | null;
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

/** After record, before the rest. The confirm step is a real gate: eight
 *  sections get built on top of that reading, and a misreading here is a
 *  misreading in all of them. */
const AFTER_RECORD: Pass[] = PASSES.filter((p) => p !== "record");

export default function ProfileDetailClient({
  profile,
  documents,
  entitled,
}: {
  profile: { id: string; name: string; objective: string; cadence: string; threshold: number };
  documents: { id: string; title: string }[];
  entitled: boolean;
}) {
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
  const [tab, setTab] = useState<"stated" | "find" | "observed">("stated");
  const dirty = useRef(false);

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    loading: fr ? "Chargement\u2026" : "Loading\u2026",
    step1: fr ? "Objectif" : "Objective",
    step2: fr ? "D\u00e9couverte" : "Discovery",
    step3: fr ? "Confirmer" : "Confirm",
    step4: fr ? "G\u00e9n\u00e9rer" : "Generate",
    branchH: fr ? "Avez-vous des preuves, ou une hypoth\u00e8se ?" : "Do you have evidence, or a hypothesis?",
    branchP: fr
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
    confirmH: fr ? "Voici ce que nous avons compris" : "Here is what we understood",
    confirmP: fr
      ? "Lisez ceci avant que nous g\u00e9n\u00e9rions la suite. Cinq sections vont \u00eatre construites l\u00e0-dessus, et une erreur de lecture ici est une erreur dans toutes."
      : "Read this before we generate the rest. Five sections are about to be built on top of it, and a misreading here is a misreading in all of them.",
    confirmNote: fr
      ? "Si la lecture est fausse, corrigez-la maintenant. Chaque persona, filtre et message plus bas en d\u00e9coule."
      : "If this reading is wrong, fix it now. Every persona, filter and message below is derived from it.",
    changeAnswers: fr ? "Modifier mes r\u00e9ponses" : "Change my answers",
    thisIsRight: fr ? "C\u2019est juste, g\u00e9n\u00e9rez" : "This is right, generate",
    building: fr ? "Construction du profil" : "Building the profile",
    buildingP: fr
      ? "Les sections s\u2019ex\u00e9cutent dans l\u2019ordre de leurs d\u00e9pendances."
      : "Sections run in dependency order.",
    done: fr ? "Termin\u00e9" : "Done",
    runningNow: fr ? "En cours" : "Running",
    queued: fr ? "En attente" : "Queued",
    run: fr ? "Lancer" : "Run",
    tabStated: fr ? "\u00c9nonc\u00e9" : "Stated",
    tabFind: fr ? "O\u00f9 les trouver" : "Where to find them",
    tabObserved: fr ? "Observ\u00e9" : "Observed",
    basisStated: fr
      ? "Vient de ce que vous nous avez dit. Non v\u00e9rifi\u00e9 contre quoi que ce soit."
      : "From what you told us. Not checked against anything.",
    basisFind: fr
      ? "Raisonn\u00e9 \u00e0 partir de vos personas et de vos march\u00e9s. Le raisonnement est montr\u00e9 pour que vous puissiez le contester."
      : "Reasoned from your personas and your markets. The reasoning is shown so you can disagree with it.",
    basisObserved: fr
      ? "Vient des lecteurs qui ont r\u00e9ellement ouvert vos documents."
      : "From readers who actually opened your documents.",
    revision: fr ? "R\u00e9vision" : "Revision",
    asserted: fr ? "\u00e9crite par vous" : "written by you",
    refined: fr ? "propos\u00e9e" : "drafted for you",
    attachedTo: fr ? "Li\u00e9 \u00e0 " : "Attached to ",
    docs: fr ? " document(s)" : " document(s)",
    notAttached: fr ? "Aucun document" : "No documents attached",
    reanswer: fr ? "Tout re-r\u00e9pondre" : "Re-answer everything",
    readersNeeded: fr ? " lecteurs engag\u00e9s requis" : " engaged readers needed",
    errLoad: fr ? "Impossible de charger ce profil." : "Could not load this profile.",
    gate: fr ? "Les profils d\u2019acheteur sont disponibles \u00e0 partir du plan Personal." : "Buyer profiles are on the Personal plan and above.",
    seePlans: fr ? "Voir les plans" : "See plans",
  };

  const OBJ: Record<string, string> = {
    outbound: fr ? "Vente sortante" : "Outbound sales",
    client: fr ? "Prospection client" : "Client prospecting",
    investor: fr ? "Recherche d\u2019investisseurs" : "Investor prospecting",
    partnership: fr ? "Partenariats" : "Partnerships",
  };

  const PASS_LABEL: Record<Pass, string> = {
    record: fr ? "D\u00e9finition du march\u00e9" : "Market definition",
    people: fr ? "Personas et comit\u00e9" : "Personas and committee",
    demand: fr ? "Demande et objections" : "Demand and objections",
    market: fr ? "March\u00e9 et signaux" : "Market and signals",
    activation: fr ? "Crit\u00e8res de recherche" : "Search criteria",
    synthesis: fr ? "Synth\u00e8se" : "Synthesis",
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/icp?profileId=" + profile.id);
      const json = (await res.json()) as { draft?: Row | null; current?: Row | null; error?: string };
      if (!res.ok) { setError(json.error || c.errLoad); return; }
      setDraft(json.draft ?? null);
      setCurrent(json.current ?? null);
      const src = json.draft ?? json.current ?? null;
      if (src) {
        const st = readAnswers(src.answers);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

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
    const r = await post<{ profile: Row }>({ action: "start", profileId: profile.id, branch });
    setBusy(false);
    if (!r) return;
    setDraft(r.profile);
    setCurrent(null);
    const st = readAnswers(r.profile.answers);
    const map: Record<string, string> = { [SELLS_ID]: st.sells };
    for (const it of st.items) map[it.id] = it.a;
    setAnswers(map);
    setCount(st.customerCount);
    setStep(0);
  }

  const flush = useCallback(async () => {
    if (!draft || !dirty.current) return;
    const qs = questionsFor(draft.branch, locale);
    const items: QA[] = qs.filter((q) => q.id !== SELLS_ID).map((q) => ({ id: q.id, q: q.q, a: answers[q.id] ?? "" }));
    const r = await post<{ profile: Row }>({
      action: "save", id: draft.id, sells: answers[SELLS_ID] ?? "", customerCount: count, answers: items,
    });
    if (r) { setDraft(r.profile); setSavedAt(Date.now()); dirty.current = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, answers, count, locale]);

  async function runPass(id: string, pass: Pass) {
    setRunning(pass);
    const r = await post<{ profile: Row; next: Pass | null }>({ action: "run", id, pass });
    setRunning(null);
    if (!r) return null;
    setCurrent(r.profile);
    setDraft(null);
    return r;
  }

  /** Step 3. Runs the record pass only, then stops so the reading can be read. */
  async function confirmStep() {
    if (!draft) return;
    setBusy(true);
    setPhase("record");
    await flush();
    await runPass(draft.id, "record");
    setBusy(false);
    setPhase("");
  }

  /** Step 4. The remaining five, in order. */
  async function generateRest() {
    if (!current) return;
    setBusy(true);
    setPhase("analysis");
    for (const p of AFTER_RECORD) {
      if (current.output?.done.includes(p)) continue;
      const r = await runPass(current.id, p);
      if (!r) break;
    }
    setBusy(false);
    setPhase("");
  }

  async function runOne(p: Pass) {
    if (!current) return;
    setBusy(true);
    await runPass(current.id, p);
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

  const btn: React.CSSProperties = {
    height: 32, boxSizing: "border-box", border: "1px solid " + T.border, borderRadius: T.rBtn,
    padding: "0 11px", fontSize: 13, fontFamily: T.font, background: T.card, color: T.body, cursor: "pointer",
  };
  const primary: React.CSSProperties = { ...btn, background: T.green, borderColor: T.green, color: T.onAccent, fontWeight: 500, padding: "0 14px" };
  const chip: React.CSSProperties = { border: "1px solid " + T.border, borderRadius: 4, background: T.soft, padding: "2px 7px", fontSize: 11.5, color: T.body, whiteSpace: "nowrap" };

  const out = current?.output ?? null;
  const recordDone = Boolean(out?.record);
  const allDone = Boolean(out && out.done.length === PASSES.length);
  const stage: 1 | 2 | 3 | 4 = !draft && !current ? 1 : draft ? 2 : !allDone ? 3 : 4;

  function Steps() {
    const items: [number, string][] = [[1, c.step1], [2, c.step2], [3, c.step3], [4, c.step4]];
    return (
      <div style={{ display: "flex", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", margin: "24px 0 22px" }}>
        {items.map(([n, label], i) => {
          const on = stage === n;
          const done = stage > n;
          return (
            <div key={n} style={{
              flex: 1, padding: "11px 14px", fontSize: 12.5,
              borderLeft: i === 0 ? "none" : "1px solid " + T.border,
              background: on ? T.soft : "transparent",
              color: on ? T.heading : T.muted, fontWeight: on ? 500 : 400,
            }}>
              <span style={{ color: done ? T.green : T.faint, marginRight: 7 }}>{n}</span>{label}
            </div>
          );
        })}
      </div>
    );
  }

  const header = (
    <>
      <a href="/buyer-profiles" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, textDecoration: "none", display: "inline-block", marginBottom: 9 }}>
        {c.back}
      </a>
      <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{profile.name}</h1>
      <p style={{ fontSize: 13.5, color: T.muted, margin: "7px 0 0", lineHeight: 1.55 }}>
        {OBJ[profile.objective] ?? profile.objective}
        {current && " \u00b7 " + c.revision + " " + current.revision + ", " + (current.source === "asserted" ? c.asserted : c.refined)}
        {" \u00b7 "}
        {documents.length > 0 ? c.attachedTo + documents.length + c.docs : c.notAttached}
      </p>
    </>
  );

  if (!entitled) {
    return (
      <div style={{ fontFamily: T.font, color: T.body, minHeight: "100vh" }}>
        <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
          {header}
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: 30, marginTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: T.muted, margin: "0 0 16px" }}>{c.gate}</p>
            <a href="/billing" style={{ ...primary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>{c.seePlans}</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        {header}
        {error && <p style={{ fontSize: 13.5, color: T.dangerText, margin: "16px 0 0" }}>{error}</p>}

        {loading ? (
          <p style={{ fontSize: 14, color: T.muted, marginTop: 26 }}>{c.loading}</p>
        ) : allDone ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "24px 0 18px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flex: 1, minWidth: 320, border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" }}>
                {([["stated", c.tabStated], ["find", c.tabFind], ["observed", c.tabObserved]] as const).map(([k, label], i) => (
                  <button key={k} onClick={() => setTab(k)} style={{
                    flex: 1, padding: "11px 14px", fontSize: 12.5, cursor: "pointer",
                    border: "none", borderLeft: i === 0 ? "none" : "1px solid " + T.border,
                    background: tab === k ? T.soft : T.card,
                    color: tab === k ? T.heading : T.muted, fontWeight: tab === k ? 500 : 400,
                    fontFamily: T.font, textAlign: "left",
                  }}>{label}</button>
                ))}
              </div>
              <button style={btn} onClick={() => void start(current!.branch)}>{c.reanswer}</button>
            </div>

            {tab === "stated" && (
              <Tier tone={T.faint} name={c.tabStated} basis={c.basisStated}>
                <StatedTab p={out!} locale={locale} />
              </Tier>
            )}
            {tab === "find" && (
              <Tier tone={T.indigo} name={fr ? "Fait public" : "Public fact"} basis={c.basisFind}>
                <FindTab p={out!} locale={locale} />
              </Tier>
            )}
            {tab === "observed" && (
              <Tier tone={T.faint} name={c.tabObserved} basis={c.basisObserved} right={"0 / " + profile.threshold + c.readersNeeded}>
                <ObservedTab locale={locale} threshold={profile.threshold} />
              </Tier>
            )}
          </>
        ) : (
          <>
            <Steps />

            {stage === 1 && (
              <>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: "0 0 6px" }}>{c.branchH}</h2>
                <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 16px", lineHeight: 1.6, maxWidth: 660 }}>{c.branchP}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12, maxWidth: 780 }}>
                  {([["operating", c.opH, c.opP], ["startup", c.stH, c.stP]] as const).map(([b, h, p]) => (
                    <button key={b} disabled={busy} onClick={() => void start(b as IcpBranchId)} style={{
                      border: "1px solid " + T.border, borderRadius: T.rCard, background: T.card,
                      padding: 16, textAlign: "left", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, fontFamily: T.font,
                    }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.heading }}>{h}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: T.muted, marginTop: 7, lineHeight: 1.55 }}>{p}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {stage === 2 && draft && (
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
                onGenerate={() => void confirmStep()}
                onDiscard={() => void discard()}
              />
            )}

            {stage === 3 && recordDone && out?.record && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 7px" }}>{c.confirmH}</h2>
                <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 20px", lineHeight: 1.6, maxWidth: 680 }}>{c.confirmP}</p>

                <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 }}>
                  <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>
                    {fr ? "R\u00e9sum\u00e9" : "Business summary"}
                  </div>
                  <div style={{ padding: 16 }}>
                    {out.record.headline && <p style={{ fontSize: 15, lineHeight: 1.7, color: T.heading, margin: "0 0 16px" }}>{out.record.headline}</p>}
                    <dl style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr)", gap: "10px 16px", fontSize: 13, margin: 0 }}>
                      {out.record.definition.map((d, i) => (
                        <div key={i} style={{ display: "contents" }}>
                          <dt style={{ color: T.muted }}>{d.label}</dt>
                          <dd style={{ color: T.body, lineHeight: 1.6, margin: 0 }}>{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <Note tone="amber">{c.confirmNote}</Note>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 22 }}>
                  <button style={btn} disabled={busy} onClick={() => void start(current!.branch)}>{c.changeAnswers}</button>
                  <button style={{ ...primary, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void generateRest()}>{c.thisIsRight}</button>
                </div>

                {phase === "analysis" && (
                  <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 22 }}>
                    <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>
                      {c.building}
                    </div>
                    <div style={{ padding: "4px 16px" }}>
                      {PASSES.map((p) => {
                        const done = out.done.includes(p);
                        const now = running === p;
                        return (
                          <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid " + T.border, fontSize: 13.5 }}>
                            <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: done ? T.green : now ? T.amber : T.faint }} />
                            <span style={{ color: done || now ? T.heading : T.muted }}>{PASS_LABEL[p]}</span>
                            <span style={{ marginLeft: "auto", fontSize: 12.5, color: T.faint }}>
                              {done ? c.done : now ? c.runningNow : c.queued}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {phase !== "analysis" && out.done.length > 1 && (
                  <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 22 }}>
                    <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>
                      {c.building}
                    </div>
                    <div style={{ padding: "4px 16px" }}>
                      {PASSES.map((p) => {
                        const done = out.done.includes(p);
                        return (
                          <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid " + T.border, fontSize: 13.5 }}>
                            <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: done ? T.green : T.faint }} />
                            <span style={{ color: done ? T.heading : T.muted }}>{PASS_LABEL[p]}</span>
                            <span style={{ marginLeft: "auto" }}>
                              {done ? <span style={{ fontSize: 12.5, color: T.faint }}>{c.done}</span>
                                : <button style={{ ...btn, height: 27, fontSize: 12 }} disabled={busy} onClick={() => void runOne(p)}>{c.run}</button>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
