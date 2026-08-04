import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, requirePaidAccess } from "@/lib/plan-context";
import { hasFeature, getLimit, withinLimit } from "@/lib/plans";
import { readNotify } from "@/lib/profile-watch";
import { isSampleId } from "@/lib/sample-profile";

export const runtime = "nodejs";

/**
 * Buyer profiles: the named things. Revisions live in icp_profiles and are
 * handled by /api/icp, which runs the passes and holds a 60 second AI budget.
 * Keeping the two apart means the plan cap has exactly one home, and a route
 * that lists profiles is not also a route that spends money.
 *
 * The cap counts PROFILES, never revisions. Re-answering the questionnaire
 * creates a revision, so a customer who refines their thinking four times has
 * used one slot, not four.
 */

const OBJECTIVES = ["outbound", "client", "investor", "partnership", "recruiting", "retail", "nonprofit"] as const;
const CADENCES = ["daily", "weekly", "monthly", "manual"] as const;
type Objective = (typeof OBJECTIVES)[number];
type Cadence = (typeof CADENCES)[number];

type Scope = { personal: boolean; orgId: string | null };

const COLS =
  "id, name, objective, cadence, threshold, archived_at, created_at, updated_at, owner_id, organization_id, created_by";

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { err: NextResponse.json({ error: "Sign in again." }, { status: 401 }) };
  }
  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(ctx.plan.id, "icp")) {
    return {
      err: NextResponse.json(
        { error: "Buyer profiles are on the Personal plan and above.", upgrade: true },
        { status: 402 },
      ),
    };
  }
  const scope: Scope =
    ctx.scope === "org" && ctx.orgId
      ? { personal: false, orgId: ctx.orgId }
      : { personal: true, orgId: null };
  return { supabase, admin, user, ctx, scope };
}

/** Scopes any query to the caller's own rows or their organisation's. */
function scoped<T>(q: T, scope: Scope, userId: string): T {
  const qq = q as unknown as {
    eq: (c: string, v: string) => unknown;
    is: (c: string, v: null) => unknown;
  };
  return (
    scope.personal
      ? (qq.eq("owner_id", userId) as { is: (c: string, v: null) => unknown }).is("organization_id", null)
      : qq.eq("organization_id", scope.orgId as string)
  ) as T;
}

export async function GET() {
  const c = await context();
  if ("err" in c) return c.err;
  const { supabase, user, ctx, scope } = c;

  const { data, error } = await scoped(
    supabase.from("buyer_profiles").select(COLS),
    scope,
    user.id,
  ).order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load profiles." }, { status: 500 });
  }

  const rows = data ?? [];
  const limit = getLimit(ctx.plan.id, "buyerProfiles");

  return NextResponse.json({
    profiles: rows,
    scope: scope.personal ? "personal" : "org",
    limit,
    used: rows.length,
    canAdd: withinLimit(rows.length, limit),
  });
}

export async function POST(req: NextRequest) {
  const c = await context();
  if ("err" in c) return c.err;
  const { supabase, admin, user, ctx, scope } = c;

  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";

  // Creating spends nothing, but it is a create action and a lapsed account
  // should not be able to grow its workspace. Reads stay open, as elsewhere.
  if (action === "create") {
    const gate = await requirePaidAccess(admin, user.id);
    if (gate.refusal) return NextResponse.json(gate.refusal.body, { status: gate.refusal.status });
  }

  if (action === "create") {
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (!name) return NextResponse.json({ error: "Give the profile a name." }, { status: 400 });

    const objective: Objective = OBJECTIVES.includes(body.objective) ? body.objective : "outbound";

    // Counted at START, not at generate: refusing after someone has answered
    // fourteen questions is the wrong place to refuse.
    const { count, error: cErr } = await scoped(
      supabase.from("buyer_profiles").select("id", { count: "exact", head: true }),
      scope,
      user.id,
    );
    if (cErr) return NextResponse.json({ error: "Could not check your plan." }, { status: 500 });

    const limit = getLimit(ctx.plan.id, "buyerProfiles");
    if (!withinLimit(count ?? 0, limit)) {
      return NextResponse.json(
        {
          error:
            "You are using all " +
            String(limit) +
            " buyer profiles on the " +
            ctx.plan.name +
            " plan. Delete one to free a slot" +
            (ctx.plan.id === "business" ? "." : ", or move up a plan."),
          limitReached: true,
          limit,
          used: count ?? 0,
        },
        { status: 402 },
      );
    }

    const { data, error } = await supabase
      .from("buyer_profiles")
      .insert({
        owner_id: scope.personal ? user.id : null,
        organization_id: scope.personal ? null : scope.orgId,
        created_by: user.id,
        name,
        objective,
      })
      .select(COLS)
      .single();

    if (error) return NextResponse.json({ error: "Could not create: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data });
  }

  const id = typeof body.id === "string" ? body.id : "";
  // The example belongs to nobody and has no rows behind it.
  if (isSampleId(id)) {
    return NextResponse.json(
      { error: "The sample profile is an example. Build your own to change anything." },
      { status: 403 },
    );
  }
  if (!id) return NextResponse.json({ error: "Which profile?" }, { status: 400 });

  // RLS is the authorisation. A profile the caller cannot see returns no row,
  // and the update or delete below simply matches nothing.
  const { data: existing } = await scoped(
    supabase.from("buyer_profiles").select("id, objective"),
    scope,
    user.id,
  ).eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "No such profile." }, { status: 404 });
  const existingObjective = (existing as { objective?: string }).objective;

  if (action === "update") {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.name === "string") {
      const name = body.name.trim().slice(0, 120);
      if (!name) return NextResponse.json({ error: "Give the profile a name." }, { status: 400 });
      patch.name = name;
    }
    if (OBJECTIVES.includes(body.objective) && body.objective !== undefined) {
      // The objective decides which questions get asked, so changing it after
      // the answers exist would leave a profile generated from questions it no
      // longer claims to have asked. Changing your objective is a re-answer.
      const { data: done } = await supabase
        .from("icp_profiles").select("id")
        .eq("profile_id", id).eq("status", "complete").limit(1).maybeSingle();
      if (done && body.objective !== existingObjective) {
        return NextResponse.json(
          { error: "This profile has already been generated. Re-answer the questions to change its objective." },
          { status: 409 },
        );
      }
      patch.objective = body.objective as Objective;
    }
    if (CADENCES.includes(body.cadence)) {
      if (body.cadence === "daily" && ctx.plan.id !== "business") {
        return NextResponse.json(
          { error: "Daily re-checks are on the Business plan.", upgrade: true },
          { status: 402 },
        );
      }
      patch.cadence = body.cadence as Cadence;
    }

    // Normalised on the way in, so a stale client cannot write a shape the
    // watcher does not understand.
    if (body.notify && typeof body.notify === "object") patch.notify = readNotify(body.notify);
    if (typeof body.threshold === "number") {
      // Below about twenty engaged readers any pattern is noise. The floor of 5
      // exists so a customer testing the feature can see it work, not so anyone
      // can plan against four people.
      patch.threshold = Math.max(5, Math.min(200, Math.round(body.threshold)));
    }

    const { data, error } = await supabase
      .from("buyer_profiles")
      .update(patch)
      .eq("id", id)
      .select(COLS)
      .single();

    if (error) return NextResponse.json({ error: "Could not save: " + error.message }, { status: 400 });
    return NextResponse.json({ profile: data });
  }

  if (action === "delete") {
    // Revisions cascade. Documents do not: buyer_profile_id is ON DELETE SET
    // NULL, so a document keeps working and simply stops being measured.
    const { error } = await supabase.from("buyer_profiles").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Could not delete: " + error.message }, { status: 400 });
    return NextResponse.json({ ok: true, deleted: id });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
