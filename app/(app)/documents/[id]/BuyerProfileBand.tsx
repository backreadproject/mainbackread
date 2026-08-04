"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { summarise, type PersonaLike, type ReaderLike } from "@/lib/persona-match";

/**
 * The buyer profile band on a document.
 *
 * This is the link that closes the loop. Without it a profile is a document
 * nobody is measured against, and the observed tier can never fill.
 *
 * Readers who match no persona are counted and named rather than hidden. Two
 * readers matching nothing is not an error, it is the beginning of the finding
 * that the people engaging are not the people the sender said they were after.
 */

export type ProfileOption = { id: string; name: string; objective: string };
export type Attached = { id: string; name: string; revision: number; personas: PersonaLike[] };

export default function BuyerProfileBand({
  documentId,
  profiles,
  attached,
  readers,
  engaged,
}: {
  documentId: string;
  profiles: ProfileOption[];
  attached: Attached | null;
  readers: ReaderLike[];
  /** How many readers did more than glance. Computed by the caller, which
   *  already has the signals. */
  engaged: number;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const summary = useMemo(
    () => summarise(readers, attached?.personas ?? []),
    [readers, attached],
  );

  const c = {
    label: fr ? "Profil d\u2019acheteur" : "Buyer profile",
    none: fr ? "Aucun profil li\u00e9" : "No profile attached",
    noneWhy: fr
      ? "Liez un profil et les lecteurs de ce document seront mesur\u00e9s contre lui. C\u2019est ce qui remplit l\u2019onglet Observ\u00e9."
      : "Attach a profile and readers of this document get measured against it. That is what fills the Observed tab.",
    measured: fr ? "Les lecteurs de ce document sont mesur\u00e9s contre la r\u00e9vision " : "Readers of this document are measured against revision ",
    engagedLabel: fr ? "engag\u00e9s" : "engaged",
    change: fr ? "Changer" : "Change",
    attach: fr ? "Lier un profil" : "Attach a profile",
    detach: fr ? "D\u00e9lier" : "Detach",
    cancel: fr ? "Annuler" : "Cancel",
    save: fr ? "Enregistrer" : "Save",
    saving: fr ? "Un instant\u2026" : "Working\u2026",
    pick: fr ? "Quel profil ?" : "Which profile?",
    noProfiles: fr ? "Vous n\u2019avez encore aucun profil." : "You have no profiles yet.",
    create: fr ? "En cr\u00e9er un" : "Create one",
    noPersonas: fr
      ? "Ce profil n\u2019a pas encore de personas g\u00e9n\u00e9r\u00e9s, donc personne ne peut encore \u00eatre rapproch\u00e9."
      : "This profile has no personas generated yet, so nobody can be matched to one.",
    unmatchedOne: fr
      ? " lecteur ne correspond \u00e0 aucun persona du profil li\u00e9. Ce n\u2019est pas une erreur, et c\u2019est de l\u00e0 que part l\u2019analyse des \u00e9carts."
      : " reader matches no persona on the attached profile. Not an error, and part of what the gap analysis is built from.",
    unmatchedMany: fr
      ? " lecteurs ne correspondent \u00e0 aucun persona du profil li\u00e9. Ce n\u2019est pas une erreur, et c\u2019est de l\u00e0 que part l\u2019analyse des \u00e9carts."
      : " readers match no persona on the attached profile. Not an error, and part of what the gap analysis is built from.",
    failed: fr ? "\u00c9chec." : "Could not save that.",
  };

  async function save(profileId: string | null) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/document-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId, profileId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { setError(json.error || c.failed); return; }
      setOpen(false);
      router.refresh();
    } catch {
      setError(c.failed);
    } finally {
      setBusy(false);
    }
  }

  const btn: React.CSSProperties = {
    height: 30, padding: "0 11px", border: "1px solid " + T.border, borderRadius: T.rBtn,
    background: T.card, fontSize: 12.5, color: T.body, cursor: "pointer", fontFamily: T.font,
  };
  const chip: React.CSSProperties = {
    border: "1px solid " + T.border, borderRadius: 4, background: T.soft,
    padding: "2px 7px", fontSize: 11.5, color: T.body, whiteSpace: "nowrap",
  };

  return (
    <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, background: T.card, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: attached ? "1px solid " + T.border : "none", flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint }}>{c.label}</span>
        {attached ? (
          <a href={"/buyer-profiles/" + attached.id} className="dc-title" style={{ fontSize: 13.5, fontWeight: 500, textDecoration: "none" }}>
            {attached.name}
          </a>
        ) : (
          <span style={{ fontSize: 13.5, color: T.muted }}>{c.none}</span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {attached && (
            <button style={btn} disabled={busy} onClick={() => void save(null)}>{c.detach}</button>
          )}
          <button style={btn} onClick={() => setOpen(true)}>{attached ? c.change : c.attach}</button>
        </span>
      </div>

      {attached && (
        <div style={{ padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, margin: "0 0 12px" }}>
            <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>
              {c.measured}{attached.revision}.
            </p>
            <span style={{ marginLeft: "auto", fontSize: 13, color: T.body, whiteSpace: "nowrap" }}>
              <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{engaged}</span>
              <span style={{ color: T.muted }}>{" " + c.engagedLabel}</span>
            </span>
          </div>

          {attached.personas.length === 0 ? (
            <p style={{ fontSize: 12.5, color: T.faint, margin: 0, lineHeight: 1.6 }}>{c.noPersonas}</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {attached.personas.map((p) => (
                  <span key={p.name} style={chip}>
                    {p.name}
                    <span style={{ color: T.faint, marginLeft: 6 }}>{summary.byPersona[p.name] ?? 0}</span>
                  </span>
                ))}
              </div>
              {summary.unmatched > 0 && (
                <p style={{ fontSize: 12.5, color: T.faint, margin: "11px 0 0", lineHeight: 1.6 }}>
                  {summary.unmatched}{summary.unmatched === 1 ? c.unmatchedOne : c.unmatchedMany}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.45)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}
          onClick={() => !busy && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, width: 460, maxWidth: "100%", boxShadow: T.overlayShadow, padding: "18px 20px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.heading, margin: "0 0 6px" }}>{c.pick}</h3>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 16px", lineHeight: 1.55 }}>{c.noneWhy}</p>

            {profiles.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, margin: "0 0 16px" }}>
                {c.noProfiles} <a href="/buyer-profiles" style={{ color: T.green }}>{c.create}</a>
              </p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                {profiles.map((p) => (
                  <button key={p.id} type="button" disabled={busy} onClick={() => void save(p.id)} style={{
                    border: "1px solid " + (attached?.id === p.id ? T.green : T.border),
                    borderRadius: T.rBtn, background: T.card, padding: "10px 12px",
                    textAlign: "left", cursor: "pointer", fontFamily: T.font,
                  }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: T.heading }}>{p.name}</span>
                  </button>
                ))}
              </div>
            )}

            {error && <p style={{ fontSize: 12.5, color: T.dangerText, margin: "0 0 12px" }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={btn} disabled={busy} onClick={() => setOpen(false)}>{busy ? c.saving : c.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
