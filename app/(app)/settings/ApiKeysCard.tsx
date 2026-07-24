"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";

type Key = { id: string; name: string; key_prefix: string; scopes: string[]; last_used_at: string | null; revoked_at: string | null; created_at: string };

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ }
      }}
      title="Copy"
      style={{ flex: "none", background: "var(--rp-card)", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, fontFamily: T.font, color: done ? T.greenText : T.heading, cursor: "pointer", lineHeight: 1.6 }}>
      {done ? "Copied" : "Copy"}
    </button>
  );
}
export default function ApiKeysCard({ enabled, canManage, keys, planName }: { enabled: boolean; canManage: boolean; keys: Key[]; planName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [write, setWrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [fresh, setFresh] = useState("");

  async function call(body: Record<string, unknown>) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/api-keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || "Failed."); return null; }
    return j as { key?: string };
  }

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 22, marginBottom: 16 };
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 8, display: "block" as const };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "var(--rp-card)", marginBottom: 10 };
  const small = { background: "var(--rp-card)", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "6px 12px", fontSize: 13, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" };

  if (!enabled) {
    return (
      <div style={card}>
        <span style={label}>API and Zapier</span>
        <p style={{ fontSize: 13, color: T.body, margin: 0, lineHeight: 1.5 }}>
          Connect ReadProspects to Zapier, Make or your own systems. <span style={{ color: T.muted }}>Not included in the {planName} plan.</span>
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <span style={label}>API and Zapier</span>
      <p style={{ fontSize: 13, color: T.body, margin: "0 0 14px", lineHeight: 1.5 }}>
        Use these keys with Zapier, Make, or your own code. Base URL: <code style={{ fontSize: 12, background: "var(--rp-soft)", padding: "1px 5px", borderRadius: 4 }}>/api/v1</code>. Send the key as <code style={{ fontSize: 12, background: "var(--rp-soft)", padding: "1px 5px", borderRadius: 4 }}>Authorization: Bearer rp_...</code>
      </p>

      {keys.map((k) => (
        <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.heading, fontWeight: 600 }}>
              {k.name}
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: T.rPill, background: k.scopes.includes("write") ? "var(--rp-amber-soft)" : T.pillNeutralBg, color: k.scopes.includes("write") ? "var(--rp-amber-text)" : T.body }}>
                {k.scopes.includes("write") ? "read + write" : "read only"}
              </span>
              {k.revoked_at && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: T.rPill, background: "var(--rp-danger-soft)", color: "var(--rp-danger-text)" }}>revoked</span>}
            </div>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: "ui-monospace, monospace" }}>
              {k.key_prefix}... {k.last_used_at ? `\u00b7 last used ${new Date(k.last_used_at).toLocaleDateString()}` : "\u00b7 never used"}
            </div>
          </div>
          {canManage && (
            <div style={{ display: "flex", gap: 6, flex: "none" }}>
              {!k.revoked_at && <button onClick={async () => { if (await call({ action: "revoke", keyId: k.id })) router.refresh(); }} disabled={busy} style={small}>Revoke</button>}
              <button onClick={async () => { if (await call({ action: "delete", keyId: k.id })) router.refresh(); }} disabled={busy} style={{ ...small, color: "var(--rp-danger-text)", borderColor: "var(--rp-danger-border)" }}>Delete</button>
            </div>
          )}
        </div>
      ))}
      {keys.length === 0 && <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px" }}>No API keys yet.</p>}

      {canManage && (
        <div style={{ marginTop: 14 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name, e.g. Zapier" style={input} />
          <label style={{ fontSize: 13, color: T.body, display: "flex", gap: 7, alignItems: "center", marginBottom: 12 }}>
            <input type="checkbox" checked={write} onChange={(e) => setWrite(e.target.checked)} /> allow write access (create and delete)
          </label>
          <button
            onClick={async () => { const r = await call({ action: "create", name, scopes: write ? ["read", "write"] : ["read"] }); if (r) { setFresh(r.key ?? ""); setName(""); setWrite(false); router.refresh(); } }}
            disabled={busy}
            style={{ background: T.green, color: "var(--rp-on-accent)", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
            Create key
          </button>
        </div>
      )}

      {msg && <p style={{ fontSize: 13, color: "var(--rp-danger-text)", marginTop: 12 }}>{msg}</p>}
      {fresh && (
        <div style={{ marginTop: 12, background: T.greenSoft, border: "1px solid var(--rp-green-border)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.greenText, marginBottom: 4 }}>Copy this key now, it will not be shown again:</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ fontSize: 12, color: T.body, wordBreak: "break-all", fontFamily: "ui-monospace, monospace", flex: 1, minWidth: 0 }}>{fresh}</div>
            <CopyButton value={fresh} />
          </div>
        </div>
      )}
    </div>
  );
}



