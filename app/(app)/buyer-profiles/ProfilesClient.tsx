"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

type Row = {
  id: string;
  name: string;
  objective: string;
  revisions: number;
  started: boolean;
  documents: number;
  updatedAt: string;
};

const COLS = "1.7fr 1fr 0.7fr 0.7fr 0.9fr";

export default function ProfilesClient({
  rows,
  limit,
  planName,
  topPlan,
  entitled,
}: {
  rows: Row[];
  limit: number | null;
  planName: string;
  topPlan: boolean;
  entitled: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("outbound");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

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
    colRevisions: fr ? "R\u00e9visions" : "Revisions",
    colDocs: fr ? "Documents" : "Documents",
    colUpdated: fr ? "Mis \u00e0 jour" : "Updated",
    statProfiles: fr ? "Profils" : "Profiles",
    statAttached: fr ? "Li\u00e9s \u00e0 un document" : "Attached to a document",
    statUnused: fr ? "Jamais li\u00e9s" : "Never attached",
    unlimited: fr ? "illimit\u00e9" : "unlimited",
    search: fr ? "Rechercher" : "Search profiles",
    all: fr ? "Tous les objectifs" : "All objectives",
    draft: fr ? "Brouillon" : "Draft",
    nameLabel: fr ? "Nom du profil" : "Profile name",
    namePlaceholder: fr ? "Acheteurs d\u2019onboarding, SaaS mid-market" : "Onboarding buyers, mid-market SaaS",
    objectiveLabel: fr ? "Que cherchez-vous \u00e0 faire ?" : "What are you here to do?",
    objectiveHint: fr
      ? "Cela change ce qui est g\u00e9n\u00e9r\u00e9, pas seulement la formulation."
      : "This changes what gets generated, not just the wording.",
    create: fr ? "Cr\u00e9er" : "Create",
    cancel: fr ? "Annuler" : "Cancel",
    working: fr ? "Un instant\u2026" : "Working\u2026",
    full: fr
      ? "Vous utilisez tous vos profils sur le plan " + planName + "."
      : "You are using every profile on the " + planName + " plan.",
    fullMore: topPlan
      ? (fr ? " Supprimez-en un pour lib\u00e9rer une place." : " Delete one to free a slot.")
      : (fr ? " Supprimez-en un ou passez au plan sup\u00e9rieur." : " Delete one to free a slot, or move up a plan."),
    none: fr ? "Aucun r\u00e9sultat" : "Nothing matches that",
    countOne: fr ? "profil" : "profile",
    countMany: fr ? "profils" : "profiles",
  };

  const OBJ: Record<string, string> = {
    outbound: fr ? "Vente sortante" : "Outbound sales",
    client: fr ? "Prospection client" : "Client prospecting",
    investor: fr ? "Recherche d\u2019investisseurs" : "Investor prospecting",
    partnership: fr ? "Partenariats" : "Partnerships",
  };

  const OBJ_HINT: Record<string, string> = {
    outbound: fr
      ? "Listes, personas et accroches. S\u2019appuie sur le comit\u00e9 d\u2019achat et les d\u00e9clencheurs."
      : "Lists, personas and openers. Leans on the buying committee and triggers.",
    client: fr
      ? "Agence ou conseil. S\u2019appuie sur les d\u00e9clencheurs de compte."
      : "Agency or consultancy work. Leans on account triggers.",
    investor: fr
      ? "Lev\u00e9e de fonds. Rempla\u00e7e les firmographies par le stade du fonds et la th\u00e8se."
      : "Raising. Replaces firmographics with fund stage, cheque size and thesis fit.",
    partnership: fr
      ? "Partenaires de r\u00e9f\u00e9rencement ou d\u2019int\u00e9gration."
      : "Referral, reseller or integration partners.",
  };

  const used = rows.length;
  const full = limit !== null && used >= limit;
  const attached = rows.filter((r) => r.documents > 0).length;

  const filtered = useMemo(() => {
    let r = rows;
    if (filter !== "all") r = r.filter((x) => x.objective === filter);
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((x) => x.name.toLowerCase().includes(t));
    return r;
  }, [rows, filter, q]);

  const objectivesInUse = useMemo(
    () => Array.from(new Set(rows.map((r) => r.objective))),
    [rows],
  );

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/buyer-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", name: name.trim(), objective }),
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

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.bp-row{transition:background .12s;text-decoration:none;color:inherit}.bp-row:hover{background:var(--rp-hover)}.bp-row:hover .dc-title{text-decoration:underline;text-underline-offset:2px}.bp-in:focus{outline:none;border-color:var(--rp-green)}`}</style>

      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          {c.title}
        </h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{c.subtitle}</p>

        {rows.length === 0 ? (
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
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...sel, minWidth: 170 }}>
                <option value="all">{c.all}</option>
                {objectivesInUse.map((o) => (
                  <option key={o} value={o}>{OBJ[o] ?? o}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="bp-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.search} style={{ ...sel, width: 220 }} />
                <button style={{ ...primary, opacity: full ? 0.5 : 1, cursor: full ? "not-allowed" : "pointer" }} disabled={full} onClick={() => setAdding(true)}>
                  {c.neu}
                </button>
              </div>
            </div>

            {full && (
              <div style={{ borderLeft: "3px solid " + T.amber, background: "#FFFBF5", padding: "11px 14px", marginBottom: 18, fontSize: 12.5, lineHeight: 1.6, color: "#7A3D0A" }}>
                {c.full}{c.fullMore}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card }} className="stat-strip">
              {([
                [limit === null ? String(used) : used + " / " + String(limit), c.statProfiles, limit === null ? c.unlimited : planName, T.green],
                [String(attached), c.statAttached, "", T.indigo],
                [String(used - attached), c.statUnused, "", T.border],
              ] as [string, string, string, string][]).map(([v, l, note, tone], i) => (
                <div key={i} style={{ padding: "15px 18px", borderLeft: "3px solid " + tone }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
                  {note && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 3 }}>{note}</div>}
                </div>
              ))}
            </div>

            <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
                <span>{c.colName}</span><span>{c.colObjective}</span><span>{c.colRevisions}</span><span>{c.colDocs}</span><span>{c.colUpdated}</span>
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: 44, textAlign: "center", fontSize: 14, color: T.muted }}>{c.none}</div>
              ) : filtered.map((r, i) => (
                <a key={r.id} href={"/buyer-profiles/" + r.id} className="bp-row" style={{ display: "grid", gridTemplateColumns: COLS, gap: 12, padding: "13px 18px", borderBottom: i < filtered.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
                  <span className="dc-title" style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", justifySelf: "start", maxWidth: "100%" }}>
                    {r.name}
                  </span>
                  <span><span style={chip}>{OBJ[r.objective] ?? r.objective}</span></span>
                  <span style={{ fontSize: 13.5, color: r.started ? T.body : T.faint, fontVariantNumeric: "tabular-nums" }}>
                    {r.started ? r.revisions : c.draft}
                  </span>
                  <span style={{ fontSize: 13.5, color: r.documents > 0 ? T.body : T.faint, fontVariantNumeric: "tabular-nums" }}>
                    {r.documents > 0 ? r.documents : "\u2014"}
                  </span>
                  <span style={{ fontSize: 13.5, color: T.faint, whiteSpace: "nowrap" }}>
                    {new Date(r.updatedAt).toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </a>
              ))}
              {filtered.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "11px 18px", borderTop: "1px solid " + T.border, fontSize: 12.5, color: T.muted }}>
                  {filtered.length} {filtered.length === 1 ? c.countOne : c.countMany}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {adding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.45)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }} onClick={() => !busy && setAdding(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, width: 560, maxWidth: "100%", boxShadow: T.overlayShadow }}>
            <div style={{ padding: "18px 20px 0" }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: T.heading, margin: "0 0 18px", letterSpacing: T.trackingTight }}>{c.neu}</h3>

              <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 }}>{c.nameLabel}</span>
              <input className="bp-in" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={c.namePlaceholder} style={{ ...sel, width: "100%", marginBottom: 18 }} />

              <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 2 }}>{c.objectiveLabel}</span>
              <p style={{ fontSize: 12.5, color: T.faint, margin: "0 0 10px", lineHeight: 1.45 }}>{c.objectiveHint}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginBottom: 4 }}>
                {(["outbound", "client", "investor", "partnership"] as const).map((o) => (
                  <button key={o} type="button" onClick={() => setObjective(o)} style={{
                    border: "1px solid " + (objective === o ? T.green : T.border),
                    boxShadow: objective === o ? "inset 0 0 0 1px " + T.green : "none",
                    borderRadius: T.rBtn, background: T.card, padding: 13, cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: T.heading }}>{OBJ[o]}</span>
                    <span style={{ display: "block", fontSize: 12, color: T.muted, marginTop: 5, lineHeight: 1.5 }}>{OBJ_HINT[o]}</span>
                  </button>
                ))}
              </div>

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
    </div>
  );
}
