import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
// Resolves a referral code to a referrer and stamps it on the new profile.
//
// Service role, because only it can read the referrers table: a signup has no
// session yet when email confirmation is on, and referrers are deliberately
// invisible to app users.
//
// This is deliberately unauthenticated. It is called immediately after signUp,
// before a session exists, so there is nothing to authenticate against. That is
// safe only because of what it refuses to do:
//   - it never overwrites an existing referred_by, so nobody can reattribute a
//     subscriber who already belongs to another referrer;
//   - it never creates a profile, so it cannot be used to fabricate accounts;
//   - it writes nothing but referred_by and referred_at.
// The worst an attacker achieves is attributing their own fresh signup to a
// referrer of their choosing, which they could do anyway by clicking that
// referrer's own link.
export async function POST(req: NextRequest) {
  let body: { code?: string; userId?: string | null; email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const code = (body.code ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{2,31}$/.test(code)) return NextResponse.json({ ok: false, reason: "bad code" });

  const admin = createAdminClient();

  // Current code first, then retired ones, so a link printed before a referrer
  // renamed still attributes correctly.
  let referrerId: string | null = null;
  const { data: live } = await admin.from("referrers").select("id, status").eq("code", code).maybeSingle();
  if (live) {
    if ((live as { status: string }).status !== "active") return NextResponse.json({ ok: false, reason: "inactive" });
    referrerId = (live as { id: string }).id;
  } else {
    const { data: old } = await admin
      .from("referrer_code_history")
      .select("referrer_id, referrers!inner ( status )")
      .eq("code", code)
      .maybeSingle();
    const st = (old as unknown as { referrers?: { status: string } } | null)?.referrers?.status;
    if (old && st === "active") referrerId = (old as { referrer_id: string }).referrer_id;
  }
  if (!referrerId) return NextResponse.json({ ok: false, reason: "unknown code" });

  // Resolve the profile. userId is the reliable handle; email is the fallback
  // for the confirmation flow, where the client may not have a user object yet.
  let profileId = body.userId ?? null;
  if (!profileId && body.email) {
    const { data: list } = await admin.auth.admin.listUsers();
    const hit = list.users.find((u) => (u.email ?? "").toLowerCase() === body.email!.trim().toLowerCase());
    profileId = hit?.id ?? null;
  }
  if (!profileId) return NextResponse.json({ ok: false, reason: "no user" });

  // A referrer must not be able to refer themselves into their own commission.
  // Monthly self-referral is bounded and handled by terms, but the trivial case
  // where the same auth user holds both records is worth refusing outright.
  if (profileId === referrerId) return NextResponse.json({ ok: false, reason: "self" });

  // First touch wins, permanently. The .is() filter is the whole guarantee: an
  // already-attributed profile is untouched, so nobody can be reattributed by
  // cancelling and signing up again through a different link.
  const { error } = await admin
    .from("profiles")
    .update({ referred_by: referrerId, referred_at: new Date().toISOString() })
    .eq("id", profileId)
    .is("referred_by", null);

  if (error) {
    console.error("[referral/attribute]", error.message);
    return NextResponse.json({ ok: false, reason: "write failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}