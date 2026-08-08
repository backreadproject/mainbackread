"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import ShareDialog from "@/app/(app)/ShareDialog";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import ProjectProfileBand, { type ProfileOption, type Counts } from "./ProjectProfileBand";
type Project = { id: string; name: string; created_at: string };
type Doc = { id: string; title: string; created_at: string };
type Member = { userId: string; email: string | null };
export default function ProjectDetailClient({ project, documents, canManage, members, profiles, attached, counts }: { project: Project; documents: Doc[]; canManage: boolean; members: Member[]; profiles: ProfileOption[]; attached: ProfileOption | null; counts: Counts }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const pd = getDict(locale).projectDetailPage;
  const [sharing, setSharing] = useState(false);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-row{transition:background .12s;text-decoration:none;color:inherit}.t-row:hover{background:var(--rp-hover)}`}</style>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <a href="/projects" style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}><span>{"\u2039"}</span> {pd.back}</a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{project.name}</h1>
            <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{documents.length} {documents.length === 1 ? pd.docCountOne : pd.docCountMany}</p>
          </div>
          {canManage && <button onClick={() => setSharing(true)} style={{ height: 34, background: T.green, color: T.onAccent, fontSize: 13.5, fontWeight: 500, padding: "0 13px", borderRadius: T.rBtn, border: "none", cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap" }}>{pd.shareWithTeam}</button>}
        </div>
        <ProjectProfileBand projectId={project.id} profiles={profiles} attached={attached} counts={counts} canManage={canManage} />
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginTop: 22, boxShadow: T.shadow }}>
          <div className="row-head" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body }}>
            <span>{pd.colDocument}</span><span>{pd.colAdded}</span>
          </div>
          {documents.length === 0 ? (
            <div style={{ padding: 44, textAlign: "center" }}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{pd.empty}</p></div>
          ) : documents.map((d, i) => (
            <a key={d.id} href={"/documents/" + d.id} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "13px 18px", borderBottom: i < documents.length - 1 ? "1px solid " + T.borderSoft : "none", alignItems: "center" }}>
              <span className="dc-title" style={{ fontSize: 13.5, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", justifySelf: "start", maxWidth: "100%" }}>{d.title}</span>
              <span style={{ fontSize: 13.5, color: T.faint, whiteSpace: "nowrap" }}>{new Date(d.created_at).toLocaleDateString(fr ? "fr-FR" : undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
            </a>
          ))}
        </div>
      </main>
      {sharing && <ShareDialog resourceType="project" resourceId={project.id} resourceName={project.name} members={members} onClose={() => setSharing(false)} />}
    </div>
  );
}
