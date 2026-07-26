import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
export const ADMIN_SLUG = "console-7f3ab9c2";
// Console access and roles.
//
// ADMIN_USER_IDS remains, but only as a BOOTSTRAP OWNER: if admin_users is
// empty, wrong, or someone locks themselves out, the env var still gets you in.
// Everyone else lives in the table, so revoking a departing member of staff is
// immediate rather than an edit-and-redeploy.
export type AdminRole = "owner" | "support" | "finance" | "compliance" | "engineering";
/** Permissions, not pages. A page asks "may this person read account detail?"
 *  rather than "is this person support?", so the policy lives in ONE table
 *  instead of being scattered across route handlers. */
export type Permission =
  | "dashboard"
  | "accounts.read"
  | "accounts.detail"
  | "documents.read"
  /** The CONTENT of reader questions and answers. Deliberately narrow: what a
   *  prospect asked about a customer's pricing is that customer's confidential
   *  deal intelligence, and a support agent debugging a broken link does not
   *  need it. They can still see THAT questions were asked and whether they
   *  escalated. */
  | "readerContent.read"
  | "support.handle"
  | "billing.manage"
  | "erasure.handle"
  | "audit.read"
  /** Delete a user or an organization. Owner only, permanently: deleting an org
   *  creator cascades through organizations_created_by_fkey and destroys the
   *  organization and every document in it. No support workflow needs that. */
  | "destructive"
  | "roles.manage";
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  owner: [
    "dashboard", "accounts.read", "accounts.detail", "documents.read", "readerContent.read",
    "support.handle", "billing.manage", "erasure.handle", "audit.read", "destructive", "roles.manage",
  ],
  // Diagnose and answer. No deletes, no plan changes, no erasures, no transcripts.
  support: ["dashboard", "accounts.read", "accounts.detail", "documents.read", "support.handle"],
  // Money only. No document access at all: nothing about revenue requires
  // reading a customer's sales intelligence.
  finance: ["dashboard", "accounts.read", "billing.manage"],
  // Erasure is a data subject right exercised over a customer's data, so it is
  // separate from support and few people should hold it. It DOES carry content
  // access, because you cannot erase what you cannot see.
  compliance: ["dashboard", "accounts.read", "accounts.detail", "readerContent.read", "erasure.handle", "audit.read"],
  // Ingestion, OCR and error surfaces. Read-only everywhere.
  engineering: ["dashboard", "documents.read"],
};
export function adminIds(): string[] {
  return (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
}
export type AdminSession = {
  id: string;
  email: string | null;
  role: AdminRole;
  can: (p: Permission) => boolean;
};
function session(id: string, email: string | null, role: AdminRole): AdminSession {
  const perms = new Set(ROLE_PERMISSIONS[role]);
  return { id, email, role, can: (p) => perms.has(p) };
}
export async function getAdminUser(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Bootstrap owner wins and is checked first, so a broken table cannot lock
  // the owner out of the console that fixes it.
  if (adminIds().includes(user.id)) return session(user.id, user.email ?? null, "owner");

  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("role, revoked_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();
  const row = data as { role: AdminRole } | null;
  if (!row) return null;
  return session(user.id, user.email ?? null, row.role);
}
/** Gate a page. The permission defaults to dashboard so every existing call
 *  keeps its current behaviour; pages that need more say so explicitly. */
export async function requireAdminPage(permission: Permission = "dashboard"): Promise<AdminSession> {
  const s = await getAdminUser();
  if (!s) notFound(); // 404, never confirm the path exists
  if (!s.can(permission)) notFound(); // same: do not reveal what they cannot reach
  return s;
}
/** Gate an API route. Returns null when allowed, or the response to send. */
export async function requireAdminApi(permission: Permission): Promise<{ session: AdminSession } | { error: Response }> {
  const s = await getAdminUser();
  if (!s) return { error: new Response(JSON.stringify({ error: "Not found." }), { status: 404, headers: { "content-type": "application/json" } }) };
  if (!s.can(permission)) {
    return { error: new Response(JSON.stringify({ error: "Your role does not allow that." }), { status: 403, headers: { "content-type": "application/json" } }) };
  }
  return { session: s };
}
export async function writeAudit(entry: {
  actorId: string; actorEmail?: string | null; action: string;
  targetUserId?: string | null; targetOrgId?: string | null; detail?: Record<string, unknown> | null;
  kind?: "mutation" | "read";
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_audit").insert({
    actor_id: entry.actorId, actor_email: entry.actorEmail ?? null, action: entry.action,
    target_user_id: entry.targetUserId ?? null, target_org_id: entry.targetOrgId ?? null,
    detail: entry.detail ?? null, kind: entry.kind ?? "mutation",
  });
  if (error) console.error("[admin_audit]", error.message);
}
/** Opening one customer's account or document is recorded. Browsing a list is
 *  not: auditing every list query buries the signal, while "who looked at this
 *  account" is exactly the question you would need to answer later. */
export async function auditRead(s: AdminSession, action: string, target: { userId?: string | null; orgId?: string | null; detail?: Record<string, unknown> }): Promise<void> {
  await writeAudit({
    actorId: s.id, actorEmail: s.email, action,
    targetUserId: target.userId ?? null, targetOrgId: target.orgId ?? null,
    detail: { role: s.role, ...(target.detail ?? {}) },
    kind: "read",
  });
}
export function roleLabel(r: AdminRole): string {
  return r === "owner" ? "Owner" : r === "support" ? "Support" : r === "finance" ? "Finance"
    : r === "compliance" ? "Compliance" : "Engineering";
}
export { ROLE_PERMISSIONS };