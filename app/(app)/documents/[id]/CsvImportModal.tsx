"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { parseCsv, downloadCsvTemplate, looksLikeEmail } from "@/lib/csv";

type Variant = { id: string; label: string; note: string | null; active: boolean };
type NewRec = { id: string; label: string | null; share_token: string; created_at: string; variant_id?: string | null };

type Row = {
  n: number;
  firstName: string;
  lastName: string;
  email: string;
  label: string;
  variantId: string | null;
  pinned: boolean;          // variant chosen by hand or by the CSV column: never auto-reshuffled
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
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<"pick" | "preview" | "done">("pick");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [err, setErr] = useState("");

  const live = variants.filter((v) => v.active);

  /** Row-level problems. Duplicates are checked against the CURRENT rows, so
   *  editing two rows to the same address is still caught. */
  function errorFor(r: Row, all: Row[]): string {
    if (!r.firstName.trim() || !r.lastName.trim()) return "First and last name are required.";
    if (r.email.trim() && !looksLikeEmail(r.email)) return "That email does not look valid.";
    if (r.email.trim()) {
      const mine = r.email.trim().toLowerCase();
      const dupe = all.some((o) => o.n !== r.n && o.email.trim().toLowerCase() === mine);
      if (dupe) return "Duplicate email in this file.";
    }
    return "";
  }

  /** Rebalances every unpinned valid row across the active variants, counting
   *  existing readers and pinned rows first so the split stays even. */
  function rebalance(input: Row[]): Row[] {
    if (live.length === 0) return input.map((r) => ({ ...r, variantId: null }));
    const tally: Record<string, number> = { ...counts };
    for (const r of input) {
      if (r.pinned && r.variantId && !errorFor(r, input)) tally[r.variantId] = (tally[r.variantId] ?? 0) + 1;
    }
    return input.map((r) => {
      if (r.pinned) return r;
      if (errorFor(r, input)) return { ...r, variantId: null };
      let best = live[0];
      for (const v of live) if ((tally[v.id] ?? 0) < (tally[best.id] ?? 0)) best = v;
      tally[best.id] = (tally[best.id] ?? 0) + 1;
      return { ...r, variantId: best.id };
    });
  }

  function update(n: number, patch: Partial<Row>) {
    setRows((prev) => rebalance(prev.map((r) => (r.n === n ? { ...r, ...patch } : r))));
  }

  function removeRow(n: number) {
    setRows((prev) => rebalance(prev.filter((r) => r.n !== n)));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name); setErr("");
    const text = await f.text();
    const { headers, rows: raw } = parseCsv(text);

    if (raw.length === 0) { setErr("That file has no rows."); return; }
    if (!headers.includes("first_name") && !headers.includes("last_name") && !headers.includes("email")) {
      setErr("The file needs first_name, last_name and email columns. Download the template below.");
      return;
    }
    if (raw.length > 200) { setErr(`That file has ${raw.length} rows. Import 200 at a time.`); return; }

    const initial: Row[] = raw.map((r, i) => {
      const wanted = (r.variant ?? "").trim().toUpperCase();
      const match = wanted ? live.find((v) => v.label.toUpperCase() === wanted) : undefined;
      return {
        n: i + 2,
        firstName: r.first_name ?? "",
        lastName: r.last_name ?? "",
        email: r.email ?? "",
        label: r.label ?? "",
        variantId: match?.id ?? null,
        pinned: !!match,
        status: "" as const,
        message: "",
      };
    });

    setRows(rebalance(initial));
    setStage("preview");
  }

  async function commit(mode: "link" | "email") {
    setBusy(true); setErr("");
    const created: NewRec[] = [];
    const next = [...rows];

    for (let i = 0; i < next.length; i++) {
      const r = next[i];
      if (errorFor(r, next)) continue;
      if (mode === "email" && !r.email.trim()) { next[i] = { ...r, status: "failed", message: "No email address." }; continue; }
      setProgress(`Working on ${i + 1} of ${next.length}...`);

      const res = await fetch("/api/share-prospect", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentId, mode,
          firstName: r.firstName.trim(), lastName: r.lastName.trim(),
          email: mode === "email" ? r.email.trim() : undefined,
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

  const errs = rows.map((r) => errorFor(r, rows));
  const valid = errs.filter((e) => !e).length;
  const bad = rows.length - valid;
  const withEmail = rows.filter((r, i) => !errs[i] && r.email.trim()).length;
  const sent = rows.filter((r) => r.status === "ok").length;
  const done = stage === "done";

  const btn = { background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer" } as const;
  const ghost = { background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;
  const th = { fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "0 6px 8px 0", textAlign: "left" as const };
  const td = { padding: "5px 6px 5px 0", borderTop: `1px solid ${T.borderSoft}`, verticalAlign: "middle" as const };
  const cell = (bad: boolean) => ({ width: "100%", boxSizing: "border-box" as const, border: `1px solid ${bad ? "#FDA29B" : "transparent"}`, borderRadius: 6, padding: "6px 8px", fontSize: 13, fontFamily: T.font, color: T.heading, background: bad ? "#FFFBFA" : "transparent" });

  return (
    <div onClick={() => !busy && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 26, width: 860, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", fontFamily: T.font, letterSpacing: T.tracking }}>
        <style>{`.csv-in:focus{border-color:${T.green} !important;outline:none;background:#fff !important}.csv-in:hover{background:#FAFBFB}`}</style>

        <h3 style={{ fontSize: 19, fontWeight: 700, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>Import recipients from CSV</h3>
        <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.5, margin: "0 0 18px" }}>
          Nothing is created until you choose to send. Fix anything flagged below by typing straight into the row.
        </p>

        {stage === "pick" && (
          <>
            <div style={{ background: T.canvas, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 6 }}>Columns</div>
              <p style={{ fontSize: 12.5, color: T.body, lineHeight: 1.55, margin: 0 }}>
                <strong>first_name</strong> and <strong>last_name</strong> are required. <strong>email</strong> is needed only to send emails.
                <strong> label</strong> is an optional display name. <strong>variant</strong> is optional (A, B, C, D) and wins over the automatic split.
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

        {(stage === "preview" || done) && (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14, fontSize: 13 }}>
              <strong style={{ color: T.heading }}>{fileName}</strong>
              <span style={{ color: T.greenText }}>{valid} ready</span>
              {bad > 0 && <span style={{ color: "#B42318" }}>{bad} to fix</span>}
              {live.length > 0 && <span style={{ color: T.muted }}>across {live.length} variant{live.length === 1 ? "" : "s"}</span>}
            </div>

            <div style={{ maxHeight: 340, overflowY: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={{ ...th, width: 34 }}>#</th>
                  <th style={th}>First name</th>
                  <th style={th}>Last name</th>
                  <th style={th}>Email</th>
                  {live.length > 0 && <th style={{ ...th, width: 88 }}>Variant</th>}
                  <th style={th}>Status</th>
                  <th style={{ ...th, width: 30 }}></th>
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => {
                    const e = errs[i];
                    const nameBad = !!e && e.startsWith("First");
                    const mailBad = !!e && e.includes("email");
                    return (
                      <tr key={r.n}>
                        <td style={{ ...td, color: T.muted, fontSize: 12 }}>{r.n}</td>
                        <td style={td}><input className="csv-in" disabled={busy || done} value={r.firstName} onChange={(ev) => update(r.n, { firstName: ev.target.value })} placeholder="First" style={cell(nameBad && !r.firstName.trim())} /></td>
                        <td style={td}><input className="csv-in" disabled={busy || done} value={r.lastName} onChange={(ev) => update(r.n, { lastName: ev.target.value })} placeholder="Last" style={cell(nameBad && !r.lastName.trim())} /></td>
                        <td style={td}><input className="csv-in" disabled={busy || done} value={r.email} onChange={(ev) => update(r.n, { email: ev.target.value })} placeholder="optional" style={cell(mailBad)} /></td>
                        {live.length > 0 && (
                          <td style={td}>
                            <select className="csv-in" disabled={busy || done} value={r.variantId ?? ""} onChange={(ev) => update(r.n, { variantId: ev.target.value || null, pinned: !!ev.target.value })}
                              style={{ ...cell(false), fontWeight: 600, color: r.variantId ? T.green : T.muted, cursor: busy || done ? "default" : "pointer" }}>
                              <option value="">auto</option>
                              {live.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                            </select>
                          </td>
                        )}
                        <td style={{ ...td, fontSize: 12 }}>
                          {r.status === "ok" ? <span style={{ color: T.greenText }}>{r.message}</span>
                            : r.status === "failed" ? <span style={{ color: "#B42318" }}>{r.message}</span>
                            : e ? <span style={{ color: "#B42318" }}>{e}</span>
                            : <span style={{ color: T.muted }}>ready</span>}
                        </td>
                        <td style={td}>
                          {!busy && !done && (
                            <button onClick={() => removeRow(r.n)} title="Remove this row" style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px" }}>{"\u00d7"}</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {err && <p style={{ color: "#B42318", fontSize: 13, margin: "0 0 12px" }}>{err}</p>}
            {busy && progress && <p style={{ color: T.body, fontSize: 13, margin: "0 0 12px" }}>{progress}</p>}

            {!done ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={onClose} disabled={busy} style={ghost}>Cancel</button>
                <button onClick={() => commit("link")} disabled={busy || valid === 0} style={{ ...ghost, opacity: busy || valid === 0 ? 0.5 : 1 }}>
                  Create {valid} link{valid === 1 ? "" : "s"} only
                </button>
                <button onClick={() => commit("email")} disabled={busy || withEmail === 0} title={withEmail === 0 ? "No valid row has an email address" : ""} style={{ ...btn, opacity: busy || withEmail === 0 ? 0.5 : 1 }}>
                  {busy ? "Working..." : `Send ${withEmail} email${withEmail === 1 ? "" : "s"}`}
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
