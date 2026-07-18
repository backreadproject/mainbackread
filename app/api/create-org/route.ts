import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Authenticate the caller with the session-aware client.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  }

  // Use the admin client for the writes. This is a trusted server route and we've
  // already verified the user. Admin bypasses RLS, which avoids the chicken-and-egg
  // where reading back a freshly-created org fails because membership isn't set yet.
  const admin = createAdminClient();

  // 1. Create the org.
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: name.trim(), created_by: user.id })
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

  return NextResponse.json({ ok: true, org });
}
