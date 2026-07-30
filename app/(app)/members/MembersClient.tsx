"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { trialInfo } from "@/lib/trial";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import { postJson, fetchJson, errMsg } from "@/lib/fetch-json";
type Member = { id: string; userId: string; email: string | null; firstName?: string; lastName?: string; avatarUrl?: string | null; role: "owner" | "admin" | "member"; joinedAt: string };
type Org = { id: string; name: string } | null;
type Invite = { id: string; email: string; firstName: string; lastName: string; role: "admin" | "member"; createdAt: string; expiresAt: string };
type Tone = "green" | "amber" | "indigo" | "neutral";
export default function MembersClient({ org, role, members: initial, invites: initialInvites = [], accountType = "personal", trialStartedAt = null }: { org: Org; role: "owner" | "admin" | "member" | null; members: Member[]; invites?: Invite[]; accountType?: "personal" | "organization"; trialStartedAt?: string | null }) {
  const locale = useLocale();
  const fr = locale === "fr";
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
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
  const input = { width: "100%", height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading };
  const btn = { height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", whiteSpace: "nowrap" as const };
  const field = { fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 };
  async function createOrg() {
    if (!orgName.trim()) return;
    setCreating(true); setError("");
    try {
      await postJson("/api/create-org", { name: orgName.trim(), domain: orgDomain.trim(), migrateDocuments });
      window.location.reload();
    } catch (e) {
      setError(errMsg(e, mp.couldNotCreateOrg));
      setCreating(false);
    }
  }
  async function lookupName() {
    const email = iEmail.trim().toLowerCase();
    if (!email || iFirst || iLast) return;
    // Auto-fill name if this email already has a ReadProspects account.
    try {
      const d = await fetchJson<{ found?: boolean; firstName?: string; lastName?: string }>("/api/lookup-user?email=" + encodeURIComponent(email), {}, 15000);
      if (d.found) { if (d.firstName) setIFirst(d.firstName); if (d.lastName) setILast(d.lastName); }
    } catch {}
  }
  async function sendInvite() {
    const email = iEmail.trim().toLowerCase();
    if (!email || !iFirst.trim() || !iLast.trim() || !org) { setError(mp.nameEmailRequired); return; }
    setAdding(true); setError(""); setInviteNote("");
    try {
      const json = await postJson<{ addedDirectly?: boolean; emailSent?: boolean; emailWarning?: string; invite?: { id?: string } }>("/api/create-invite", { email, firstName: iFirst.trim(), lastName: iLast.trim(), role: iRole });
      if (json.addedDirectly) { setInviteNote(mp.addedDirectly); window.location.reload(); return; }
      if (json.emailSent) setInviteNote(mp.inviteSent);
      else setInviteNote(json.emailWarning ?? mp.inviteCreated);
      setIEmail(""); setIFirst(""); setILast("");
      setInvites((prev) => [{ id: json.invite?.id ?? Math.random().toString(), email, firstName: iFirst.trim(), lastName: iLast.trim(), role: iRole, createdAt: new Date().toISOString(), expiresAt: "" }, ...prev]);
    } catch (e) {
      setError(errMsg(e, mp.couldNotSendInvite));
    } finally {
      setAdding(false);
    }
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
  // ---- No org yet ----
  if (!org) {
    const isCompany = accountType === "organization";
    const trial = trialInfo(trialStartedAt);
    if (!isCompany) {
      return (
        <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
          <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{mp.orgTitle}</h1>
            <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{mp.orgPartOfCompany}</p>
            <div style={{ ...card, padding: 40, textAlign: "center", marginTop: 26 }}>
              <p style={{ fontSize: 14, color: T.heading, margin: "0 0 6px" }}>{mp.onPersonal}</p>
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.55 }}>{mp.personalUnlock}</p>
            </div>
          </main>
        </div>
      );
    }
    return (
      <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
        <style>{`.t-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
        <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{mp.setupTitle}</h1>
          <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{mp.setupSub}</p>
          {trial.started && trial.active && (
            <div style={{ background: T.greenSoft, border: "1px solid " + T.greenBorder, borderRadius: T.rCard, padding: "11px 15px", margin: "20px 0 0", fontSize: 13.5, color: T.greenText }}>
              {mp.trialActivePrefix} {trial.daysLeft} {trial.daysLeft === 1 ? mp.trialDay : mp.trialDays} {mp.trialLeft}
            </div>
          )}
          <div style={{ ...card, marginTop: 20 }}>
            <div style={head}>{mp.createOrg}</div>
            <div style={{ padding: 18 }}>
              <span style={field}>{mp.orgName}</span>
              <input className="t-in" value={orgName} onChange={(e) => setOrgName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createOrg()} placeholder={mp.orgNamePlaceholder} style={{ ...input, marginBottom: 12 }} />
              <span style={field}>{mp.companyDomain} <span style={{ color: T.faint }}>{mp.optional}</span></span>
              <input className="t-in" value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} placeholder={mp.domainPlaceholder} style={{ ...input, marginBottom: 14 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer", fontSize: 13.5, color: T.body }}>
                <input type="checkbox" checked={migrateDocuments} onChange={(e) => setMigrateDocuments(e.target.checked)} style={{ width: 15, height: 15, accentColor: T.green, cursor: "pointer" }} />
                {mp.migrateDocs}
              </label>
              <button onClick={createOrg} disabled={creating || !orgName.trim()} style={{ ...btn, opacity: creating || !orgName.trim() ? 0.5 : 1 }}>{creating ? mp.creating : mp.createOrg}</button>
              {error && <p style={{ fontSize: 13, color: T.dangerText, margin: "12px 0 0" }}>{error}</p>}
              <p style={{ fontSize: 12.5, color: T.faint, margin: "16px 0 0", lineHeight: 1.55 }}>{mp.createOrgNote}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }  // ---- Org exists: roster ----
  const active = members.length;
  const admins = members.filter((m) => m.role === "owner" || m.role === "admin").length;
  const toneRule: Record<Tone, string> = { green: T.green, amber: T.amber, indigo: T.indigo, neutral: T.border };
  const roleLabel = (r: string) => {
    const map: Record<string, string> = { owner: fr ? "propri\u00e9taire" : "owner", admin: "admin", member: fr ? "membre" : "member" };
    return map[r] ?? r;
  };
  const roleDot = (r: string) => (r === "owner" ? T.green : r === "admin" ? T.indigo : T.faint);
  const cells: [number, string, Tone][] = [
    [active, mp.statTotalMembers, "green"],
    [admins, mp.statOwnersAdmins, "indigo"],
    [invites.length, mp.statPendingInvites, invites.length > 0 ? "amber" : "neutral"],
  ];
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{outline:none;border-color:var(--rp-green)}.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}`}</style>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{mp.title}</h1>
            <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{mp.manageWho} {org.name} {mp.manageWhat}</p>
          </div>
          {canManage && <button onClick={() => setShowAdd((v) => !v)} style={btn}>{mp.inviteMember}</button>}
        </div>
        {error && <p style={{ color: T.dangerText, fontSize: 14, margin: "16px 0 0" }}>{error}</p>}
        {showAdd && canManage && (
          <div style={{ ...card, marginTop: 20 }}>
            <div style={head}>{mp.inviteTeammate}</div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 9, marginBottom: 9 }}>
                <input className="t-in" value={iFirst} onChange={(e) => setIFirst(e.target.value)} placeholder={mp.firstName} style={{ ...input, flex: 1 }} />
                <input className="t-in" value={iLast} onChange={(e) => setILast(e.target.value)} placeholder={mp.lastName} style={{ ...input, flex: 1 }} />
              </div>
              <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <input className="t-in" value={iEmail} onChange={(e) => setIEmail(e.target.value)} onBlur={lookupName} placeholder={mp.emailPlaceholder} style={{ ...input, flex: 1 }} />
                <select value={iRole} onChange={(e) => setIRole(e.target.value as "admin" | "member")} style={{ ...input, width: 140, flex: "none" }}>
                  <option value="member">{mp.roleMember}</option>
                  <option value="admin">{mp.roleAdmin}</option>
                </select>
                <button onClick={sendInvite} disabled={adding || !iEmail.trim() || !iFirst.trim() || !iLast.trim()} style={{ ...btn, opacity: adding || !iEmail.trim() || !iFirst.trim() || !iLast.trim() ? 0.5 : 1 }}>{adding ? mp.sending : mp.sendInvite}</button>
              </div>
              {inviteNote && <p style={{ fontSize: 13, color: (inviteNote === mp.inviteSent || inviteNote === mp.addedDirectly) ? T.greenText : T.muted, margin: "12px 0 0" }}>{inviteNote}</p>}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, marginTop: 26 }} className="stat-strip">
          {cells.map(([v, l, tone], i) => (
            <div key={i} style={{ padding: "15px 18px", borderLeft: "3px solid " + toneRule[tone] }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        {invites.length > 0 && (
          <div style={{ ...card, marginTop: 18 }}>
            <div style={head}>{mp.pendingInvitations}</div>
            {invites.map((inv, i) => (
              <div key={inv.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 40px", gap: 12, padding: "13px 18px", borderBottom: i < invites.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.firstName} {inv.lastName}</div>
                  <div style={{ fontSize: 12.5, color: T.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.email}</div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.heading, justifySelf: "start", whiteSpace: "nowrap" }}>
                  <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.amber }} />
                  {mp.pending} &middot; {roleLabel(inv.role)}
                </span>
                {canManage && <button onClick={() => revokeInvite(inv.id)} aria-label={mp.revoke} title={mp.revoke} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.faint, justifySelf: "end", lineHeight: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18 M6 6l12 12" /></svg></button>}
              </div>
            ))}
          </div>
        )}
        <div style={{ ...card, marginTop: 18 }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>{mp.colMember}</span><span>{mp.colRole}</span><span>{mp.colJoined}</span><span></span>
          </div>
          {members.map((m, i) => (
            <div key={m.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 12, padding: "13px 18px", borderBottom: i < members.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
              <div className="data-cell dc-title" style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 4, border: "1px solid " + T.border, background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0, overflow: "hidden" }}>{m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ((m.firstName?.[0] ?? "").toUpperCase() + (m.lastName?.[0] ?? "").toUpperCase()) || (m.email?.[0] ?? "?").toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  {(m.firstName || m.lastName) && <div style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(m.firstName ?? "") + " " + (m.lastName ?? "")}</div>}
                  <div style={{ fontSize: (m.firstName || m.lastName) ? 12.5 : 13.5, fontWeight: (m.firstName || m.lastName) ? 400 : 500, color: (m.firstName || m.lastName) ? T.faint : T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email ?? mp.memberFallback}</div>
                </div>
              </div>
              <span className="data-cell" data-label={mp.colRole}>
                {canManage && m.role !== "owner" ? (
                  <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value as "admin" | "member")} style={{ height: 28, boxSizing: "border-box", border: "1px solid " + T.border, borderRadius: 4, padding: "0 7px", fontSize: 12.5, fontFamily: T.font, background: T.card, color: T.body }}>
                    <option value="member">{mp.roleMember}</option>
                    <option value="admin">{mp.roleAdmin}</option>
                  </select>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: T.heading, whiteSpace: "nowrap" }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: roleDot(m.role) }} />
                    {roleLabel(m.role)}
                  </span>
                )}
              </span>
              <span className="data-cell" data-label={mp.colJoined} style={{ fontSize: 13.5, color: T.faint, whiteSpace: "nowrap" }}>{new Date(m.joinedAt).toLocaleDateString(fr ? "fr-FR" : undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              <span style={{ justifySelf: "end" }}>
                {canManage && m.role !== "owner" && (
                  <button onClick={() => removeMember(m.id)} aria-label={mp.removeMember} title={mp.remove} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.faint, lineHeight: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
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