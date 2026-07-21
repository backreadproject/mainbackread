"use client";

import { useState } from "react";
import { T, microLabel } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

type Project = { id: string; name: string; createdAt: string; docCount: number };

export default function ProjectsClient({ projects, orgless, personal = false }: { projects: Project[]; orgless: boolean; personal?: boolean }) {
  const locale = useLocale();
  const pp = getDict(locale).projectsPage;
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!name.trim()) return;
    setCreating(true); setError("");
    const res = await fetch("/api/create-project", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? pp.couldNotCreate); setCreating(false); return; }
    window.location.reload();
  }

  if (orgless) {
    return (
      <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
        <main style={{ maxWidth: 620, padding: "26px 30px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{pp.title}</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 24px" }}>{pp.introOrgless}</p>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 15, color: T.body, margin: "0 0 16px" }}>{pp.orglessBody}</p>
            <a href="/members" style={{ display: "inline-block", background: T.green, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: T.rBtn, textDecoration: "none" }}>{pp.goToMembers} &rarr;</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-card{transition:transform .12s,box-shadow .12s;text-decoration:none}.t-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,41,0.08)}.t-in:focus{border-color:${T.green};outline:none}`}</style>
      <main style={{ maxWidth: 1000, padding: "26px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{pp.title}</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{personal ? pp.subPersonal : pp.subTeam}</p>
          </div>
          <button onClick={() => setShowNew((v) => !v)} style={{ background: T.darkBtn, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: T.rBtn, border: "none", cursor: "pointer" }}>{pp.newProject}</button>
        </div>

        {error && <p style={{ color: "#B42318", fontSize: 14, marginBottom: 16 }}>{error}</p>}

        {showNew && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 18, marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <input className="t-in" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder={pp.projectNamePlaceholder} autoFocus style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 12px", fontSize: 14, fontFamily: T.font, background: "#fff" }} />
            <button onClick={create} disabled={creating || !name.trim()} style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "9px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer", opacity: creating || !name.trim() ? 0.5 : 1 }}>{creating ? pp.creating : pp.create}</button>
          </div>
        )}

        {projects.length === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 44, textAlign: "center" }}>
            <p style={{ fontSize: 15, color: T.body, margin: 0 }}>{pp.emptyNone}</p>
          </div>
        ) : (
          <div className="card-grid-3">
            {projects.map((p) => (
              <a key={p.id} href={`/projects/${p.id}`} className="t-card" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 13, color: T.muted }}>{p.docCount} {p.docCount === 1 ? pp.docCountOne : pp.docCountMany}</div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


