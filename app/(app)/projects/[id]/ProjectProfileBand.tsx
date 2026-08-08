"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

/**
 * The buyer profile on a project.
 *
 * Every document inside the project is measured against it, unless that
 * document carries its own or has been deliberately left out. Resolution
 * happens when a document is read, never copied here: copying would leave the
 * documents already in the project untouched, which is the one thing attaching
 * a profile to a project is expected to do.
 *
 * The counts are shown rather than implied. Three documents keeping their own
 * profile is correct behaviour and completely invisible otherwise.
 */

export type ProfileOption = { id: string; name: string; objective: string };
export type Counts = { following: number; overriding: number; detached: number };

export default function ProjectProfileBand({
  projectId,
  profiles,
  attached,
  counts,
  canManage,
}: {
  projectId: string;
  profiles: ProfileOption[];
  attached: ProfileOption | null;
  counts: Counts;
  canManage: boolean;
}) {
  const router = useRouter();
  const fr = useLocale() === "fr";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const c = {
    label: fr ? "Profil d\u2019acheteur" : "Buyer profile",
    none: fr ? "Aucun profil sur ce projet" : "No buyer profile on this project",
    noneWhy: fr
      ? "Liez un profil et chaque document de ce projet sera mesur\u00e9 contre lui, y compris ceux d\u00e9j\u00e0 pr\u00e9sents."
      : "Attach one and every document in this project gets measured against it, including the ones already in it.",
    appliesOne: fr ? "S\u2019applique \u00e0 1 document de ce projet" : "Applies to 1 document in this project",
    appliesMany: fr ? "S\u2019applique \u00e0 {n} documents de ce projet" : "Applies to {n} documents in this project",
    appliesNone: fr ? "Aucun document ne le suit encore" : "No document follows it yet",
    keepOwn: fr ? "{n} garde son propre profil" : "{n} keeps its own profile",
    keepOwnMany: fr ? "{n} gardent leur propre profil" : "{n} keep their own profile",
    leftOut: fr ? "{n} est laiss\u00e9 de c\u00f4t\u00e9" : "{n} is left out",
    leftOutMany: fr ? "{n} sont laiss\u00e9s de c\u00f4t\u00e9" : "{n} are left out",
    change: fr ? "Changer" : "Change",
    attach: fr ? "Lier un profil" : "Attach",
    remove: fr ? "Retirer" : "Remove",
    cancel: fr ? "Annuler" : "Cancel",
    working: fr ? "Un instant\u2026" : "Working\u2026",
    pick: fr ? "Quel profil ?" : "Which profile?",
    noProfiles: fr ? "Vous n\u2019avez encore aucun profil." : "You have no profiles yet.",
    create: fr ? "En cr\u00e9er un" : "Create one",
    failed: fr ? "\u00c9chec." : "Could not save that.",
  };

  async function save(profileId: string | null) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/project-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, profileId }),
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

  const sub = attached
    ? counts.following === 0
      ? c.appliesNone
      : (counts.following === 1 ? c.appliesOne : c.appliesMany.replace("{n}", String(counts.following)))
    : c.noneWhy;

  // Said plainly, because a document keeping its own profile is correct and
  // would otherwise look like the attach silently failed.
  const notes: string[] = [];
  if (attached && counts.overriding > 0) {
    notes.push((counts.overriding === 1 ? c.keepOwn : c.keepOwnMany).replace("{n}", String(counts.overriding)));
  }
  if (attached && counts.detached > 0) {
    notes.push((counts.detached === 1 ? c.leftOut : c.leftOutMany).replace("{n}", String(counts.detached)));
  }

  return (
    <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, background: T.card, marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, marginBottom: 6 }}>
            {c.label}
          </span>
          {attached ? (
            <a href={"/buyer-profiles/" + attached.id} className="dc-title" style={{ fontSize: 14.5, fontWeight: 600, color: T.heading, textDecoration: "none" }}>
              {attached.name}
            </a>
          ) : (
            <span style={{ fontSize: 14.5, color: T.muted }}>{c.none}</span>
          )}
          <p style={{ fontSize: 12.5, color: T.muted, margin: "4px 0 0", lineHeight: 1.55 }}>{sub}</p>
          {notes.length > 0 && (
            <p style={{ fontSize: 12.5, color: T.faint, margin: "4px 0 0", lineHeight: 1.55 }}>
              {notes.join(" \u00b7 ")}
            </p>
          )}
        </div>
        {canManage && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {attached && <button style={btn} disabled={busy} onClick={() => void save(null)}>{c.remove}</button>}
            <button style={btn} onClick={() => setOpen(true)}>{attached ? c.change : c.attach}</button>
          </span>
        )}
      </div>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.45)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}
          onClick={() => !busy && setOpen(false)}
        >
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
                  <button
                    key={p.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void save(p.id)}
                    style={{
                      border: "1px solid " + (attached?.id === p.id ? T.green : T.border),
                      borderRadius: T.rBtn, background: T.card, padding: "10px 12px",
                      textAlign: "left", cursor: "pointer", fontFamily: T.font,
                    }}
                  >
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: T.heading }}>{p.name}</span>
                  </button>
                ))}
              </div>
            )}

            {error && <p style={{ fontSize: 12.5, color: T.dangerText, margin: "0 0 12px" }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={btn} disabled={busy} onClick={() => setOpen(false)}>{busy ? c.working : c.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
