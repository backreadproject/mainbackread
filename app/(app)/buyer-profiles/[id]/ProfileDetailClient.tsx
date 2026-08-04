"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { stepsFor, OBJECTIVES, type Branch, type Objective } from "@/lib/buyer-questions";
import { PASSES, type Profile, type Pass } from "@/lib/buyer-profile";
import DiscoveryForm from "../DiscoveryForm";
import { Tier, Note, StatedTab, FindTab } from "./Tabs";
import ObservedTab from "./ObservedTab";
import type { ObservedView } from "@/lib/observed";

type Row = {
  id: string;
  branch: Branch;
  source: "asserted" | "refined";
  revision: number;
  status: "draft" | "complete";
  answers: unknown;
  output: Profile | null;
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

/** people, demand and market read the record and nothing else, so they run
 *  together. activation reads all three; synthesis reads activation too. */
/** market is the confirm gate. people reads it, find reads both. */
const AFTER_CONFIRM: Pass[] = ["people", "find"];

export default function ProfileDetailClient({
  profile,
  documents,
  entitled,
  observed,
}: {
  profile: { id: string; name: string; objective: string; cadence: string; threshold: number };
  documents: { id: string; title: string }[];
  entitled: boolean;
  /** Counted from the readers of the attached documents. No model call. */
  observed: ObservedView;
}) {
  const locale = useLocale();
  const fr = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Row | null>(null);
  const [current, setCurrent] = useState<Row | null>(null);
  const [error, setError] = useState("");

  const [objective, setObjective] = useState<Objective>((profile.objective as Objective) ?? "outbound");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"" | "record" | "analysis">("");
  const [running, setRunning] = useState<Pass[]>([]);
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<"stated" | "find" | "observed">("stated");
  const dirty = useRef(false);

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    loading: fr ? "Chargement\u2026" : "Loading\u2026",
    s1: fr ? "Objectif" : "Objective",
    s2: fr ? "D\u00e9couverte" : "Discovery",
    s3: fr ? "Confirmer" : "Confirm",
    s4: fr ? "G\u00e9n\u00e9rer" : "Generate",
    objH: fr ? "Que cherchez-vous \u00e0 faire ?" : "What are you here to do?",
    objP: fr
      ? "Cela change ce qui est g\u00e9n\u00e9r\u00e9, pas seulement la formulation. Un fondateur qui l\u00e8ve des fonds et un commercial n\u2019ont pas besoin de la m\u00eame page."
      : "This changes what gets generated, not just the wording. A founder raising money and an SDR selling software need different things on the page.",
    brH: fr ? "Avez-vous des preuves, ou une hypoth\u00e8se ?" : "Do you have evidence, or a hypothesis?",
    brP: fr
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
    soon: fr ? "Bient\u00f4t disponible" : "Not available yet",
    confirmH: fr ? "Voici ce que nous avons compris" : "Here is what we understood",
    confirmP: fr
      ? "Lisez ceci avant que nous g\u00e9n\u00e9rions la suite. Cinq sections vont \u00eatre construites l\u00e0-dessus, et une erreur de lecture ici est une erreur dans toutes."
      : "Read this before we generate the rest. Five sections are about to be built on top of it, and a misreading here is a misreading in all of them.",
    confirmNote: fr
      ? "Si la lecture est fausse, corrigez-la maintenant. Chaque persona, filtre et message plus bas en d\u00e9coule."
      : "If this reading is wrong, fix it now. Every persona, filter and message below is derived from it.",
    summary: fr ? "R\u00e9sum\u00e9" : "Business summary",
    change: fr ? "Modifier mes r\u00e9ponses" : "Change my answers",
    right: fr ? "C\u2019est juste, g\u00e9n\u00e9rez" : "This is right, generate",
    building: fr ? "Construction du profil" : "Building the profile",
    done: fr ? "Termin\u00e9" : "Done",
    now: fr ? "En cours" : "Running",
    queued: fr ? "En attente" : "Queued",
    run: fr ? "Lancer" : "Run",
    tStated: fr ? "\u00c9nonc\u00e9" : "Stated",
    tFind: fr ? "O\u00f9 les trouver" : "Where to find them",
    tObs: fr ? "Observ\u00e9" : "Observed",
    bStated: fr ? "Vient de ce que vous nous avez dit. Non v\u00e9rifi\u00e9 contre quoi que ce soit." : "From what you told us. Not checked against anything.",
    bFind: fr
      ? "Raisonn\u00e9 \u00e0 partir de vos personas et de vos march\u00e9s. Le raisonnement est montr\u00e9 pour que vous puissiez le contester."
      : "Reasoned from your personas and your markets. The reasoning is shown so you can disagree with it.",
    bObs: fr ? "Vient des lecteurs qui ont r\u00e9ellement ouvert vos documents." : "From readers who actually opened your documents.",
    rev: fr ? "R\u00e9vision" : "Revision",
    asserted: fr ? "\u00e9crite par vous" : "written by you",
    refined: fr ? "propos\u00e9e" : "drafted for you",
    attached: fr ? "Li\u00e9 \u00e0 " : "Attached to ",
    docs: fr ? " document(s)" : " document(s)",
    noDocs: fr ? "Aucun document" : "No documents attached",
    reanswer: fr ? "Tout re-r\u00e9pondre" : "Re-answer everything",
    needed: fr ? " lecteurs engag\u00e9s requis" : " engaged readers needed",
    errLoad: fr ? "Impossible de charger ce profil." : "Could not load this profile.",
    timedOut: fr
      ? "Cette section a pris trop de temps et a \u00e9t\u00e9 interrompue. Rien n\u2019est perdu. R\u00e9essayez-la seule."
      : "That section took too long and was cut off. Nothing is lost. Try it on its own.",
    gate: fr ? "Les profils d\u2019acheteur sont disponibles \u00e0 partir du plan Personal." : "Buyer profiles are on the Personal plan and above.",
    seePlans: fr ? "Voir les plans" : "See plans",
  };


  const PASS_LABEL: Record<Pass, string> = {
    market: fr ? "D\u00e9finition du march\u00e9" : "Market definition",
    people: fr ? "Personas et angles" : "Personas and angles",
    find: fr ? "O\u00f9 les trouver" : "Where to find them",
  };

  const TICKS = fr ? [
    "Chaque section est enregistr\u00e9e d\u00e8s qu\u2019elle arrive. Vous pouvez quitter la page et revenir.",
    "Populations : s\u00e9parer les gens qui se ressemblent mais n\u2019ach\u00e8tent pas pareil.",
    "Comit\u00e9 : qui signe, qui porte le projet, qui bloque.",
    "Demande : ce que \u00e7a leur co\u00fbte, et o\u00f9 les affaires calent.",
    "March\u00e9 : ce qu\u2019ils utilisent d\u00e9j\u00e0, et les signaux visibles de l\u2019ext\u00e9rieur.",
    "Crit\u00e8res : des filtres collables, dans la langue de chaque plateforme.",
    "Synth\u00e8se : ce qui ressort, et ce que cela ne peut pas vous dire.",
  ] : [
    "Each section saves the moment it lands. You can leave this page and come back.",
    "Populations: separating the people who look alike but do not buy alike.",
    "Committee: who signs, who champions, and who quietly blocks.",
    "Demand: what it costs them, and where deals actually stall.",
    "Market: what they already run, and which signals are visible from outside.",
    "Criteria: pasteable filters, in each platform's own vocabulary.",
    "Synthesis: what stands out, and what none of this can tell you.",
  ];

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
        const map: Record<string, string> = {};
        for (const it of st.items) map[it.id] = it.a;
        setAnswers(map);
      }
    } catch {
      setError(c.errLoad);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (phase !== "analysis") { setTick(0); return; }
    const h = window.setInterval(() => setTick((x) => x + 1), 6000);
    return () => window.clearInterval(h);
  }, [phase]);

  async function post<R>(body: Record<string, unknown>): Promise<R | null> {
    const res = await fetch("/api/icp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // A timed out function returns an HTML error page. Parsing that throws, and
    // an uncaught throw left the progress row spinning with nothing on screen.
    const raw = await res.text();
    if (!raw.trim().startsWith("{")) { setError(c.timedOut); return null; }
    const json = JSON.parse(raw) as R & { error?: string };
    if (!res.ok) { setError(json.error || c.errLoad); return null; }
    setError("");
    return json;
  }

  async function start(branch: Branch) {
    setBusy(true);
    // The objective lives on the profile, not on the revision, so it is saved
    // before the revision that will be generated from it exists.
    await fetch("/api/buyer-profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "update", id: profile.id, objective }),
    }).catch(() => undefined);

    const r = await post<{ profile: Row }>({ action: "start", profileId: profile.id, branch });
    setBusy(false);
    if (!r) return;
    setDraft(r.profile);
    setCurrent(null);
    const st = readAnswers(r.profile.answers);
    const map: Record<string, string> = {};
    for (const it of st.items) map[it.id] = it.a;
    setAnswers(map);
    setStep(0);
  }

  const flush = useCallback(async () => {
    if (!draft || !dirty.current) return;
    const fields = stepsFor(objective, draft.branch, locale).flatMap((s) => s.fields);
    const items: QA[] = fields.map((f) => ({ id: f.id, q: f.label, a: answers[f.id] ?? "" }));
    // Confidence weighs how many paying customers there are, and the mock asks
    // no such number: the branch asserts it instead. Five is what the operating
    // branch claims, not a figure invented on the customer's behalf.
    const r = await post<{ profile: Row }>({
      action: "save",
      id: draft.id,
      sells: answers.sells ?? "",
      customerCount: draft.branch === "operating" ? 5 : 0,
      answers: items,
    });
    if (r) { setDraft(r.profile); setSavedAt(Date.now()); dirty.current = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, answers, objective, locale]);

  async function runPass(id: string, pass: Pass, quiet = false) {
    setRunning((r) => [...r, pass]);
    try {
      const r = await post<{ profile: Row; next: Pass | null }>({ action: "run", id, pass });
      if (!r) return null;
      if (!quiet) { setCurrent(r.profile); setDraft(null); }
      return r;
    } finally {
      setRunning((r) => r.filter((x) => x !== pass));
    }
  }

  async function confirmStep() {
    if (!draft) return;
    setBusy(true);
    setPhase("record");
    await flush();
    await runPass(draft.id, "market");
    setBusy(false);
    setPhase("");
  }

  async function generateRest() {
    if (!current) return;
    const id = current.id;
    const already: Pass[] = Array.isArray(current.output?.done) ? current.output.done : [];
    setBusy(true);
    setPhase("analysis");
    try {
      for (const x of AFTER_CONFIRM.filter((y) => !already.includes(y))) {
        const r = await runPass(id, x, true);
        if (!r) break;
      }
    } finally {
      await load();
      setBusy(false);
      setPhase("");
    }
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
    void load();
  }

  const btn: React.CSSProperties = {
    height: 32, boxSizing: "border-box", border: "1px solid " + T.border, borderRadius: T.rBtn,
    padding: "0 11px", fontSize: 13, fontFamily: T.font, background: T.card, color: T.body, cursor: "pointer",
  };
  const primary: React.CSSProperties = { ...btn, background: T.green, borderColor: T.green, color: T.onAccent, fontWeight: 500, padding: "0 14px" };
  const chip: React.CSSProperties = { border: "1px solid " + T.border, borderRadius: 4, background: T.soft, padding: "2px 7px", fontSize: 11.5, color: T.body, whiteSpace: "nowrap" };

  const out = current?.output ?? null;
  const doneList: Pass[] = Array.isArray(out?.done) ? out.done : [];
  const recordDone = Boolean(out?.market);
  const allDone = doneList.length === PASSES.length;
  const stage: 1 | 2 | 3 | 4 = draft ? 2 : !current || !recordDone ? 1 : !allDone ? 3 : 4;

  const header = (
    <>
      <a href="/buyer-profiles" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, textDecoration: "none", display: "inline-block", marginBottom: 9 }}>
        {c.back}
      </a>
      <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{profile.name}</h1>
      <p style={{ fontSize: 13.5, color: T.muted, margin: "7px 0 0", lineHeight: 1.55 }}>
        {current ? (() => { const x = OBJECTIVES.find((o) => o.id === profile.objective); return x ? (fr ? x.fr : x.en) : profile.objective; })() + " \u00b7 " + c.rev + " " + current.revision + ", " + (current.source === "asserted" ? c.asserted : c.refined) + " \u00b7 " : ""}
        {documents.length > 0 ? c.attached + documents.length + c.docs : c.noDocs}
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

  const steps: [number, string][] = [[1, c.s1], [2, c.s2], [3, c.s3], [4, c.s4]];

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
                {([["stated", c.tStated], ["find", c.tFind], ["observed", c.tObs]] as const).map(([k, label], i) => (
                  <button key={k} onClick={() => setTab(k)} style={{
                    flex: 1, padding: "11px 14px", fontSize: 12.5, cursor: "pointer",
                    border: "none", borderLeft: i === 0 ? "none" : "1px solid " + T.border,
                    background: tab === k ? T.soft : T.card,
                    color: tab === k ? T.heading : T.muted, fontWeight: tab === k ? 500 : 400,
                    fontFamily: T.font, textAlign: "left",
                  }}>{label}</button>
                ))}
              </div>
              <button style={btn} onClick={() => { setCurrent(null); setDraft(null); setAnswers({}); }}>{c.reanswer}</button>
            </div>

            {tab === "stated" && <Tier tone={T.faint} name={c.tStated} basis={c.bStated}><StatedTab p={out!} locale={locale} attachedDoc={documents[0] ?? null} profileId={profile.id} /></Tier>}
            {tab === "find" && <Tier tone={T.indigo} name={fr ? "Fait public" : "Public fact"} basis={c.bFind}><FindTab p={out!} locale={locale} /></Tier>}
            {tab === "observed" && (
              <Tier tone={observed.summary.engaged > 0 ? T.green : T.faint} name={c.tObs} basis={c.bObs} right={observed.summary.engaged + " / " + profile.threshold + c.needed}>
                <ObservedTab locale={locale} threshold={profile.threshold} view={observed} />
              </Tier>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", margin: "24px 0 22px" }}>
              {steps.map(([n, label], i) => (
                <div key={n} style={{
                  flex: 1, padding: "11px 14px", fontSize: 12.5,
                  borderLeft: i === 0 ? "none" : "1px solid " + T.border,
                  background: stage === n ? T.soft : "transparent",
                  color: stage === n ? T.heading : T.muted, fontWeight: stage === n ? 500 : 400,
                }}>
                  <span style={{ color: stage > n ? T.green : T.faint, marginRight: 7 }}>{n}</span>{label}
                </div>
              ))}
            </div>

            {stage === 1 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 7px" }}>{c.objH}</h2>
                <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 16px", lineHeight: 1.6, maxWidth: 700 }}>{c.objP}</p>
                {([OBJECTIVES.slice(0, 4), OBJECTIVES.slice(4)] as const).map((group, gi) => (
                  <div key={gi} style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(" + (gi === 0 ? 2 : 3) + ", minmax(0,1fr))",
                    gap: 12, marginTop: gi === 0 ? 0 : 12,
                  }}>
                    {group.map((o) => (
                      <button key={o.id} type="button" onClick={() => setObjective(o.id)} style={{
                        border: "1px solid " + (objective === o.id ? T.green : T.border),
                        boxShadow: objective === o.id ? "inset 0 0 0 1px " + T.green : "none",
                        borderRadius: T.rCard, background: T.card, padding: 15, textAlign: "left",
                        cursor: "pointer", fontFamily: T.font,
                      }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.heading }}>{fr ? o.fr : o.en}</span>
                        <span style={{ display: "block", fontSize: 12.5, color: T.muted, marginTop: 6, lineHeight: 1.55 }}>{fr ? o.hintFr : o.hintEn}</span>
                      </button>
                    ))}
                  </div>
                ))}

                <div style={{ height: 1, background: T.border, margin: "26px 0" }} />

                <h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: "0 0 6px" }}>{c.brH}</h2>
                <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 16px", lineHeight: 1.6, maxWidth: 700 }}>{c.brP}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
                  {([["operating", c.opH, c.opP], ["startup", c.stH, c.stP]] as const).map(([b, h, p]) => (
                    <button key={b} type="button" disabled={busy} onClick={() => void start(b as Branch)} style={{
                      border: "1px solid " + T.border, borderRadius: T.rCard, background: T.card,
                      padding: 16, textAlign: "left", cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.6 : 1, fontFamily: T.font,
                    }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.heading }}>{h}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: T.muted, marginTop: 7, lineHeight: 1.55 }}>{p}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {stage === 2 && draft && (
              <DiscoveryForm
                objective={objective}
                branch={draft.branch}
                locale={locale}
                step={step}
                setStep={setStep}
                answers={answers}
                setAnswers={(fn) => { dirty.current = true; setAnswers(fn); }}
                savedAt={savedAt}
                busy={busy}
                onFlush={flush}
                onGenerate={() => void confirmStep()}
                onDiscard={() => void discard()}
              />
            )}

            {stage === 3 && out?.market && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 7px" }}>{c.confirmH}</h2>
                <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 20px", lineHeight: 1.6, maxWidth: 700 }}>{c.confirmP}</p>

                <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 }}>
                  <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>{c.summary}</div>
                  <div style={{ padding: 16 }}>
                    {out.market.headline && <p style={{ fontSize: 15, lineHeight: 1.7, color: T.heading, margin: "0 0 16px" }}>{out.market.headline}</p>}
                    <dl style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr)", gap: "10px 16px", fontSize: 13, margin: 0 }}>
                      {[{ label: fr ? "Ce qui doit vraiment \u00eatre vrai" : "What actually has to be true", value: out.market.reallyTrue }].map((d, i) => (
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
                  <button style={btn} disabled={busy} onClick={() => { setCurrent(null); setDraft(null); }}>{c.change}</button>
                  <button style={{ ...primary, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void generateRest()}>{c.right}</button>
                </div>

                {(phase === "analysis" || doneList.length > 1) && (
                  <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 22 }}>
                    <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>{c.building}</div>
                    <div style={{ padding: "4px 16px" }}>
                      {PASSES.map((p) => {
                        const isDone = doneList.includes(p);
                        const isNow = running.includes(p);
                        return (
                          <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid " + T.border, fontSize: 13.5 }}>
                            <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: isDone ? T.green : isNow ? T.amber : T.faint }} />
                            <span style={{ color: isDone || isNow ? T.heading : T.muted }}>{PASS_LABEL[p]}</span>
                            <span style={{ marginLeft: "auto" }}>
                              {isDone ? <span style={{ fontSize: 12.5, color: T.faint }}>{c.done}</span>
                                : isNow ? <span style={{ fontSize: 12.5, color: T.faint }}>{c.now}</span>
                                : phase === "analysis" ? <span style={{ fontSize: 12.5, color: T.faint }}>{c.queued}</span>
                                : <button style={{ ...btn, height: 27, fontSize: 12 }} disabled={busy} onClick={() => void runOne(p)}>{c.run}</button>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {phase === "analysis" && (
                      <div style={{ borderTop: "1px solid " + T.border, borderLeft: "3px solid " + T.indigo, background: "#F5F5FF", padding: "11px 14px", fontSize: 12.5, lineHeight: 1.6, color: "#2C2E9E" }}>
                        {TICKS[tick % TICKS.length]}
                      </div>
                    )}
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
