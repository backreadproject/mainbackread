import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, isLocked } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { runAI, reportTask } from "@/lib/ai";
import { assembleReport } from "@/lib/report-data";
import { ReportDocument, ALL_SECTIONS, type ReportSections } from "@/lib/pdf/ReportDocument";
import { reportFingerprint, getCachedReport, putCachedReport, loadBrandingDefaults, type Branding } from "@/lib/report-cache";
export const runtime = "nodejs";
// One model call plus PDF rendering. Assembly is fast; the call is the cost.
export const maxDuration = 60;
// Produces the report a customer forwards to their own boss.
//
// Contract: { documentId, recipientIds?: string[] }
// Omitting recipientIds means every reader of the document.
type Body = {
  documentId?: string;
  recipientIds?: string[];
  /** Cover details. Reporter and recipient are per report; company name and
   *  logo fall back to the saved settings when not given. */
  reporter?: string;
  recipient?: string;
  recipientKind?: "person" | "department" | "organisation";
  companyName?: string;
  note?: string;
  /** Force a fresh synthesis even when the cache is valid. */
  refresh?: boolean;
  /** Which sections to print. Presentation only: the analysis is unchanged, so
   *  the cache is shared across every combination. */
  sections?: Partial<ReportSections>;
  headerText?: string;
  footerText?: string;
  /** Remove the ReadProspects line from the footer. */
  signature?: boolean;
};
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
    // The model call is the cost; rendering is nearly free. Caching the
    // SYNTHESIS rather than the PDF means changing the logo or the recipient
    // re-renders the same analysis for nothing, which is what lets reports go
    // un-quota'd: we pay once per change in the underlying data, not per
    // download.
    const fingerprint = await reportFingerprint(admin, documentId, ids);
    let report = body.refresh ? null : await getCachedReport(admin, documentId, fingerprint);
    if (!report) {
      const run = await runAI(reportTask, assembled.input, { documentId });
      report = run.data;
      await putCachedReport(admin, documentId, fingerprint, report, assembled.detail.length);
    }

    const saved = await loadBrandingDefaults(admin, user.id);

    // Fetched and inlined rather than linked. The renderer decides format from
    // the path, and our cache-buster leaves the URL ending in a query string,
    // so a perfectly good PNG would still be dropped.
    let logoData: string | null = null;
    if (saved.logoUrl) {
      try {
        const res = await fetch(saved.logoUrl);
        const type = res.headers.get("content-type") || "";
        if (!res.ok) {
          console.warn("[report] logo fetch returned", res.status);
        } else if (!/image\/(png|jpe?g)/.test(type)) {
          // WebP and friends are not supported by the PDF renderer. Skipping is
          // better than emitting a document that fails to open.
          console.warn("[report] logo is", type, "which a PDF cannot carry. Skipped.");
        } else {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length < 2_000_000) logoData = "data:" + type + ";base64," + buf.toString("base64");
          else console.warn("[report] logo too large, skipped:", buf.length);
        }
      } catch (e) {
        console.warn("[report] logo fetch failed:", e instanceof Error ? e.message : String(e));
      }
    }
    const branding: Branding = {
      companyName: (body.companyName ?? "").trim() || saved.companyName,
      logoUrl: logoData,
      reporter: (body.reporter ?? "").trim() || saved.defaultReporter || user.email || null,
      recipient: (body.recipient ?? "").trim() || null,
      recipientKind: body.recipientKind ?? null,
      note: (body.note ?? "").trim() || null,
      headerText: (body.headerText ?? "").trim() || null,
      footerText: (body.footerText ?? "").trim() || null,
      signature: body.signature !== false,
    };

    const element = React.createElement(ReportDocument, {
      report,
      data: assembled,
      generatedFor: user.email ?? "",
      generatedAt: new Date(),
      branding,
      sections: { ...ALL_SECTIONS, ...(body.sections ?? {}) },
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