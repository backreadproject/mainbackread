import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, isLocked } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { getLocale } from "@/lib/locale-server";
import { observeProfile } from "@/lib/observed";
import { readProfile } from "@/lib/buyer-profile";
import { OBJECTIVES } from "@/lib/buyer-questions";
import { allCriteria, nothingToSearchOn, type ProspectFilters } from "@/lib/search-criteria";
import { loadBrandingDefaults, type Branding } from "@/lib/report-cache";
import {
  ProfileReport, ALL_PROFILE_SECTIONS,
  type ProfileSections, type ProfileReportData,
} from "@/lib/pdf/ProfileReport";
import type { GapOutput } from "@/lib/ai/tasks/gap";

export const runtime = "nodejs";
// No model call. Every section already exists: the passes were run when the
// profile was built, the criteria are a deterministic mapping, the counts are
// signals, and the gap analysis is whatever was last stored. So this renders
// and returns, and there is nothing to cache.
export const maxDuration = 60;

const EMPTY_FILTERS: ProspectFilters = {
  titles: [], excludeTitles: [], headcount: "", industries: [], excludeIndustries: [],
  geographies: [], technologies: [], keywords: [], hiringSignals: [], fundingStages: [], searchStrings: [],
};

type Body = {
  profileId?: string;
  reporter?: string;
  recipient?: string;
  recipientKind?: "person" | "department" | "organisation";
  companyName?: string;
  note?: string;
  sections?: Partial<ProfileSections>;
  headerText?: string;
  footerText?: string;
  signature?: boolean;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const profileId = (body.profileId ?? "").trim();
  if (!profileId) return NextResponse.json({ error: "No profile given." }, { status: 400 });

  // Ownership through RLS: this read runs as the signed in user, so a profile
  // they cannot see returns nothing.
  const { data: profileRow } = await supabase
    .from("buyer_profiles")
    .select("id, name, objective, threshold")
    .eq("id", profileId)
    .maybeSingle();
  if (!profileRow) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (isLocked(ctx)) {
    return NextResponse.json({ error: "Your trial has ended. Choose a plan to keep exporting.", trialEnded: true }, { status: 402 });
  }
  if (!hasFeature(ctx.plan.id, "reports") || !hasFeature(ctx.plan.id, "icp")) {
    return NextResponse.json({
      error: "Exporting a buyer profile is available on Personal and above.",
      upgrade: true,
    }, { status: 402 });
  }

  const { data: rev } = await supabase
    .from("icp_profiles")
    .select("id, revision, branch, output")
    .eq("profile_id", profileId)
    .eq("status", "complete")
    .eq("source", "asserted")
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rev) {
    return NextResponse.json(
      { error: "This profile has not been generated yet, so there is nothing to export." },
      { status: 400 },
    );
  }

  const locale = await getLocale();
  const threshold = (profileRow.threshold as number) ?? 20;
  const profile = readProfile(rev.output);
  const observed = await observeProfile(supabase, profileId, threshold, true);

  const { data: docs } = await supabase
    .from("documents")
    .select("title")
    .eq("buyer_profile_id", profileId);

  // The gap analysis as it stands. Never generated here: a report is a record
  // of what is known, not an occasion to spend money on new analysis.
  const { data: gapRow } = await admin
    .from("buyer_gap_runs")
    .select("output, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const filters: ProspectFilters = profile.find
    ? ({ ...EMPTY_FILTERS, ...profile.find.filters } as ProspectFilters)
    : EMPTY_FILTERS;
  const platforms = profile.find && !nothingToSearchOn(filters) ? allCriteria(filters, locale) : [];

  try {
    const saved = await loadBrandingDefaults(admin, user.id);

    // Fetched and inlined rather than linked. The renderer decides format from
    // the path, and the cache-buster leaves the URL ending in a query string,
    // so a perfectly good PNG would still be dropped.
    let logoData: string | null = null;
    if (saved.logoUrl) {
      try {
        const res = await fetch(saved.logoUrl);
        const type = res.headers.get("content-type") || "";
        if (!res.ok) console.warn("[profile-report] logo fetch returned", res.status);
        else if (!/image\/(png|jpe?g)/.test(type)) console.warn("[profile-report] logo is", type, "which a PDF cannot carry. Skipped.");
        else {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length < 2_000_000) logoData = "data:" + type + ";base64," + buf.toString("base64");
          else console.warn("[profile-report] logo too large, skipped:", buf.length);
        }
      } catch (e) {
        console.warn("[profile-report] logo fetch failed:", e instanceof Error ? e.message : String(e));
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

    const objective = OBJECTIVES.find((o) => o.id === (profileRow.objective as string));

    const data: ProfileReportData = {
      profileName: profileRow.name as string,
      objectiveLabel: objective ? (locale === "fr" ? objective.fr : objective.en) : (profileRow.objective as string),
      revision: (rev.revision as number) ?? null,
      hypothesis: rev.branch === "startup",
      profile,
      observed,
      gap: (gapRow?.output as GapOutput | undefined) ?? null,
      gapAt: (gapRow?.created_at as string | undefined) ?? null,
      threshold,
      documentTitles: (docs ?? []).map((d) => (d.title as string) ?? "Untitled"),
      platforms,
    };

    const element = React.createElement(ProfileReport, {
      data,
      generatedAt: new Date(),
      branding,
      sections: { ...ALL_PROFILE_SECTIONS, ...(body.sections ?? {}) },
    }) as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    const safe = (profileRow.name as string).replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "buyer profile";
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${safe} - buyer profile ${stamp}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[profile-report] failed", { profileId, error: msg });
    return NextResponse.json({ error: "Could not build the report: " + msg }, { status: 500 });
  }
}
