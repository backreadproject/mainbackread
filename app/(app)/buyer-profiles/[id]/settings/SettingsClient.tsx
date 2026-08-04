"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { Cadence, NotifySettings } from "@/lib/profile-watch";

export default function SettingsClient({
  profile,
  canDaily,
  planName,
}: {
  profile: {
    id: string;
    name: string;
    cadence: Cadence;
    threshold: number;
    notify: NotifySettings;
    lastCheckedAt: string | null;
  };
  canDaily: boolean;
  planName: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const [cadence, setCadence] = useState<Cadence>(profile.cadence);
  const [threshold, setThreshold] = useState(profile.threshold);
  const [notify, setNotify] = useState<NotifySettings>(profile.notify);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    title: fr ? "R\u00e9\u00e9talonnage" : "Re-benchmarking",
    sub: fr
      ? "\u00c0 quelle fr\u00e9quence nous remesurons vos lecteurs contre ce profil, et quand nous vous interrompons \u00e0 ce sujet."
      : "How often we re-measure your readers against this profile, and when we interrupt you about it.",

    howH: fr ? "\u00c0 quelle fr\u00e9quence" : "How often",
    dailyT: fr ? "Chaque jour" : "Every day",
    dailyD: fr ? "Pour un profil sur une campagne active. Plan Business." : "For a profile on an active campaign. Business plan.",
    dailyLocked: fr ? " Disponible \u00e0 partir du plan Business, vous \u00eates sur " : " Available on the Business plan; you are on ",
    weeklyT: fr ? "Chaque semaine" : "Every week",
    weeklyD: fr
      ? "Le r\u00e9glage par d\u00e9faut. Assez de lecteurs arrivent en une semaine pour d\u00e9placer un chiffre, et pas si souvent que la cloche cesse de vouloir dire quelque chose."
      : "The default. Enough readers arrive in a week to move a number, and not so often that the bell stops meaning anything.",
    monthlyT: fr ? "Chaque mois" : "Every month",
    monthlyD: fr ? "Pour un profil au ralenti, ou sur lequel vous avez d\u00e9j\u00e0 agi." : "For a profile on a slow motion, or one you have already acted on.",
    manualT: fr ? "Seulement quand je l\u2019ouvre" : "Only when I open it",
    manualD: fr
      ? "Aucun travail en arri\u00e8re-plan, aucune notification. L\u2019analyse se calcule quand vous la regardez."
      : "No background work, no notifications. The gap analysis computes when you look at it.",

    whenH: fr ? "Quand vous interrompre" : "When to interrupt you",
    nGapT: fr ? "Un \u00e9cart franchit le seuil" : "A gap crosses the threshold",
    nGapD: fr
      ? "Ce qui \u00e9tait du bruit devient un constat. C\u2019est celui qui vaut une notification."
      : "Something that was noise becomes a finding. This is the one worth a notification.",
    nQuietT: fr ? "Un persona cesse d\u2019appara\u00eetre" : "A persona stops appearing",
    nQuietD: fr
      ? "Personne y correspondant ne s\u2019est engag\u00e9 depuis trente jours."
      : "Nobody matching it has engaged in the last 30 days.",
    nMovedT: fr ? "Un constat existant se renforce ou s\u2019inverse" : "An existing finding gets stronger or reverses",
    nMovedD: fr ? "La direction a chang\u00e9, pas seulement le chiffre." : "Direction changed, not just the number.",
    nEveryT: fr ? "Chaque v\u00e9rification, quoi qu\u2019elle trouve" : "Every re-check, whatever it found",
    nEveryD: fr
      ? "D\u00e9sactiv\u00e9 par principe. Une cloche qui sonne chaque semaine pour dire que rien n\u2019a chang\u00e9 est une cloche qu\u2019on cesse de lire."
      : "Off by design. A bell that rings weekly saying nothing changed is a bell you stop reading.",

    thH: fr ? "Seuil" : "Threshold",
    thT: fr ? "Lecteurs engag\u00e9s avant de conclure quoi que ce soit" : "Engaged readers before we call anything",
    thD: fr
      ? "Abaissez-le et on vous dira des choses qui ne sont pas vraies. Nous ne recommandons pas de descendre en dessous de vingt."
      : "Lower it and you will be told things that are not true. We do not recommend going under twenty.",
    thDefault: fr ? "20, par d\u00e9faut" : "20, default",

    lastChecked: fr ? "Derni\u00e8re v\u00e9rification : " : "Last checked ",
    never: fr ? "Jamais v\u00e9rifi\u00e9 automatiquement pour l\u2019instant." : "Not checked automatically yet.",
    manualNote: fr
      ? "Avec ce r\u00e9glage, rien ne tourne en arri\u00e8re-plan et la cloche ne dira rien sur ce profil."
      : "On this setting nothing runs in the background and the bell will say nothing about this profile.",

    save: fr ? "Enregistrer" : "Save",
    saving: fr ? "Un instant\u2026" : "Working\u2026",
    savedWord: fr ? "Enregistr\u00e9" : "Saved",
    cancel: fr ? "Annuler" : "Cancel",
    failed: fr ? "\u00c9chec de l\u2019enregistrement." : "Could not save that.",
  };

  const CADENCES: [Cadence, string, string][] = [
    ["daily", c.dailyT, c.dailyD],
    ["weekly", c.weeklyT, c.weeklyD],
    ["monthly", c.monthlyT, c.monthlyD],
    ["manual", c.manualT, c.manualD],
  ];

  const TOGGLES: [keyof NotifySettings, string, string][] = [
    ["gapFound", c.nGapT, c.nGapD],
    ["personaQuiet", c.nQuietT, c.nQuietD],
    ["findingMoved", c.nMovedT, c.nMovedD],
    ["everyCheck", c.nEveryT, c.nEveryD],
  ];

  const btn: React.CSSProperties = {
    height: 34, boxSizing: "border-box", padding: "0 11px",
    border: "1px solid " + T.border, borderRadius: T.rBtn,
    background: T.card, fontSize: 13.5, color: T.body, cursor: "pointer", fontFamily: T.font,
  };
  const primary: React.CSSProperties = { ...btn, background: T.green, borderColor: T.green, color: T.onAccent, fontWeight: 500, padding: "0 14px" };
  const card: React.CSSProperties = { border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 16 };
  const cardHead: React.CSSProperties = {
    background: T.soft, borderBottom: "1px solid " + T.border, padding: "9px 14px",
    fontSize: 11.5, color: T.muted, fontWeight: 500,
  };

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/buyer-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "update", id: profile.id, cadence, threshold, notify }),
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

  function when(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "short" })
      + ", " + d.toLocaleTimeString(fr ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" });
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
          <div style={cardHead}>{c.howH}</div>
          <div style={{ padding: "0 16px" }}>
            {CADENCES.map(([id, label, detail], i) => {
              const locked = id === "daily" && !canDaily;
              const on = cadence === id;
              return (
                <div
                  key={id}
                  onClick={() => !locked && setCadence(id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "13px 0",
                    borderBottom: i < CADENCES.length - 1 ? "1px solid " + T.border : "none",
                    cursor: locked ? "not-allowed" : "pointer",
                    opacity: locked ? 0.55 : 1,
                  }}
                >
                  <i style={{
                    width: 15, height: 15, borderRadius: "50%", flex: "none", marginTop: 2,
                    border: "1px solid " + (on ? T.green : T.border),
                    position: "relative", display: "inline-block",
                    background: T.card,
                  }}>
                    {on && <i style={{ position: "absolute", inset: 3, background: T.green, borderRadius: "50%", display: "block" }} />}
                  </i>
                  <div>
                    <div style={{ fontSize: 13.5, color: T.heading, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.55 }}>
                      {detail}
                      {locked && <span style={{ color: T.amber }}>{c.dailyLocked + planName + "."}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {cadence === "manual" && (
          <div style={{ borderLeft: "3px solid " + T.amber, background: "#FFFBF5", padding: "11px 14px", marginTop: 16, fontSize: 12.5, lineHeight: 1.6, color: "#7A3D0A" }}>
            {c.manualNote}
          </div>
        )}

        <div style={{ ...card, opacity: cadence === "manual" ? 0.55 : 1 }}>
          <div style={cardHead}>{c.whenH}</div>
          <div style={{ padding: "0 16px" }}>
            {TOGGLES.map(([key, label, detail], i) => {
              const on = notify[key];
              const off = cadence === "manual";
              return (
                <div key={key} style={{
                  display: "grid", gridTemplateColumns: "1fr 60px", gap: 16, alignItems: "center",
                  padding: "14px 0",
                  borderBottom: i < TOGGLES.length - 1 ? "1px solid " + T.border : "none",
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, color: T.heading, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.55 }}>{detail}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      aria-pressed={on}
                      disabled={off}
                      onClick={() => setNotify((n) => ({ ...n, [key]: !n[key] }))}
                      style={{
                        width: 34, height: 19, borderRadius: 10, border: "none", padding: 0,
                        background: on ? T.green : T.border,
                        position: "relative", cursor: off ? "not-allowed" : "pointer",
                        display: "inline-block", verticalAlign: "middle",
                      }}
                    >
                      <i style={{
                        position: "absolute", top: 2, left: on ? 17 : 2,
                        width: 15, height: 15, borderRadius: "50%", background: "#fff",
                        transition: "left .15s", display: "block",
                      }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={card}>
          <div style={cardHead}>{c.thH}</div>
          <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 13.5, color: T.heading, fontWeight: 500 }}>{c.thT}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, lineHeight: 1.55 }}>{c.thD}</div>
            </div>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ ...btn, width: 140, cursor: "pointer" }}
            >
              <option value={15}>15</option>
              <option value={20}>{c.thDefault}</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <p style={{ fontSize: 12, color: T.faint, margin: "14px 0 0", lineHeight: 1.6 }}>
          {profile.lastCheckedAt ? c.lastChecked + when(profile.lastCheckedAt) : c.never}
        </p>

        {error && <p style={{ fontSize: 13.5, color: T.dangerText, margin: "14px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <a href={"/buyer-profiles/" + profile.id} style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            {c.cancel}
          </a>
          <button style={{ ...primary, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void save()}>
            {busy ? c.saving : saved ? c.savedWord : c.save}
          </button>
        </div>
      </main>
    </div>
  );
}
