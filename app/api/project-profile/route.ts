import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { isSampleId } from "@/lib/sample-profile";

export const runtime = "nodejs";

/**
 * The buyer profile on a project.
 *
 * Every document in the project is measured against it, unless that document
 * carries its own or has been deliberately left out. Resolution happens when a
 * document is read, never copied at attach time: copying would leave the
 * documents already in the project untouched, which is the one thing people
 * expect this to do.
 *
 * Unlike /api/document-profile this writes with the SESSION client. Projects
 * have an UPDATE policy, so RLS decides whether the caller may change it, and
 * zero rows back means they may not.
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const gate = await requirePaidAccess(createAdminClient(), user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const body = await req.json().catch(() => ({}));
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const profileId = typeof body.profileId === "string" && body.profileId ? body.profileId : null;

  if (!projectId) return NextResponse.json({ error: "Which project?" }, { status: 400 });
  if (isSampleId(profileId)) {
    return NextResponse.json(
      { error: "The sample profile is an example. Build your own to change anything." },
      { status: 403 },
    );
  }

  if (profileId) {
    const { data: prof } = await supabase
      .from("buyer_profiles").select("id").eq("id", profileId).maybeSingle();
    if (!prof) return NextResponse.json({ error: "No such profile." }, { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("projects")
    .update({ buyer_profile_id: profileId })
    .eq("id", projectId)
    .select("id");

  if (error) {
    if (error.message.includes("out of scope")) {
      return NextResponse.json(
        { error: "That profile belongs to a different workspace." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
  }
  if (!rows || rows.length === 0) {
    // RLS matched nothing: either no such project, or not theirs to change.
    // One message for both, so this never confirms a project exists.
    return NextResponse.json({ error: "You cannot change this project." }, { status: 403 });
  }

  // How many documents this actually reaches, so the caller can say so rather
  // than claim it applies to everything.
  const admin = createAdminClient();
  const { count: following } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("buyer_profile_id", null)
    .eq("buyer_profile_detached", false);

  const { count: overriding } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .not("buyer_profile_id", "is", null);

  const { count: detached } = await admin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("buyer_profile_detached", true);

  return NextResponse.json({
    ok: true,
    profileId,
    following: following ?? 0,
    overriding: overriding ?? 0,
    detached: detached ?? 0,
  });
}
