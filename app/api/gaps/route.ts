import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePaidAccess } from "@/lib/plan-context";
import { runAI, gapsTask } from "@/lib/ai";
import { getLocale } from "@/lib/locale-server";
import { createHash } from "crypto";

export const runtime = "nodejs";
// One reason-tier call over a document. Well inside the Hobby ceiling.
export const maxDuration = 60;

// What this document does not answer.
//
// The only surface that helps BEFORE a send, which makes it the first thing a
// customer with no readers yet can get value from.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const documentId = typeof body.documentId === "string" ? body.documentId : "";
  if (!documentId) return NextResponse.json({ error: "Which document?" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  // RLS decides visibility: read through the SESSION client, so grants and org
  // roles apply without a second permission model.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, extracted_text")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No such document." }, { status: 404 });

  const text = (doc.extracted_text ?? "").trim();
  if (text.length < 200) {
    return NextResponse.json({
      error: "There is not enough text in this document to read it properly yet. If it is a scan or an image, give the text extraction a moment and try again.",
      notReady: true,
    }, { status: 400 });
  }

  // The evidence half. Questions this customer's OWN readers have asked, across
  // every document they can see -- which is what turns "a reader might ask
  // about pricing" into "your readers keep asking this, and this document does
  // not answer it". Empty on a first document, and the task says so honestly
  // rather than implying evidence it does not have.
  const { data: docs } = await supabase.from("documents").select("id");
  const docIds = (docs ?? []).map((d) => d.id);
  let askedBefore: string[] = [];
  if (docIds.length) {
    const { data: recs } = await admin.from("recipients").select("id").in("document_id", docIds);
    const recIds = (recs ?? []).map((r) => r.id);
    if (recIds.length) {
      const { data: qs } = await admin
        .from("signals")
        .select("value, created_at")
        .eq("kind", "question")
        .in("recipient_id", recIds)
        .order("created_at", { ascending: false })
        .limit(60);
      const seen = new Set<string>();
      for (const s of qs ?? []) {
        const v = s.value as { text?: string } | null;
        const q = (v?.text ?? "").trim();
        // Deduplicated case-insensitively: the same question asked by four
        // readers is one pattern, and repeating it four times in the prompt
        // just spends tokens saying the same thing.
        const key = q.toLowerCase();
        if (q.length > 3 && !seen.has(key)) { seen.add(key); askedBefore.push(q); }
      }
    }
  }

  const locale = await getLocale();

  // Cached on the document text plus the question set: re-reading an unchanged
  // document is free, and it becomes a fresh call only when the document
  // changes or new questions have arrived.
  const fingerprint = createHash("sha256")
    .update(text.slice(0, 12000) + "|" + askedBefore.join("|") + "|" + locale)
    .digest("hex")
    .slice(0, 32);

  if (body.refresh !== true) {
    const { data: hit } = await admin
      .from("gaps_cache")
      .select("output")
      .eq("document_id", documentId)
      .eq("fingerprint", fingerprint)
      .maybeSingle();
    if (hit?.output) return NextResponse.json({ ok: true, gaps: hit.output, cached: true });
  }

  try {
    const { data } = await runAI(gapsTask, {
      documentTitle: doc.title,
      // The largest cost lever here, same ceiling the report uses.
      documentText: text.slice(0, 12000),
      askedBefore,
      locale,
    }, { documentId });

    await admin.from("gaps_cache").upsert({
      document_id: documentId,
      fingerprint,
      output: data,
      question_count: askedBefore.length,
    }, { onConflict: "document_id,fingerprint" });

    return NextResponse.json({ ok: true, gaps: data, cached: false, basedOn: askedBefore.length });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Could not read the document.",
    }, { status: 500 });
  }
}