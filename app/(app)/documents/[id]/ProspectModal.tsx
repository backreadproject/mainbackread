"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type NewRec = { id: string; label: string | null; share_token: string; created_at: string };
type Variant = { id: string; label: string; note: string | null; active: boolean };
const choiceBtn = { display: "block", width: "100%", background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, padding: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const };
const iconWrap = { width: 30, height: 30, borderRadius: 4, border: "1px solid " + T.border, background: T.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const ghostBtn = { height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", color: T.heading, cursor: "pointer" };
export default function ProspectModal({ documentId, onClose, onCreated, variants = [], counts = {} }: {
  documentId: string;
  onClose: () => void;
  onCreated: (rec: NewRec, readUrl: string, emailInfo: { sent: boolean; warning?: string } | null) => void;
  variants?: Variant[];
  counts?: Record<string, number>;
}) {
  const locale = useLocale();
  const pm = getDict(locale).prospectModal;
  const fr = locale === "fr";
  const noteLabel = fr ? "Ajouter un mot (facultatif)" : "Add a note (optional)";
  const notePlaceholder = fr ? "Une ligne ou deux pour votre destinataire\u2026" : "A line or two so your recipient understands\u2026";
  const noteHint = fr ? "Laissez vide pour envoyer l'e-mail standard." : "Leave blank to send the standard email.";
  const salutationHint = fr ? "Pas besoin d'ajouter de salutation. Nous les saluons d\u00e9j\u00e0 par leur nom en haut." : "No need to add a greeting. We already address them by name at the top.";
  const emailForGrouping = fr ? "E-mail (facultatif)" : "Email (optional)";
  const groupingHint = fr
    ? "Rien ne lui sera envoy\u00e9. L\u2019adresse sert \u00e0 regrouper les lecteurs d\u2019une m\u00eame entreprise."
    : "Nothing is sent to it. The address is used to group readers from the same company.";
  const [step, setStep] = useState<"type" | "link" | "email">("type");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Auto-balance suggestion: the active variant with the fewest readers so far.
  const live = variants.filter((v) => v.active);
  const suggested = live.length ? live.reduce((best, v) => ((counts[v.id] ?? 0) < (counts[best.id] ?? 0) ? v : best), live[0]) : null;
  const [variantId, setVariantId] = useState<string>("");
  const chosen = variantId || suggested?.id || "";
  async function submit(mode: "link" | "email") {
    setError("");
    if (!firstName.trim() || !lastName.trim()) { setError(pm.nameRequired); return; }
    if (mode === "email" && !email.trim()) { setError(pm.emailRequired); return; }
    setBusy(true);
    // Guarded like every other write in the app: a 500 or 504 returns HTML, and
    // an unguarded res.json() would throw and leave the button stuck on Working.
    try {
      const res = await fetch("/api/share-prospect", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId, mode, firstName, lastName, email: email.trim() || undefined, note: mode === "email" ? note.trim() : undefined, variantId: chosen || undefined }),
      });
      const text = await res.text();
      let json: { recipient?: NewRec; readUrl?: string; emailSent?: boolean; emailWarning?: string; error?: string } = {};
      try { json = JSON.parse(text); } catch { throw new Error("Server returned " + res.status + " and no error detail."); }
      if (!res.ok) throw new Error(json.error ?? pm.somethingWrong);
      if (!json.recipient) throw new Error(pm.somethingWrong);
      onCreated(json.recipient, json.readUrl ?? "", mode === "email" ? { sent: !!json.emailSent, warning: json.emailWarning } : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : pm.somethingWrong);
      setBusy(false);
    }
  }
  const input = { width: "100%", height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading, marginBottom: 12 };
  const textareaStyle = { ...input, height: "auto", minHeight: 82, padding: "10px 11px", resize: "vertical" as const, marginBottom: 6, lineHeight: 1.55 };
  const label = { fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 };
  return (
    <div onClick={() => !busy && onClose()} style={{ position: "fixed", inset: 0, background: T.scrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, padding: 24, width: 440, maxWidth: "100%", fontFamily: T.font, letterSpacing: T.tracking }}>
        <style>{`.t-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
        {step === "type" && (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>{pm.shareTitle}</h3>
            <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 18px", lineHeight: 1.55 }}>{pm.shareSub}</p>
            <button onClick={() => setStep("link")} style={choiceBtn}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={iconWrap}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1 M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg></span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: T.heading }}>{pm.shareAsLink}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 1 }}>{pm.shareAsLinkSub}</div>
                </div>
              </div>
            </button>
            <button onClick={() => setStep("email")} style={{ ...choiceBtn, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={iconWrap}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z M4 6l8 6 8-6" /></svg></span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: T.heading }}>{pm.sendAsEmail}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 1 }}>{pm.sendAsEmailSub}</div>
                </div>
              </div>
            </button>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button onClick={onClose} style={ghostBtn}>{pm.cancel}</button>
            </div>
          </>
        )}
        {(step === "link" || step === "email") && (
          <>
            <button onClick={() => { setStep("type"); setError(""); }} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 14, fontFamily: T.font }}>{"\u2039"} {pm.back}</button>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>{step === "email" ? pm.sendAsEmail : pm.shareAsLink}</h3>
            <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 18px", lineHeight: 1.55 }}>{step === "email" ? pm.emailIntro : pm.linkIntro}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><span style={label}>{pm.firstName}</span><input className="t-in" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sarah" style={input} /></div>
              <div style={{ flex: 1 }}><span style={label}>{pm.lastName}</span><input className="t-in" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Chen" style={input} /></div>
            </div>
            <span style={label}>{step === "email" ? pm.emailLabel : emailForGrouping}</span>
            <input className="t-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@company.com" style={step === "email" ? input : { ...input, marginBottom: 6 }} />
            {step === "link" && <p style={{ fontSize: 12.5, color: T.faint, margin: "0 0 12px", lineHeight: 1.45 }}>{groupingHint}</p>}
            {step === "email" && (
              <>
                <span style={label}>{noteLabel}</span>
                <textarea className="t-in" value={note} onChange={(e) => setNote(e.target.value)} placeholder={notePlaceholder} rows={3} maxLength={2000} style={textareaStyle} />
                <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 3px", lineHeight: 1.45 }}>{salutationHint}</p>
                <p style={{ fontSize: 12.5, color: T.faint, margin: "0 0 12px", lineHeight: 1.45 }}>{noteHint}</p>
              </>
            )}
            {live.length > 0 && (
              <>
                <span style={label}>Version</span>
                <select className="t-in" value={chosen} onChange={(e) => setVariantId(e.target.value)} style={input}>
                  {live.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}{v.note ? " \u2014 " + v.note : ""}{v.id === suggested?.id ? (fr ? " (sugg\u00e9r\u00e9)" : " (suggested)") : ""}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: 12.5, color: T.faint, margin: "-6px 0 12px", lineHeight: 1.45 }}>
                  {fr ? "La suggestion \u00e9quilibre le test. Changez-la si vous voulez." : "The suggestion keeps the split even. Change it if you want."}
                </p>
              </>
            )}
            {error && <div style={{ background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, margin: "0 0 12px", lineHeight: 1.5 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button onClick={onClose} disabled={busy} style={ghostBtn}>{pm.cancel}</button>
              <button onClick={() => submit(step)} disabled={busy} style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? pm.working : step === "email" ? pm.send : pm.createLink}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}