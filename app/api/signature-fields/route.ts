import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";

export const runtime = "nodejs";

type Incoming = {
  recipientId: string;
  page: number;
  x: number; y: number; w: number; h: number;
  kind: "signature" | "date" | "text";
  dateMode?: "signed" | "chosen";
};

const KINDS = new Set(["signature", "date", "text"]);
const MAX_FIELDS = 60;

// Where each signer signs.
//
// The whole set is replaced on every save rather than diffed. The list is
// small, the placement screen holds the truth while it is open, and a diff
// would mean tracking which box on screen belongs to which row -- complexity
// with no benefit at this size.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  const incoming = Array.isArray(body.fields) ? (body.fields as Incoming[]) : null;
  if (!documentId || !incoming) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  if (incoming.length > MAX_FIELDS) return NextResponse.json({ error: "Too many fields." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  // RLS proves ownership: if the session client can see the document, the
  // caller may place fields on it.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, signing_enabled")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });
  if (!doc.signing_enabled) {
    return NextResponse.json({ error: "This document was not set up for signatures." }, { status: 400 });
  }

  // Every field must belong to a signer ON THIS DOCUMENT. Without this check a
  // crafted request could attach a signature box to someone else's recipient.
  const { data: signers } = await admin
    .from("recipients")
    .select("id")
    .eq("document_id", documentId)
    .eq("is_signer", true);
  const valid = new Set((signers ?? []).map((s) => s.id as string));

  const rows = [];
  for (const f of incoming) {
    if (!valid.has(f.recipientId)) {
      return NextResponse.json({ error: "A field was placed for someone who is not a signer here." }, { status: 400 });
    }
    if (!KINDS.has(f.kind)) return NextResponse.json({ error: "Unknown field type." }, { status: 400 });
    const page = Math.round(Number(f.page));
    if (!Number.isFinite(page) || page < 1) return NextResponse.json({ error: "Bad page." }, { status: 400 });
    const nums = [f.x, f.y, f.w, f.h].map(Number);
    if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 1)) {
      return NextResponse.json({ error: "Bad coordinates." }, { status: 400 });
    }
    rows.push({
      document_id: documentId,
      recipient_id: f.recipientId,
      page, x: nums[0], y: nums[1], w: nums[2], h: nums[3],
      kind: f.kind,
      // Only meaningful on a date field, and defaulted rather than left null
      // so the stamping code never has to guess what an absent mode means.
      date_mode: f.kind === "date" ? (f.dateMode === "chosen" ? "chosen" : "signed") : null,
    });
  }

  // Replace: delete then insert. A signed document should never have its field
  // positions moved underneath the signature, so refuse once anyone has signed.
  const { data: signed } = await admin
    .from("recipients")
    .select("id")
    .eq("document_id", documentId)
    .not("signed_at", "is", null)
    .limit(1);
  if ((signed ?? []).length > 0) {
    return NextResponse.json({
      error: "Someone has already signed this document, so the fields cannot be moved.",
    }, { status: 409 });
  }

  await admin.from("signature_fields").delete().eq("document_id", documentId);
  if (rows.length) {
    const { error } = await admin.from("signature_fields").insert(rows);
    if (error) return NextResponse.json({ error: "Could not save the fields." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}