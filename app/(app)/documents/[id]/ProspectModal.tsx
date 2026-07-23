"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type NewRec = { id: string; label: string | null; share_token: string; created_at: string };
type Variant = { id: string; label: string; note: string | null; active: boolean };
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
    const res = await fetch("/api/share-prospect", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId, mode, firstName, lastName, email: mode === "email" ? email : undefined, note: mode === "email" ? note.trim() : undefined, variantId: chosen || undefined }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? pm.somethingWrong); setBusy(false); return; }
    onCreated(json.recipient, json.readUrl, mode === "email" ? { sent: !!json.emailSent, warning: json.emailWarning } : null);
  }
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 };
  const textareaStyle = { ...input, minHeight: 88, resize: "vertical" as const, marginBottom: 6, lineHeight: 1.5 };
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 6 };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 26, width: 440, maxWidth: "100%", fontFamily: T.font, letterSpacing: T.tracking }}>
        <style>{`.t-in:focus{border-color:${T.green};outline:none}`}</style>
        {step === "type" && (
          <>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>{pm.shareTitle}</h3>
            <p style={{ fontSize: 14, color: T.body, margin: "0 0 22px", lineHeight: 1.5 }}>{pm.shareSub}</p>
            <button onClick={() => setStep("link")} style={choiceBtn}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={iconWrap}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1 M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg></span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.heading }}>{pm.shareAsLink}</div>
                  <div style={{ fontSize: 13, color: T.body }}>{pm.shareAsLinkSub}</div>
                </div>
              </div>
            </button>
            <button onClick={() => setStep("email")} style={{ ...choiceBtn, marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={iconWrap}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z M4 6l8 6 8-6" /></svg></span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.heading }}>{pm.sendAsEmail}</div>
                  <div style={{ fontSize: 13, color: T.body }}>{pm.sendAsEmailSub}</div>
                </div>
              </div>
            </button>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={onClose} style={ghostBtn}>{pm.cancel}</button>
            </div>
          </>
        )}
        {(step === "link" || step === "email") && (
          <>
            <button onClick={() => { setStep("type"); setError(""); }} style={{ background: "none", border: "none", color: T.body, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 14, fontFamily: T.font }}>{"\u2039"} {pm.back}</button>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>{step === "email" ? pm.sendAsEmail : pm.shareAsLink}</h3>
            <p style={{ fontSize: 13, color: T.body, margin: "0 0 20px" }}>{step === "email" ? pm.emailIntro : pm.linkIntro}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}><span style={label}>{pm.firstName}</span><input className="t-in" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sarah" style={input} /></div>
              <div style={{ flex: 1 }}><span style={label}>{pm.lastName}</span><input className="t-in" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Chen" style={input} /></div>
            </div>
            {step === "email" && (
              <>
                <span style={label}>{pm.emailLabel}</span>
                <input className="t-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@company.com" style={input} />
                <span style={label}>{noteLabel}</span>
                <textarea className="t-in" value={note} onChange={(e) => setNote(e.target.value)} placeholder={notePlaceholder} rows={3} maxLength={2000} style={textareaStyle} />
                <p style={{ fontSize: 12, color: T.body, margin: "0 0 4px", lineHeight: 1.4 }}>{salutationHint}</p>
                <p style={{ fontSize: 12, color: T.muted, margin: "0 0 12px", lineHeight: 1.4 }}>{noteHint}</p>
              </>
            )}
            {live.length > 0 && (
              <>
                <span style={label}>{fr ? "Version" : "Version"}</span>
                <select className="t-in" value={chosen} onChange={(e) => setVariantId(e.target.value)} style={input}>
                  {live.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}{v.note ? ` \u2014 ${v.note}` : ""}{v.id === suggested?.id ? (fr ? " (suggested)" : " (suggested)") : ""}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: 12, color: T.muted, margin: "-6px 0 12px", lineHeight: 1.4 }}>
                  {fr ? "La suggestion \u00e9quilibre le test. Changez-la si vous voulez." : "The suggestion keeps the split even. Change it if you want."}
                </p>
              </>
            )}
            {error && <p style={{ fontSize: 13, color: "#B42318", margin: "2px 0 12px" }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button onClick={onClose} style={ghostBtn}>{pm.cancel}</button>
              <button onClick={() => submit(step)} disabled={busy} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 20px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? pm.working : step === "email" ? pm.send : pm.createLink}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
const choiceBtn = { display: "block", width: "100%", background: "#fff", border: "1px solid #EAECEF", borderRadius: 12, padding: 16, cursor: "pointer", fontFamily: "inherit" };
const iconWrap = { width: 36, height: 36, borderRadius: 9, background: "#E7F6EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const ghostBtn = { background: "#fff", border: "1px solid #EAECEF", borderRadius: 8, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", color: "#0F1729", cursor: "pointer" };

