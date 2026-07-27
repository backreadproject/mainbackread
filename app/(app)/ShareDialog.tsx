"use client";
import { useState, useEffect } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import { fetchJson, postJson, errMsg } from "@/lib/fetch-json";
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
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [granteeType, setGranteeType] = useState<"user" | "role">("user");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [permission, setPermission] = useState<"view" | "edit" | "manage">("view");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  // A silent failure here is dangerous: an empty list reads as "nobody has
  // access" when the truth may be the opposite. Say so instead of guessing.
  async function load() {
    setLoading(true); setLoadError("");
    try {
      const json = await fetchJson<{ shares?: Share[] }>("/api/grants?resourceType=" + resourceType + "&resourceId=" + resourceId, {}, 20000);
      setShares(json.shares ?? []);
    } catch (e) {
      setLoadError(errMsg(e, "Could not load who has access."));
    } finally {
      setLoading(false);
    }
  }
  async function addShare() {
    setError("");
    if (granteeType === "user" && !userId) { setError(sd.pickMember); return; }
    setBusy(true);
    try {
      await postJson("/api/grants", { resourceType, resourceId, granteeType, granteeId: granteeType === "user" ? userId : role, permission });
      setUserId("");
      load();
    } catch (e) {
      setError(errMsg(e, sd.couldNotShare));
    } finally {
      setBusy(false);
    }
  }
  async function revoke(grantId: string) {
    setError("");
    try {
      await fetchJson("/api/grants", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ grantId, resourceType, resourceId }) }, 20000);
      setShares((prev) => prev.filter((s) => s.id !== grantId));
    } catch (e) {
      setError(errMsg(e, "Could not revoke that."));
    }
  }
  const permLabels: Record<string, string> = { view: sd.permView, edit: sd.permEdit, manage: sd.permManage };
  const permDot: Record<string, string> = { view: T.faint, edit: T.indigo, manage: T.green };
  const perm = (p: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.heading, whiteSpace: "nowrap", flex: "none" }}>
      <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: permDot[p] ?? T.faint }} />
      {permLabels[p] ?? p}
    </span>
  );
  const sel = { height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 10px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading };
  const errBox = { background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, lineHeight: 1.5 };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: T.scrim, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, width: 480, maxWidth: "100%", fontFamily: T.font, letterSpacing: T.tracking, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body }}>{sd.title}</div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 13.5, color: T.heading, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resourceName}</p>
          <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 18px", lineHeight: 1.55 }}>{sd.introA}{resourceType === "project" ? sd.introBProject : sd.introBDoc}{sd.introC}</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <select value={granteeType} onChange={(e) => setGranteeType(e.target.value as "user" | "role")} style={sel}>
              <option value="user">{sd.aMember}</option>
              <option value="role">{sd.aRole}</option>
            </select>
            {granteeType === "user" ? (
              members.length === 0 ? (
                <span style={{ flex: 1, minWidth: 140, fontSize: 12.5, color: T.muted, lineHeight: 1.5, alignSelf: "center" }}>{sd.noOtherMembers}</span>
              ) : (
                <select value={userId} onChange={(e) => setUserId(e.target.value)} style={{ ...sel, flex: 1, minWidth: 140 }}>
                  <option value="">{sd.chooseMember}</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.email ?? sd.memberFallback}</option>)}
                </select>
              )
            ) : (
              <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")} style={{ ...sel, flex: 1, minWidth: 140 }}>
                <option value="member">{sd.allMembers}</option>
                <option value="admin">{sd.allAdmins}</option>
              </select>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={permission} onChange={(e) => setPermission(e.target.value as "view" | "edit" | "manage")} style={{ ...sel, flex: 1 }}>
              <option value="view">{sd.canView}</option>
              <option value="edit">{sd.canEdit}</option>
              <option value="manage">{sd.canManage}</option>
            </select>
            <button onClick={addShare} disabled={busy} style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{sd.share}</button>
          </div>
          {error && <div style={{ ...errBox, marginTop: 12 }}>{error}</div>}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.body, marginBottom: 10 }}>{sd.peopleWithAccess}</div>
            {loadError ? (
              <div style={errBox}>{loadError}</div>
            ) : loading ? (
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>{sd.loading}</p>
            ) : shares.length === 0 ? (
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0 }}>{sd.onlyYou}</p>
            ) : (
              <div style={{ border: "1px solid " + T.border, borderRadius: T.rCard }}>
                {shares.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderBottom: i < shares.length - 1 ? "1px solid " + T.borderSoft : "none" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 4, border: "1px solid " + T.border, background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{(s.label[0] ?? "?").toUpperCase()}</div>
                    <span style={{ fontSize: 13.5, color: T.heading, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                    {perm(s.permission)}
                    <button onClick={() => revoke(s.id)} aria-label={sd.revoke} title={sd.revoke} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: T.faint, lineHeight: 0, flex: "none" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18 M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={onClose} style={{ height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>{sd.done}</button>
          </div>
        </div>
      </div>
    </div>
  );
}