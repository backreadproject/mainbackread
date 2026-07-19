"use client";
import { useState } from "react";
import { T, microLabel } from "@/lib/theme";
import ShareDialog from "@/app/(app)/ShareDialog";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Project = { id: string; name: string; created_at: string };
type Doc = { id: string; title: string; created_at: string };
type Member = { userId: string; email: string | null };
export default function ProjectDetailClient({ project, documents, canManage, members }: { project: Project; documents: Doc[]; canManage: boolean; members: Member[] }) {
  const locale = useLocale();
  const pd = getDict(locale).projectDetailPage;
  const [sharing, setSharing] = useState(false);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-row{transition:background .12s;text-decoration:none;color:inherit}.t-row:hover{background:#FCFCFD}`}</style>
      <div style={{ padding: "26px 30px 0" }}>
        <a href="/projects" style={{ fontSize: 13, color: T.body, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12 }}><span style={{ color: T.muted }}>{"\u2039"}</span> {pd.back}</a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{project.name}</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{documents.length} {documents.length === 1 ? pd.docCountOne : pd.docCountMany}</p>
          </div>
          {canManage && <button onClick={() => setSharing(true)} style={{ background: T.darkBtn, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: T.rBtn, border: "none", cursor: "pointer" }}>{pd.shareWithTeam}</button>}
        </div>
      </div>
      <main style={{ maxWidth: 900, padding: "22px 30px 40px" }}>
        {documents.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 15, color: T.body, margin: 0 }}>{pd.empty}</p>
          </div>
        ) : (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, overflow: "hidden" }}>
            <div className="row-head" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "11px 18px", borderBottom: `1px solid ${T.border}`, ...microLabel }}>
              <span>{pd.colDocument}</span><span>{pd.colAdded}</span>
            </div>
            {documents.map((d, i) => (
              <a key={d.id} href={`/documents/${d.id}`} className="t-row data-row" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "15px 18px", borderBottom: i < documents.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                <span style={{ fontSize: 14, color: T.body }}>{new Date(d.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : undefined, { day: "numeric", month: "short" })}</span>
              </a>
            ))}
          </div>
        )}
      </main>
      {sharing && <ShareDialog resourceType="project" resourceId={project.id} resourceName={project.name} members={members} onClose={() => setSharing(false)} />}
    </div>
  );
}
