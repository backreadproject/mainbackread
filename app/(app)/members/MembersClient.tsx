"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, microLabel } from "@/lib/theme";
import { trialInfo } from "@/lib/trial";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

type Member = { id: string; userId: string; email: string | null; firstName?: string; lastName?: string; avatarUrl?: string | null; role: "owner" | "admin" | "member"; joinedAt: string };
type Org = { id: string; name: string } | null;
type Invite = { id: string; email: string; firstName: string; lastName: string; role: "admin" | "member"; createdAt: string; expiresAt: string };

export default function MembersClient({ org, role, members: initial, invites: initialInvites = [], accountType = "personal", trialStartedAt = null }: { org: Org; role: "owner" | "admin" | "member" | null; members: Member[]; invites?: Invite[]; accountType?: "personal" | "company" | "organization"; trialStartedAt?: string | null }) {
  const locale = useLocale();
  const mp = getDict(locale).membersPage;
  const [members, setMembers] = useState(initial);
  const [orgName, setOrgName] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [migrateDocuments, setMigrateDocuments] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [invites, setInvites] = useState(initialInvites);
  const [iEmail, setIEmail] = useState("");
  const [iFirst, setIFirst] = useState("");
  const [iLast, setILast] = useState("");
  const [iRole, setIRole] = useState<"admin" | "member">("member");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [inviteNote, setInviteNote] = useState("");

  const canManage = role === "owner" || role === "admin";

  async function createOrg() {
    if (!orgName.trim()) return;
    setCreating(true); setError("");
    const res = await fetch("/api/create-org", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: orgName.trim(), domain: orgDomain.trim(), migrateDocuments }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? mp.couldNotCreateOrg); setCreating(false); return; }
    window.location.reload();
  }

  async function lookupName() {
    const email = iEmail.trim().toLowerCase();
    if (!email || iFirst || iLast) return;
    // Auto-fill name if this email already has a BackRead account.
    try {
      const res = await fetch(`/api/lookup-user?email=${encodeURIComponent(email)}`);
      const d = await res.json();
      if (d.found) { if (d.firstName) setIFirst(d.firstName); if (d.lastName) setILast(d.lastName); }
    } catch {}
  }

  async function sendInvite() {
    const email = iEmail.trim().toLowerCase();
    if (!email || !iFirst.trim() || !iLast.trim() || !org) { setError(mp.nameEmailRequired); return; }
    setAdding(true); setError(""); setInviteNote("");
    const res = await fetch("/api/create-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, firstName: iFirst.trim(), lastName: iLast.trim(), role: iRole }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? mp.couldNotSendInvite); setAdding(false); return; }
    if (json.addedDirectly) {
      setInviteNote(mp.addedDirectly);
      window.location.reload();
      return;
    }
    if (json.emailSent) setInviteNote(mp.inviteSent);
    else setInviteNote(json.emailWarning ?? mp.inviteCreated);
    setIEmail(""); setIFirst(""); setILast("");
    // Refresh invites list from server on next load; optimistically add.
    setInvites((prev) => [{ id: json.invite?.id ?? Math.random().toString(), email, firstName: iFirst.trim(), lastName: iLast.trim(), role: iRole, createdAt: new Date().toISOString(), expiresAt: "" }, ...prev]);
    setAdding(false);
  }

  async function revokeInvite(id: string) {
    const res = await fetch("/api/revoke-invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inviteId: id }) });
    if (res.ok) setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  async function changeRole(memberId: string, newRole: "admin" | "member") {
    const supabase = createClient();
    const { error } = await supabase.from("organization_members").update({ role: newRole }).eq("id", memberId);
    if (error) { setError(error.message); return; }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
  }

  async function removeMember(memberId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
    if (error) { setError(error.message); return; }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  // ---- No org yet: create-org state ----
  if (!org) {
    const isCompany = accountType === "company" || accountType === "organization";
    const trial = trialInfo(trialStartedAt);
    if (!isCompany) {
      return (
        <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
          <main style={{ maxWidth: 560, padding: "26px 30px" }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{mp.orgTitle}</h1>
            <p style={{ fontSize: 14, color: T.body, margin: "0 0 24px" }}>{mp.orgPartOfCompany}</p>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 32, textAlign: "center" }}>
              <p style={{ fontSize: 15, color: T.body, margin: "0 0 8px" }}>{mp.onPersonal}</p>
              <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.5 }}>{mp.personalUnlock}</p>
            </div>
          </main>
        </div>
      );
    }
    return (
      <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
        <main style={{ maxWidth: 560, padding: "26px 30px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{mp.setupTitle}</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 16px" }}>{mp.setupSub}</p>
          {trial.started && trial.active && <div style={{ background: T.greenSoft, border: "1px solid #C7EBD8", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: T.greenText }}>{mp.trialActivePrefix} {trial.daysLeft} {trial.daysLeft === 1 ? mp.trialDay : mp.trialDays} {mp.trialLeft}</div>}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 8 }}>{mp.orgName}</span>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createOrg()} placeholder={mp.orgNamePlaceholder} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 8 }}>{mp.companyDomain} <span style={{ fontWeight: 400, color: T.muted }}>{mp.optional}</span></span>
            <input value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} placeholder={mp.domainPlaceholder} style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 14 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, cursor: "pointer", fontSize: 14, color: T.body }}>
              <input type="checkbox" checked={migrateDocuments} onChange={(e) => setMigrateDocuments(e.target.checked)} style={{ width: 16, height: 16, accentColor: T.green, cursor: "pointer" }} />
              {mp.migrateDocs}
            </label>
            <button onClick={createOrg} disabled={creating || !orgName.trim()} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: creating || !orgName.trim() ? 0.5 : 1 }}>{creating ? mp.creating : mp.createOrg}</button>
            {error && <p style={{ fontSize: 13, color: "#B42318", marginTop: 12 }}>{error}</p>}
            <p style={{ fontSize: 12, color: T.muted, marginTop: 16, lineHeight: 1.5 }}>{mp.createOrgNote}</p>
          </div>
        </main>
      </div>
    );
  }

  // ---- Org exists: roster ----
  const active = members.length;
  const admins = members.filter((m) => m.role === "owner" || m.role === "admin").length;
  const roleBadge = (r: string) => {
    const map: Record<string, [string, string]> = { owner: [T.greenSoft, T.greenText], admin: ["#EEF4FF", "#3538CD"], member: [T.pillNeutralBg, T.body] };
    const [bg, fg] = map[r] ?? map.member;
    const roleLabel: Record<string, string> = { owner: locale === "fr" ? "propriétaire" : "owner", admin: locale === "fr" ? "admin" : "admin", member: locale === "fr" ? "membre" : "member" };
    return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: bg, color: fg, textTransform: "uppercase", letterSpacing: "0.04em" }}>{roleLabel[r] ?? r}</span>;
  };
  const stat = (label: string, value: number) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 18 }}>
      <div style={{ ...microLabel, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight }}>{value}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}`}</style>
      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{mp.title}</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{mp.manageWho} {org.name} {mp.manageWhat}</p>
          </div>
          {canManage && <button onClick={() => setShowAdd((v) => !v)} style={{ background: T.darkBtn, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: T.rBtn, border: "none", cursor: "pointer" }}>{mp.inviteMember}</button>}
        </div>

        {error && <p style={{ color: "#B42318", fontSize: 14, marginBottom: 16 }}>{error}</p>}

        {showAdd && canManage && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, marginBottom: 12 }}>{mp.inviteTeammate}</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input className="t-in" value={iFirst} onChange={(e) => setIFirst(e.target.value)} placeholder={mp.firstName} style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }} />
              <input className="t-in" value={iLast} onChange={(e) => setILast(e.target.value)} placeholder={mp.lastName} style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input className="t-in" value={iEmail} onChange={(e) => setIEmail(e.target.value)} onBlur={lookupName} placeholder={mp.emailPlaceholder} style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }} />
              <select value={iRole} onChange={(e) => setIRole(e.target.value as "admin" | "member")} style={{ border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }}>
                <option value="member">{mp.roleMember}</option>
                <option value="admin">{mp.roleAdmin}</option>
              </select>
              <button onClick={sendInvite} disabled={adding || !iEmail.trim() || !iFirst.trim() || !iLast.trim()} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", whiteSpace: "nowrap", opacity: adding || !iEmail.trim() || !iFirst.trim() || !iLast.trim() ? 0.5 : 1 }}>{adding ? mp.sending : mp.sendInvite}</button>
            </div>
            {inviteNote && <p style={{ fontSize: 13, color: (inviteNote === mp.inviteSent || inviteNote === mp.addedDirectly) ? T.greenText : T.body, margin: "10px 0 0" }}>{inviteNote}</p>}
          </div>
        )}

        {invites.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden", marginBottom: 18 }}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 600, color: T.heading }}>{mp.pendingInvitations}</div>
            {invites.map((inv, i) => (
              <div key={inv.id} className="data-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 40px", gap: 12, padding: "12px 18px", borderBottom: i < invites.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{inv.firstName} {inv.lastName}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{inv.email}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: "#FEF0C7", color: "#B54708", textTransform: "uppercase", letterSpacing: "0.04em", justifySelf: "start" }}>{mp.pending} &middot; {inv.role}</span>
                {canManage && <button onClick={() => revokeInvite(inv.id)} aria-label={mp.revoke} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.muted, justifySelf: "end", lineHeight: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18 M6 6l12 12" /></svg></button>}
              </div>
            ))}
          </div>
        )}

        <div className="stat-grid-3" style={{ marginBottom: 22 }}>
          {stat(mp.statTotalMembers, active)}
          {stat(mp.statOwnersAdmins, admins)}
          {stat(mp.statPendingInvites, invites.length)}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden" }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
            <span>{mp.colMember}</span><span>{mp.colRole}</span><span>{mp.colJoined}</span><span></span>
          </div>
          {members.map((m, i) => (
            <div key={m.id} className="data-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 12, padding: "14px 18px", borderBottom: i < members.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
              <div className="data-cell dc-title" style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : `${(m.firstName?.[0] ?? "").toUpperCase()}${(m.lastName?.[0] ?? "").toUpperCase()}` || (m.email?.[0] ?? "?").toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  {(m.firstName || m.lastName) && <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()}</div>}
                  <div style={{ fontSize: (m.firstName || m.lastName) ? 12 : 14, fontWeight: (m.firstName || m.lastName) ? 400 : 600, color: (m.firstName || m.lastName) ? T.muted : T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email ?? mp.memberFallback}</div>
                </div>
              </div>
              <span className="data-cell" data-label={mp.colRole}>
                {canManage && m.role !== "owner" ? (
                  <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value as "admin" | "member")} style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "4px 8px", fontSize: 12, fontFamily: T.font, background: "#fff", color: T.body, textTransform: "capitalize" }}>
                    <option value="member">{mp.roleMember}</option>
                    <option value="admin">{mp.roleAdmin}</option>
                  </select>
                ) : roleBadge(m.role)}
              </span>
              <span className="data-cell" data-label={mp.colJoined} style={{ fontSize: 14, color: T.body }}>{new Date(m.joinedAt).toLocaleDateString(locale === "fr" ? "fr-FR" : undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              <span style={{ justifySelf: "end" }}>
                {canManage && m.role !== "owner" && (
                  <button onClick={() => removeMember(m.id)} aria-label={mp.removeMember} title={mp.remove} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.muted, lineHeight: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
