import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Creating an organisation is four writes: the org, the owner membership, the
// profile pointer, and optionally migrating existing documents. As four separate
// calls, a failure on the second left an organisation with NO owner -- nobody
// could administer it, and endSubscription would still find it by created_by.
//
// So the work happens inside public.create_organization, a security-definer
// function that Postgres runs as one transaction: any failure rolls back all of
// it. The rules live in there too, because a rule checked out here and enforced
// in there could be raced by two requests.
//
// Deliberately NOT entitlement-gated. A company account whose trial lapsed must
// still be able to create its organisation, because checkout will not sell an
// org plan until one exists -- guarding on isLocked would lock them out of the
// only route to paying.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { name?: string; domain?: string; migrateDocuments?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  if (name.length > 120) return NextResponse.json({ error: "That name is too long." }, { status: 400 });

  // The tier this account signed up for. user_metadata is the durable record --
  // the same value the signup trigger reads -- and it is validated inside the
  // function as well, because it originally came from a URL parameter.
  const claimed = String((user.user_metadata as Record<string, unknown> | null)?.plan ?? "");

  // The session client, so auth.uid() inside the function is this caller.
  const { data, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_domain: typeof body.domain === "string" ? body.domain : null,
    p_plan: claimed,
    p_migrate: !!body.migrateDocuments,
  });

  if (error) {
    // The function raises with SQLSTATEs chosen so this maps cleanly.
    const map: Record<string, number> = { "28000": 401, "42501": 403, "23505": 409 };
    const status = map[error.code ?? ""] ?? 400;
    return NextResponse.json({ error: error.message.replace(/^.*?:\s*/, "") }, { status });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return NextResponse.json({ error: "Could not create organization." }, { status: 400 });

  return NextResponse.json({
    ok: true,
    org: { id: row.org_id, name: row.org_name },
    migrated: row.migrated ?? 0,
  });
}