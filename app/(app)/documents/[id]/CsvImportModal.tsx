"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { parseCsv, downloadCsvTemplate, looksLikeEmail } from "@/lib/csv";

type Variant = { id: string; label: string; note: string | null; active: boolean };
type NewRec = { id: string; label: string | null; share_token: string; created_at: string; variant_id?: string | null };

type Parsed = {
  n: number;
  firstName: string;
  lastName: string;
  email: string;
  label: string;
  variantId: string | null;
  variantLabel: string;
  error: string;
  status: "" | "ok" | "failed";
  message: string;
};

export default function CsvImportModal({ documentId, variants, counts, onClose, onImported }: {
  documentId: string;
  variants: Variant[];
  counts: Record<string, number>;
  onClose: () => void;
  onImported: (recs: NewRec[]) => void;
}) {
  const [rows, setRows] = useState<Parsed[]>([]);
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<"pick" | "preview" | "done">("pick");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [err, setErr] = useState("");

  const live = variants.filter((v) => v.active);

  function assignAuto(tally: Record<string, number>): { id: string | null; label: string } {
    if (live.length === 0) return { id: null, label: "" };
    let best = live[0];
    for (const v of live) if ((tally[v.id] ?? 0) < (tally[best.id] ?? 0)) best = v;
    tally[best.id] = (tally[best.id] ?? 0) + 1;
    return { id: best.id, label: best.label };
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name); setErr("");
    const text = await f.text();
    const { headers, rows: raw } = parseCsv(text);

    if (raw.length === 0) { setErr("That file has no rows."); return; }
    if (!headers.includes("first_name") || !headers.includes("last_name")) {
      setErr("The file needs at least first_name and last_name columns. Download the template below.");
      return;
    }
    if (raw.length > 200) { setErr(`That file has ${raw.length} rows. Import 200 at a time.`); return; }

    const tally: Record<string, number> = { ...counts };
    const seen = new Set<string>();

    const parsed: Parsed[] = raw.map((r, i) => {
      const firstName = r.first_name ?? "";
      const lastName = r.last_name ?? "";
      const email = r.email ?? "";
      const wanted = (r.variant ?? "").trim().toUpperCase();

      let error = "";
      if (!firstName || !lastName) error = "First and last name are required.";
      else if (email && !looksLikeEmail(email)) error = "That email does not look valid.";
      else if (email && seen.has(email.toLowerCase())) error = "Duplicate email in this file.";
      if (email && !error) seen.add(email.toLowerCase());

      // CSV column wins; blanks fall through to auto-balance.
      let variantId: string | null = null;
      let variantLabel = "";
      if (live.length > 0) {
        if (wanted) {
          const match = live.find((v) => v.label.toUpperCase() === wanted);
          if (!match) { if (!error) error = `No active variant "${wanted}".`; }
          else { variantId = match.id; variantLabel = match.label; tally[match.id] = (tally[match.id] ?? 0) + 1; }
        }
        if (!variantId && !error) {
          const a = assignAuto(tally);
          variantId = a.id; variantLabel = a.label;
        }
      }

      return { n: i + 2, firstName, lastName, email, label: r.label ?? "", variantId, variantLabel, error, status: "" as const, message: "" };
    });

    setRows(parsed);
    setStage("preview");
  }

  async function commit(mode: "link" | "email") {
    setBusy(true); setErr("");
    const created: NewRec[] = [];
    const next = [...rows];

    for (let i = 0; i < next.length; i++) {
      const r = next[i];
      if (r.error) continue;
      if (mode === "email" && !r.email) { next[i] = { ...r, status: "failed", message: "No email address." }; continue; }
      setProgress(`Sending ${i + 1} of ${next.length}...`);

      const res = await fetch("/api/share-prospect", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentId, mode,
          firstName: r.firstName, lastName: r.lastName,
          email: mode === "email" ? r.email : undefined,
          variantId: r.variantId ?? undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        next[i] = { ...r, status: "failed", message: j.error || "Failed." };
        if (res.status === 402) { setRows([...next]); setErr(j.error || "Plan limit reached. Stopped here."); setBusy(false); setStage("done"); return; }
      } else {
        created.push(j.recipient as NewRec);
        next[i] = { ...r, status: "ok", message: mode === "email" ? (j.emailSent ? "Sent" : "Link created") : "Link created" };
      }
      setRows([...next]);
    }

    setBusy(false); setProgress("");
    setStage("done");
    if (created.length) onImported(created);
  }

  const valid = rows.filter((r) => !r.error).length;
  const bad = rows.length - valid;
  const withEmail = rows.filter((r) => !r.error && r.email).length;
  const sent = rows.filter((r) => r.status === "ok").length;

  const btn = { background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer" } as const;
  const ghost = { background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;
  const th = { fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "0 8px 8px 0", textAlign: "left" as const };
  const td = { fontSize: 13, color: T.heading, padding: "7px 8px 7px 0", borderTop: `1px solid ${T.borderSoft}` };

  return (
    <div onClick={() => !busy && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 26, width: 720, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", fontFamily: T.font, letterSpacing: T.tracking }}>

        <h3 style={{ fontSize: 19, fontWeight: 700, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>Import recipients from CSV</h3>
        <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.5, margin: "0 0 18px" }}>
          Nothing is created until you choose to send. Rows with problems are skipped, not guessed at.
        </p>

        {stage === "pick" && (
          <>
            <div style={{ background: T.canvas, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 6 }}>Columns</div>
              <p style={{ fontSize: 12.5, color: T.body, lineHeight: 1.55, margin: 0 }}>
                <strong>first_name</strong> and <strong>last_name</strong> are required. <strong>email</strong> is needed only if you want to send emails.
                <strong> label</strong> is an optional display name. <strong>variant</strong> is optional (A, B, C, D) and wins over the automatic split when set.
              </p>
              <button onClick={() => downloadCsvTemplate()} style={{ ...ghost, marginTop: 12, padding: "7px 14px", fontSize: 13 }}>Download template</button>
            </div>
            <input type="file" accept=".csv,text/csv" onChange={onFile}
              style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }} />
            {err && <p style={{ color: "#B42318", fontSize: 13, margin: "12px 0 0" }}>{err}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={onClose} style={ghost}>Cancel</button>
            </div>
          </>
        )}

        {(stage === "preview" || stage === "done") && (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14, fontSize: 13 }}>
              <span style={{ color: T.body }}><strong style={{ color: T.heading }}>{fileName}</strong></span>
              <span style={{ color: T.greenText }}>{valid} ready</span>
              {bad > 0 && <span style={{ color: "#B42318" }}>{bad} with problems</span>}
              {live.length > 0 && <span style={{ color: T.muted }}>split across {live.length} variant{live.length === 1 ? "" : "s"}</span>}
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={th}>Row</th><th style={th}>Name</th><th style={th}>Email</th>
                  {live.length > 0 && <th style={th}>Variant</th>}
                  <th style={th}>Status</th>
                </tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.n}>
                      <td style={{ ...td, color: T.muted, fontSize: 12 }}>{r.n}</td>
                      <td style={td}>{[r.firstName, r.lastName].filter(Boolean).join(" ") || <span style={{ color: T.muted }}>missing</span>}</td>
                      <td style={{ ...td, color: r.email ? T.body : T.muted, fontSize: 12.5 }}>{r.email || "no email"}</td>
                      {live.length > 0 && (
                        <td style={td}>
                          {r.variantLabel ? <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: T.greenSoft, color: T.green }}>{r.variantLabel}</span> : <span style={{ color: T.muted }}>-</span>}
                        </td>
                      )}
                      <td style={td}>
                        {r.error ? <span style={{ color: "#B42318", fontSize: 12 }}>{r.error}</span>
                          : r.status === "ok" ? <span style={{ color: T.greenText, fontSize: 12 }}>{r.message}</span>
                          : r.status === "failed" ? <span style={{ color: "#B42318", fontSize: 12 }}>{r.message}</span>
                          : <span style={{ color: T.muted, fontSize: 12 }}>ready</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {err && <p style={{ color: "#B42318", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            {busy && progress && <p style={{ color: T.body, fontSize: 13, margin: "0 0 12px" }}>{progress}</p>}

            {stage === "preview" ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={onClose} disabled={busy} style={ghost}>Cancel</button>
                <button onClick={() => commit("link")} disabled={busy || valid === 0} style={{ ...ghost, opacity: busy || valid === 0 ? 0.5 : 1 }}>
                  Create {valid} link{valid === 1 ? "" : "s"} only
                </button>
                <button onClick={() => commit("email")} disabled={busy || withEmail === 0} title={withEmail === 0 ? "No valid rows have an email address" : ""} style={{ ...btn, opacity: busy || withEmail === 0 ? 0.5 : 1 }}>
                  {busy ? "Sending..." : `Send ${withEmail} email${withEmail === 1 ? "" : "s"}`}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: T.body }}>{sent} of {valid} created.</span>
                <button onClick={onClose} style={btn}>Done</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
