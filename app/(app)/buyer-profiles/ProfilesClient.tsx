"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { Deletable } from "@/lib/profile-reach";

type Basis = "draft" | "stated" | "tested";

type Row = {
  id: string;
  name: string;
  objective: string;
  revisions: number;
  started: boolean;
  documents: number;
  updatedAt: string;
  /** Draft until a revision is finished, Stated until the profile's own
   *  threshold is crossed, Tested after. Not a quality judgement: a statement
   *  about what the profile has been checked against. */
  basis: Basis;
  engaged: number;
  readers: number;
  threshold: number;
  lastSignalAt: string | null;
  /** On course to reach its threshold within a year, at the rate its readers
   *  are actually arriving. */
  willReach: boolean;
  weeksToThreshold: number | null;
  /** The worked example. Belongs to nobody, counts for nothing. */
  sample?: boolean;
};

const COLS = "1.6fr 1fr 0.9fr 0.7fr 0.8fr 1fr";

export default function ProfilesClient({
  rows,
  limit,
  planName,
  topPlan,
  entitled,
  deletable,
  sample,
}: {
  rows: Row[];
  limit: number | null;
  planName: string;
  topPlan: boolean;
  entitled: boolean;
  deletable: Deletable[];
  sample: Row | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [state, setState] = useState("all");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<Deletable | null>(null);

  const c = {
    title: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    subtitle: fr
      ? "\u00c0 qui vous vendez, o\u00f9 les trouver, et si vos lecteurs sont d\u2019accord."
      : "Who you are selling to, where to find them, and whether your readers agree.",
    neu: fr ? "Nouveau profil" : "New profile",
    first: fr ? "Cr\u00e9er votre premier profil" : "Build your first profile",
    emptyT: fr ? "Aucun profil d\u2019acheteur" : "No buyer profiles yet",
    emptyD: fr
      ? "Un profil r\u00e9pond \u00e0 qui contacter, o\u00f9 les trouver et quoi dire. Comptez environ quatre minutes."
      : "A profile answers who to contact, where to find them, and what to say. Building one takes about four minutes.",
    emptyD2: fr
      ? "Il commence comme une reformulation soign\u00e9e de ce que vous croyez d\u00e9j\u00e0. Il devient une preuve \u00e0 mesure que vos lecteurs ouvrent des documents."
      : "It starts as a careful restatement of what you already believe. It becomes evidence as your readers open documents, and it will tell you when they disagree with you.",
    honest: fr
      ? "Un profil n\u2019est pas termin\u00e9 une fois g\u00e9n\u00e9r\u00e9. Il s\u2019affine \u00e0 mesure que les lecteurs arrivent, et il lui faut environ vingt lecteurs engag\u00e9s avant de pouvoir vous apprendre quelque chose que vous n\u2019aviez pas d\u00e9j\u00e0 dit."
      : "A profile is not finished when it is generated. It sharpens as readers arrive, and it needs roughly twenty engaged readers before it can tell you anything you did not already say.",
    colName: fr ? "Profil" : "Profile",
    colObjective: fr ? "Objectif" : "Objective",
    colBasis: fr ? "Base" : "Basis",
    colDocs: fr ? "Documents" : "Documents",
    colEngaged: fr ? "Lecteurs engag\u00e9s" : "Engaged readers",
    colChecked: fr ? "Derni\u00e8re mesure" : "Last checked",
    statProfiles: fr ? "Profils" : "Profiles",
    statAttached: fr ? "Li\u00e9s \u00e0 un document" : "Attached to documents",
    statTested: fr ? "Test\u00e9s sur des lecteurs" : "Tested against readers",
    statNever: fr ? "N\u2019atteindront jamais le seuil" : "Will never reach threshold",
    statNeverNote: fr ? "\u00c0 votre volume actuel" : "At your current volume",
    unlimited: fr ? "illimit\u00e9" : "unlimited",
    search: fr ? "Rechercher" : "Search profiles",
    all: fr ? "Tous les objectifs" : "All objectives",
    anyState: fr ? "Tout \u00e9tat" : "Any state",
    bDraft: fr ? "Brouillon" : "Draft",
    bStated: fr ? "\u00c9nonc\u00e9 seulement" : "Stated only",
    bTested: fr ? "Test\u00e9" : "Tested",
    nameLabel: fr ? "Nom du profil" : "Profile name",
    namePlaceholder: fr ? "Acheteurs d\u2019onboarding, SaaS mid-market" : "Onboarding buyers, mid-market SaaS",
    create: fr ? "Cr\u00e9er" : "Create",
    cancel: fr ? "Annuler" : "Cancel",
    working: fr ? "Un instant\u2026" : "Working\u2026",
    full: fr
      ? "Vous utilisez tous vos profils sur le plan " + planName + "."
      : "You are using every profile on the " + planName + " plan.",
    fullMore: topPlan
      ? (fr ? " Supprimez-en un pour lib\u00e9rer une place." : " Delete one to free a slot.")
      : (fr ? " Supprimez-en un pour lib\u00e9rer une place, ou passez au plan sup\u00e9rieur." : " Delete one to free a slot, or move up a plan."),
    fullKeep: fr
      ? " Rien n\u2019est supprim\u00e9 et chaque profil existant continue de fonctionner."
      : " Nothing is removed and every existing profile keeps working.",
    none: fr ? "Aucun r\u00e9sultat" : "Nothing matches that",
    countOne: fr ? "profil" : "profile",
    countMany: fr ? "profils" : "profiles",
    neverAttached: fr ? "Jamais li\u00e9" : "Never attached",
    noReaders: fr ? "Aucun lecteur" : "No readers yet",
    unfinished: fr ? "Inachev\u00e9" : "Unfinished",
    noneUnused: fr ? "tous li\u00e9s" : "all attached",
    needed: fr ? "lecteurs engag\u00e9s requis" : "engaged readers needed",

    thinH: fr ? "Avant de passer au plan sup\u00e9rieur" : "Before you upgrade",
    thinOne: fr
      ? " de ces profils n\u2019a pas assez de lecteurs pour vous apprendre quoi que ce soit. Il vaut la peine de se demander s\u2019il s\u2019agit de march\u00e9s distincts ou d\u2019un seul march\u00e9 d\u00e9crit de plusieurs fa\u00e7ons. Plus de profils dilue les preuves sur tous."
      : " of these has too few readers to ever tell you anything. It is worth asking whether they are separate markets, or one market described several ways. More profiles thin the evidence across all of them.",
    thinMany: fr
      ? " de ces profils n\u2019ont pas assez de lecteurs pour vous apprendre quoi que ce soit. Il vaut la peine de se demander s\u2019il s\u2019agit de march\u00e9s distincts ou d\u2019un seul march\u00e9 d\u00e9crit de plusieurs fa\u00e7ons. Plus de profils dilue les preuves sur tous."
      : " of these have too few readers to ever tell you anything. It is worth asking whether they are separate markets, or one market described several ways. More profiles thin the evidence across all of them.",

    leastH: fr ? "Les moins utilis\u00e9s, si vous voulez r\u00e9cup\u00e9rer une place" : "Least used, if you want a slot back",
    rUnfinished: fr ? "Brouillon, jamais termin\u00e9" : "Draft, never finished",
    rUnattached: fr ? "Aucun document li\u00e9" : "No documents attached",
    rQuiet: fr ? "Aucun lecteur engag\u00e9" : "No engaged readers",
    del: fr ? "Supprimer" : "Delete",
    delT: fr ? "Supprimer ce profil ?" : "Delete this profile?",
    delD: fr
      ? "Le profil et toutes ses r\u00e9visions sont supprim\u00e9s. Les documents qui y \u00e9taient li\u00e9s continuent de fonctionner, ils cessent simplement d\u2019\u00eatre mesur\u00e9s contre lui. Les lecteurs gardent tout leur historique."
      : "The profile and all its revisions are deleted. Documents that were attached keep working, they just stop being measured against it. Readers keep their whole history.",
    seePlans: fr ? "Voir les plans" : "See plans",
    plansFoot: fr
      ? "Personal permet 3 profils. Team en permet 15. Business ne les limite pas."
      : "Personal allows 3 profiles. Team allows 15. Business does not limit them.",
    sampleChip: fr ? "Exemple" : "Sample",
    sampleFoot: fr
      ? "Le profil d\u2019exemple ne compte pas dans votre limite et ne peut pas \u00eatre modifi\u00e9."
      : "The sample profile does not count against your limit and cannot be edited.",
    countedFoot: fr
      ? "Le nombre de lecteurs engag\u00e9s est calcul\u00e9 \u00e0 l\u2019ouverture de cette page, \u00e0 partir des lecteurs des documents li\u00e9s. Les r\u00e9visions ne comptent pas dans votre limite, seuls les profils."
      : "Engaged readers are counted when you open this page, from the readers of the documents each profile is attached to. Revisions do not count against your limit. Only profiles do.",
  };

  const OBJ: Record<string, string> = {
    outbound: fr ? "Vente sortante" : "Outbound sales",
    client: fr ? "Prospection client" : "Client prospecting",
    investor: fr ? "Recherche d\u2019investisseurs" : "Investor prospecting",
    partnership: fr ? "Partenariats" : "Partnerships",
    recruiting: fr ? "Recrutement" : "Recruiting",
    retail: fr ? "Distribution et vente au d\u00e9tail" : "Distribution and retail",
    nonprofit: fr ? "Subventions et associations" : "Grants and nonprofit",
  };

  const BASIS: Record<Basis, { label: string; tone: string }> = {
    draft: { label: c.bDraft, tone: T.faint },
    stated: { label: c.bStated, tone: T.amber },
    tested: { label: c.bTested, tone: T.green },
  };

  const REASON: Record<Deletable["reason"], string> = {
    unfinished: c.rUnfinished,
    unattached: c.rUnattached,
    quiet: c.rQuiet,
  };

  const used = rows.length;
  const full = limit !== null && used >= limit;
  const attached = rows.filter((r) => r.documents > 0).length;
  const tested = rows.filter((r) => r.basis === "tested").length;
  const stuck = rows.filter((r) => !r.willReach).length;

  const commonThreshold = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const r of rows) counts[r.threshold] = (counts[r.threshold] ?? 0) + 1;
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return best ? Number(best[0]) : 20;
  }, [rows]);

  const filtered = useMemo(() => {
    let r = sample ? [sample, ...rows] : rows;
    if (filter !== "all") r = r.filter((x) => x.objective === filter);
    if (state !== "all") r = r.filter((x) => x.basis === state);
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((x) => x.name.toLowerCase().includes(t));
    return r;
  }, [rows, filter, state, q]);

  const objectivesInUse = useMemo(
    () => Array.from(new Set(rows.map((r) => r.objective))),
    [rows],
  );

  /** Absolute, and the locale is pinned. A relative string here depends on the
   *  render clock and hydrates differently on the server and the browser. */
  function when(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "short" })
      + ", " + d.toLocaleTimeString(fr ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/buyer-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", name: name.trim() }),
      });
      const json = (await res.json()) as { profile?: { id: string }; error?: string };
      if (!res.ok || !json.profile) {
        setError(json.error || (fr ? "\u00c9chec." : "Could not create that."));
        return;
      }
      router.push("/buyer-profiles/" + json.profile.id);
    } catch {
      setError(fr ? "\u00c9chec." : "Could not create that.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/buyer-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error || (fr ? "\u00c9chec." : "Could not delete that.")); return; }
      setConfirm(null);
      router.refresh();
    } catch {
      setError(fr ? "\u00c9chec." : "Could not delete that.");
    } finally {
      setBusy(false);
    }
  }

  const sel: React.CSSProperties = {
    height: 34,
    boxSizing: "border-box",
    border: "1px solid " + T.border,
    borderRadius: T.rBtn,
    padding: "0 10px",
    fontSize: 13.5,
    fontFamily: T.font,
    background: T.card,
    color: T.body,
  };
  const primary: React.CSSProperties = {
    ...sel,
    background: T.green,
    borderColor: T.green,
    color: T.onAccent,
    fontWeight: 500,
    cursor: "pointer",
    padding: "0 14px",
  };
  const chip: React.CSSProperties = {
    border: "1px solid " + T.border,
    borderRadius: 4,
    background: T.soft,
    padding: "2px 7px",
    fontSize: 11.5,
    color: T.body,
    whiteSpace: "nowrap",
  };
  const smallBtn: React.CSSProperties = {
    height: 27, padding: "0 9px", border: "1px solid " + T.border, borderRadius: T.rBtn,
    background: T.card, fontSize: 12, color: T.body, cursor: "pointer", fontFamily: T.font,
  };
  const num: React.CSSProperties = { fontSize: 13.5, fontVariantNumeric: "tabular-nums" };

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.bp-row{transition:background .12s;text-decoration:none;color:inherit}.bp-row:hover{background:var(--rp-hover)}.bp-row:hover .dc-title{text-decoration:underline;text-underline-offset:2px}.bp-in:focus{outline:none;border-color:var(--rp-green)}`}</style>

      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          {c.title}
        </h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{c.subtitle}</p>

        {rows.length === 0 && !sample ? (
          <>
            <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: "40px 26px", textAlign: "center", marginTop: 26 }}>
              <div style={{ fontSize: 15, color: T.heading, fontWeight: 500 }}>{c.emptyT}</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 10, lineHeight: 1.65, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
                {c.emptyD}
                <br />
                <br />
                {c.emptyD2}
              </div>
              {entitled && (
                <div style={{ marginTop: 20 }}>
                  <button style={primary} onClick={() => setAdding(true)}>{c.first}</button>
                </div>
              )}
            </div>
            <div style={{ borderLeft: "3px solid " + T.indigo, background: "#F5F5FF", padding: "11px 14px", marginTop: 18, fontSize: 12.5, lineHeight: 1.6, color: "#2C2E9E" }}>
              {c.honest}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "26px 0 16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...sel, minWidth: 170 }}>
                  <option value="all">{c.all}</option>
                  {objectivesInUse.map((o) => (
                    <option key={o} value={o}>{OBJ[o] ?? o}</option>
                  ))}
                </select>
                <select value={state} onChange={(e) => setState(e.target.value)} style={{ ...sel, minWidth: 150 }}>
                  <option value="all">{c.anyState}</option>
                  <option value="tested">{c.bTested}</option>
                  <option value="stated">{c.bStated}</option>
                  <option value="draft">{c.bDraft}</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="bp-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.search} style={{ ...sel, width: 220 }} />
                <button style={{ ...primary, opacity: full ? 0.5 : 1, cursor: full ? "not-allowed" : "pointer" }} disabled={full} onClick={() => setAdding(true)}>
                  {c.neu}
                </button>
              </div>
            </div>

            {full && (
              <div style={{ borderLeft: "3px solid " + T.amber, background: "#FFFBF5", padding: "11px 14px", marginBottom: 18, fontSize: 12.5, lineHeight: 1.6, color: "#7A3D0A" }}>
                {c.full}{c.fullMore}{c.fullKeep}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card }} className="stat-strip">
              {([
                [limit === null ? String(used) : used + " / " + String(limit), c.statProfiles, limit === null ? c.unlimited : planName, full ? T.amber : T.green],
                [String(attached), c.statAttached, used - attached > 0 ? String(used - attached) + " " + c.neverAttached.toLowerCase() : c.noneUnused, T.indigo],
                [String(tested), c.statTested, tested === 0 ? String(commonThreshold) + " " + c.needed : "", T.green],
                [String(stuck), c.statNever, c.statNeverNote, stuck > 0 ? T.danger : T.border],
              ] as [string, string, string, string][]).map(([v, l, note, tone], i) => (
                <div key={i} style={{ padding: "15px 18px", borderLeft: "3px solid " + tone }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
                  {note && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 3 }}>{note}</div>}
                </div>
              ))}
            </div>

            {stuck > 0 && (
              <div style={{ borderLeft: "3px solid " + T.indigo, background: "#F5F5FF", padding: "11px 14px", marginTop: 14, fontSize: 12.5, lineHeight: 1.6, color: "#2C2E9E" }}>
                {stuck}{stuck === 1 ? c.thinOne : c.thinMany}
              </div>
            )}

            <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
                <span>{c.colName}</span><span>{c.colObjective}</span><span>{c.colBasis}</span><span>{c.colDocs}</span><span>{c.colEngaged}</span><span>{c.colChecked}</span>
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: 44, textAlign: "center", fontSize: 14, color: T.muted }}>{c.none}</div>
              ) : filtered.map((r, i) => (
                <a key={r.id} href={"/buyer-profiles/" + r.id} className="bp-row" style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "13px 18px", borderBottom: i < filtered.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
                  <span className="dc-title" style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", justifySelf: "start", maxWidth: "100%" }}>
                    {r.name}
                  </span>
                  {r.sample && (
                    <span style={{
                      border: "1px solid " + T.indigo, borderRadius: 4, background: "#F5F5FF",
                      color: T.indigo, fontSize: 10.5, fontWeight: 500, padding: "1px 6px",
                      whiteSpace: "nowrap", justifySelf: "start", marginLeft: -4,
                    }}>{c.sampleChip}</span>
                  )}
                  <span>{r.started ? <span style={chip}>{OBJ[r.objective] ?? r.objective}</span> : <span style={{ fontSize: 13, color: T.faint }}>{"\u2014"}</span>}</span>
                  <span style={{ fontSize: 13.5, color: T.body, whiteSpace: "nowrap" }}>
                    <i style={{ display: "inline-block", width: 6, height: 6, background: BASIS[r.basis].tone, marginRight: 7, verticalAlign: 1 }} />
                    {BASIS[r.basis].label}
                  </span>
                  <span style={{ ...num, color: r.documents > 0 ? T.body : T.faint }}>
                    {r.documents > 0 ? r.documents : "\u2014"}
                  </span>
                  <span style={{ ...num, color: r.engaged > 0 ? T.body : T.faint }}>
                    {r.readers > 0 ? r.engaged : "\u2014"}
                  </span>
                  <span style={{ fontSize: 13, color: T.faint, whiteSpace: "nowrap" }}>
                    {!r.started
                      ? c.unfinished
                      : r.documents === 0
                        ? c.neverAttached
                        : r.lastSignalAt
                          ? when(r.lastSignalAt)
                          : c.noReaders}
                  </span>
                </a>
              ))}
              {filtered.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "11px 18px", borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
                  {filtered.length} {filtered.length === 1 ? c.countOne : c.countMany}
                </div>
              )}
            </div>

            {full && deletable.length > 0 && (
              <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 20 }}>
                <div style={{ background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px", fontSize: 11.5, color: T.muted, fontWeight: 500 }}>
                  {c.leastH}
                </div>
                <div style={{ padding: "0 16px" }}>
                  {deletable.map((d, i) => (
                    <div key={d.id} style={{
                      display: "grid", gridTemplateColumns: "1fr 220px 100px", gap: 16, alignItems: "center",
                      padding: "14px 0", borderBottom: i < deletable.length - 1 ? "1px solid " + T.border : "none",
                    }}>
                      <a href={"/buyer-profiles/" + d.id} className="dc-title" style={{ fontSize: 13.5, fontWeight: 500, textDecoration: "none" }}>{d.name}</a>
                      <span style={{ fontSize: 12.5, color: T.faint }}>
                        {REASON[d.reason]}
                        {", " + when(d.updatedAt)}
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <button style={smallBtn} onClick={() => setConfirm(d)}>{c.del}</button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {full && !topPlan && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <a href="/billing" style={{ ...primary, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>{c.seePlans}</a>
              </div>
            )}

            <p style={{ fontSize: 12, color: T.faint, margin: "11px 0 0", lineHeight: 1.6 }}>
              {sample ? c.sampleFoot + " " : ""}{full ? c.plansFoot + " " : ""}{c.countedFoot}
            </p>
          </>
        )}
      </main>

      {adding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.45)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }} onClick={() => !busy && setAdding(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, width: 460, maxWidth: "100%", boxShadow: T.overlayShadow }}>
            <div style={{ padding: "18px 20px 0" }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: T.heading, margin: "0 0 18px", letterSpacing: T.trackingTight }}>{c.neu}</h3>

              <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 }}>{c.nameLabel}</span>
              <input className="bp-in" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={c.namePlaceholder} style={{ ...sel, width: "100%", marginBottom: 18 }} />

              {error && <p style={{ fontSize: 13, color: T.dangerText, margin: "14px 0 0" }}>{error}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "18px 20px", marginTop: 4 }}>
              <button style={{ ...sel, cursor: "pointer" }} disabled={busy} onClick={() => setAdding(false)}>{c.cancel}</button>
              <button style={{ ...primary, opacity: !name.trim() || busy ? 0.5 : 1 }} disabled={!name.trim() || busy} onClick={() => void create()}>
                {busy ? c.working : c.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.45)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }} onClick={() => !busy && setConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, width: 460, maxWidth: "100%", boxShadow: T.overlayShadow, padding: "18px 20px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.heading, margin: "0 0 6px" }}>{c.delT}</h3>
            <p style={{ fontSize: 13.5, color: T.heading, margin: "0 0 10px", fontWeight: 500 }}>{confirm.name}</p>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 16px", lineHeight: 1.6 }}>{c.delD}</p>
            {error && <p style={{ fontSize: 12.5, color: T.dangerText, margin: "0 0 12px" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={{ ...sel, cursor: "pointer" }} disabled={busy} onClick={() => setConfirm(null)}>{c.cancel}</button>
              <button
                style={{ ...sel, cursor: "pointer", background: T.danger, borderColor: T.danger, color: T.onAccent, fontWeight: 500, opacity: busy ? 0.6 : 1 }}
                disabled={busy}
                onClick={() => void remove(confirm.id)}
              >
                {busy ? c.working : c.del}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
