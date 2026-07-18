"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, pageHeading } from "@/lib/theme";

type Props = {
  email: string;
  isOrg: boolean;
  canManageOrg: boolean;
  orgId: string | null;
  orgName: string;
  orgDomain: string;
};

export default function SettingsClient({ email, isOrg, canManageOrg, orgId, orgName: initialName, orgDomain: initialDomain }: Props) {
  const [name, setName] = useState(initialName);
  const [domain, setDomain] = useState(initialDomain);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);

  async function saveOrg() {
    if (!orgId) return;
    if (!name.trim()) { setMsg("Organization name can't be empty."); return; }
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = await supabase.from("organizations").update({ name: name.trim(), domain: domain.trim() || null }).eq("id", orgId);
    setMsg(error ? error.message : "Saved."); setBusy(false);
  }

  const label = { fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 8, display: "block" };
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 22, marginBottom: 16 };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 };

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-b{cursor:pointer}`}</style>
      <main style={{ maxWidth: 560, padding: "26px 30px" }}>
        <h1 style={{ ...pageHeading, marginBottom: 20 }}>Settings</h1>

        {isOrg ? (
          <div style={card}>
            <span style={label}>Organization</span>
            {canManageOrg ? (
              <>
                <p style={{ fontSize: 13, color: T.body, margin: "0 0 14px", lineHeight: 1.5 }}>Your organization name and domain. The name appears on shared documents and prospect emails.</p>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Name</span>
                <input className="t-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." style={input} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Domain <span style={{ fontWeight: 400 }}>(optional)</span></span>
                <input className="t-in" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" style={input} />
                <button onClick={saveOrg} disabled={busy} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, opacity: busy ? 0.5 : 1 }}>{busy ? "Saving…" : "Save changes"}</button>
                {msg && <p style={{ fontSize: 13, color: msg === "Saved." ? T.greenText : "#B42318", marginTop: 12 }}>{msg}</p>}
              </>
            ) : (
              <>
                <p style={{ fontSize: 15, color: T.heading, margin: "0 0 4px", fontWeight: 600 }}>{initialName}</p>
                {initialDomain && <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{initialDomain}</p>}
                <p style={{ fontSize: 13, color: T.body, margin: "10px 0 0", lineHeight: 1.5 }}>You're a member of this organization. Only owners and admins can change its details.</p>
              </>
            )}
          </div>
        ) : (
          <div style={card}>
            <span style={label}>Your account</span>
            <p style={{ fontSize: 13, color: T.body, margin: 0, lineHeight: 1.5 }}>You're on a personal account. Manage your name and photo on the <a href="/account" style={{ color: T.green, textDecoration: "none", fontWeight: 600 }}>Account</a> page.</p>
          </div>
        )}

        <div style={card}>
          <span style={label}>Signed in as</span>
          <p style={{ fontSize: 15, color: T.heading, margin: 0 }}>{email}</p>
          <p style={{ fontSize: 13, color: T.body, margin: "8px 0 0" }}>Manage your password on the <a href="/account" style={{ color: T.green, textDecoration: "none", fontWeight: 600 }}>Account</a> page.</p>
        </div>
      </main>
    </div>
  );
}
