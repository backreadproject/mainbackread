import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, isLocked } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { runAI, reportTask } from "@/lib/ai";
import { assembleReport } from "@/lib/report-data";
import { ReportDocument } from "@/lib/pdf/ReportDocument";
export const runtime = "nodejs";
// One model call plus PDF rendering. Assembly is fast; the call is the cost.
export const maxDuration = 60;
// Produces the report a customer forwards to their own boss.
//
// Contract: { documentId, recipientIds?: string[] }
// Omitting recipientIds means every reader of the document.
type Body = { documentId?: string; recipientIds?: string[] };
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const documentId = (body.documentId ?? "").trim();
  if (!documentId) return NextResponse.json({ error: "No document given." }, { status: 400 });

  // Ownership through RLS: this read runs as the signed-in user, so a document
  // they cannot see returns nothing. The admin client below is only used after
  // this has proven access.
  const { data: docRow } = await supabase
    .from("documents")
    .select("id, title")
    .eq("id", documentId)
    .maybeSingle();
  if (!docRow) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (isLocked(ctx)) {
    return NextResponse.json({ error: "Your trial has ended. Choose a plan to keep generating reports.", trialEnded: true }, { status: 402 });
  }
  if (!hasFeature(ctx.plan.id, "reports")) {
    return NextResponse.json({
      error: "Reports are available on Personal and above. Your document data is all still here \u2014 upgrading turns it into a report.",
      upgrade: true,
    }, { status: 402 });
  }

  const ids = Array.isArray(body.recipientIds) && body.recipientIds.length ? body.recipientIds : null;
  const assembled = await assembleReport(admin, documentId, ids);
  if (!assembled) {
    return NextResponse.json({ error: "Nobody has been sent this document yet, so there is nothing to report on." }, { status: 400 });
  }

  try {
    const { data: report } = await runAI(reportTask, assembled.input, { documentId });
    const element = React.createElement(ReportDocument, {
      report,
      data: assembled,
      generatedFor: user.email ?? "",
      generatedAt: new Date(),
    }) as React.ReactElement<DocumentProps>;
    // renderToBuffer rather than a stream: the document is small, and a stream
    // that fails halfway produces a corrupt file the customer cannot diagnose.
    const buffer = await renderToBuffer(element);

    const safe = assembled.documentTitle.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "report";
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${safe} - reading report ${stamp}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[report] failed", { documentId, readers: assembled.detail.length, error: msg });
    return NextResponse.json({ error: "Could not build the report: " + msg }, { status: 500 });
  }
}