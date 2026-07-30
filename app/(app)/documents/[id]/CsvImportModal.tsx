"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
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
  const C = getDict(useLocale()).csvImport;
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
    if (!r.firstName.trim() || !r.lastName.trim()) return C.errName;
    if (r.email.trim() && !looksLikeEmail(r.email)) return C.errEmail;
    if (r.email.trim()) {
      const mine = r.email.trim().toLowerCase();
      const dupe = all.some((o) => o.n !== r.n && o.email.trim().toLowerCase() === mine);
      if (dupe) return C.errDupe;
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
    if (raw.length === 0) { setErr(C.errNoRows); return; }
    if (!headers.includes("first_name") && !headers.includes("last_name") && !headers.includes("email")) {
      setErr(C.errColumns);
      return;
    }
    if (raw.length > 200) { setErr(C.errTooManyA + " " + raw.length + " " + C.errTooMany); return; }
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
      if (mode === "email" && !r.email.trim()) { next[i] = { ...r, status: "failed", message: C.errNoEmail }; continue; }
      setProgress(C.workingOn + " " + (i + 1) + " " + C.ofN + " " + next.length + "...");
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
        next[i] = { ...r, status: "failed", message: j.error || C.failed };
        if (res.status === 402) { setRows([...next]); setErr(j.error || C.limitStop); setBusy(false); setStage("done"); return; }
      } else {
        created.push(j.recipient as NewRec);
        next[i] = { ...r, status: "ok", message: mode === "email" ? (j.emailSent ? C.sent : C.linkCreated) : C.linkCreated };
      }
      setRows([...next]);
    }
    setBusy(false); setProgress("");
    setStage("done");
    if (created.length) onImported(created);
  }
  const errs = rows.map((r) => errorFor(r, rows));
  const valid = errs.filter((e) => !e).length;
  const badCount = rows.length - valid;
  const withEmail = rows.filter((r, i) => !errs[i] && r.email.trim()).length;
  const sent = rows.filter((r) => r.status === "ok").length;
  const done = stage === "done";
  const btn = { height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" } as const;
  const ghost = { height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;
  const th = { fontSize: 12.5, fontWeight: 600, color: T.body, padding: "10px 8px", textAlign: "left" as const, background: T.soft, borderBottom: "1px solid " + T.border, whiteSpace: "nowrap" as const };
  const td = { padding: "6px 8px", borderBottom: "1px solid " + T.borderSoft, verticalAlign: "middle" as const };
  const cell = (isBad: boolean) => ({ width: "100%", height: 30, boxSizing: "border-box" as const, border: "1px solid " + (isBad ? T.dangerBorder : "transparent"), borderRadius: 4, padding: "0 8px", fontSize: 13, fontFamily: T.font, color: T.heading, background: isBad ? T.dangerSoft : "transparent" });
  const dot = (c: string) => ({ width: 6, height: 6, borderRadius: 2, flex: "none" as const, background: c, display: "inline-block", marginRight: 6, verticalAlign: 1 });  return (
    <div onClick={() => !busy && onClose()} style={{ position: "fixed", inset: 0, background: T.scrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, width: 860, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", fontFamily: T.font, letterSpacing: T.tracking }}>
        <style>{`.csv-in:focus{outline:none;border-color:var(--rp-green) !important;background:var(--rp-card) !important}.csv-in:hover{background:var(--rp-hover)}`}</style>
        <div style={{ padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body }}>{C.title}</div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.55, margin: "0 0 16px" }}>
            {C.intro}
          </p>
          {stage === "pick" && (
            <>
              <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 6 }}>{C.columns}</div>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>
                  <span style={{ color: T.heading }}>first_name</span> and <span style={{ color: T.heading }}>last_name</span> are required. <span style={{ color: T.heading }}>email</span> is needed only to send emails. <span style={{ color: T.heading }}>label</span> is an optional display name. <span style={{ color: T.heading }}>variant</span> is optional (A, B, C, D) and wins over the automatic split.
                </p>
                <button onClick={() => downloadCsvTemplate()} style={{ ...ghost, height: 30, fontSize: 12.5, marginTop: 12 }}>{C.template}</button>
              </div>
              <input type="file" accept=".csv,text/csv" onChange={onFile}
                style={{ width: "100%", boxSizing: "border-box", border: "1px solid " + T.border, borderRadius: T.rInput, padding: "9px 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading }} />
              {err && <div style={{ marginTop: 12, background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, lineHeight: 1.5 }}>{err}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button onClick={onClose} style={ghost}>{C.cancel}</button>
              </div>
            </>
          )}
          {(stage === "preview" || done) && (
            <>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 14, fontSize: 13 }}>
                <span style={{ color: T.heading, fontWeight: 500 }}>{fileName}</span>
                <span style={{ color: T.body }}><i style={dot(T.green)} />{valid} {C.ready}</span>
                {badCount > 0 && <span style={{ color: T.body }}><i style={dot(T.danger)} />{badCount} {C.toFix}</span>}
                {live.length > 0 && <span style={{ color: T.muted }}>{C.across} {live.length} {live.length === 1 ? C.variant : C.variants}</span>}
              </div>
              <div style={{ maxHeight: 340, overflowY: "auto", border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 14 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={{ ...th, width: 40 }}>#</th>
                    <th style={th}>{C.hFirst}</th>
                    <th style={th}>{C.hLast}</th>
                    <th style={th}>{C.hEmail}</th>
                    {live.length > 0 && <th style={{ ...th, width: 92 }}>{C.hVariant}</th>}
                    <th style={th}>{C.hStatus}</th>
                    <th style={{ ...th, width: 34 }}></th>
                  </tr></thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const e = errs[i];
                      const nameBad = !!e && e.startsWith("First");
                      const mailBad = !!e && e.includes("email");
                      return (
                        <tr key={r.n}>
                          <td style={{ ...td, color: T.faint, fontSize: 12.5 }}>{r.n}</td>
                          <td style={td}><input className="csv-in" disabled={busy || done} value={r.firstName} onChange={(ev) => update(r.n, { firstName: ev.target.value })} placeholder={C.phFirst} style={cell(nameBad && !r.firstName.trim())} /></td>
                          <td style={td}><input className="csv-in" disabled={busy || done} value={r.lastName} onChange={(ev) => update(r.n, { lastName: ev.target.value })} placeholder={C.phLast} style={cell(nameBad && !r.lastName.trim())} /></td>
                          <td style={td}><input className="csv-in" disabled={busy || done} value={r.email} onChange={(ev) => update(r.n, { email: ev.target.value })} placeholder={C.phEmail} style={cell(mailBad)} /></td>
                          {live.length > 0 && (
                            <td style={td}>
                              <select className="csv-in" disabled={busy || done} value={r.variantId ?? ""} onChange={(ev) => update(r.n, { variantId: ev.target.value || null, pinned: !!ev.target.value })}
                                style={{ ...cell(false), color: r.variantId ? T.heading : T.faint, cursor: busy || done ? "default" : "pointer" }}>
                                <option value="">{C.auto}</option>
                                {live.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                              </select>
                            </td>
                          )}
                          <td style={{ ...td, fontSize: 12.5, whiteSpace: "nowrap" }}>
                            {r.status === "ok" ? <span style={{ color: T.heading }}><i style={dot(T.green)} />{r.message}</span>
                              : r.status === "failed" ? <span style={{ color: T.dangerText }}><i style={dot(T.danger)} />{r.message}</span>
                              : e ? <span style={{ color: T.dangerText }}><i style={dot(T.danger)} />{e}</span>
                              : <span style={{ color: T.muted }}><i style={dot(T.faint)} />{C.rowReady}</span>}
                          </td>
                          <td style={td}>
                            {!busy && !done && (
                              <button onClick={() => removeRow(r.n)} title={C.removeRow} aria-label={C.removeRow} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 4px" }}>{"\u00d7"}</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {err && <div style={{ marginBottom: 12, background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, lineHeight: 1.5 }}>{err}</div>}
              {busy && progress && <p style={{ color: T.muted, fontSize: 13, margin: "0 0 12px" }}>{progress}</p>}
              {!done ? (
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={onClose} disabled={busy} style={ghost}>{C.cancel}</button>
                  <button onClick={() => commit("link")} disabled={busy || valid === 0} style={{ ...ghost, opacity: busy || valid === 0 ? 0.5 : 1 }}>
                    {C.createLinks} {valid} {valid === 1 ? C.linkOnly : C.linksOnly}
                  </button>
                  <button onClick={() => commit("email")} disabled={busy || withEmail === 0} title={withEmail === 0 ? C.noEmailRow : ""} style={{ ...btn, opacity: busy || withEmail === 0 ? 0.5 : 1 }}>
                    {busy ? C.working : C.send + " " + withEmail + " " + (withEmail === 1 ? C.email : C.emails)}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.muted }}>{sent} {C.of} {valid} {C.created}</span>
                  <button onClick={onClose} style={btn}>{C.done}</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}