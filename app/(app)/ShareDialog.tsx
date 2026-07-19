"use client";

import { useState, useEffect } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

type Member = { userId: string; email: string | null };
type Share = { id: string; granteeType: string; granteeId: string; label: string; permission: string };

export default function ShareDialog({ resourceType, resourceId, resourceName, members, onClose }: {
  resourceType: "document" | "project";
  resourceId: string;
  resourceName: string;
  members: Member[];
  onClose: () => void;
}) {
  const locale = useLocale();
  const sd = getDict(locale).shareDialog;
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [granteeType, setGranteeType] = useState<"user" | "role">("user");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [permission, setPermission] = useState<"view" | "edit" | "manage">("view");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/grants?resourceType=${resourceType}&resourceId=${resourceId}`);
    const json = await res.json();
    setShares(json.shares ?? []);
    setLoading(false);
  }

  async function addShare() {
    setError("");
    if (granteeType === "user" && !userId) { setError(sd.pickMember); return; }
    setBusy(true);
    const body = { resourceType, resourceId, granteeType, granteeId: granteeType === "user" ? userId : role, permission };
    const res = await fetch("/api/grants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? sd.couldNotShare); setBusy(false); return; }
    setUserId(""); setBusy(false);
    load();
  }

  async function revoke(grantId: string) {
    const res = await fetch("/api/grants", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ grantId, resourceType, resourceId }) });
    if (res.ok) setShares((prev) => prev.filter((s) => s.id !== grantId));
  }

  const permLabels: Record<string, string> = { view: sd.permView, edit: sd.permEdit, manage: sd.permManage };
  const permBadge = (p: string) => {
    const map: Record<string, [string, string]> = { view: [T.pillNeutralBg, T.body], edit: ["#EEF4FF", "#3538CD"], manage: [T.greenSoft, T.greenText] };
    const [bg, fg] = map[p] ?? map.view;
    return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: T.rPill, background: bg, color: fg }}>{permLabels[p] ?? p}</span>;
  };

  const sel = { border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 11px", fontSize: 14, fontFamily: T.font, background: "#fff", color: T.heading };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,41,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: 480, maxWidth: "100%", fontFamily: T.font, letterSpacing: T.tracking, maxHeight: "85vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: T.heading, margin: "0 0 4px", letterSpacing: T.trackingTight }}>{sd.title}</h3>
        <p style={{ fontSize: 14, color: T.body, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resourceName}</p>
        <p style={{ fontSize: 12, color: T.muted, margin: "0 0 20px", lineHeight: 1.5 }}>{sd.introA}{resourceType === "project" ? sd.introBProject : sd.introBDoc}{sd.introC}</p>

        {/* Add a share */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <select value={granteeType} onChange={(e) => setGranteeType(e.target.value as "user" | "role")} style={sel}>
            <option value="user">{sd.aMember}</option>
            <option value="role">{sd.aRole}</option>
          </select>
          {granteeType === "user" ? (
            <select value={userId} onChange={(e) => setUserId(e.target.value)} style={{ ...sel, flex: 1, minWidth: 140 }}>
              <option value="">{sd.chooseMember}</option>
              {members.map((m) => <option key={m.userId} value={m.userId}>{m.email ?? sd.memberFallback}</option>)}
            </select>
          ) : (
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")} style={{ ...sel, flex: 1, minWidth: 140 }}>
              <option value="member">{sd.allMembers}</option>
              <option value="admin">{sd.allAdmins}</option>
            </select>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <select value={permission} onChange={(e) => setPermission(e.target.value as "view" | "edit" | "manage")} style={{ ...sel, flex: 1 }}>
            <option value="view">{sd.canView}</option>
            <option value="edit">{sd.canEdit}</option>
            <option value="manage">{sd.canManage}</option>
          </select>
          <button onClick={addShare} disabled={busy} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{sd.share}</button>
        </div>
        {error && <p style={{ fontSize: 13, color: "#B42318", margin: "6px 0 0" }}>{error}</p>}

        {/* Current shares */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{sd.peopleWithAccess}</div>
          {loading ? (
            <p style={{ fontSize: 14, color: T.muted }}>{sd.loading}</p>
          ) : shares.length === 0 ? (
            <p style={{ fontSize: 14, color: T.body }}>{sd.onlyYou}</p>
          ) : (
            shares.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{(s.label[0] ?? "?").toUpperCase()}</div>
                <span style={{ fontSize: 14, color: T.heading, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                {permBadge(s.permission)}
                <button onClick={() => revoke(s.id)} aria-label={sd.revoke} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: T.muted, lineHeight: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18 M6 6l12 12" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
          <button onClick={onClose} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "9px 18px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>{sd.done}</button>
        </div>
      </div>
    </div>
  );
}
