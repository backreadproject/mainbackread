"use client";
import { useState, useRef, useCallback } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// Adding a document.
//
// Replaces a bare file input on the toolbar. The input accepted the right
// types and said nothing about why, so someone with a .docx got a one-line
// refusal with no explanation and no second chance -- the picker had already
// closed.
//
// This costs one extra click for someone uploading their fifth document. It
// buys a place to say what the product accepts and, more importantly, WHY it
// refuses Word: automatic conversion loses layout, and a reader seeing a
// proposal the sender did not design is worse than a moment's inconvenience.
export type PickedFile = { file: File };

const PDF = ["application/pdf"];
const IMAGES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const OFFICE_RE = /\.(docx?|pptx?|xlsx?|odt|odp|ods|pages|key|numbers)$/i;

export default function UploadModal({
  onClose, onPick, busy, progress,
}: {
  onClose: () => void;
  onPick: (file: File) => void;
  busy: boolean;
  /** What is happening now: uploading, then reading. Null when idle. */
  progress: { name: string; size: number; step: string } | null;
}) {
  const fr = useLocale() === "fr";
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<{ name: string; reason: "office" | "other" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const C = {
    title: fr ? "Ajouter un document" : "Add a document",
    sub: fr ? "PDF de pr\u00e9f\u00e9rence. Les images sont accept\u00e9es." : "PDF preferred. Images are accepted.",
    drop: fr ? "D\u00e9posez un fichier ici" : "Drop a file here",
    or: fr ? "ou" : "or",
    choose: fr ? "Choisir un fichier" : "Choose a file",
    release: fr ? "Rel\u00e2chez pour envoyer" : "Release to upload",
    note: fr
      ? "Les fichiers Word et PowerPoint doivent d\u2019abord \u00eatre export\u00e9s en PDF, afin que votre lecteur voie le document exactement tel que vous l\u2019avez con\u00e7u."
      : "Word and PowerPoint files should be exported to PDF first, so your reader sees the document exactly as you designed it.",
    officeWhy: fr
      ? "Exportez-le en PDF et r\u00e9essayez. Une conversion automatique d\u00e9forme la mise en page, et votre lecteur verrait un document que vous n\u2019avez pas con\u00e7u."
      : "Export it as PDF and try again. Word files lose their layout when converted automatically, and your reader would see something you did not design.",
    otherWhy: fr
      ? "Envoyez un PDF, ou une image JPEG, PNG, WebP ou GIF."
      : "Upload a PDF, or a JPEG, PNG, WebP or GIF image.",
    isWord: fr ? "est un fichier Word ou PowerPoint" : "is a Word or PowerPoint file",
    notSupported: fr ? "n\u2019est pas un type accept\u00e9" : "is not a file type we can read",
    cancel: fr ? "Annuler" : "Cancel",
  };

  // The rule, in one place. PDF and images through; everything else refused,
  // and Office files get their own explanation because that is the mistake
  // people actually make.
  const check = useCallback((file: File): "ok" | "office" | "other" => {
    if (OFFICE_RE.test(file.name)) return "office";
    if (PDF.includes(file.type) || /\.pdf$/i.test(file.name)) return "ok";
    if (IMAGES.includes(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name)) return "ok";
    return "other";
  }, []);

  const take = useCallback((file: File | undefined) => {
    if (!file) return;
    const verdict = check(file);
    if (verdict === "ok") { setRejected(null); onPick(file); return; }
    // The modal stays open and the drop zone stays live. Refusing a file and
    // closing the door means starting over.
    setRejected({ name: file.name, reason: verdict });
  }, [check, onPick]);

  const zone = {
    border: "1px dashed " + (over ? T.green : T.border),
    borderRadius: T.rCard,
    padding: "32px 20px",
    textAlign: "center" as const,
    background: over ? T.greenSoft : T.soft,
    transition: "background .12s, border-color .12s",
  };

  return (
    <div onClick={() => !busy && onClose()}
      style={{ position: "fixed", inset: 0, background: T.scrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow,
          padding: 24, width: 480, maxWidth: "100%", fontFamily: T.font, letterSpacing: T.tracking }}>

        <h3 style={{ fontSize: 17, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 4px" }}>{C.title}</h3>
        {!progress && <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 18px" }}>{C.sub}</p>}

        {progress ? (
          <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: "18px 20px", marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, color: T.heading, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{progress.name}</span>
              <span style={{ fontSize: 12.5, color: T.faint, marginLeft: "auto", fontFamily: "ui-monospace, monospace", flex: "none" }}>
                {(progress.size / 1048576).toFixed(1)} MB
              </span>
            </div>
            {/* Indeterminate on purpose: the upload has a real percentage but the
                reading that follows does not, and a bar that fills then sits at
                100% for fifteen seconds reads as frozen. */}
            <div style={{ height: 4, background: T.soft, borderRadius: 2, overflow: "hidden" }}>
              <div className="up-bar" style={{ height: "100%", background: T.green, width: "40%" }} />
            </div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 10 }}>{progress.step}</div>
            <style>{`@keyframes upslide{0%{margin-left:-40%}100%{margin-left:100%}}.up-bar{animation:upslide 1.1s ease-in-out infinite}`}</style>
          </div>
        ) : (<>
          <div style={zone}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}>
            {over ? (
              <div style={{ fontSize: 14, color: T.greenText }}>{C.release}</div>
            ) : (<>
              <div style={{ fontSize: 14, color: T.body, marginBottom: 3 }}>{C.drop}</div>
              <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 14 }}>{C.or}</div>
              <button onClick={() => inputRef.current?.click()}
                style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn,
                  padding: "0 14px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>
                {C.choose}
              </button>
            </>)}
          </div>

          {rejected ? (
            <div style={{ border: "1px solid " + T.dangerBorder, background: T.dangerSoft, borderRadius: T.rCard, padding: "12px 14px", marginTop: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: T.dangerText, marginBottom: 3 }}>
                {rejected.name} {rejected.reason === "office" ? C.isWord : C.notSupported}
              </div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
                {rejected.reason === "office" ? C.officeWhy : C.otherWhy}
              </div>
            </div>
          ) : (
            // Below the drop zone, not above it: someone dropping a PDF never
            // needs this, and someone who just got refused looks straight here.
            <p style={{ fontSize: 12.5, color: T.faint, lineHeight: 1.55, margin: "14px 0 0" }}>{C.note}</p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={onClose}
              style={{ height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn,
                padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>
              {C.cancel}
            </button>
          </div>
        </>)}

        <input ref={inputRef} type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }}
          style={{ display: "none" }} />
      </div>
    </div>
  );
}