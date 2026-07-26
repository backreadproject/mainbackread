import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
// Turns a signed-in auth user into a referrer.
//
// Authentication and entitlement are separate here: one auth.users row per
// email, a referrers row grants the referral console, a profiles row grants the
// app. The same person can hold both with one set of credentials, which is the
// only way "same email on both systems" is possible at all, because
// auth.users.email is unique and cannot be worked around.
const RESERVED = new Set([
  "admin","api","app","support","privacy","terms","help","login","signup",
  "readprospects","relay","relaydocuments","referrals","console","billing",
  "account","settings","dashboard","www","mail","docs","status","pricing",
]);
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let body: { code?: string; displayName?: string; payoutCurrency?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const code = (body.code ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{2,31}$/.test(code)) {
    return NextResponse.json({ error: "Use 3 to 32 characters: lowercase letters, numbers and hyphens, starting with a letter or number." }, { status: 400 });
  }
  if (RESERVED.has(code)) {
    return NextResponse.json({ error: "That link name is reserved. Please choose another." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Already a referrer? Return their code rather than erroring, so a double
  // submit is harmless.
  const { data: existing } = await admin.from("referrers").select("code").eq("id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, code: (existing as { code: string }).code, already: true });

  // Taken now, or retired by someone else? A retired code still resolves to its
  // original owner, so it can never be reissued.
  const [{ data: live }, { data: retired }] = await Promise.all([
    admin.from("referrers").select("id").eq("code", code).maybeSingle(),
    admin.from("referrer_code_history").select("referrer_id").eq("code", code).maybeSingle(),
  ]);
  if (live || retired) return NextResponse.json({ error: "That link name is taken." }, { status: 409 });

  const { error } = await admin.from("referrers").insert({
    id: user.id,
    code,
    display_name: (body.displayName ?? "").trim() || null,
    contact_email: user.email ?? null,
    payout_currency: (body.payoutCurrency ?? "USD").trim().toUpperCase().slice(0, 3),
  });
  if (error) {
    // The unique constraint is the real authority; the checks above are only a
    // friendlier first pass and can lose a race.
    if (error.code === "23505") return NextResponse.json({ error: "That link name is taken." }, { status: 409 });
    console.error("[referral/register]", error.message);
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, code });
}