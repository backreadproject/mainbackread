"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";

export default function VariantUpload({ isOrg, orgId, projects }: { isOrg: boolean; orgId: string | null; projects: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [err, setErr] = useState("");

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const all = Array.from(e.target.files ?? []).slice(0, 4);
    const office = all.filter((f) => /\.(docx?|pptx?)$/i.test(f.name) || f.type.includes("officedocument") || f.type.includes("msword") || f.type.includes("ms-powerpoint"));
    if (office.length > 0) {
      setErr("Word and PowerPoint files cannot be shared yet. Export as PDF first, so your reader sees the document exactly as you designed it.");
      setFiles([]); setNotes([]);
      return;
    }
    const picked = all;
    setFiles(picked);
    setNotes(picked.map(() => ""));
    if (!title && picked[0]) setTitle(picked[0].name.replace(/\.(pdf|docx|jpe?g|png|webp|gif)$/i, ""));
    setErr("");
  }

  async function go() {
    if (files.length < 2) { setErr("Pick at least two files, one per variant."); return; }
    if (!title.trim()) { setErr("Give the document a title."); return; }
    setBusy(true); setErr("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Your session expired. Sign in again."); setBusy(false); return; }

    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setStep(`Uploading ${i + 1} of ${files.length}...`);
      const f = files[i];
      const safe = f.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
      const { error } = await supabase.storage.from("documents").upload(path, f);
      if (error) { setErr(`Upload failed: ${error.message}`); setBusy(false); setStep(""); return; }
      paths.push(path);
    }

    setStep("Creating the document...");
    const row: Record<string, unknown> = { owner_id: user.id, title: title.trim(), storage_path: paths[0] };
    if (isOrg && orgId) { row.organization_id = orgId; if (projectId) row.project_id = projectId; }
    const { data: doc, error: dbErr } = await supabase.from("documents").insert(row).select("id").single();
    if (dbErr || !doc) {
      try { await supabase.storage.from("documents").remove(paths); } catch { /* best effort */ }
      setErr(`Could not create the document: ${dbErr?.message ?? ""}`); setBusy(false); setStep(""); return;
    }

    fetch("/api/extract-document", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId: doc.id }) }).catch(() => {});

    for (let i = 0; i < paths.length; i++) {
      const label = String.fromCharCode(65 + i);
      setStep(`Creating variant ${label}...`);
      const res = await fetch("/api/variants", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, action: "create", label, storagePath: i === 0 ? null : paths[i], note: notes[i] || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Variant creation failed after the document exists. Remove the unused files;
        // the document itself keeps paths[0] and stays valid.
        try { await supabase.storage.from("documents").remove(paths.slice(1)); } catch { /* best effort */ }
        setErr(j.error || `Variant ${label} failed.`); setBusy(false); setStep(""); return;
      }
      if (i > 0 && j.variant?.id) {
        fetch("/api/extract-document", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId: doc.id, variantId: j.variant.id }) }).catch(() => {});
      }
    }

    window.location.href = `/documents/${doc.id}`;
  }

  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 14, fontFamily: T.font, background: "var(--rp-card)", marginBottom: 10 };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ background: "var(--rp-card)", color: T.heading, border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", whiteSpace: "nowrap" }}>
        Upload A/B variants
      </button>

      {open && (
        <div onClick={() => !busy && setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--rp-card)", borderRadius: 14, padding: 26, width: 520, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", fontFamily: T.font }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: T.heading, margin: "0 0 6px", letterSpacing: T.trackingTight }}>Upload A/B variants</h3>
            <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 18px" }}>
              Pick two to four files. Each becomes a variant (A, B, C, D) of the same document. Readers are split between them automatically, and you compare how each one performs.
            </p>

            <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Document title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Series A deck" style={input} />

            {isOrg && projects.length > 0 && (
              <>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Project (optional)</span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={input}>
                  <option value="">No project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </>
            )}

            <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", margin: "4px 0 6px" }}>Files (2 to 4)</span>
            <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,image/gif" onChange={onPick} style={{ ...input, padding: "9px 10px" }} />

            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: `1px solid ${T.border}` }}>
                <span style={{ flex: "none", width: 26, height: 26, borderRadius: 7, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                  <input
                    value={notes[i] ?? ""}
                    onChange={(e) => setNotes((n) => n.map((x, k) => (k === i ? e.target.value : x)))}
                    placeholder="What is different about this one? (optional)"
                    style={{ width: "100%", boxSizing: "border-box", border: "none", borderBottom: `1px solid ${T.border}`, padding: "4px 0", fontSize: 12, fontFamily: T.font, color: T.body, background: "transparent", marginTop: 2 }}
                  />
                </div>
              </div>
            ))}

            {err && <p style={{ color: "var(--rp-danger-text)", fontSize: 13, margin: "12px 0 0" }}>{err}</p>}
            {busy && step && <p style={{ color: T.body, fontSize: 13, margin: "12px 0 0" }}>{step}</p>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setOpen(false)} disabled={busy} style={{ background: "var(--rp-card)", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>Cancel</button>
              <button onClick={go} disabled={busy || files.length < 2} style={{ background: T.green, color: "var(--rp-on-accent)", border: "none", borderRadius: T.rBtn, padding: "9px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy || files.length < 2 ? 0.5 : 1 }}>
                {busy ? "Working..." : "Create variants"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



