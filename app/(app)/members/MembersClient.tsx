"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, microLabel } from "@/lib/theme";

type Member = { id: string; userId: string; email: string | null; role: "owner" | "admin" | "member"; joinedAt: string };
type Org = { id: string; name: string } | null;

export default function MembersClient({ org, role, members: initial }: { org: Org; role: "owner" | "admin" | "member" | null; members: Member[] }) {
  const [members, setMembers] = useState(initial);
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "member">("member");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const canManage = role === "owner" || role === "admin";

  async function createOrg() {
    if (!orgName.trim()) return;
    setCreating(true); setError("");
    const res = await fetch("/api/create-org", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: orgName.trim() }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Could not create organization."); setCreating(false); return; }
    window.location.reload();
  }

  async function addMember() {
    const email = addEmail.trim().toLowerCase();
    if (!email || !org) return;
    setAdding(true); setError("");
    // Look up the user by email via an API (admin) — Stage 4 does full invites.
    // For Stage 3 we add an existing user by email.
    const res = await fetch("/api/add-member", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ organizationId: org.id, email, role: addRole }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Could not add member."); setAdding(false); return; }
    setMembers((prev) => [...prev, json.member]);
    setAddEmail(""); setShowAdd(false); setAdding(false);
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
    return (
      <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
        <main style={{ maxWidth: 560, padding: "26px 30px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>Organization</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 24px" }}>Create an organization to share documents and read your pipeline as a team.</p>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.heading, display: "block", marginBottom: 8 }}>Organization name</span>
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createOrg()} placeholder="Acme Inc." style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 14 }} />
            <button onClick={createOrg} disabled={creating || !orgName.trim()} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: creating || !orgName.trim() ? 0.5 : 1 }}>{creating ? "Creating…" : "Create organization"}</button>
            {error && <p style={{ fontSize: 13, color: "#B42318", marginTop: 12 }}>{error}</p>}
            <p style={{ fontSize: 12, color: T.muted, marginTop: 16, lineHeight: 1.5 }}>Creating an organization moves your account into team mode. You become the owner.</p>
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
    return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: T.rPill, background: bg, color: fg, textTransform: "uppercase", letterSpacing: "0.04em" }}>{r}</span>;
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
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>Members</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>Manage who's in {org.name} and what they can do.</p>
          </div>
          {canManage && <button onClick={() => setShowAdd((v) => !v)} style={{ background: T.darkBtn, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: T.rBtn, border: "none", cursor: "pointer" }}>+ Add member</button>}
        </div>

        {error && <p style={{ color: "#B42318", fontSize: 14, marginBottom: 16 }}>{error}</p>}

        {showAdd && canManage && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 18, marginBottom: 18, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input className="t-in" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="teammate@company.com" style={{ flex: 1, minWidth: 200, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }} />
            <select value={addRole} onChange={(e) => setAddRole(e.target.value as "admin" | "member")} style={{ border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={addMember} disabled={adding || !addEmail.trim()} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: adding || !addEmail.trim() ? 0.5 : 1 }}>{adding ? "Adding…" : "Add"}</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
          {stat("Total members", active)}
          {stat("Owners & admins", admins)}
          {stat("Pending invites", 0)}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
            <span>Member</span><span>Role</span><span>Joined</span><span></span>
          </div>
          {members.map((m, i) => (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 12, padding: "14px 18px", borderBottom: i < members.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{(m.email?.[0] ?? "?").toUpperCase()}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email ?? "Member"}</span>
              </div>
              <span>
                {canManage && m.role !== "owner" ? (
                  <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value as "admin" | "member")} style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "4px 8px", fontSize: 12, fontFamily: T.font, background: "#fff", color: T.body, textTransform: "capitalize" }}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : roleBadge(m.role)}
              </span>
              <span style={{ fontSize: 14, color: T.body }}>{new Date(m.joinedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
              <span style={{ justifySelf: "end" }}>
                {canManage && m.role !== "owner" && (
                  <button onClick={() => removeMember(m.id)} aria-label="Remove member" title="Remove" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: T.muted, lineHeight: 0 }}>
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
