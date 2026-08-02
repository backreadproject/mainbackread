"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import DropZone from "@/app/(app)/DropZone";

// Adding a document.
//
// Two steps, because a signing document is a different kind of object and that
// has to be declared before the file is committed. Picking a file no longer
// uploads it: it moves to a second step where the sender says whether anyone
// signs, and names them. An ordinary document passes through in one click.
//
// Signers are named HERE rather than shared later because the fields are placed
// against people -- "Ada signs on page 4" -- and there is nothing to place
// against until the people exist.
export type Signer = { name: string; email: string };

export default function UploadModal({
  onClose, onPick, busy, progress, selfName, selfEmail,
}: {
  onClose: () => void;
  onPick: (file: File, signing: { enabled: boolean; signers: Signer[] }) => void;
  busy: boolean;
  progress: { name: string; size: number; step: string } | null;
  selfName: string;
  selfEmail: string;
}) {
  const fr = useLocale() === "fr";
  const [file, setFile] = useState<File | null>(null);
  const [signing, setSigning] = useState(false);
  const [selfSigns, setSelfSigns] = useState(false);
  const [signers, setSigners] = useState<Signer[]>([{ name: "", email: "" }]);
  const [err, setErr] = useState("");

  const C = {
    title: fr ? "Ajouter un document" : "Add a document",
    sub: fr ? "PDF de pr\u00e9f\u00e9rence. Les images sont accept\u00e9es." : "PDF preferred. Images are accepted.",
    note: fr
      ? "Les fichiers Word et PowerPoint doivent d\u2019abord \u00eatre export\u00e9s en PDF, afin que votre lecteur voie le document exactement tel que vous l\u2019avez con\u00e7u."
      : "Word and PowerPoint files should be exported to PDF first, so your reader sees the document exactly as you designed it.",
    wrong: fr ? "Envoyez un PDF, ou une image JPEG, PNG, WebP ou GIF." : "Upload a PDF, or a JPEG, PNG, WebP or GIF image.",
    needsSig: fr ? "Ce document doit \u00eatre sign\u00e9" : "This document needs signatures",
    needsSigWhy: fr
      ? "Nommez chaque signataire, vous compris si vous signez. Chacun re\u00e7oit son propre lien et peut signer d\u00e8s qu\u2019il est d\u2019accord."
      : "Name everyone who signs, including yourself if you do. Each gets their own link, and anyone can sign whenever they agree.",
    iSign: fr ? "Je signe aussi" : "I sign this too",
    name: fr ? "Nom" : "Name",
    email: fr ? "E-mail" : "Email",
    addSigner: fr ? "Ajouter un signataire" : "Add another signer",
    remove: fr ? "Retirer" : "Remove",
    back: fr ? "Changer de fichier" : "Choose a different file",
    upload: fr ? "Ajouter le document" : "Add document",
    cancel: fr ? "Annuler" : "Cancel",
    needOne: fr ? "Nommez au moins un signataire." : "Name at least one signer.",
    needBoth: fr ? "Chaque signataire a besoin d\u2019un nom et d\u2019un e-mail." : "Every signer needs a name and an email.",
    you: fr ? "vous" : "you",
  };

  function go() {
    if (!file) return;
    if (!signing) { onPick(file, { enabled: false, signers: [] }); return; }
    const clean = signers.map((s) => ({ name: s.name.trim(), email: s.email.trim() })).filter((s) => s.name || s.email);
    const all = selfSigns ? [{ name: selfName, email: selfEmail }, ...clean] : clean;
    if (!all.length) { setErr(C.needOne); return; }
    if (all.some((s) => !s.name || !s.email)) { setErr(C.needBoth); return; }
    setErr("");
    onPick(file, { enabled: true, signers: all });
  }

  const input = { width: "100%", height: 32, boxSizing: "border-box" as const, border: "1px solid " + T.border,
    borderRadius: T.rInput, padding: "0 10px", fontSize: 13, fontFamily: T.font, background: T.card, color: T.heading } as const;

  return (
    <div onClick={() => !busy && onClose()}
      style={{ position: "fixed", inset: 0, background: T.scrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: T.card, border: "1px solid " + T.borderStrong, borderRadius: T.rCard,
          boxShadow: "0 16px 48px -12px rgba(15,40,28,0.35)", padding: 24, width: 520, maxWidth: "100%",
          fontFamily: T.font, letterSpacing: T.tracking, margin: "auto" }}>

        <h3 style={{ fontSize: 17, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 4px" }}>{C.title}</h3>

        {progress ? (
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: "18px 20px", marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, color: T.heading, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{progress.name}</span>
              <span style={{ fontSize: 12.5, color: T.faint, marginLeft: "auto", fontFamily: "ui-monospace, monospace", flex: "none" }}>
                {(progress.size / 1048576).toFixed(1)} MB
              </span>
            </div>
            <div style={{ height: 4, background: T.soft, borderRadius: 2, overflow: "hidden" }}>
              <div className="up-bar" style={{ height: "100%", background: T.green, width: "40%" }} />
            </div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 10 }}>{progress.step}</div>
            <style>{`@keyframes upslide{0%{margin-left:-40%}100%{margin-left:100%}}.up-bar{animation:upslide 1.1s ease-in-out infinite}`}</style>
          </div>
        ) : !file ? (<>
          <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 18px" }}>{C.sub}</p>
          <DropZone
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
            extensions={/\.(pdf|jpe?g|png|webp|gif)$/i}
            onFiles={(files) => setFile(files[0])}
            hint={C.note}
            wrongMessage={C.wrong}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={onClose} style={{ height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>{C.cancel}</button>
          </div>
        </>) : (<>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 18px", padding: "10px 12px", background: T.soft, border: "1px solid " + T.border, borderRadius: T.rCard }}>
            <span style={{ fontSize: 13.5, color: T.heading, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
            <button onClick={() => { setFile(null); setSigning(false); setErr(""); }}
              style={{ marginLeft: "auto", flex: "none", background: "none", border: "none", padding: 0, fontSize: 12.5, fontFamily: T.font, color: T.greenText, cursor: "pointer", borderBottom: "1px solid " + T.greenBorder }}>
              {C.back}
            </button>
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: signing ? 16 : 0 }}>
            <input type="checkbox" checked={signing} onChange={(e) => { setSigning(e.target.checked); setErr(""); }}
              style={{ marginTop: 3, width: 15, height: 15, accentColor: T.green, flex: "none" }} />
            <span>
              <span style={{ fontSize: 14, color: T.heading, display: "block" }}>{C.needsSig}</span>
              <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginTop: 2, lineHeight: 1.5 }}>{C.needsSigWhy}</span>
            </span>
          </label>

          {signing && (<>
            {/* Explicit rather than automatic: someone sending a document they
                do not sign should not have to remove themselves from it. */}
            <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", marginBottom: 12, padding: "9px 12px", border: "1px solid " + T.border, borderRadius: T.rCard }}>
              <input type="checkbox" checked={selfSigns} onChange={(e) => setSelfSigns(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: T.green, flex: "none" }} />
              <span style={{ fontSize: 13.5, color: T.heading }}>{C.iSign}</span>
              <span style={{ fontSize: 12.5, color: T.faint, marginLeft: "auto" }}>{selfName || selfEmail}</span>
            </label>

            {signers.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input className="t-in" value={s.name} placeholder={C.name}
                  onChange={(e) => setSigners((p) => p.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                  style={{ ...input, flex: 1 }} />
                <input className="t-in" type="email" value={s.email} placeholder={C.email}
                  onChange={(e) => setSigners((p) => p.map((x, k) => (k === i ? { ...x, email: e.target.value } : x)))}
                  style={{ ...input, flex: 1.3 }} />
                {signers.length > 1 && (
                  <button onClick={() => setSigners((p) => p.filter((_, k) => k !== i))}
                    aria-label={C.remove}
                    style={{ flex: "none", background: "none", border: "none", padding: "0 4px", fontSize: 16, color: T.faint, cursor: "pointer" }}>{"\u00d7"}</button>
                )}
              </div>
            ))}
            {signers.length < 10 && (
              <button onClick={() => setSigners((p) => [...p, { name: "", email: "" }])}
                style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontFamily: T.font, color: T.greenText, cursor: "pointer", borderBottom: "1px solid " + T.greenBorder, marginBottom: 4 }}>
                {C.addSigner}
              </button>
            )}
          </>)}

          {err && <p style={{ fontSize: 13, color: T.dangerText, margin: "12px 0 0" }}>{err}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
            <button onClick={onClose} disabled={busy}
              style={{ height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>{C.cancel}</button>
            <button onClick={go} disabled={busy}
              style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 14px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{C.upload}</button>
          </div>
        </>)}
      </div>
    </div>
  );
}