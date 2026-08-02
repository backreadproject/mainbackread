import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stampDocument, appendPages, StampSigner } from "@/lib/pdf/compose";
import { SignatureCertificate, CertSigner } from "@/lib/pdf/SignatureCertificate";

export const runtime = "nodejs";
export const maxDuration = 60;

// The signed document.
//
// Composed on demand and cached, exactly like the report engine: the render is
// the cost, and doing it inside /api/sign would leave the last signer watching
// a spinner on a legal document while a serverless function decides whether to
// freeze an un-awaited promise.
//
// Two callers, two credentials. The sender arrives with a session and RLS
// proves ownership. A signer arrives with their share token, the same
// credential that let them sign. Nobody else gets it.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("token") || "").trim();
  const documentId = (url.searchParams.get("documentId") || "").trim();
  const admin = createAdminClient();

  let docId = "";
  if (token) {
    const { data: rec } = await admin
      .from("recipients")
      .select("document_id, is_signer, revoked_at")
      .eq("share_token", token)
      .maybeSingle();
    if (!rec || !rec.is_signer || rec.revoked_at) {
      return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 });
    }
    docId = rec.document_id as string;
  } else if (documentId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    const { data: doc } = await supabase.from("documents").select("id").eq("id", documentId).maybeSingle();
    if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });
    docId = documentId;
  } else {
    return NextResponse.json({ error: "Nothing requested." }, { status: 400 });
  }

  const { data: doc } = await admin
    .from("documents")
    .select("id, title, owner_id, storage_path, signed_storage_path, signing_completed_at")
    .eq("id", docId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });
  if (!doc.signing_completed_at) {
    return NextResponse.json({ error: "This document is not fully signed yet." }, { status: 409 });
  }

  const serve = (bytes: Uint8Array) =>
    new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="' +
          String(doc.title || "document").replace(/[^\w\- ]+/g, "").slice(0, 60) + ' (signed).pdf"',
        "cache-control": "private, no-store",
      },
    });

  // Already composed: serve the stored copy. The signed document must be the
  // same bytes every time it is fetched, or two people comparing downloads see
  // two different artefacts.
  if (doc.signed_storage_path) {
    const { data: cached } = await admin.storage.from("documents").download(doc.signed_storage_path as string);
    if (cached) return serve(new Uint8Array(await cached.arrayBuffer()));
  }

  if (!doc.storage_path) {
    return NextResponse.json({ error: "The original file is missing." }, { status: 500 });
  }
  const { data: file } = await admin.storage.from("documents").download(doc.storage_path as string);
  if (!file) return NextResponse.json({ error: "The original file could not be read." }, { status: 500 });
  const original = new Uint8Array(await file.arrayBuffer());
  const fingerprint = createHash("sha256").update(original).digest("hex");

  const { data: recs } = await admin
    .from("recipients")
    .select("id, label, first_name, last_name, email, signed_email, signed_at, signed_ip, signature_kind, signature_data")
    .eq("document_id", docId)
    .eq("is_signer", true)
    .order("signed_at", { ascending: true });

  const { data: fields } = await admin
    .from("signature_fields")
    .select("page, x, y, w, h, kind, date_mode, value, recipient_id")
    .eq("document_id", docId);

  const nameOf = (r: Record<string, unknown>) =>
    String(r.label || [r.first_name, r.last_name].filter(Boolean).join(" ") || r.signed_email || r.email || "Signer");

  const map = new Map<string, StampSigner>();
  (recs ?? []).forEach((r) => map.set(r.id as string, {
    id: r.id as string,
    name: nameOf(r),
    signed_at: (r.signed_at as string) ?? null,
    signature_data: (r.signature_data as string) ?? null,
  }));

  const stamped = await stampDocument(original, (fields ?? []) as never[], map);

  const certSigners: CertSigner[] = (recs ?? []).map((r) => ({
    name: nameOf(r),
    email: (r.signed_email as string) || (r.email as string) || null,
    method: r.signature_kind === "typed" ? "Typed" : r.signature_kind === "drawn" ? "Drawn" : "Uploaded image",
    signedAt: (r.signed_at as string) ?? null,
    ip: (r.signed_ip as string) ?? null,
  }));

  const cert = await renderToBuffer(
    SignatureCertificate({
      reference: "RP-SIG-" + String(doc.id).replace(/-/g, "").slice(0, 8).toUpperCase(),
      title: String(doc.title || "Document"),
      completedAt: String(doc.signing_completed_at),
      signers: certSigners,
    }) as React.ReactElement<DocumentProps>,
  );

  const final = await appendPages(stamped, new Uint8Array(cert));

  // Stored so the bytes never change. If two signers race, one write wins and
  // the loser has produced an identical document, so nothing is lost.
  const path = String(doc.owner_id) + "/signed/" + String(doc.id) + ".pdf";
  await admin.storage.from("documents").upload(path, Buffer.from(final), {
    contentType: "application/pdf", upsert: true,
  });
  await admin.from("documents").update({ signed_storage_path: path }).eq("id", docId);

  return serve(final);
}