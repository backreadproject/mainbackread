import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { isSampleId } from "@/lib/sample-profile";

export const runtime = "nodejs";

/**
 * Attaching a buyer profile to a document.
 *
 * This is the link that closes the loop: readers of this document get measured
 * against that profile, which is the only way the observed tier ever fills.
 *
 * Three states, not two. A document carries its own profile, inherits the one
 * on its project, or is deliberately left out even though its project has one.
 * A null column cannot mean both "inherit" and "deliberately not inheriting",
 * so detachment has its own flag.
 *
 * Authorisation follows the pattern in /api/outcome. The SESSION client reads
 * the document, so RLS decides whether the caller may see it, and only then
 * does the admin client write. The documents table has no UPDATE policy, so a
 * session write would silently match zero rows and report success.
 */

type Action = "use" | "project" | "none";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const body = await req.json().catch(() => ({}));
  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  const profileId = typeof body.profileId === "string" && body.profileId ? body.profileId : null;

  // Older clients send profileId alone: a string meant attach, null meant
  // detach. Both still map onto an action, so a tab left open through a deploy
  // keeps working rather than quietly writing the wrong state.
  const action: Action =
    body.action === "use" || body.action === "project" || body.action === "none"
      ? body.action
      : profileId ? "use" : "none";

  if (!documentId) return NextResponse.json({ error: "Which document?" }, { status: 400 });
  if (action === "use" && !profileId) {
    return NextResponse.json({ error: "Which profile?" }, { status: 400 });
  }
  if (isSampleId(profileId)) {
    return NextResponse.json(
      { error: "The sample profile is an example. Build your own to change anything." },
      { status: 403 },
    );
  }

  const { data: doc } = await supabase
    .from("documents").select("id, project_id").eq("id", documentId).maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });

  if (action === "project" && !doc.project_id) {
    return NextResponse.json({ error: "This document is not in a project." }, { status: 400 });
  }

  if (action === "use") {
    const { data: prof } = await supabase
      .from("buyer_profiles").select("id").eq("id", profileId).maybeSingle();
    if (!prof) return NextResponse.json({ error: "No such profile." }, { status: 404 });
  }

  const patch =
    action === "use"
      ? { buyer_profile_id: profileId, buyer_profile_detached: false }
      : action === "project"
        ? { buyer_profile_id: null, buyer_profile_detached: false }
        : { buyer_profile_id: null, buyer_profile_detached: true };

  const { error } = await admin.from("documents").update(patch).eq("id", documentId);
  if (error) {
    // The scope trigger speaks here. Its wording is for a log, not a customer.
    if (error.message.includes("out of scope")) {
      return NextResponse.json(
        { error: "That profile belongs to a different workspace." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
  }

  // What it resolves to now, read back rather than assumed, so the client never
  // has to work out inheritance for itself.
  const { data: resolved } = await admin
    .from("document_buyer_profile")
    .select("buyer_profile_id, source")
    .eq("document_id", documentId)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    action,
    profileId: (resolved?.buyer_profile_id as string | null) ?? null,
    source: (resolved?.source as string) ?? "none",
  });
}
