import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org-context";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
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

  // RLS insert policy: created_by = me AND is_org_member(org). Satisfied.
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name: name.trim(), organization_id: ctx.org.id, created_by: user.id })
    .select("id, name")
    .single();
  if (error || !project) return NextResponse.json({ error: error?.message ?? "Could not create project." }, { status: 400 });

  return NextResponse.json({ ok: true, project });
}
