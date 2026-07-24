"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { T, microLabel } from "@/lib/theme";

type Variant = { id: string; label: string; note: string | null; active: boolean; storage_path: string | null };
type Rec = { id: string; variant_id?: string | null };
type Sig = { recipient_id: string; kind: string };

export default function VariantsPanel({ documentId, variants, recipients, signals }: { documentId: string; variants: Variant[]; recipients: Rec[]; signals: Sig[] }) {
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
    if (!res.ok) { setErr(j.error || "Failed."); return false; }
    router.refresh();
    return true;
  }

  if (variants.length === 0) return null;

  const totalReaders = recipients.filter((r) => r.variant_id).length;
  const thin = totalReaders < 6;
  const small = { background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "5px 10px", fontSize: 12, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" } as const;

  return (
    <div style={{ padding: "22px 30px 0" }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <span style={microLabel}>Variants</span>
          <span style={{ fontSize: 12, color: T.muted }}>{totalReaders} reader{totalReaders === 1 ? "" : "s"} split across {variants.length}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(variants.length, 4)}, minmax(0,1fr))`, gap: 12 }}>
          {variants.map((v) => {
            const a = stats.get(v.id) ?? { readers: 0, opens: 0, questions: 0, forwards: 0, opened: new Set<string>() };
            const openRate = a.readers > 0 ? Math.round((a.opened.size / a.readers) * 100) : 0;
            return (
              <div key={v.id} style={{ border: `1px solid ${v.active ? T.border : T.borderSoft}`, borderRadius: 12, padding: 14, opacity: v.active ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{v.label}</span>
                  {!v.active && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: T.rPill, background: T.pillNeutralBg, color: T.body }}>paused</span>}
                  {!v.storage_path && <span title="Uses the base document file" style={{ fontSize: 11, color: T.muted, cursor: "help" }}>shared file</span>}
                </div>
                {v.note && <p style={{ fontSize: 13, color: T.body, lineHeight: 1.45, margin: "0 0 10px" }}>{v.note}</p>}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 18, fontWeight: 700, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{a.readers}</div><div style={{ fontSize: 11, color: T.muted }}>readers</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 700, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{openRate}%</div><div style={{ fontSize: 11, color: T.muted }}>opened</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 700, color: a.questions ? T.heading : T.muted, fontVariantNumeric: "tabular-nums" }}>{a.questions}</div><div style={{ fontSize: 11, color: T.muted }}>questions</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 700, color: a.forwards ? T.greenText : T.muted, fontVariantNumeric: "tabular-nums" }}>{a.forwards}</div><div style={{ fontSize: 11, color: T.muted }}>forwards</div></div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => call({ action: "update", variantId: v.id, active: !v.active })} disabled={!!busy} style={small}>{v.active ? "Pause" : "Resume"}</button>
                  {confirming === v.id ? (
                    <button onClick={async () => { if (await call({ action: "delete", variantId: v.id })) setConfirming(""); }} disabled={!!busy} style={{ ...small, color: "#fff", background: "#D92D20", borderColor: "#D92D20" }}>Confirm</button>
                  ) : (
                    <button onClick={() => setConfirming(v.id)} disabled={!!busy} style={{ ...small, color: "#B42318", borderColor: "#FDA29B" }}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {err && <p style={{ color: "#B42318", fontSize: 13, margin: "12px 0 0" }}>{err}</p>}
        {thin && (
          <p style={{ fontSize: 13, color: T.muted, margin: "14px 0 0", lineHeight: 1.5 }}>
            Too few readers to call a winner yet. Differences at this size are noise, not signal.
          </p>
        )}
      </div>
    </div>
  );
}

