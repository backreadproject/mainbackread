"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// How you sell.
//
// One setting today, and the card is built to grow. The rule that got it here:
// nothing goes into Settings until two things read it. The quiet threshold
// earned that -- the cooling list and the outcome prompt both had it hardcoded,
// and two features asking about the same silence on different clocks would be
// incoherent.
//
// The default works. Somebody who never opens this page should not be able to
// tell it exists.
const CHOICES = [3, 5, 7, 10, 14, 21, 30] as const;

export default function SalesCard({ quietDays: initial }: { quietDays: number }) {
  const fr = useLocale() === "fr";
  const [days, setDays] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const C = {
    title: fr ? "Votre fa\u00e7on de vendre" : "How you sell",
    intro: fr
      ? "Apr\u00e8s combien de jours sans nouvelles consid\u00e9rons-nous qu\u2019un lecteur engag\u00e9 s\u2019est refroidi ? Cela d\u00e9termine qui appara\u00eet dans \u00ab Ils se sont tus \u00bb et quand nous vous demandons ce qu\u2019il est advenu d\u2019une affaire."
      : "How many days of silence before we treat an engaged reader as cooling? This decides who appears under \u201cThey have gone quiet\u201d, and when we ask you what happened to a deal.",
    label: fr ? "Silence avant refroidissement" : "Silence before cooling",
    days: fr ? "jours" : "days",
    save: fr ? "Enregistrer" : "Save",
    saving: fr ? "Enregistrement..." : "Saving...",
    saved: fr ? "Enregistr\u00e9." : "Saved.",
    failed: fr ? "Impossible d\u2019enregistrer." : "Could not save that.",
    note: fr
      ? "Seuls les lecteurs r\u00e9ellement engag\u00e9s comptent : un simple coup d\u2019\u0153il n\u2019est pas une affaire qui se refroidit."
      : "Only genuinely engaged readers count. A single glance is not a deal going cold.",
  };

  async function save() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/sales-settings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ quietDays: days }),
      });
      const raw = await res.text();
      let json: { error?: string } = {};
      try { json = JSON.parse(raw); } catch { json = {}; }
      if (!res.ok) throw new Error(json.error ?? C.failed);
      setOk(true); setMsg(C.saved);
    } catch (e) {
      setOk(false); setMsg(e instanceof Error ? e.message : C.failed);
    } finally { setBusy(false); }
  }

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };

  return (
    <div style={card}>
      <div style={head}>{C.title}</div>
      <div style={{ padding: 18 }}>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 16px", lineHeight: 1.55 }}>{C.intro}</p>
        <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 8 }}>{C.label}</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {CHOICES.map((d) => (
            <button key={d} onClick={() => { setDays(d); setMsg(""); }}
              style={{ height: 30, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font,
                color: d === days ? T.onAccent : T.heading,
                background: d === days ? T.green : T.card,
                border: "1px solid " + (d === days ? T.green : T.border),
                borderRadius: T.rBtn, cursor: "pointer" }}>
              {d} {C.days}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: T.faint, margin: "0 0 16px", lineHeight: 1.55 }}>{C.note}</p>
        <button onClick={save} disabled={busy || days === initial}
          style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn,
            padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer",
            opacity: busy || days === initial ? 0.5 : 1 }}>
          {busy ? C.saving : C.save}
        </button>
        {msg && <p style={{ fontSize: 13, color: ok ? T.greenText : T.dangerText, margin: "12px 0 0" }}>{msg}</p>}
      </div>
    </div>
  );
}