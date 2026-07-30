"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Variant = { id: string; label: string; note: string | null; active: boolean; storage_path: string | null };
type Rec = { id: string; variant_id?: string | null };
type Sig = { recipient_id: string; kind: string };
export default function VariantsPanel({ documentId, variants, recipients, signals }: { documentId: string; variants: Variant[]; recipients: Rec[]; signals: Sig[] }) {
  const V = getDict(useLocale()).variantsPanel;
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [confirming, setConfirming] = useState("");
  const [err, setErr] = useState("");
  const stats = useMemo(() => {
    const byRec = new Map<string, string | null>(recipients.map((r) => [r.id, r.variant_id ?? null]));
    const out = new Map<string, { readers: number; opens: number; questions: number; forwards: number; opened: Set<string> }>();
    for (const v of variants) out.set(v.id, { readers: 0, opens: 0, questions: 0, forwards: 0, opened: new Set() });
    for (const r of recipients) {
      const vid = r.variant_id ?? null;
      if (vid && out.has(vid)) out.get(vid)!.readers++;
    }
    for (const s of signals) {
      const vid = byRec.get(s.recipient_id) ?? null;
      if (!vid || !out.has(vid)) continue;
      const a = out.get(vid)!;
      if (s.kind === "opened") { a.opens++; a.opened.add(s.recipient_id); }
      else if (s.kind === "question") a.questions++;
      else if (s.kind === "forwarded") a.forwards++;
    }
    return out;
  }, [variants, recipients, signals]);
  async function call(body: Record<string, unknown>) {
    setBusy(String(body.variantId ?? "x")); setErr("");
    const res = await fetch("/api/variants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId, ...body }) });
    const j = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) { setErr(j.error || V.failed); return false; }
    router.refresh();
    return true;
  }
  if (variants.length === 0) return null;
  const totalReaders = recipients.filter((r) => r.variant_id).length;
  const thin = totalReaders < 6;
  const small = { height: 28, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 10px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;
  const stat = (v: number, l: string, ink: string) => (
    <div>
      <div style={{ fontSize: 17, fontWeight: 600, color: ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{v}</div>
      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{l}</div>
    </div>
  );
  // Nothing to compare yet. Explaining what a variant is here is the only
  // place the feature introduces itself.
  if (variants.length === 0) {
    return (
      <div style={{ maxWidth: 1040, padding: "20px 28px 0" }}>
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, padding: 18 }}>
          <div style={{ fontSize: 13, color: T.body, marginBottom: 4 }}>{V.title}</div>
          <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.55, maxWidth: 520 }}>
            Upload two or more versions and ReadProspects splits your readers between them, so you can see which wording holds attention and which loses it. Use Upload A/B variants above.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 1040, padding: "20px 28px 0" }}>
      <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: T.body }}>{V.title}</span>
          <span style={{ fontSize: 12.5, color: T.muted }}>{totalReaders} {totalReaders === 1 ? V.reader : V.readers} {V.acrossN} {variants.length}</span>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(variants.length, 4) + ", minmax(0,1fr))", gap: 12 }}>
            {variants.map((v) => {
              const a = stats.get(v.id) ?? { readers: 0, opens: 0, questions: 0, forwards: 0, opened: new Set<string>() };
              const openRate = a.readers > 0 ? Math.round((a.opened.size / a.readers) * 100) : 0;
              return (
                <div key={v.id} style={{ border: "1px solid " + T.border, borderLeft: "3px solid " + (v.active ? T.green : T.border), borderRadius: T.rCard, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 4, border: "1px solid " + T.border, background: T.soft, color: T.heading, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 600 }}>{v.label}</span>
                    {!v.active && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted }}><i style={{ width: 6, height: 6, borderRadius: 2, background: T.faint }} />{V.paused}</span>}
                    {!v.storage_path && <span title={V.sharedFileHint} style={{ fontSize: 12, color: T.faint, cursor: "help" }}>{V.sharedFile}</span>}
                  </div>
                  {v.note && <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: "0 0 12px" }}>{v.note}</p>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 12 }}>
                    {stat(a.readers, V.kReaders, T.heading)}
                    {stat(openRate, V.kOpened, T.heading)}
                    {stat(a.questions, V.kQuestions, a.questions ? T.heading : T.faint)}
                    {stat(a.forwards, V.kForwards, a.forwards ? T.heading : T.faint)}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => call({ action: "update", variantId: v.id, active: !v.active })} disabled={!!busy} style={small}>{v.active ? V.pause : V.resume}</button>
                    {confirming === v.id ? (
                      <button onClick={async () => { if (await call({ action: "delete", variantId: v.id })) setConfirming(""); }} disabled={!!busy} style={{ ...small, color: T.onAccent, background: T.danger, border: "none" }}>{V.confirm}</button>
                    ) : (
                      <button onClick={() => setConfirming(v.id)} disabled={!!busy} style={{ ...small, color: T.dangerText, borderColor: T.dangerBorder }}>{V.del}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {err && <div style={{ marginTop: 14, background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText }}>{err}</div>}
          {thin && <p style={{ fontSize: 13, color: T.muted, margin: "14px 0 0", lineHeight: 1.55 }}>{V.tooFew}</p>}
        </div>
      </div>
    </div>
  );
}