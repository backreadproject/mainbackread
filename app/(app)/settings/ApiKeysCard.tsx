"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Key = { id: string; name: string; key_prefix: string; scopes: string[]; last_used_at: string | null; revoked_at: string | null; created_at: string };
const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 };
const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
const body = { padding: 18 };
const small = { height: 30, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 11px", fontSize: 12.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" };
const code = { fontSize: 12, background: T.soft, border: "1px solid " + T.border, padding: "1px 5px", borderRadius: 4, fontFamily: "ui-monospace, monospace" };
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
export default function ApiKeysCard({ enabled, canManage, keys, planName }: { enabled: boolean; canManage: boolean; keys: Key[]; planName: string }) {
  const K = getDict(useLocale()).apiKeys;
  const router = useRouter();
  const [name, setName] = useState("");
  const [write, setWrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [fresh, setFresh] = useState("");
  async function call(b: Record<string, unknown>) {
    setBusy(true); setMsg("");
    const res = await fetch("/api/api-keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.error || K.failed); return null; }
    return j as { key?: string };
  }
  const input = { width: "100%", height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading, marginBottom: 10 };
  if (!enabled) {
    return (
      <div style={card}>
        <div style={head}>{K.title}</div>
        <div style={body}><p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.55 }}>{K.locked} <span style={{ color: T.faint }}>{K.notIncluded} {planName} {K.planSuffix}</span></p></div>
      </div>
    );
  }
  return (
    <div style={card}>
      <div style={head}>{K.title}</div>
      <div style={body}>
        <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 14px", lineHeight: 1.7 }}>
          {K.intro} <code style={code}>/api/v1</code>{K.andSend} <code style={code}>Authorization: Bearer rp_...</code>
        </p>
        {keys.length === 0 && <p style={{ fontSize: 13.5, color: T.faint, margin: "0 0 14px" }}>{K.none}</p>}
        {keys.map((k, i) => (
          <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "11px 0", borderTop: i === 0 ? "1px solid " + T.border : "1px solid " + T.borderSoft }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, color: T.heading, fontWeight: 500 }}>{k.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted }}>
                  <i style={{ width: 6, height: 6, borderRadius: 2, background: k.scopes.includes("write") ? T.amber : T.faint }} />
                  {k.scopes.includes("write") ? K.readWrite : K.readOnly}
                </span>
                {k.revoked_at && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.dangerText }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, background: T.danger }} />{K.revoked}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: T.faint, fontFamily: "ui-monospace, monospace", marginTop: 3 }}>
                {k.key_prefix}... {k.last_used_at ? "\u00b7 " + K.lastUsed + " " + new Date(k.last_used_at).toLocaleDateString() : "\u00b7 " + K.neverUsed}
              </div>
            </div>
            {canManage && (
              <div style={{ display: "flex", gap: 6, flex: "none" }}>
                {!k.revoked_at && <button onClick={async () => { if (await call({ action: "revoke", keyId: k.id })) router.refresh(); }} disabled={busy} style={small}>{K.revoke}</button>}
                <button onClick={async () => { if (await call({ action: "delete", keyId: k.id })) router.refresh(); }} disabled={busy} style={{ ...small, color: T.dangerText, borderColor: T.dangerBorder }}>{K.del}</button>
              </div>
            )}
          </div>
        ))}
        {canManage && (
          <div style={{ marginTop: 16 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={K.namePlaceholder} style={input} />
            <label style={{ fontSize: 13.5, color: T.body, display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <input type="checkbox" checked={write} onChange={(e) => setWrite(e.target.checked)} /> {K.allowWrite}
            </label>
            <button
              onClick={async () => { const r = await call({ action: "create", name, scopes: write ? ["read", "write"] : ["read"] }); if (r) { setFresh(r.key ?? ""); setName(""); setWrite(false); router.refresh(); } }}
              disabled={busy}
              style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
              Create key
            </button>
          </div>
        )}
        {msg && <p style={{ fontSize: 13, color: T.dangerText, margin: "12px 0 0" }}>{msg}</p>}
        {fresh && (
          <div style={{ marginTop: 12, background: T.greenSoft, border: "1px solid " + T.greenBorder, borderRadius: T.rCard, padding: "11px 13px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.greenText, marginBottom: 5 }}>Copy this key now, it will not be shown again</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, color: T.body, wordBreak: "break-all", fontFamily: "ui-monospace, monospace", flex: 1, minWidth: 0 }}>{fresh}</div>
              <CopyButton value={fresh} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}