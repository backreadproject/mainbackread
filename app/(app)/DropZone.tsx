"use client";
import { useState, useRef, useCallback } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// One drop zone, three uses.
//
// The upload modal, the A/B variant upload and the CSV import all need the same
// thing: a target you can drop onto, a picker for people who prefer one, and a
// refusal that says why rather than just no. What differs is what they accept
// and what surrounds them, so those are props and everything else is shared.
//
// The refusal is the reason this is a component rather than three inputs. A
// bare <input accept="..."> silently ignores a wrong file on drop and shows a
// grey system dialog on pick -- neither tells the person anything.
export type DropVerdict = "ok" | "office" | "wrong";

const OFFICE_RE = /\.(docx?|pptx?|xlsx?|odt|odp|ods|pages|key|numbers)$/i;

export default function DropZone({
  accept, extensions, multiple = false, max = 1, onFiles,
  label, hint, disabled = false, wrongMessage,
}: {
  /** The input's accept attribute. */
  accept: string;
  /** Extensions we consider valid, checked on DROP where accept does nothing. */
  extensions: RegExp;
  multiple?: boolean;
  max?: number;
  onFiles: (files: File[]) => void;
  label?: string;
  /** Shown under the zone when nothing has been refused. */
  hint?: string;
  disabled?: boolean;
  /** What to say when the type is wrong but not Office. */
  wrongMessage: string;
}) {
  const fr = useLocale() === "fr";
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<{ name: string; reason: "office" | "wrong" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const C = {
    drop: multiple
      ? (fr ? "D\u00e9posez vos fichiers ici" : "Drop your files here")
      : (fr ? "D\u00e9posez un fichier ici" : "Drop a file here"),
    or: fr ? "ou" : "or",
    choose: multiple
      ? (fr ? "Choisir des fichiers" : "Choose files")
      : (fr ? "Choisir un fichier" : "Choose a file"),
    release: fr ? "Rel\u00e2chez pour envoyer" : "Release to upload",
    isOffice: fr ? "est un fichier Word ou PowerPoint" : "is a Word or PowerPoint file",
    officeWhy: fr
      ? "Exportez-le en PDF et r\u00e9essayez. Une conversion automatique d\u00e9forme la mise en page, et votre lecteur verrait un document que vous n\u2019avez pas con\u00e7u."
      : "Export it as PDF and try again. Word files lose their layout when converted automatically, and your reader would see something you did not design.",
    notSupported: fr ? "n\u2019est pas un type accept\u00e9" : "is not a file type we can read",
  };

  const take = useCallback((list: FileList | null) => {
    if (!list || !list.length || disabled) return;
    const all = Array.from(list).slice(0, max);
    // Office is called out separately because it is the mistake people actually
    // make, and "wrong file type" would not tell them what to do about it.
    const office = all.find((f) => OFFICE_RE.test(f.name));
    if (office) { setRejected({ name: office.name, reason: "office" }); return; }
    const bad = all.find((f) => !extensions.test(f.name));
    if (bad) { setRejected({ name: bad.name, reason: "wrong" }); return; }
    setRejected(null);
    onFiles(all);
  }, [disabled, extensions, max, onFiles]);

  return (
    <>
      {label && <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 }}>{label}</span>}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
        style={{
          border: "1.5px dashed " + (over ? T.green : T.borderStrong),
          borderRadius: T.rCard,
          padding: "34px 20px",
          textAlign: "center",
          background: over ? T.greenSoft : T.soft,
          transition: "background .12s, border-color .12s",
          opacity: disabled ? 0.5 : 1,
        }}>
        {over ? (
          <div style={{ fontSize: 14, color: T.greenText }}>{C.release}</div>
        ) : (<>
          <div style={{ fontSize: 14, color: T.body, marginBottom: 3 }}>{C.drop}</div>
          <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 14 }}>{C.or}</div>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}
            style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn,
              padding: "0 14px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: disabled ? "default" : "pointer" }}>
            {C.choose}
          </button>
        </>)}
      </div>

      {rejected ? (
        <div style={{ border: "1px solid " + T.dangerBorder, background: T.dangerSoft, borderRadius: T.rCard, padding: "12px 14px", marginTop: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: T.dangerText, marginBottom: 3 }}>
            {rejected.name} {rejected.reason === "office" ? C.isOffice : C.notSupported}
          </div>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55 }}>
            {rejected.reason === "office" ? C.officeWhy : wrongMessage}
          </div>
        </div>
      ) : hint ? (
        <p style={{ fontSize: 12.5, color: T.faint, lineHeight: 1.55, margin: "12px 0 0" }}>{hint}</p>
      ) : null}

      <input ref={inputRef} type="file" accept={accept} multiple={multiple}
        onChange={(e) => { take(e.target.files); e.target.value = ""; }}
        style={{ display: "none" }} />
    </>
  );
}