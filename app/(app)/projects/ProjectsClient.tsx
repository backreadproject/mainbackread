"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import { postJson, errMsg } from "@/lib/fetch-json";
type Project = { id: string; name: string; createdAt: string; docCount: number };
export default function ProjectsClient({ projects, orgless, personal = false }: { projects: Project[]; orgless: boolean; personal?: boolean }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const pp = getDict(locale).projectsPage;
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    if (!name.trim()) return;
    setCreating(true); setError("");
    try {
      await postJson("/api/create-project", { name: name.trim() });
      window.location.reload();
    } catch (e) {
      setError(errMsg(e, pp.couldNotCreate));
      setCreating(false);
    }
  }
  const sel = { height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 10px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.body };
  if (orgless) {
    return (
      <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
        <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{pp.title}</h1>
          <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{pp.introOrgless}</p>
          <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, padding: 40, textAlign: "center", marginTop: 26 }}>
            <p style={{ fontSize: 14, color: T.muted, margin: "0 0 16px" }}>{pp.orglessBody}</p>
            <a href="/members" style={{ display: "inline-flex", alignItems: "center", height: 34, background: T.green, color: T.onAccent, fontSize: 13.5, fontWeight: 500, padding: "0 13px", borderRadius: T.rBtn, textDecoration: "none" }}>{pp.goToMembers} &rarr;</a>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-row{transition:background .12s;text-decoration:none;color:inherit}.t-row:hover{background:var(--rp-hover)}.pj-in:focus{outline:none;border-color:var(--rp-green)}`}</style>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{pp.title}</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{personal ? pp.subPersonal : pp.subTeam}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 9, margin: "26px 0 16px" }}>
          <button onClick={() => setShowNew((v) => !v)} style={{ height: 34, background: T.green, color: T.onAccent, fontSize: 13.5, fontWeight: 500, padding: "0 13px", borderRadius: T.rBtn, border: "none", cursor: "pointer", fontFamily: T.font }}>{pp.newProject}</button>
        </div>
        {error && <p style={{ color: T.dangerText, fontSize: 14, marginBottom: 16 }}>{error}</p>}
        {showNew && (
          <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, padding: 14, marginBottom: 16, display: "flex", gap: 9, alignItems: "center" }}>
            <input className="pj-in" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder={pp.projectNamePlaceholder} autoFocus style={{ ...sel, flex: 1 }} />
            <button onClick={create} disabled={creating || !name.trim()} style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: creating || !name.trim() ? 0.5 : 1 }}>{creating ? pp.creating : pp.create}</button>
          </div>
        )}
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr", gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body, whiteSpace: "nowrap" }}>
            <span>{fr ? "Projet" : "Project"}</span><span>{fr ? "Documents" : "Documents"}</span><span>{fr ? "Cr\u00e9\u00e9" : "Created"}</span>
          </div>
          {projects.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{pp.emptyNone}</p></div>
          ) : projects.map((p, i) => (
            <a key={p.id} href={"/projects/" + p.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr", gap: 12, padding: "13px 18px", borderBottom: i < projects.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
              <span className="data-cell dc-title" style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid " + T.border, paddingBottom: 1, justifySelf: "start", maxWidth: "100%" }}>{p.name}</span>
              <span className="data-cell" data-label="Documents" style={{ fontSize: 13.5, color: T.body, fontVariantNumeric: "tabular-nums" }}>{p.docCount}</span>
              <span className="data-cell" data-label="Created" style={{ fontSize: 13.5, color: T.faint, whiteSpace: "nowrap" }}>{new Date(p.createdAt).toLocaleDateString(fr ? "fr-FR" : undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}