import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
import { getPlan } from "@/lib/plans";
import OrgActions from "./OrgActions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function OrgDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("accounts.detail");
  const { id } = await params;
  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id, name, domain, plan, subscription_active, created_at, created_by").eq("id", id).single();
  if (!org) return <div style={{ padding: 30, fontFamily: T.font, color: T.body }}>Organization not found.</div>;
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
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const nameOfMember = (m: { user_id: string; email: string | null }) => {
    const p = pmap.get(m.user_id);
    return [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() || m.email || "Member";
  };
  const pending = invites.filter((i) => i.status === "pending").length;
  const cells: [string, string, boolean][] = [
    [seats + (seatLimit !== null ? " / " + seatLimit : " / unlimited"), "Seats used", overSeats],
    [String(projects.length), "Projects", false],
    [String(documents.length), "Documents", false],
    [String(pending), "Pending invites", false],
  ];
  const rowStyle = (i: number, len: number) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < len - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13.5 } as const);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "34px 28px 120px" }}>
        <a href={"/" + ADMIN_SLUG + "/orgs"} style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}><span>{"\u2039"}</span> All organizations</a>
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{org.name || "Unnamed organization"}</h1>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "7px 0 0", fontFamily: mono }}>
              {org.domain || "no domain"} {"\u00b7"} {plan.name} {"\u00b7"} {org.subscription_active ? "subscribed" : "unpaid"} {"\u00b7"} created {new Date(org.created_at).toLocaleDateString()} {"\u00b7"} by {creator?.user?.email ?? "unknown"}
            </p>
          </div>
          <OrgActions orgId={org.id} orgName={org.name || ""} documentCount={documents.length} memberCount={members.length} projectCount={projects.length} />
        </div>
        <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, margin: "26px 0 14px" }}>
          {cells.map(([v, l, warn], i) => (
            <div key={l} style={{ padding: "15px 18px", borderLeft: i ? "1px solid " + T.border : "none" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>
                {warn && <i title="Over the seat limit" style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.danger }} />}
                {v}
              </div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        {overSeats && (
          <div style={{ background: T.dangerSoft, border: "1px solid " + T.dangerBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13.5, color: T.dangerText, marginBottom: 14, lineHeight: 1.5 }}>
            This organization is over its seat limit for the {plan.name} plan.
          </div>
        )}
        <div style={card}>
          <div style={head}>Members {"\u00b7"} {members.length}</div>
          {members.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>No members.</div>}
          {members.map((m, i) => (
            <div key={m.id} style={rowStyle(i, members.length)}>
              <a href={"/" + ADMIN_SLUG + "/accounts/" + m.user_id} style={{ textDecoration: "none", minWidth: 0 }}>
                <div style={{ color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nameOfMember(m)}</div>
                <div style={{ fontSize: 12.5, color: T.faint, fontFamily: mono, marginTop: 1 }}>{m.email || "no email"} {"\u00b7"} {m.role || "member"}{m.user_id === org.created_by ? " \u00b7 creator" : ""}</div>
              </a>
              {m.user_id !== org.created_by && <OrgActions orgId={org.id} orgName={org.name || ""} memberId={m.id} memberLabel={m.email || nameOfMember(m)} mode="member" />}
            </div>
          ))}
        </div>
        {invites.length > 0 && (
          <div style={card}>
            <div style={head}>Invitations {"\u00b7"} {invites.length}</div>
            {invites.map((v, i) => (
              <div key={v.id} style={rowStyle(i, invites.length)}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: T.heading, minWidth: 0 }}>
                    {v.status === "pending" && <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.amber }} />}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.email}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: T.faint, fontFamily: mono, marginTop: 1 }}>
                    {v.role || "member"} {"\u00b7"} {v.status || "pending"} {"\u00b7"} sent {new Date(v.created_at).toLocaleDateString()}
                    {v.expires_at ? " \u00b7 expires " + new Date(v.expires_at).toLocaleDateString() : ""}
                  </div>
                </div>
                <OrgActions orgId={org.id} orgName={org.name || ""} inviteId={v.id} inviteLabel={v.email ?? ""} mode="invite" />
              </div>
            ))}
          </div>
        )}
        <div style={card}>
          <div style={head}>Projects {"\u00b7"} {projects.length}</div>
          {projects.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>No projects.</div>}
          {projects.map((p, i) => (
            <div key={p.id} style={rowStyle(i, projects.length)}>
              <span style={{ color: T.heading, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              <span style={{ color: T.faint, fontFamily: mono, fontSize: 12, flex: "none" }}>{documents.filter((d) => d.project_id === p.id).length} documents {"\u00b7"} {new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={head}>Documents {"\u00b7"} {documents.length}</div>
          {documents.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>None.</div>}
          {documents.map((d, i) => (
            <a key={d.id} href={"/" + ADMIN_SLUG + "/documents/" + d.id} className="t-row" style={{ ...rowStyle(i, documents.length), textDecoration: "none" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {d.archived_at && <i title="Archived" style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.faint }} />}
                <span style={{ color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
              </span>
              <span style={{ color: T.faint, fontFamily: mono, fontSize: 12, flex: "none" }}>{d.project_id ? projName.get(d.project_id) ?? "project" : "no project"}</span>
            </a>
          ))}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}@media (max-width: 800px){ .stat-strip{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  );
}