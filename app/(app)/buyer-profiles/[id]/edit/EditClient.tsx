"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { OBJECTIVES, type Objective } from "@/lib/buyer-questions";

/**
 * Editing a profile.
 *
 * Four things, and the line between them matters. The name and the objective
 * are the profile's own; changing them changes nothing that was generated.
 * Re-answering makes a new revision the customer wrote. Deleting removes it.
 *
 * What is NOT here, deliberately: hand-editing the disqualifiers, the market
 * definition or the personas. Those were generated from the answers, and typing
 * over them would produce a version that is neither what the customer asserted
 * nor what the system derived. The gap analysis measures against the last
 * asserted revision, so a half-edited one would quietly become the baseline and
 * the whole comparison would start agreeing with itself. Changing what you
 * believe is a re-answer, and that is the button.
 */

export default function EditClient({
  profile,
  generated,
  revisions,
  documents,
}: {
  profile: { id: string; name: string; objective: string };
  generated: boolean;
  revisions: number;
  documents: { id: string; title: string }[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const [name, setName] = useState(profile.name);
  const [objective, setObjective] = useState<Objective>((profile.objective as Objective) ?? "outbound");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    title: fr ? "Modifier ce profil" : "Edit this profile",
    sub: fr
      ? "Le nom et l\u2019objectif appartiennent au profil lui-m\u00eame. Changer ce que vous croyez du march\u00e9 est une nouvelle r\u00e9ponse aux questions, pas une modification."
      : "The name and the objective belong to the profile itself. Changing what you believe about the market is a re-answer, not an edit.",

    basicsH: fr ? "Le profil" : "The profile",
    nameL: fr ? "Nom du profil" : "Profile name",
    nameH: fr ? "Ce que vous voyez dans la liste. Ne change rien de g\u00e9n\u00e9r\u00e9." : "What you see in the list. Changes nothing that was generated.",
    objL: fr ? "Objectif" : "Objective",
    objH: fr
      ? "D\u00e9cide des questions pos\u00e9es et de ce qui est g\u00e9n\u00e9r\u00e9."
      : "Decides which questions are asked and what gets generated.",
    objLocked: fr
      ? "Ce profil a d\u00e9j\u00e0 \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9. Changer d\u2019objectif changerait les questions, donc cela se fait en r\u00e9pondant \u00e0 nouveau, plus bas."
      : "This profile has already been generated. A different objective means different questions, so it happens by re-answering, below.",
    save: fr ? "Enregistrer" : "Save",
    saving: fr ? "Un instant\u2026" : "Working\u2026",
    savedWord: fr ? "Enregistr\u00e9" : "Saved",
    cancel: fr ? "Annuler" : "Cancel",

    biggerH: fr ? "Changements plus importants" : "Bigger changes",

    reanswerT: fr ? "Tout re-r\u00e9pondre" : "Re-answer everything",
    reanswerD: fr
      ? "Cr\u00e9e une nouvelle r\u00e9vision \u00e9crite par vous. L\u2019actuelle est conserv\u00e9e et reste lisible, et c\u2019est la nouvelle qui devient la r\u00e9f\u00e9rence de l\u2019analyse des \u00e9carts."
      : "Creates a new revision written by you. The current one is kept and stays readable, and the new one becomes what the gap analysis measures against.",
    reanswerB: fr ? "Re-r\u00e9pondre" : "Re-answer",

    whyNoEditT: fr ? "Pourquoi les sections g\u00e9n\u00e9r\u00e9es ne se modifient pas \u00e0 la main" : "Why the generated sections cannot be hand-edited",
    whyNoEditD: fr
      ? "La d\u00e9finition du march\u00e9, les disqualificateurs et les personas ont \u00e9t\u00e9 d\u00e9duits de vos r\u00e9ponses. Les r\u00e9\u00e9crire \u00e0 la main produirait une version qui n\u2019est ni ce que vous avez affirm\u00e9 ni ce qui en a \u00e9t\u00e9 d\u00e9duit, et l\u2019analyse des \u00e9carts mesure contre la derni\u00e8re version que vous avez \u00e9crite. Elle finirait par \u00eatre d\u2019accord avec elle-m\u00eame."
      : "The market definition, the disqualifiers and the personas were derived from your answers. Typing over them would produce a version that is neither what you asserted nor what was derived from it, and the gap analysis measures against the last version you wrote. It would end up agreeing with itself.",

    deleteT: fr ? "Supprimer ce profil" : "Delete this profile",
    deleteD: fr
      ? "Le profil et ses "
      : "The profile and its ",
    deleteD2: fr ? " r\u00e9visions sont supprim\u00e9s d\u00e9finitivement." : " revisions are permanently deleted.",
    deleteDocs: fr
      ? "Les documents li\u00e9s continuent de fonctionner, ils cessent simplement d\u2019\u00eatre mesur\u00e9s contre lui. Les lecteurs gardent tout leur historique."
      : "Attached documents keep working, they just stop being measured against it. Readers keep their whole history.",
    deleteAttached: fr ? "Actuellement li\u00e9 \u00e0 " : "Currently attached to ",
    deleteAttached2: fr ? " document(s)." : " document(s).",
    deleteB: fr ? "Supprimer" : "Delete",
    deleteConfirm: fr ? "Tapez le nom du profil pour confirmer" : "Type the profile name to confirm",
    deleteFrees: fr ? "Supprimer lib\u00e8re une place sur votre plan." : "Deleting frees a slot on your plan.",

    failed: fr ? "\u00c9chec." : "Could not save that.",
    failedDel: fr ? "\u00c9chec de la suppression." : "Could not delete that.",
  };

  const btn: React.CSSProperties = {
    height: 34, boxSizing: "border-box", padding: "0 11px",
    border: "1px solid " + T.border, borderRadius: T.rBtn,
    background: T.card, fontSize: 13.5, color: T.body, cursor: "pointer", fontFamily: T.font,
  };
  const primary: React.CSSProperties = { ...btn, background: T.green, borderColor: T.green, color: T.onAccent, fontWeight: 500, padding: "0 14px" };
  const danger: React.CSSProperties = { ...btn, background: T.danger, borderColor: T.danger, color: T.onAccent, fontWeight: 500, padding: "0 14px" };
  const input: React.CSSProperties = { ...btn, width: "100%", cursor: "text", color: T.heading };
  const card: React.CSSProperties = { border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 16 };
  const cardHead: React.CSSProperties = {
    background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px",
    fontSize: 11.5, color: T.muted, fontWeight: 500,
  };
  const rowLabel: React.CSSProperties = { fontSize: 13, color: T.heading, fontWeight: 500 };
  const rowHint: React.CSSProperties = { fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 };

  const dirty = name.trim() !== profile.name || objective !== profile.objective;

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/buyer-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: profile.id,
          name: name.trim(),
          ...(generated ? {} : { objective }),
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error || c.failed); return; }
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setError(c.failed);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/buyer-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete", id: profile.id }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error || c.failedDel); setBusy(false); return; }
      router.push("/buyer-profiles");
    } catch {
      setError(c.failedDel);
      setBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, marginBottom: 9 }}>
          <a href="/buyer-profiles" style={{ color: "inherit", textDecoration: "none" }}>{c.back}</a>
          {" \u00b7 "}
          <a href={"/buyer-profiles/" + profile.id} style={{ color: "inherit", textDecoration: "none" }}>{profile.name}</a>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
          {c.title}
        </h1>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "9px 0 0", lineHeight: 1.6, maxWidth: 720 }}>{c.sub}</p>

        <div style={{ ...card, marginTop: 24 }}>
          <div style={cardHead}>{c.basicsH}</div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "230px minmax(0,1fr)", gap: 16, padding: "15px 0", borderBottom: "1px solid " + T.border, alignItems: "start" }}>
              <div>
                <div style={rowLabel}>{c.nameL}</div>
                <div style={rowHint}>{c.nameH}</div>
              </div>
              <input style={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "230px minmax(0,1fr)", gap: 16, padding: "15px 0", alignItems: "start" }}>
              <div>
                <div style={rowLabel}>{c.objL}</div>
                <div style={rowHint}>{generated ? c.objLocked : c.objH}</div>
              </div>
              {generated ? (
                <div style={{ fontSize: 13.5, color: T.body, paddingTop: 7 }}>
                  {(() => {
                    const o = OBJECTIVES.find((x) => x.id === profile.objective);
                    return o ? (fr ? o.fr : o.en) : profile.objective;
                  })()}
                </div>
              ) : (
                <select value={objective} onChange={(e) => setObjective(e.target.value as Objective)} style={{ ...btn, width: "100%", cursor: "pointer" }}>
                  {OBJECTIVES.map((o) => (
                    <option key={o.id} value={o.id}>{fr ? o.fr : o.en}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {error && <p style={{ fontSize: 13.5, color: T.dangerText, margin: "14px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <a href={"/buyer-profiles/" + profile.id} style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            {c.cancel}
          </a>
          <button
            style={{ ...primary, opacity: busy || !dirty || !name.trim() ? 0.5 : 1 }}
            disabled={busy || !dirty || !name.trim()}
            onClick={() => void save()}
          >
            {busy ? c.saving : saved ? c.savedWord : c.save}
          </button>
        </div>

        <div style={{ ...card, marginTop: 30 }}>
          <div style={cardHead}>{c.biggerH}</div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 16, alignItems: "center", padding: "15px 0", borderBottom: "1px solid " + T.border }}>
              <div>
                <div style={rowLabel}>{c.reanswerT}</div>
                <div style={rowHint}>{c.reanswerD}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <a href={"/buyer-profiles/" + profile.id} style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  {c.reanswerB}
                </a>
              </div>
            </div>

            <div style={{ padding: "15px 0", borderBottom: "1px solid " + T.border }}>
              <div style={rowLabel}>{c.whyNoEditT}</div>
              <div style={{ ...rowHint, maxWidth: 720 }}>{c.whyNoEditD}</div>
            </div>

            <div style={{ padding: "15px 0" }}>
              <div style={rowLabel}>{c.deleteT}</div>
              <div style={{ ...rowHint, maxWidth: 720 }}>
                {c.deleteD}{revisions}{c.deleteD2} {c.deleteDocs}
                {documents.length > 0 && (
                  <>
                    {" "}
                    <span style={{ color: T.amber }}>{c.deleteAttached}{documents.length}{c.deleteAttached2}</span>
                  </>
                )}
                {" "}{c.deleteFrees}
              </div>

              {!confirming ? (
                <div style={{ marginTop: 12 }}>
                  <button style={btn} onClick={() => setConfirming(true)}>{c.deleteB}</button>
                </div>
              ) : (
                <div style={{ marginTop: 12, maxWidth: 420 }}>
                  <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 6 }}>{c.deleteConfirm}</div>
                  <input
                    style={{ ...input, marginBottom: 10 }}
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={profile.name}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btn} disabled={busy} onClick={() => { setConfirming(false); setTyped(""); }}>{c.cancel}</button>
                    <button
                      style={{ ...danger, opacity: busy || typed.trim() !== profile.name ? 0.5 : 1 }}
                      disabled={busy || typed.trim() !== profile.name}
                      onClick={() => void remove()}
                    >
                      {busy ? c.saving : c.deleteB}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
