"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { renderPdfPages } from "@/lib/ocr-client";

// TEMPORARY DIAGNOSTIC.
//
// Scanned-PDF OCR renders pages in the browser, posts them, and the model
// reports "no readable text" on every page -- so the images arriving are blank.
// Two guesses have not found why, and console debugging is being blocked by
// Firefox's user-activation rules.
//
// This runs the REAL renderPdfPages, from a real click, and puts the result on
// screen. Whatever it shows ends the guessing: a readable page means the fault
// is downstream in transmission or the route; a blank one means the rendering
// itself is not drawing.
//
// Delete once the answer is known.
export default function OcrDebug({ documentId, storagePath }: { documentId: string; storagePath: string | null }) {
  const [img, setImg] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true); setInfo(""); setImg(null);
    try {
      if (!storagePath) throw new Error("This document has no stored file.");
      const supabase = createClient();
      const { data, error } = await supabase.storage.from("documents").download(storagePath);
      if (error || !data) throw new Error("Could not download: " + (error?.message ?? "unknown"));
      setInfo("File: " + data.size + " bytes. Rendering...");
      const pages = await renderPdfPages(data, (done, total) => setInfo("Rendering " + done + "/" + total));
      if (!pages.length) throw new Error("renderPdfPages returned no pages at all.");
      setImg(pages[0]);
      setInfo(pages.length + " page(s) rendered. First page JPEG: " + pages[0].length +
        " chars. Under about 10,000 means a blank image.");
    } catch (e) {
      setInfo("FAILED: " + (e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 1040, padding: "0 28px" }}>
      <div style={{ background: T.card, border: "1px solid " + T.amberBorder, borderRadius: T.rCard, marginBottom: 16, padding: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.amberText, marginBottom: 8 }}>
          Diagnostic, temporary
        </div>
        <button onClick={run} disabled={busy}
          style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn,
            padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Working..." : "Render page one and show it"}
        </button>
        {info && <p style={{ fontSize: 13, color: T.body, lineHeight: 1.55, margin: "12px 0 0", fontFamily: "ui-monospace, monospace" }}>{info}</p>}
        {img && (
          <img src={img} alt="rendered page one"
            style={{ display: "block", marginTop: 14, maxWidth: 520, width: "100%", border: "2px solid " + T.danger }} />
        )}
      </div>
    </div>
  );
}