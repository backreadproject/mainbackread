import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  }

  // 1. Create the org (created_by = me; RLS insert policy checks this).
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: name.trim(), created_by: user.id })
    .select("id, name")
    .single();
  if (orgErr || !org) return NextResponse.json({ error: orgErr?.message ?? "Could not create organization." }, { status: 400 });

  // 2. Seed myself as owner (RLS insert allows self-insert).
  const { error: memErr } = await supabase
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: user.id, role: "owner", email: user.email });
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 400 });

  // 3. Flip my profile to organization account, active org = this one.
  const { error: profErr } = await supabase
    .from("profiles")
    .upsert({ id: user.id, account_type: "organization", active_org_id: org.id, updated_at: new Date().toISOString() });
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, org });
}
