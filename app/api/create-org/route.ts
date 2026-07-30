import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Deliberately NOT an entitlement check. A company account whose trial lapsed
  // must still be able to create its organisation, because checkout will not
  // sell an org plan until one exists -- guarding on isLocked would lock them
  // out of the only route to paying. The real rule here is account type.
  const ctx = await resolvePlanForUser(createAdminClient(), user.id);
  if (ctx.scope !== "org") {
    return NextResponse.json({ error: "Personal accounts cannot create an organization. Choose Team or Business to run one." }, { status: 403 });
  }
  // One organisation per owner. endSubscription and applyPlan both look an org
  // up by created_by, and applyPlan uses maybeSingle(), which throws on two.
  if (ctx.orgId) {
    return NextResponse.json({ error: "You already have an organization." }, { status: 409 });
  }

  const { name, domain, migrateDocuments } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Create the org.
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: name.trim(), domain: domain?.trim() || null, created_by: user.id })
    .select("id, name")
    .single();
  if (orgErr || !org) return NextResponse.json({ error: orgErr?.message ?? "Could not create organization." }, { status: 400 });

  // 2. Seed the caller as owner.
  const { error: memErr } = await admin
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: user.id, role: "owner", email: user.email });
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 400 });

  // 3. Flip the caller's profile to organization account.
  const { error: profErr } = await admin
    .from("profiles")
    .upsert({ id: user.id, account_type: "organization", active_org_id: org.id, updated_at: new Date().toISOString() });
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 400 });

  // 4. Optionally migrate the user's existing personal documents into the org.
  //    owner_id stays the user; they just become org-scoped (project_id stays null).
  let migratedCount = 0;
  if (migrateDocuments) {
    const { data: moved, error: migErr } = await admin
      .from("documents")
      .update({ organization_id: org.id })
      .eq("owner_id", user.id)
      .is("organization_id", null)
      .select("id");
    if (migErr) {
      // Non-fatal: org is created; just report that migration didn't complete.
      return NextResponse.json({ ok: true, org, migrated: 0, migrateWarning: migErr.message });
    }
    migratedCount = moved?.length ?? 0;
  }

  return NextResponse.json({ ok: true, org, migrated: migratedCount });
}
