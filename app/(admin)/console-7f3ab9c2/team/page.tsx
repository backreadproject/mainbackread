import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, adminIds, roleLabel, ROLE_PERMISSIONS, type AdminRole } from "@/lib/admin";
import { T } from "@/lib/theme";
import TeamForm from "./TeamForm";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Row = { user_id: string; email: string; role: AdminRole; note: string | null; created_at: string; revoked_at: string | null };
export default async function TeamPage() {
  const me = await requireAdminPage("roles.manage");
  const admin = createAdminClient();
  const { data } = await admin.from("admin_users").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const active = rows.filter((r) => !r.revoked_at);
  const revoked = rows.filter((r) => r.revoked_at);
  const bootstrap = adminIds();

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body } as const;

  return (
    <div style={{ maxWidth: 940 }}>
      <div className="page-header" style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, display: "flex" }}>Console team</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Who can reach this console and what each of them may do.</p>
      </div>

      <div style={card}>
        <div style={head}>Active access</div>
        {bootstrap.length > 0 && (
          <div style={{ padding: "12px 18px", borderBottom: "1px solid " + T.borderSoft, fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
            {bootstrap.length} owner{bootstrap.length === 1 ? "" : "s"} from ADMIN_USER_IDS, which cannot be revoked here.
            That is deliberate: it is the way back in if this table is ever wrong.
          </div>
        )}
        {active.length === 0 ? (
          <p style={{ padding: 18, fontSize: 13.5, color: T.muted, margin: 0 }}>Nobody has been granted access yet.</p>
        ) : active.map((r) => (
          <div key={r.user_id} className="data-row" style={{ display: "grid", gridTemplateColumns: "1.6fr .8fr 1.2fr auto", gap: 12, padding: "12px 18px", borderBottom: "1px solid " + T.borderSoft, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: T.heading, overflowWrap: "anywhere" }}>{r.email}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: T.heading }}>
              <i style={{ width: 6, height: 6, borderRadius: 2, background: r.role === "owner" ? T.danger : r.role === "compliance" ? T.indigo : T.green, flex: "none" }} />
              {roleLabel(r.role)}
            </span>
            <span style={{ fontSize: 12, color: T.muted, overflowWrap: "anywhere" }}>{r.note ?? "\u2014"}</span>
            <TeamForm mode="revoke" userId={r.user_id} email={r.email} disabled={r.user_id === me.id} />
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={head}>Grant access</div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, margin: "0 0 14px" }}>
            They need a ReadProspects account first. Granting a role here lets that same login reach the console.
          </p>
          <TeamForm mode="grant" />
        </div>
      </div>

      <div style={card}>
        <div style={head}>What each role can do</div>
        <div style={{ padding: 18 }}>
          {(Object.keys(ROLE_PERMISSIONS) as AdminRole[]).map((role) => (
            <div key={role} style={{ padding: "10px 0", borderBottom: "1px solid " + T.borderSoft }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 4 }}>{roleLabel(role)}</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, overflowWrap: "anywhere" }}>
                {ROLE_PERMISSIONS[role].join(", ")}
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12, color: T.faint, lineHeight: 1.55, margin: "14px 0 0" }}>
            Only Owner holds destructive and roles.manage. Deleting an organization creator cascades and destroys
            the organization and every document in it, so no other role can reach it.
          </p>
        </div>
      </div>

      {revoked.length > 0 && (
        <div style={card}>
          <div style={head}>Revoked</div>
          {revoked.map((r) => (
            <div key={r.user_id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 18px", borderBottom: "1px solid " + T.borderSoft, fontSize: 12.5, color: T.muted, flexWrap: "wrap" }}>
              <span>{r.email}</span>
              <span>{roleLabel(r.role)} &middot; revoked {new Date(r.revoked_at!).toLocaleDateString()}</span>
            </div>
          ))}
          <p style={{ padding: "12px 18px", fontSize: 12, color: T.faint, margin: 0, lineHeight: 1.55 }}>
            Kept rather than deleted, so audit entries written months ago still resolve to a named person.
          </p>
        </div>
      )}
    </div>
  );
}