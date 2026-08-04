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
 * Authorisation follows the pattern in /api/outcome. The SESSION client reads
 * the document, so RLS decides whether the caller may see it, and only then
 * does the admin client write. The documents table has no UPDATE policy, so a
 * session write would silently match zero rows and report success.
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const body = await req.json().catch(() => ({}));
  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  // null detaches. Anything else must be a profile the caller can see.
  const profileId = typeof body.profileId === "string" && body.profileId ? body.profileId : null;
  if (!documentId) return NextResponse.json({ error: "Which document?" }, { status: 400 });
  if (isSampleId(profileId)) {
    return NextResponse.json(
      { error: "The sample profile is an example. Build your own to change anything." },
      { status: 403 },
    );
  }

  const { data: doc } = await supabase
    .from("documents").select("id").eq("id", documentId).maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });

  if (profileId) {
    const { data: prof } = await supabase
      .from("buyer_profiles").select("id, name").eq("id", profileId).maybeSingle();
    if (!prof) return NextResponse.json({ error: "No such profile." }, { status: 404 });
  }

  const { error } = await admin
    .from("documents")
    .update({ buyer_profile_id: profileId })
    .eq("id", documentId);

  if (error) return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
  return NextResponse.json({ ok: true, profileId });
}
