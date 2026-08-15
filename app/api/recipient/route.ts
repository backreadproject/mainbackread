import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { isRoleId } from "@/lib/roles";

export const runtime = "nodejs";

/**
 * Edit a reader: who they are, and what their link is called.
 *
 * Company and roles feed the buyer profile. Company is the strongest of the
 * three grouping edges in lib/accounts.ts, because a human asserted it rather
 * than a string being pattern-matched; roles are what personas are matched
 * against.
 *
 * The custom slug is an ALIAS on top of share_token, never a replacement. The
 * token keeps resolving, so a link already sent stays live through the edit.
 * Uniqueness is global because /read/ is one flat namespace shared across
 * every customer on the reader domain.
 *
 * Authorization follows /api/outcome exactly: read the recipient with the
 * ADMIN client to learn its document, read that document with the SESSION
 * client so RLS decides entitlement, then write with admin. The recipients
 * table has SELECT and INSERT policies only, so an update through the session
 * client silently matches zero rows.
 */

const SLUG = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;
const TOKEN_SHAPED = /^[0-9a-f]{32}$/;

// Deliberately loose. This addresses a human in an email, it does not
// authenticate anyone, and rejecting a valid unusual address is worse than
// accepting a typo the sender can see and fix.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(error: string, field?: string, status = 400) {
  return NextResponse.json(field ? { error, field } : { error }, { status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  if (!recipientId) return bad("Which reader?");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad("Sign in again.", undefined, 401);

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const { data: rec } = await admin
    .from("recipients")
    .select("id, document_id, label, signed_at")
    .eq("id", recipientId)
    .maybeSingle();
  if (!rec) return bad("No such reader.", undefined, 404);

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", rec.document_id)
    .maybeSingle();
  if (!doc) return bad("No such reader.", undefined, 404);

  // Unknown ids are dropped rather than rejected: the library grows, and a
  // stale client must not be told its edit is invalid.
  const roles = Array.isArray(body.roles)
    ? Array.from(new Set(body.roles.filter((r: unknown): r is string => typeof r === "string" && isRoleId(r)))).slice(0, 6)
    : [];
  const roleOther = typeof body.roleOther === "string" && body.roleOther.trim()
    ? body.roleOther.trim().slice(0, 80)
    : null;
  const company = typeof body.company === "string" && body.company.trim()
    ? body.company.trim().slice(0, 120)
    : null;

  const patch: Record<string, unknown> = { roles, role_other: roleOther, company };

  // Name and email are frozen once a signature exists. signed_email on the
  // certificate is a separate captured fact, and the app disagreeing with a
  // PDF it issued is worse than an uncorrected typo.
  const signed = !!rec.signed_at;

  const firstName = typeof body.firstName === "string" && body.firstName.trim()
    ? body.firstName.trim().slice(0, 80)
    : null;
  const lastName = typeof body.lastName === "string" && body.lastName.trim()
    ? body.lastName.trim().slice(0, 80)
    : null;
  const email = typeof body.email === "string" && body.email.trim()
    ? body.email.trim().slice(0, 254)
    : null;

  if (!signed) {
    if (email && !EMAIL.test(email)) return bad("That does not look like an email address.", "email");
    // Label is what every surface displays. Derive it the same way
    // /api/share-prospect does at creation, and keep the existing one when
    // both name fields are cleared rather than blanking the reader.
    const derived = [firstName, lastName].filter(Boolean).join(" ").trim();
    patch.first_name = firstName;
    patch.last_name = lastName;
    patch.email = email;
    patch.label = derived || (rec.label as string | null) || null;
  }

  // Empty string clears the alias. There is no confirmation step because
  // nothing breaks: the token address was never switched off.
  const rawSlug = typeof body.customSlug === "string" ? body.customSlug.trim().toLowerCase() : "";
  if (rawSlug) {
    if (!SLUG.test(rawSlug)) {
      return bad("Use 3 to 48 lowercase letters, numbers or hyphens, not starting or ending with a hyphen.", "customSlug");
    }
    if (TOKEN_SHAPED.test(rawSlug)) {
      // The reader route resolves share_token first, so this address would be
      // silently unreachable rather than wrong, which is harder to diagnose.
      return bad("That address is not available.", "customSlug");
    }
  }
  patch.custom_slug = rawSlug || null;

  const { error } = await admin.from("recipients").update(patch).eq("id", recipientId);

  if (error) {
    // 23505 is the unique index on lower(custom_slug).
    if (error.code === "23505") {
      return bad(
        "That address is taken. Addresses are shared across everyone using the reader domain, so common words go early. Something with the client name in it will usually be free.",
        "customSlug",
        409
      );
    }
    if (error.code === "23514") {
      return bad("That address cannot be used.", "customSlug");
    }
    return bad("Could not save that.", undefined, 500);
  }

  return NextResponse.json({
    ok: true,
    roles,
    roleOther,
    company,
    firstName: signed ? undefined : firstName,
    lastName: signed ? undefined : lastName,
    email: signed ? undefined : email,
    customSlug: rawSlug || null,
  });
}
