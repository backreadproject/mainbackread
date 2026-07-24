"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
type Hook = { id: string; url: string; events: string[]; active: boolean; last_status: number | null; last_delivery_at: string | null };
const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 };
const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
const body = { padding: 18 };
const small = { height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" };
function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ } }}
      title="Copy"
      style={{ flex: "none", height: 26, background: T.card, border: "1px solid " + T.border, borderRadius: 4, padding: "0 8px", fontSize: 11, fontWeight: 500, fontFamily: T.font, color: done ? T.greenText : T.heading, cursor: "pointer" }}>
      {done ? "Copied" : "Copy"}
    </button>
  );
}
export default function WebhooksCard({ enabled, canManage, hooks, planName }: { enabled: boolean; canManage: boolean; hooks: Hook[]; planName: string }) {
  const router = useRouter();
  const fr = useLocale() === "fr";
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [secret, setSecret] = useState("");
  const L = {
    title: fr ? "Alertes webhook" : "Webhook alerts",
    intro: fr ? "Recevez chaque lecture, question et transfert dans Slack ou sur votre propre endpoint." : "Get every read, question and forward in Slack or on your own endpoint.",
    locked: fr ? "Non inclus dans le plan " + planName + "." : "Not included in the " + planName + " plan.",
    add: fr ? "Ajouter" : "Add endpoint",
    test: fr ? "Tester" : "Test",
    del: fr ? "Supprimer" : "Delete",
    on: fr ? "Actif" : "Active",
    off: fr ? "En pause" : "Paused",
    pause: fr ? "Mettre en pause" : "Pause",
    resume: fr ? "Reprendre" : "Resume",
    none: fr ? "Aucun endpoint pour l\u2019instant." : "No endpoints yet.",
    saved: fr ? "Endpoint ajout\u00e9." : "Endpoint added.",
    sent: fr ? "Test envoy\u00e9." : "Test delivered.",
    secretNote: fr ? "Conservez ce secret, il ne sera plus affich\u00e9 :" : "Save this signing secret, it will not be shown again:",
  };
  async function call(b: Record<string, unknown>) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setOk(false); setMsg(j.error || "Failed."); return null; }
    return j as { id?: string; secret?: string };
  }
  const input = { width: "100%", height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading, marginBottom: 12 };
  if (!enabled) {
    return (
      <div style={card}>
        <div style={head}>{L.title}</div>
        <div style={body}><p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.55 }}>{L.intro} <span style={{ color: T.faint }}>{L.locked}</span></p></div>
      </div>
    );
  }
  return (
    <div style={card}>
      <div style={head}>{L.title}</div>
      <div style={body}>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 14px", lineHeight: 1.55 }}>{L.intro}</p>
        {hooks.length === 0 && <p style={{ fontSize: 13.5, color: T.faint, margin: "0 0 14px" }}>{L.none}</p>}
        {hooks.map((h, i) => (
          <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "11px 0", borderTop: i === 0 ? "1px solid " + T.border : "1px solid " + T.borderSoft }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>{h.url}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.muted, marginTop: 3 }}>
                <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: h.active ? T.green : T.faint }} />
                {h.active ? L.on : L.off}{h.last_status ? " \u00b7 " + h.last_status : ""}{h.last_delivery_at ? " \u00b7 " + new Date(h.last_delivery_at).toLocaleDateString() : ""}
              </div>
            </div>
            {canManage && (
              <div style={{ display: "flex", gap: 6, flex: "none" }}>
                <button onClick={async () => { const r = await call({ action: "test", webhookId: h.id }); if (r) { setOk(true); setMsg(L.sent); } }} disabled={busy} style={small}>{L.test}</button>
                <button onClick={async () => { if (await call({ action: "toggle", webhookId: h.id })) router.refresh(); }} disabled={busy} style={small}>{h.active ? L.pause : L.resume}</button>
                <button onClick={async () => { if (await call({ action: "delete", webhookId: h.id })) router.refresh(); }} disabled={busy} style={{ ...small, color: T.dangerText, borderColor: T.dangerBorder }}>{L.del}</button>
              </div>
            )}
          </div>
        ))}
        {canManage && (
          <div style={{ marginTop: 16 }}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." style={input} />
            <button
              onClick={async () => { const r = await call({ action: "create", url }); if (r) { setOk(true); setMsg(L.saved); setSecret(r.secret ?? ""); setUrl(""); router.refresh(); } }}
              disabled={busy || !url.trim()}
              style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy || !url.trim() ? 0.5 : 1 }}>
              {L.add}
            </button>
          </div>
        )}
        {msg && <p style={{ fontSize: 13, color: ok ? T.greenText : T.dangerText, margin: "12px 0 0" }}>{msg}</p>}
        {secret && (
          <div style={{ marginTop: 12, background: T.greenSoft, border: "1px solid " + T.greenBorder, borderRadius: T.rCard, padding: "11px 13px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.greenText, marginBottom: 5 }}>{L.secretNote}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, color: T.body, wordBreak: "break-all", fontFamily: "ui-monospace, monospace", flex: 1, minWidth: 0 }}>{secret}</div>
              <CopyButton value={secret} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}