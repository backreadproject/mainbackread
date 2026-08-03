"use client";
import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { clampDwellMs, formatDwell, DWELL_CAP_MS } from "@/lib/dwell";
import ShareDialog from "@/app/(app)/ShareDialog";
import ProspectModal from "@/app/(app)/documents/[id]/ProspectModal";
import ComposeWorkspace from "@/app/(app)/documents/[id]/ComposeWorkspace";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import VariantsPanel from "./VariantsPanel";
import AccountsPanel from "./AccountsPanel";
import GapsPanel from "./GapsPanel";
import LinkControls from "./LinkControls";
import FieldPlacer, { type Field } from "./FieldPlacer";
import type { Grouped } from "@/lib/accounts";
import CsvImportModal from "./CsvImportModal";
import ReportButton from "@/app/(app)/ReportButton";
import SignedDocumentButton from "@/app/SignedDocumentButton";
import SigningProgress from "./SigningProgress";
type Doc = { id: string; title: string; created_at: string };
type Rec = { id: string; label: string | null; share_token: string; created_at: string; variant_id?: string | null; expires_at?: string | null; revoked_at?: string | null; is_signer?: boolean; signed_at?: string | null; declined_at?: string | null; decline_reason?: string | null; sent_at?: string | null };
type Variant = { id: string; label: string; note: string | null; active: boolean; storage_path: string | null };
type Sig = { recipient_id: string; kind: string; page: number | null; value: unknown; created_at: string };
type Verdict = { headline: string; reasoning: string; nextAction: string; confidence: string; evidence: string[] };
const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow };
const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
const ghost = { height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" };
const dot = (c: string) => ({ width: 6, height: 6, borderRadius: 2, flex: "none" as const, background: c });
export default function DocumentDetailClient({ doc, recipients, signals, variants = [], grouped, storagePath, signingEnabled, signingCompletedAt, signingFileUrl, fields: initialFields }: { doc: Doc; recipients: Rec[]; signals: Sig[]; variants?: Variant[]; grouped: Grouped; storagePath: string | null; signingEnabled: boolean; signingCompletedAt: string | null; signingFileUrl: string; fields: Field[] }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const dd = getDict(locale).documentDetailPage;
  const [recs, setRecs] = useState(recipients);
  const [selected, setSelected] = useState<string | null>(recipients[0]?.id ?? null);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [verdictBusy, setVerdictBusy] = useState("");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [shareInfo, setShareInfo] = useState<{ isOrg: boolean; canManage: boolean; members: { userId: string; email: string | null }[] }>({ isOrg: false, canManage: false, members: [] });
  useEffect(() => {
    fetch("/api/org-members?docId=" + doc.id).then((r) => r.json()).then((d) => setShareInfo({ isOrg: !!d.isOrg, canManage: !!d.canManage, members: d.members ?? [] })).catch(() => {});
  }, [doc.id]);
  const summary = useMemo(() => {
    const map: Record<string, { opens: number; dwell: Record<number, number>; questions: { text: string; escalated?: boolean }[] }> = {};
    for (const r of recs) map[r.id] = { opens: 0, dwell: {}, questions: [] };
    for (const s of signals) {
      const m = map[s.recipient_id]; if (!m) continue;
      if (s.kind === "opened") m.opens++;
      if (s.kind === "page_dwell" && s.page != null && s.value && typeof s.value === "object" && "ms" in s.value) m.dwell[s.page] = clampDwellMs((s.value as { ms: unknown }).ms);
      if (s.kind === "question" && s.value && typeof s.value === "object" && "text" in s.value) m.questions.push({ text: String((s.value as { text: string }).text), escalated: (s.value as { escalated?: boolean }).escalated });
    }
    return map;
  }, [signals, recs]);
  async function readTheReader(id: string) {
    setVerdictBusy(id); setError("");
    // A verdict is a real model call and can be slow. Without this guard a
    // timeout returns an HTML error page, res.json() throws, and the button
    // sits on "Reading..." forever with nothing to tell you why.
    try {
      const ctrl = new AbortController();
      const kill = setTimeout(() => ctrl.abort(), 90000);
      const res = await fetch("/api/verdict-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId: id }), signal: ctrl.signal });
      clearTimeout(kill);
      const text = await res.text();
      let json: { verdict?: Verdict; error?: string } = {};
      try { json = JSON.parse(text); } catch { throw new Error("Server returned " + res.status + " and no error detail. Check the server logs."); }
      if (!res.ok) throw new Error(json.error ?? dd.couldntRead);
      if (!json.verdict) throw new Error(dd.couldntRead);
      setVerdicts((p) => ({ ...p, [id]: json.verdict as Verdict }));
    } catch (e) {
      setError(e instanceof Error ? (e.name === "AbortError" ? "Timed out after 90 seconds." : e.message) : dd.couldntRead);
    } finally {
      setVerdictBusy("");
    }
  }
  async function saveName(id: string) {
    const supabase = createClient();
    const label = nameDraft.trim() || null;
    await supabase.from("recipients").update({ label }).eq("id", id);
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r))); setEditing(null);
  }
  const readerOrigin = (process.env.NEXT_PUBLIC_READER_ORIGIN || "").replace(/\/+$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  function copyLink(token: string) { navigator.clipboard.writeText(readerOrigin + "/read/" + token); setCopied(token); setTimeout(() => setCopied(""), 1500); }
  const sel = recs.find((r) => r.id === selected);
  const selSum = selected ? summary[selected] : null;
  const maxDwell = selSum ? Math.max(1, ...Object.values(selSum.dwell)) : 1;
  const variantCounts = recs.reduce((m, r) => { if (r.variant_id) m[r.variant_id] = (m[r.variant_id] ?? 0) + 1; return m; }, {} as Record<string, number>);  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-b{cursor:pointer}.t-rec{transition:background .12s;cursor:pointer}.t-rec:hover{background:var(--rp-hover)}.t-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
      <div className="dd-wrap" style={{ maxWidth: 1040, padding: "34px 28px 0" }}>
        <a href="/documents" style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
          <span>{"\u2039"}</span> {dd.back}
        </a>
        <div className="dd-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{doc.title}</h1>
            <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{recs.length} {recs.length === 1 ? dd.recipientOne : dd.recipientMany}</p>
          </div>
          <span style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            <ReportButton documentId={doc.id} recipients={recs.map((r) => ({ id: r.id, label: r.label }))} />
  {shareInfo.isOrg && shareInfo.canManage && <button onClick={() => setSharing(true)} style={ghost}>{dd.shareWithTeam}</button>}
          </span>
        </div>
        {error && <p style={{ color: T.dangerText, fontSize: 14, margin: "16px 0 0" }}>{error}</p>}
      </div>
      <VariantsPanel documentId={doc.id} variants={variants} recipients={recs} signals={signals} />
        {signingEnabled && (
          <div style={{ maxWidth: 1040, padding: "0 28px" }}>
            <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: T.heading }}>Signatures</span>
              {!signingCompletedAt && (
                <span style={{ fontSize: 13, color: T.muted }}>
                  {recs.filter((r) => r.is_signer && r.signed_at).length} / {recs.filter((r) => r.is_signer).length}
                </span>
              )}
              {signingCompletedAt && (
                <span style={{ fontSize: 13, color: T.greenText }}>{fr ? "Compl\u00e9t\u00e9" : "Complete"}</span>
              )}
              {fields.length === 0 && (
                <span style={{ fontSize: 12.5, color: T.amberText }}>
                  {fr ? "Aucun champ plac\u00e9. Personne ne peut encore signer." : "No fields placed yet. Nobody can sign."}
                </span>
              )}
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 12 }}>
                {/* Fields are editable only while nobody has signed. /api/signature-fields
                    already refuses with a 409 after the first signature, so a button here
                    was a handle on a locked door: click, place, save, error. */}
                {recs.some((r) => r.is_signer && r.signed_at) ? (
                  <span style={{ fontSize: 12.5, color: T.faint }}>
                    {fr ? "Champs verrouill\u00e9s apr\u00e8s la premi\u00e8re signature." : "Fields locked once someone has signed."}
                  </span>
                ) : (
                  <button onClick={() => setPlacing(true)}
                    style={{ height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>
                    {fields.length === 0 ? (fr ? "Placer les champs" : "Place the fields") : (fr ? "Modifier les champs" : "Edit the fields")}
                  </button>
                )}
                {/* Only once everyone is in. A half-signed PDF in circulation is a
                    document that looks like an agreement and is not one. */}
                {signingCompletedAt && (
                  <SignedDocumentButton documentId={doc.id} title={doc.title} label={fr ? "T\u00e9l\u00e9charger le document sign\u00e9" : "Download signed"} />
                )}
              </span>
            </div>
            <SigningProgress
              recipients={recs}
              reading={Object.fromEntries(Object.entries(summary).map(([id, s]) => [id, { opens: s.opens, questions: s.questions.length }]))}
            />
          </div>
        )}
        {!recs.some((r) => r.is_signer && r.signed_at) && <GapsPanel documentId={doc.id} />}
        <AccountsPanel grouped={grouped} />
      <div style={{ maxWidth: 1040, display: "grid", gridTemplateColumns: "268px minmax(0,1fr)", gap: 16, padding: "20px 28px 120px", alignItems: "start" }} className="dd-grid">
        <div style={card}>
          <div style={head}>{dd.recipients}</div>
          <div style={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <ShareButton documentId={doc.id} variants={variants} counts={variantCounts} onCreated={(r) => { setRecs((p) => [r, ...p]); setSelected(r.id); }} />
              <button onClick={() => setImporting(true)} title="Import recipients from a CSV file" style={{ ...ghost, flex: 1 }}>CSV</button>
            </div>
            {recs.length === 0 ? <p style={{ fontSize: 13.5, color: T.faint, margin: "8px 2px" }}>{dd.noLinks}</p> : recs.map((r) => {
              const s = summary[r.id]; const active = r.id === selected; const opened = !!(s && s.opens > 0);
              const dead = !!r.revoked_at || (!!r.expires_at && new Date(r.expires_at) < new Date());
              const v = r.variant_id ? variants.find((x) => x.id === r.variant_id) : null;
              return (
                <div key={r.id} className="t-rec" onClick={() => setSelected(r.id)} style={{ padding: "9px 10px", borderRadius: 4, marginBottom: 2, background: active ? T.greenSoft : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <i title={dead ? (fr ? "Lien inactif" : "Link is closed") : undefined} style={dot(dead ? T.danger : opened ? T.green : T.faint)} />
                    <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 400, color: active ? T.greenText : T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label || dd.unnamedReader}</span>
                  </span>
                  {v && (
                    <span title={"Variant " + v.label} style={{ flex: "none", fontSize: 10, fontWeight: 600, width: 17, height: 17, borderRadius: 3, border: "1px solid " + T.border, background: T.card, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>{v.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          {!sel ? (
            <div style={{ ...card, padding: 40, textAlign: "center" }}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{dd.selectRecipient}</p></div>
          ) : (
            <div style={card}>
              <div style={{ ...head, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                {editing === sel.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                    <input className="t-in" autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName(sel.id)} placeholder={dd.renamePlaceholder} style={{ height: 30, flex: 1, boxSizing: "border-box", border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 10px", fontSize: 13.5, fontFamily: T.font, color: T.heading, background: T.card }} />
                    <button onClick={() => saveName(sel.id)} className="t-b" style={{ height: 30, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 12px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font }}>{dd.save}</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel.label || dd.unnamedReader}</span>
                    <button onClick={() => { setEditing(sel.id); setNameDraft(sel.label || ""); }} className="t-b" style={{ flex: "none", fontSize: 12.5, color: T.greenText, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, borderBottom: "1px solid " + T.greenBorder, padding: 0 }}>{dd.rename}</button>
                  </>
                )}
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: T.soft, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 20 }}>
                  <span className="dd-link" style={{ fontSize: 12.5, color: T.muted, fontFamily: "ui-monospace, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{readerOrigin.replace(/^https?:\/\//, "")}/read/{sel.share_token}</span>
                  <button onClick={() => copyLink(sel.share_token)} className="t-b" style={{ flex: "none", marginLeft: "auto", height: 26, fontSize: 11, fontWeight: 500, background: T.card, border: "1px solid " + T.border, borderRadius: 4, padding: "0 8px", cursor: "pointer", fontFamily: T.font, color: copied === sel.share_token ? T.greenText : T.heading }}>{copied === sel.share_token ? dd.copied : dd.copy}</button>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <LinkControls
                    recipientId={sel.id}
                    expiresAt={sel.expires_at ?? null}
                    revokedAt={sel.revoked_at ?? null}
                    onChange={(next) => setRecs((prev) => prev.map((x) => (x.id === sel.id ? { ...x, ...(next.expiresAt !== undefined ? { expires_at: next.expiresAt } : {}), ...(next.revokedAt !== undefined ? { revoked_at: next.revokedAt } : {}) } : x)))}
                  />
                </div>
                {selSum && selSum.opens > 0 ? (
                  <>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 12 }}>{dd.howTheyRead}</div>
                    <div style={{ marginBottom: 24 }}>
                      {Object.keys(selSum.dwell).length === 0 ? <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>{dd.openedNoDwell}</p> : Object.entries(selSum.dwell).sort((a, b) => Number(a[0]) - Number(b[0])).map(([page, ms]) => (
                        <div key={page} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9 }}>
                          <span style={{ fontSize: 12.5, color: T.muted, width: 58, flex: "none" }}>{dd.page} {page}</span>
                          <div className="dd-dwell" style={{ flex: 1, height: 6, background: T.soft, border: "1px solid " + T.border, borderRadius: 2, overflow: "hidden", maxWidth: 340, minWidth: 0 }}><div style={{ width: ((Number(ms) / maxDwell) * 100) + "%", height: "100%", background: T.green }} /></div>
                          <span title={Number(ms) >= DWELL_CAP_MS ? "Capped. A tab left open, not attention." : undefined} style={{ fontSize: 13, color: Number(ms) >= DWELL_CAP_MS ? T.faint : T.body, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{formatDwell(Number(ms))}</span>
                        </div>
                      ))}
                    </div>
                    {selSum.questions.length === 0 && (
                <p style={{ fontSize: 13, color: T.muted, margin: "14px 0 0", lineHeight: 1.55 }}>
                  No questions from this reader yet. They can ask the document anything while reading, and what they ask appears here.
                </p>
              )}
              {selSum.questions.length > 0 && (
                      <>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 12 }}>{dd.whatTheyAsked} &middot; {selSum.questions.length}</div>
                        <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 24 }}>
                          {selSum.questions.map((q, i) => (
                            <div key={i} style={{ padding: "12px 14px", borderBottom: i < selSum.questions.length - 1 ? "1px solid " + T.borderSoft : "none" }}>
                              <p style={{ fontSize: 13.5, color: T.heading, margin: 0, lineHeight: 1.5 }}>{q.text}</p>
                              {q.escalated && <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.heading, marginTop: 6 }}><i style={dot(T.amber)} />{dd.escalated}</span>}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 12 }}>{dd.verdict}</div>
                    {verdicts[sel.id] ? (
                      <>
                        <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard, padding: 18 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.heading, marginBottom: 10 }}>
                            <i style={dot(verdicts[sel.id].confidence === "high" ? T.green : T.faint)} />
                            {verdicts[sel.id].confidence}{dd.confidenceSuffix}
                          </span>
                          <p style={{ fontSize: 19, fontWeight: 600, color: T.heading, lineHeight: 1.3, letterSpacing: T.trackingTight, margin: "0 0 10px" }}>{verdicts[sel.id].headline}</p>
                          <p style={{ fontSize: 14, color: T.body, lineHeight: 1.55, margin: "0 0 14px" }}>{verdicts[sel.id].reasoning}</p>
                          <div style={{ background: T.greenSoft, border: "1px solid " + T.greenBorder, borderRadius: T.rCard, padding: "12px 14px" }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.greenText, marginBottom: 3 }}>{dd.doThisNext}</div>
                            <p style={{ fontSize: 14, color: T.heading, margin: 0, lineHeight: 1.5 }}>{verdicts[sel.id].nextAction}</p>
                          </div>
                        </div>
                        {!recs.some((r) => r.is_signer && r.signed_at) && (
                          <ComposeWorkspace recipientId={sel.id} verdict={verdicts[sel.id]} />
                        )}
                      </>
                    ) : (
                      <button onClick={() => readTheReader(sel.id)} disabled={verdictBusy === sel.id} className="t-b" style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, opacity: verdictBusy === sel.id ? 0.6 : 1 }}>{verdictBusy === sel.id ? dd.readingBusy : dd.readTheReader}</button>
                    )}
                  </>
                ) : <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>{dd.notOpenedYet}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px){ .dd-grid{ grid-template-columns: minmax(0, 1fr) !important; } }
        @media (max-width: 700px){
          .dd-head{ flex-direction: column !important; align-items: stretch !important; }
          .dd-head button{ width: 100%; }
          .dd-wrap{ padding-left: 16px !important; padding-right: 16px !important; }
          .dd-grid{ padding-left: 16px !important; padding-right: 16px !important; gap: 12px !important; }
          .dd-link{ font-size: 11.5px !important; overflow-wrap: anywhere; }
          .dd-dwell{ max-width: none !important; }
        }
      `}</style>
      {placing && (
        <FieldPlacer
          documentId={doc.id}
          fileUrl={signingFileUrl}
          signers={recs.filter((r) => r.is_signer).map((r) => ({ id: r.id, label: r.label }))
            .map((r) => ({ id: r.id, name: r.label || (fr ? "Signataire" : "Signer") }))}
          initial={fields}
          onClose={() => setPlacing(false)}
          onSaved={(next) => { setFields(next); setPlacing(false); }}
        />
      )}
      {importing && (
        <CsvImportModal
          documentId={doc.id}
          variants={variants}
          counts={variantCounts}
          onClose={() => setImporting(false)}
          onImported={(created) => { setRecs((p) => [...created, ...p]); if (created[0]) setSelected(created[0].id); }}
        />
      )}
      {sharing && <ShareDialog resourceType="document" resourceId={doc.id} resourceName={doc.title} members={shareInfo.members} onClose={() => setSharing(false)} />}
    </div>
  );
}
function ShareButton({ documentId, onCreated, variants = [], counts = {} }: { documentId: string; onCreated: (r: Rec) => void; variants?: Variant[]; counts?: Record<string, number> }) {
  const locale = useLocale();
  const dd = getDict(locale).documentDetailPage;
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"success" | "info">("success");
  const sentMsg = ((dd.emailSent as string) || "").trim() || (locale === "fr" ? "E-mail envoy\u00e9" : "Email sent");
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ flex: 2, height: 30, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dd.shareWithProspect}</button>
      {notice && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, padding: "11px 15px", display: "flex", alignItems: "center", gap: 9, maxWidth: "calc(100vw - 40px)", fontFamily: T.font }}>
          <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: noticeKind === "success" ? T.green : T.faint }} />
          <span style={{ fontSize: 13.5, color: T.heading, lineHeight: 1.4 }}>{notice}</span>
        </div>
      )}
      {open && (
        <ProspectModal
          variants={variants}
          counts={counts}
          documentId={documentId}
          onClose={() => setOpen(false)}
          onCreated={(rec, readUrl, emailInfo) => {
            onCreated(rec as Rec);
            setOpen(false);
            if (emailInfo) {
              if (emailInfo.sent) { setNotice(sentMsg); setNoticeKind("success"); }
              else { setNotice(emailInfo.warning ?? dd.linkCreated); setNoticeKind("info"); }
              setTimeout(() => setNotice(""), 5000);
            }
          }}
        />
      )}
    </>
  );
}