import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, requirePaidAccess } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { getLocale } from "@/lib/locale-server";
import { runGapFor, GapFailed } from "@/lib/gap-run";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Running the gap analysis on request.
 *
 * The work itself lives in lib/gap-run, because the scheduled watcher runs
 * the identical analysis with no session. Two implementations would drift,
 * and the bell would announce a finding this page then disagreed with.
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(ctx.plan.id, "icp")) {
    return NextResponse.json({ error: "Buyer profiles are on the Personal plan and above.", upgrade: true }, { status: 402 });
  }
  const gate = await requirePaidAccess(admin, user.id);
  if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });

  const body = await req.json().catch(() => ({}));
  const profileId = typeof body.profileId === "string" ? body.profileId : "";
  const refresh = body.refresh === true;
  if (!profileId) return NextResponse.json({ error: "Which profile?" }, { status: 400 });

  const locale = await getLocale();

  try {
    // The session client reads, so RLS decides what this caller may see.
    const result = await runGapFor(supabase, admin, profileId, { refresh, locale });
    if ("refusal" in result) {
      return NextResponse.json({ refusal: result.refusal, summary: result.summary });
    }
    return NextResponse.json({
      run: result.run,
      previous: result.previous,
      cached: result.cached,
      unsaved: result.unsaved ?? false,
    });
  } catch (e) {
    if (e instanceof GapFailed) {
      return NextResponse.json({ error: e.message }, { status: e.message.startsWith("No such") ? 404 : 502 });
    }
    throw e;
  }
}
