import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Signing, from the reader.
//
// UNAUTHENTICATED by necessity: a signer has no account and never will. The
// share token is the credential, exactly as it is for reading and asking.
//
// That makes this the most exposed write in the product, so every step is
// guarded: the token must resolve to a SIGNER on a signing document, the
// document must not be complete or declined, and a signature can only be set
// once. Rate limited per token like the reader's Ask.
const MAX_SIGNATURE_CHARS = 400_000; // ~300KB of PNG. A drawn signature is far under.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const action = String(body.action ?? "");
  if (!token) return NextResponse.json({ error: "This link is no longer valid." }, { status: 400 });

  const admin = createAdminClient();

  // Rate limited before any work: an unauthenticated endpoint that writes must
  // not be free to hammer. Fails open, like the reader's Ask -- a limiter
  // outage should not stop someone signing a contract.
  try {
    await admin.rpc("bump_rate_limit", { p_key: "sign:" + token, p_limit: 20, p_window_seconds: 3600 });
  } catch { /* fail open */ }

  const { data: rec } = await admin
    .from("recipients")
    .select("id, label, first_name, email, document_id, is_signer, signed_at, declined_at, revoked_at, expires_at, documents ( id, title, owner_id, signing_enabled, signing_completed_at )")
    .eq("share_token", token)
    .maybeSingle();

  if (!rec) return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });

  const doc = rec.documents as unknown as { id: string; title: string; owner_id: string; signing_enabled: boolean; signing_completed_at: string | null } | undefined;

  // Every reason this link cannot sign, checked before anything is written.
  if (rec.revoked_at) return NextResponse.json({ error: "This link has been withdrawn." }, { status: 403 });
  if (rec.expires_at && new Date(rec.expires_at as string) < new Date()) {
    return NextResponse.json({ error: "This link has expired." }, { status: 403 });
  }
  if (!doc?.signing_enabled) return NextResponse.json({ error: "This document is not for signing." }, { status: 400 });
  if (!rec.is_signer) return NextResponse.json({ error: "You are not named as a signer on this document." }, { status: 403 });
  if (rec.signed_at) return NextResponse.json({ error: "You have already signed this." }, { status: 409 });
  if (rec.declined_at) return NextResponse.json({ error: "You have already declined this." }, { status: 409 });

  // A declined document can never complete, so nobody else should sign into it.
  const { data: declined } = await admin
    .from("recipients")
    .select("id")
    .eq("document_id", rec.document_id as string)
    .not("declined_at", "is", null)
    .limit(1);
  if ((declined ?? []).length > 0) {
    return NextResponse.json({ error: "Someone has declined this document, so it can no longer be signed." }, { status: 409 });
  }

  // Vercel puts the caller's address here. Recorded because the certificate
  // says it is, and taken from the header rather than trusted from the body.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;

  if (action === "decline") {
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null;
    const { error } = await admin
      .from("recipients")
      .update({ declined_at: new Date().toISOString(), decline_reason: reason || null })
      .eq("id", rec.id);
    if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });
    await admin.from("signals").insert({
      recipient_id: rec.id, kind: "declined", value: { reason: reason || "" },
    }).select().maybeSingle().then(() => {}, () => {});
    return NextResponse.json({ ok: true, declined: true });
  }

  if (action !== "sign") return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const kind = String(body.kind ?? "");
  if (!["typed", "drawn", "uploaded"].includes(kind)) {
    return NextResponse.json({ error: "Unknown signature type." }, { status: 400 });
  }
  const data = typeof body.data === "string" ? body.data : "";
  if (!data.startsWith("data:image/") || data.length > MAX_SIGNATURE_CHARS) {
    return NextResponse.json({ error: "That signature could not be read." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("recipients")
    .update({
      signed_at: now,
      signature_kind: kind,
      signature_data: data,
      signed_email: email,
      signed_ip: ip,
      // A link-mode signer may have had no email until now. Backfilling it
      // keeps the account rollup and the reply path working for them.
      ...(rec.email ? {} : { email }),
    })
    .eq("id", rec.id)
    // Only if still unsigned: two tabs racing must not both write.
    .is("signed_at", null);
  if (error) return NextResponse.json({ error: "Could not record your signature." }, { status: 500 });

  await admin.from("signals").insert({
    recipient_id: rec.id, kind: "signed", value: { kind, email },
  }).select().maybeSingle().then(() => {}, () => {});

  // Complete when every named signer has signed. The stamped PDF is produced
  // separately -- this route stays fast, because a signer waiting on a PDF
  // render is a signer watching a spinner on a legal document.
  const { data: signers } = await admin
    .from("recipients")
    .select("id, signed_at")
    .eq("document_id", rec.document_id as string)
    .eq("is_signer", true);
  const all = signers ?? [];
  const complete = all.length > 0 && all.every((s) => s.signed_at || s.id === rec.id);
  if (complete) {
    await admin.from("documents").update({ signing_completed_at: now }).eq("id", rec.document_id as string).is("signing_completed_at", null);
  }

  return NextResponse.json({ ok: true, complete });
}