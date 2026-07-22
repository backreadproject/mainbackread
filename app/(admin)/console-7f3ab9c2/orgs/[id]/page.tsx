import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel } from "@/lib/theme";
import { getPlan } from "@/lib/plans";
import OrgActions from "./OrgActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OrgDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin.from("organizations").select("id, name, domain, plan, subscription_active, created_at, created_by").eq("id", id).single();
  if (!org) return <div style={{ padding: 30, fontFamily: T.font }}>Organization not found.</div>;

  const plan = getPlan(org.plan);
  const { data: creator } = await admin.auth.admin.getUserById(org.created_by);

  const { data: memsRaw } = await admin.from("organization_members").select("id, user_id, email, role, created_at").eq("organization_id", id).order("created_at", { ascending: true });
  const members = memsRaw ?? [];
  const memberIds = members.map((m) => m.user_id);
  const { data: profs } = memberIds.length ? await admin.from("profiles").select("id, first_name, last_name").in("id", memberIds) : { data: [] };
  const pmap = new Map((profs ?? []).map((p) => [p.id, p as { first_name: string | null; last_name: string | null }]));

  const { data: invsRaw } = await admin.from("invitations").select("id, email, first_name, last_name, role, status, created_at, expires_at").eq("organization_id", id).order("created_at", { ascending: false });
  const invites = invsRaw ?? [];

  const { data: projsRaw } = await admin.from("projects").select("id, name, created_at").eq("organization_id", id).order("created_at", { ascending: false });
  const projects = projsRaw ?? [];

  const { data: docsRaw } = await admin.from("documents").select("id, title, owner_id, project_id, created_at, archived_at").eq("organization_id", id).order("created_at", { ascending: false });
  const documents = docsRaw ?? [];
  const projName = new Map(projects.map((p) => [p.id, p.name as string]));

  const seats = members.length;
  const seatLimit = plan.limits.seats;
  const overSeats = seatLimit !== null && seats > seatLimit;

  const box = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 18, marginBottom: 16 } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const nameOfMember = (m: { user_id: string; email: string | null }) => {
    const p = pmap.get(m.user_id);
    return [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() || m.email || "Member";
  };

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "26px 30px 60px" }}>
        <a href={`/${ADMIN_SLUG}/orgs`} style={{ fontSize: 13, color: T.green, fontWeight: 600, textDecoration: "none", display: "inline-block", marginBottom: 14 }}>&larr; All organizations</a>

        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={pageHeading}>{org.name || "Unnamed organization"}</h1>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "5px 0 0", fontFamily: mono }}>
              {org.domain || "no domain"} {"\u00b7"} {plan.name} {"\u00b7"} {org.subscription_active ? "subscribed" : "unpaid"} {"\u00b7"} created {new Date(org.created_at).toLocaleDateString()}
            </p>
          </div>
          <OrgActions orgId={org.id} orgName={org.name || ""} documentCount={documents.length} memberCount={members.length} projectCount={projects.length} />
        </div>

        <div style={box}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 14px" }}>At a glance</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 34 }}>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Seats used</div><div style={{ fontSize: 18, fontWeight: 700, color: overSeats ? "#B42318" : T.heading }}>{seats}{seatLimit !== null ? ` / ${seatLimit}` : " / unlimited"}</div></div>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Projects</div><div style={{ fontSize: 18, fontWeight: 700, color: T.heading }}>{projects.length}</div></div>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Documents</div><div style={{ fontSize: 18, fontWeight: 700, color: T.heading }}>{documents.length}</div></div>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Pending invites</div><div style={{ fontSize: 18, fontWeight: 700, color: T.heading }}>{invites.filter((i) => i.status === "pending").length}</div></div>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Created by</div><div style={{ fontSize: 13, color: T.heading, paddingTop: 4 }}>{creator?.user?.email ?? "unknown"}</div></div>
          </div>
          {overSeats && <p style={{ fontSize: 12.5, color: "#B42318", margin: "12px 0 0" }}>This organization is over its seat limit for the {plan.name} plan.</p>}
        </div>

        <div style={box}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Members ({members.length})</h2>
          {members.length === 0 && <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>No members.</p>}
          {members.map((m, i) => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
              <a href={`/${ADMIN_SLUG}/accounts/${m.user_id}`} style={{ textDecoration: "none", minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.heading }}>{nameOfMember(m)}</div>
                <div style={{ fontSize: 11.5, color: T.muted, fontFamily: mono }}>{m.email || "no email"} {"\u00b7"} {m.role || "member"}{m.user_id === org.created_by ? " \u00b7 creator" : ""}</div>
              </a>
              {m.user_id !== org.created_by && <OrgActions orgId={org.id} orgName={org.name || ""} memberId={m.id} memberLabel={m.email || nameOfMember(m)} mode="member" />}
            </div>
          ))}
        </div>

        {invites.length > 0 && (
          <div style={box}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Invitations ({invites.length})</h2>
            {invites.map((v, i) => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? `1px solid ${T.border}` : "none" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.heading }}>{v.email}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, fontFamily: mono }}>
                    {v.role || "member"} {"\u00b7"} {v.status || "pending"} {"\u00b7"} sent {new Date(v.created_at).toLocaleDateString()}
                    {v.expires_at ? ` \u00b7 expires ${new Date(v.expires_at).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <OrgActions orgId={org.id} orgName={org.name || ""} inviteId={v.id} inviteLabel={v.email ?? ""} mode="invite" />
              </div>
            ))}
          </div>
        )}

        <div style={box}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Projects ({projects.length})</h2>
          {projects.length === 0 && <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>No projects.</p>}
          {projects.map((p, i) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 13.5 }}>
              <span style={{ color: T.heading, fontWeight: 600 }}>{p.name}</span>
              <span style={{ color: T.muted, fontFamily: mono, fontSize: 12 }}>{documents.filter((d) => d.project_id === p.id).length} docs {"\u00b7"} {new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        <div style={box}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Documents ({documents.length})</h2>
          {documents.length === 0 && <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>None.</p>}
          {documents.map((d, i) => (
            <a key={d.id} href={`/${ADMIN_SLUG}/documents/${d.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i ? `1px solid ${T.border}` : "none", fontSize: 13.5, textDecoration: "none" }}>
              <span style={{ color: T.heading, fontWeight: 600 }}>{d.title}{d.archived_at ? <span style={{ color: T.muted, fontWeight: 400 }}> (archived)</span> : ""}</span>
              <span style={{ color: T.muted, fontFamily: mono, fontSize: 12 }}>{d.project_id ? projName.get(d.project_id) ?? "project" : "no project"}</span>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
