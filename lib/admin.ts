import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export const ADMIN_SLUG = "console-7f3ab9c2";

export function adminIds(): string[] {
  return (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !adminIds().includes(user.id)) return null;
  return user;
}

export async function requireAdminPage() {
  const user = await getAdminUser();
  if (!user) notFound(); // 404, never confirm the path exists
  return user;
}

export async function writeAudit(entry: {
  actorId: string; actorEmail?: string | null; action: string;
  targetUserId?: string | null; targetOrgId?: string | null; detail?: Record<string, unknown> | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_audit").insert({
    actor_id: entry.actorId, actor_email: entry.actorEmail ?? null, action: entry.action,
    target_user_id: entry.targetUserId ?? null, target_org_id: entry.targetOrgId ?? null, detail: entry.detail ?? null,
  });
  if (error) console.error("[admin_audit]", error.message);
}
