"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, pageHeading } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import WebhooksCard from "./WebhooksCard";
import ApiKeysCard from "./ApiKeysCard";

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
};

export default function SettingsClient({ email, isOrg, canManageOrg, orgId, orgName: initialName, orgDomain: initialDomain, webhooksEnabled, webhooks, planName, apiEnabled, apiKeys }: Props) {
  const locale = useLocale();
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

  const label = { fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 8, display: "block" };
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 22, marginBottom: 16 };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "var(--rp-card)", marginBottom: 12 };

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-b{cursor:pointer}`}</style>
      <main className="set-grid" style={{ maxWidth: 1040, padding: "26px 30px 60px" }}>
        <h1 style={{ ...pageHeading, marginBottom: 20 }}>{st.title}</h1>

        {isOrg ? (
          <div style={card}>
            <span style={label}>{st.organization}</span>
            {canManageOrg ? (
              <>
                <p style={{ fontSize: 13, color: T.body, margin: "0 0 14px", lineHeight: 1.5 }}>{st.orgManageIntro}</p>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>{st.name}</span>
                <input className="t-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." style={input} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>{st.domain} <span style={{ fontWeight: 400 }}>{st.optional}</span></span>
                <input className="t-in" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" style={input} />
                <button onClick={saveOrg} disabled={busy} className="t-b" style={{ background: T.green, color: "var(--rp-on-accent)", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, opacity: busy ? 0.5 : 1 }}>{busy ? st.saving : st.saveChanges}</button>
                {msg && <p style={{ fontSize: 13, color: msgOk ? T.greenText : "var(--rp-danger-text)", marginTop: 12 }}>{msg}</p>}
              </>
            ) : (
              <>
                <p style={{ fontSize: 15, color: T.heading, margin: "0 0 4px", fontWeight: 600 }}>{initialName}</p>
                {initialDomain && <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{initialDomain}</p>}
                <p style={{ fontSize: 13, color: T.body, margin: "10px 0 0", lineHeight: 1.5 }}>{st.memberNotice}</p>
              </>
            )}
          </div>
        ) : (
          <div style={card}>
            <span style={label}>{st.yourAccount}</span>
            <p style={{ fontSize: 13, color: T.body, margin: 0, lineHeight: 1.5 }}>{st.personalAccountNotice} <a href="/account" style={{ color: T.green, textDecoration: "none", fontWeight: 600 }}>{st.accountLink}</a> {st.accountLinkTail}</p>
          </div>
        )}

        {isOrg && <WebhooksCard enabled={webhooksEnabled} canManage={canManageOrg} hooks={webhooks} planName={planName} />}
        {isOrg && <ApiKeysCard enabled={apiEnabled} canManage={canManageOrg} keys={apiKeys} planName={planName} />}

        <div style={card}>
          <span style={label}>{st.signedInAs}</span>
          <p style={{ fontSize: 15, color: T.heading, margin: 0 }}>{email}</p>
          <p style={{ fontSize: 13, color: T.body, margin: "8px 0 0" }}>{st.managePasswordA} <a href="/account" style={{ color: T.green, textDecoration: "none", fontWeight: 600 }}>{st.accountLink}</a> {st.managePasswordTail}</p>
        </div>
      </main>
    </div>
  );
}









