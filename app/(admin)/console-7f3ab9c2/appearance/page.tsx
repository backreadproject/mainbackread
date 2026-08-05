import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin";
import { T } from "@/lib/theme";
import { readWorkspace, type Workspace } from "@/lib/workspace";
import AppearanceForm from "./AppearanceForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The workspace default for everyone.
 *
 * Owner only, because it changes what every customer sees. A person switching
 * only themselves does it from the sidebar, or from /api/workspace, and neither
 * of those touches this.
 */

export default async function AppearancePage() {
  await requireAdminPage("roles.manage");
  const admin = createAdminClient();

  const { data } = await admin.from("app_settings").select("workspace, updated_at").limit(1).maybeSingle();
  const current: Workspace = readWorkspace((data as { workspace?: unknown } | null)?.workspace) ?? "classic";
  const updatedAt = (data as { updated_at?: string } | null)?.updated_at ?? null;

  // How many people have overridden it for themselves. Worth knowing before
  // changing the default: a setting nobody is using is safe to move.
  const { count: overridden } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .not("workspace", "is", null);

  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body } as const;

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header" style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, display: "flex" }}>Appearance</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>
          Which workspace customers get by default. Anyone can override it for themselves.
        </p>
      </div>

      <div style={card}>
        <div style={head}>Default workspace</div>
        <AppearanceForm current={current} />
      </div>

      <div style={card}>
        <div style={head}>Where this applies</div>
        <div style={{ padding: 18, fontSize: 13, color: T.body, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>
            The setting above is the last thing consulted. An explicit choice always wins over it, in this order:
          </p>
          <ol style={{ margin: "12px 0 0 18px", padding: 0, color: T.muted }}>
            <li style={{ marginBottom: 6 }}>The <code>rp-ws</code> cookie, set by the sidebar switch or by <code>/api/workspace</code>.</li>
            <li style={{ marginBottom: 6 }}>That person&rsquo;s own stored preference.</li>
            <li style={{ marginBottom: 6 }}>This default.</li>
            <li>Classic, if any of the above is missing or unreadable.</li>
          </ol>
          <p style={{ margin: "14px 0 0", color: T.muted }}>
            {overridden ?? 0} account{(overridden ?? 0) === 1 ? " has" : "s have"} chosen a workspace for themselves and
            will not be affected by changing this.
            {updatedAt ? " Last changed " + new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + "." : ""}
          </p>
        </div>
      </div>

      <div style={{ ...card, borderColor: T.amberBorder, background: T.amberSoft }}>
        <div style={{ ...head, background: "transparent", borderBottom: "1px solid " + T.amberBorder, color: T.amberText }}>
          If something breaks
        </div>
        <div style={{ padding: 18, fontSize: 13, color: T.amberText, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>
            <code>/api/workspace?ws=classic</code> sets the cookie and redirects. It reads no session, touches no
            database and renders no part of the app shell, so it still works when the shell itself is failing. That is
            the only reason it exists as a URL rather than as a button.
          </p>
          <p style={{ margin: "12px 0 0" }}>
            Changing the default here does not move anybody who has already chosen for themselves, so it cannot be used
            to rescue them. They use the URL.
          </p>
        </div>
      </div>
    </div>
  );
}
