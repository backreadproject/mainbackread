import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Authenticate + confirm org membership via session client.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const ctx = await getOrgContext();
  if (ctx.accountType !== "organization" || !ctx.org) {
    return NextResponse.json({ error: "Projects require an organization." }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  // Write with the admin client. We've already verified the caller is a member
  // of ctx.org via getOrgContext, so this is safe and avoids the RLS
  // insert-then-read-back chicken-and-egg (same pattern as create-org).
  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("projects")
    .insert({ name: name.trim(), organization_id: ctx.org.id, created_by: user.id })
    .select("id, name")
    .single();
  if (error || !project) return NextResponse.json({ error: error?.message ?? "Could not create project." }, { status: 400 });

  return NextResponse.json({ ok: true, project });
}
