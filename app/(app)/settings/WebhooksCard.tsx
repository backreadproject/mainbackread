"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

type Hook = { id: string; url: string; events: string[]; active: boolean; last_status: number | null; last_delivery_at: string | null };

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
    locked: fr ? `Non inclus dans le plan ${planName}.` : `Not included in the ${planName} plan.`,
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

  async function call(body: Record<string, unknown>) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setOk(false); setMsg(j.error || "Failed."); return null; }
    return j as { id?: string; secret?: string };
  }

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 22, marginBottom: 16 };
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 8, display: "block" as const };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 };
  const small = { background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" };

  if (!enabled) {
    return (
      <div style={card}>
        <span style={label}>{L.title}</span>
        <p style={{ fontSize: 13, color: T.body, margin: 0, lineHeight: 1.5 }}>{L.intro} <span style={{ color: T.muted }}>{L.locked}</span></p>
      </div>
    );
  }

  return (
    <div style={card}>
      <span style={label}>{L.title}</span>
      <p style={{ fontSize: 13, color: T.body, margin: "0 0 14px", lineHeight: 1.5 }}>{L.intro}</p>

      {hooks.map((h) => (
        <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.url}</div>
            <div style={{ fontSize: 11.5, color: h.active ? T.greenText : T.muted }}>
              {h.active ? L.on : L.off}{h.last_status ? ` \u00b7 ${h.last_status}` : ""}{h.last_delivery_at ? ` \u00b7 ${new Date(h.last_delivery_at).toLocaleDateString()}` : ""}
            </div>
          </div>
          {canManage && (
            <div style={{ display: "flex", gap: 6, flex: "none" }}>
              <button onClick={async () => { const r = await call({ action: "test", webhookId: h.id }); if (r) { setOk(true); setMsg(L.sent); } }} disabled={busy} style={small}>{L.test}</button>
              <button onClick={async () => { if (await call({ action: "toggle", webhookId: h.id })) router.refresh(); }} disabled={busy} style={small}>{h.active ? L.pause : L.resume}</button>
              <button onClick={async () => { if (await call({ action: "delete", webhookId: h.id })) router.refresh(); }} disabled={busy} style={{ ...small, color: "#B42318", borderColor: "#FDA29B" }}>{L.del}</button>
            </div>
          )}
        </div>
      ))}
      {hooks.length === 0 && <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px" }}>{L.none}</p>}

      {canManage && (
        <div style={{ marginTop: 14 }}>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.slack.com/services/..." style={input} />
          <button
            onClick={async () => { const r = await call({ action: "create", url }); if (r) { setOk(true); setMsg(L.saved); setSecret(r.secret ?? ""); setUrl(""); router.refresh(); } }}
            disabled={busy || !url.trim()}
            style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy || !url.trim() ? 0.5 : 1 }}>
            {L.add}
          </button>
        </div>
      )}

      {msg && <p style={{ fontSize: 13, color: ok ? T.greenText : "#B42318", marginTop: 12 }}>{msg}</p>}
      {secret && (
        <div style={{ marginTop: 12, background: T.greenSoft, border: "1px solid #C7EBD8", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: T.greenText, marginBottom: 4 }}>{L.secretNote}</div>
          <div style={{ fontSize: 11.5, color: T.body, wordBreak: "break-all", fontFamily: "ui-monospace, monospace" }}>{secret}</div>
        </div>
      )}
    </div>
  );
}

