"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, microLabel } from "@/lib/theme";
import ShareDialog from "@/app/(app)/ShareDialog";

type Doc = { id: string; title: string; created_at: string };
type Rec = { id: string; label: string | null; share_token: string; created_at: string };
type Sig = { recipient_id: string; kind: string; page: number | null; value: unknown; created_at: string };
type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string; evidence: string[] };

export default function DocumentDetailClient({ doc, recipients, signals }: { doc: Doc; recipients: Rec[]; signals: Sig[] }) {
  const [recs, setRecs] = useState(recipients);
  const [selected, setSelected] = useState<string | null>(recipients[0]?.id ?? null);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [verdictBusy, setVerdictBusy] = useState("");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareInfo, setShareInfo] = useState<{ isOrg: boolean; canManage: boolean; members: { userId: string; email: string | null }[] }>({ isOrg: false, canManage: false, members: [] });
  useEffect(() => {
    fetch(`/api/org-members?docId=${doc.id}`).then((r) => r.json()).then((d) => setShareInfo({ isOrg: !!d.isOrg, canManage: !!d.canManage, members: d.members ?? [] })).catch(() => {});
  }, [doc.id]);

  const summary = useMemo(() => {
    const map: Record<string, { opens: number; dwell: Record<number, number>; questions: { text: string; escalated?: boolean }[] }> = {};
    for (const r of recs) map[r.id] = { opens: 0, dwell: {}, questions: [] };
    for (const s of signals) {
      const m = map[s.recipient_id]; if (!m) continue;
      if (s.kind === "opened") m.opens++;
      if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) m.dwell[s.page] = Number((s.value as { ms: number }).ms) || 0;
      if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) m.questions.push({ text: String((s.value as { text: string }).text), escalated: (s.value as { escalated?: boolean }).escalated });
    }
    return map;
  }, [signals, recs]);

  async function readTheReader(id: string) {
    setVerdictBusy(id); setError("");
    const res = await fetch("/api/verdict-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId: id }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Couldn't read the reader."); setVerdictBusy(""); return; }
    setVerdicts((p) => ({ ...p, [id]: json.verdict })); setVerdictBusy("");
  }
  async function saveName(id: string) {
    const supabase = createClient();
    const label = nameDraft.trim() || null;
    await supabase.from("recipients").update({ label }).eq("id", id);
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r))); setEditing(null);
  }
  function copyLink(token: string) { navigator.clipboard.writeText(`${window.location.origin}/read/${token}`); setCopied(token); setTimeout(() => setCopied(""), 1500); }

  const sel = recs.find((r) => r.id === selected);
  const selSum = selected ? summary[selected] : null;
  const maxDwell = selSum ? Math.max(1, ...Object.values(selSum.dwell)) : 1;

  const pill = (pos: boolean, txt: string) => (<span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: T.rPill, background: pos ? T.pillPosBg : T.pillNeutralBg, color: pos ? T.pillPosText : T.pillNeutralText }}>{txt}</span>);

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-b{cursor:pointer;transition:opacity .12s}.t-b:hover{opacity:.88}.t-rec{transition:background .12s;cursor:pointer}.t-rec:hover{background:#FCFCFD}.t-in:focus{border-color:${T.green};outline:none}`}</style>

      <div style={{ padding: "26px 30px 0" }}>
        <a href="/documents" style={{ fontSize: 13, color: T.body, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
          <span style={{ color: T.muted }}>‹</span> Documents
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{doc.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{recs.length} recipient{recs.length === 1 ? "" : "s"}</p>
          {shareInfo.isOrg && shareInfo.canManage && <button onClick={() => setSharing(true)} style={{ background: T.greenSoft, color: T.greenText, fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: T.rBtn, border: "none", cursor: "pointer", fontFamily: T.font }}>Share with team</button>}
        </div>
      </div>

      {error && <p style={{ color: "#B42318", fontSize: 14, padding: "12px 30px 0" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: 18, padding: "22px 30px 40px", alignItems: "start" }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={microLabel}>Recipients</span>
            <ShareButton documentId={doc.id} onCreated={(r) => { setRecs((p) => [r, ...p]); setSelected(r.id); }} />
          </div>
          {recs.length === 0 ? <p style={{ fontSize: 14, color: T.body, padding: "6px 2px" }}>No links yet.</p> : recs.map((r) => {
            const s = summary[r.id]; const active = r.id === selected; const opened = s && s.opens > 0;
            return (
              <div key={r.id} className="t-rec" onClick={() => setSelected(r.id)} style={{ padding: "10px 11px", borderRadius: 8, marginBottom: 3, background: active ? T.greenSoft : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? T.greenText : T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label || "Unnamed reader"}</span>
                {pill(!!opened, opened ? "Opened" : "New")}
              </div>
            );
          })}
        </div>

        <div>
          {!sel ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 28 }}><p style={{ fontSize: 15, color: T.body, margin: 0 }}>Select a recipient to see how they read.</p></div>
          ) : (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                {editing === sel.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <input className="t-in" autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName(sel.id)} placeholder="e.g. Sarah at Meridian" style={{ border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "8px 11px", fontSize: 16, fontFamily: T.font, fontWeight: 600, color: T.heading }} />
                    <button onClick={() => saveName(sel.id)} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: T.font }}>Save</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: 0 }}>{sel.label || "Unnamed reader"}</h2>
                    <button onClick={() => { setEditing(sel.id); setNameDraft(sel.label || ""); }} className="t-b" style={{ fontSize: 13, color: T.green, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: T.font }}>Rename</button>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.canvas, borderRadius: T.rInput, maxWidth: 520 }}>
                  <span style={{ fontSize: 12, color: T.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/read/{sel.share_token}</span>
                  <button onClick={() => copyLink(sel.share_token)} className="t-b" style={{ fontSize: 12, fontWeight: 600, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", marginLeft: "auto", fontFamily: T.font, color: T.heading }}>{copied === sel.share_token ? "Copied" : "Copy"}</button>
                </div>
              </div>

              {selSum && selSum.opens > 0 ? (
                <>
                  <div style={{ ...microLabel, marginBottom: 12 }}>How they read</div>
                  <div style={{ marginBottom: 24 }}>
                    {Object.keys(selSum.dwell).length === 0 ? <p style={{ fontSize: 14, color: T.body }}>Opened, no page dwell yet.</p> : Object.entries(selSum.dwell).sort((a, b) => Number(a[0]) - Number(b[0])).map(([page, ms]) => (
                      <div key={page} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                        <span style={{ fontSize: 12, color: T.body, width: 48, fontWeight: 500 }}>Page {page}</span>
                        <div style={{ flex: 1, height: 8, background: T.canvas, borderRadius: 20, overflow: "hidden", maxWidth: 340 }}><div style={{ width: `${(Number(ms) / maxDwell) * 100}%`, height: "100%", background: T.green, borderRadius: 20 }} /></div>
                        <span style={{ fontSize: 13, color: T.body }}>{(Number(ms) / 1000).toFixed(1)}s</span>
                      </div>
                    ))}
                  </div>

                  {selSum.questions.length > 0 && (<>
                    <div style={{ ...microLabel, marginBottom: 12 }}>What they asked</div>
                    <div style={{ marginBottom: 24 }}>{selSum.questions.map((q, i) => (
                      <div key={i} style={{ background: T.canvas, borderRadius: T.rInput, padding: "12px 14px", marginBottom: 8 }}>
                        <p style={{ fontSize: 15, color: T.heading, margin: 0 }}>{q.text}</p>
                        {q.escalated && <span style={{ fontSize: 11, fontWeight: 600, color: "#B42318", marginTop: 4, display: "inline-block" }}>Escalated — commercial question</span>}
                      </div>
                    ))}</div>
                  </>)}

                  <div style={{ ...microLabel, marginBottom: 12 }}>Verdict</div>
                  {verdicts[sel.id] ? (
                    <div style={{ background: T.canvas, borderRadius: T.rCard, padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.body }}>Reading</span>
                        {pill(verdicts[sel.id].confidence === "high", verdicts[sel.id].confidence + " confidence")}
                      </div>
                      <p style={{ fontSize: 20, fontWeight: 700, color: T.heading, lineHeight: 1.3, letterSpacing: T.trackingTight, margin: "0 0 10px" }}>{verdicts[sel.id].headline}</p>
                      <p style={{ fontSize: 14, color: T.body, lineHeight: 1.5, margin: "0 0 14px" }}>{verdicts[sel.id].reasoning}</p>
                      <div style={{ background: "#fff", borderRadius: T.rInput, padding: "12px 14px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.green, marginBottom: 3 }}>Do this next</div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: 0 }}>{verdicts[sel.id].nextAction}</p>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => readTheReader(sel.id)} disabled={verdictBusy === sel.id} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "11px 20px", fontSize: 14, fontWeight: 600, fontFamily: T.font }}>{verdictBusy === sel.id ? "Reading…" : "Read the reader"}</button>
                  )}
                </>
              ) : <p style={{ fontSize: 15, color: T.body, margin: 0 }}>This reader hasn't opened the document yet. Their read appears here once they do.</p>}
            </div>
          )}
        </div>
      </div>
    {sharing && <ShareDialog resourceType="document" resourceId={doc.id} resourceName={doc.title} members={shareInfo.members} onClose={() => setSharing(false)} />}
    </div>
  );
}

function ShareButton({ documentId, onCreated }: { documentId: string; onCreated: (r: Rec) => void }) {
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    const supabase = createClient();
    const { data } = await supabase.from("recipients").insert({ document_id: documentId, label: null }).select("id, label, share_token, created_at").single();
    if (data) onCreated(data as Rec);
    setBusy(false);
  }
  return <button onClick={create} disabled={busy} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "6px 11px", fontSize: 12, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>{busy ? "…" : "+ New link"}</button>;
}
