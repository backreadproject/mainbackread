"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import WebhooksCard from "./WebhooksCard";
import ApiKeysCard from "./ApiKeysCard";
import SalesCard from "./SalesCard";
type Props = {
  email: string;
  isOrg: boolean;
  canManageOrg: boolean;
  orgId: string | null;
  orgName: string;
  orgDomain: string;
  webhooksEnabled: boolean;
  webhooks: { id: string; url: string; events: string[]; active: boolean; last_status: number | null; last_delivery_at: string | null }[];
  planName: string;
  apiEnabled: boolean;
  apiKeys: { id: string; name: string; key_prefix: string; scopes: string[]; last_used_at: string | null; revoked_at: string | null; created_at: string }[];
  quietDays: number;
};
export default function SettingsClient({ email, isOrg, canManageOrg, orgId, orgName: initialName, orgDomain: initialDomain, webhooksEnabled, webhooks, planName, quietDays, apiEnabled, apiKeys }: Props) {
  const locale = useLocale();
  const fr = locale === "fr";
  const st = getDict(locale).settingsPage;
  const [name, setName] = useState(initialName);
  const [domain, setDomain] = useState(initialDomain);
  const [msg, setMsg] = useState(""); const [msgOk, setMsgOk] = useState(false); const [busy, setBusy] = useState(false);
  async function saveOrg() {
    if (!orgId) return;
    if (!name.trim()) { setMsgOk(false); setMsg(st.orgNameEmpty); return; }
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = await supabase.from("organizations").update({ name: name.trim(), domain: domain.trim() || null }).eq("id", orgId);
    setMsgOk(!error); setMsg(error ? error.message : st.saved); setBusy(false);
  }
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
  const body = { padding: 18 };
  const field = { fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 };
  const input = { width: "100%", height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading, marginBottom: 12 };
  const btn = { height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" };
  const link = { color: T.greenText, textDecoration: "none", borderBottom: "1px solid " + T.greenBorder };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
      <main className="set-grid" style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{st.title}</h1>
          <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{fr ? "G\u00e9rez votre espace de travail, vos int\u00e9grations et vos cl\u00e9s." : "Manage your workspace, integrations and keys."}</p>
        </div>
        {isOrg ? (
          <div style={card}>
            <div style={head}>{st.organization}</div>
            <div style={body}>
              {canManageOrg ? (
                <>
                  <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 14px", lineHeight: 1.55 }}>{st.orgManageIntro}</p>
                  <span style={field}>{st.name}</span>
                  <input className="t-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." style={input} />
                  <span style={field}>{st.domain} <span style={{ color: T.faint }}>{st.optional}</span></span>
                  <input className="t-in" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" style={input} />
                  <button onClick={saveOrg} disabled={busy} style={{ ...btn, opacity: busy ? 0.5 : 1 }}>{busy ? st.saving : st.saveChanges}</button>
                  {msg && <p style={{ fontSize: 13, color: msgOk ? T.greenText : T.dangerText, margin: "12px 0 0" }}>{msg}</p>}
                </>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: T.heading, margin: "0 0 3px", fontWeight: 500 }}>{initialName}</p>
                  {initialDomain && <p style={{ fontSize: 13, color: T.faint, margin: 0 }}>{initialDomain}</p>}
                  <p style={{ fontSize: 13.5, color: T.muted, margin: "12px 0 0", lineHeight: 1.55 }}>{st.memberNotice}</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={card}>
            <div style={head}>{st.yourAccount}</div>
            <div style={body}>
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.55 }}>{st.personalAccountNotice} <a href="/account" style={link}>{st.accountLink}</a> {st.accountLinkTail}</p>
            </div>
          </div>
        )}
        <SalesCard quietDays={quietDays} />
        {isOrg && <WebhooksCard enabled={webhooksEnabled} canManage={canManageOrg} hooks={webhooks} planName={planName} />}
        {isOrg && <ApiKeysCard enabled={apiEnabled} canManage={canManageOrg} keys={apiKeys} planName={planName} />}
        <div style={card}>
          <div style={head}>{st.signedInAs}</div>
          <div style={body}>
            <p style={{ fontSize: 14, color: T.heading, margin: 0 }}>{email}</p>
            <p style={{ fontSize: 13.5, color: T.muted, margin: "8px 0 0", lineHeight: 1.55 }}>{st.managePasswordA} <a href="/account" style={link}>{st.accountLink}</a> {st.managePasswordTail}</p>
          </div>
        </div>
      </main>
    </div>
  );
}