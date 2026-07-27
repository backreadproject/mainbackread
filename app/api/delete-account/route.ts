import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";

// Deletes the logged-in user's account and all their data.
// Deleting an auth user REQUIRES admin (service_role) - the browser can't do it.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();

  // Storage does NOT cascade. Rows disappear when the auth user is deleted
  // (documents.owner_id and profiles.id are ON DELETE CASCADE), but the files
  // would be orphaned forever, so remove them first while we can still find them.
  // Does this person's deletion take an organisation with it?
  const { data: ownedOrgs } = await admin
    .from("organizations")
    .select("id, name")
    .eq("created_by", user.id);
  const orgs = (ownedOrgs ?? []) as { id: string; name: string }[];
  if (orgs.length > 0) {
    const ids = orgs.map((o) => o.id);
    const { count } = await admin
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .in("organization_id", ids);
    // More than just them: refuse. The cascade would delete other people's
    // documents and there is no way to undo it.
    if ((count ?? 0) > 1) {
      const name = orgs[0].name;
      return NextResponse.json({
        error:
          "You created " + name + ", and deleting your account would delete the whole organisation with it, including documents belonging to everyone else in it. Remove the other members first, or ask us to transfer ownership, and then delete your account.",
        blockedByOrg: true,
        organization: name,
      }, { status: 409 });
    }
  }

  const { data: docs } = await admin.from("documents").select("id, storage_path").eq("owner_id", user.id);
  const documents = docs ?? [];
  const paths = documents.map((d) => d.storage_path).filter(Boolean) as string[];

  // Variant files hang off those documents and are not covered by the query above.
  if (documents.length) {
    const { data: vars } = await admin
      .from("document_variants")
      .select("storage_path")
      .in("document_id", documents.map((d) => d.id));
    for (const v of vars ?? []) {
      const p = (v as { storage_path: string | null }).storage_path;
      if (p) paths.push(p);
    }
  }

  if (paths.length) {
    try { await admin.storage.from("documents").remove(paths); }
    catch (err) { console.error("[delete-account] storage cleanup failed:", err instanceof Error ? err.message : String(err)); }
  }

  // Avatar, if they uploaded one.
  const { data: prof } = await admin.from("profiles").select("avatar_url").eq("id", user.id).single();
  const avatar = (prof as { avatar_url: string | null } | null)?.avatar_url;
  if (avatar && avatar.includes("/avatars/")) {
    const key = avatar.split("/avatars/")[1]?.split("?")[0];
    if (key) { try { await admin.storage.from("avatars").remove([key]); } catch { /* non-fatal */ } }
  }

  // Only reached when the guard above found no other members, so this deletes
  // an organisation of one: their own. Explicit, so the FK can refuse the
  // accidental version.
  for (const o of orgs) {
    const { error: orgErr } = await admin.from("organizations").delete().eq("id", o.id);
    if (orgErr) {
      console.error("[delete-account] could not remove organisation", o.id, orgErr.message);
      return NextResponse.json({ error: "Could not close your organisation. Nothing has been deleted." }, { status: 500 });
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, filesRemoved: paths.length });
}
