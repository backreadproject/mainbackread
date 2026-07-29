import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/org-context";
import { isValidPlan, type PlanId } from "@/lib/plans";
import { startCheckout, type Interval } from "@/lib/billing";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { planId?: string; interval?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const planId = body.planId;
  if (!isValidPlan(planId)) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  const interval: Interval = body.interval === "annual" ? "annual" : "monthly";

  // An organization plan can only be bought by someone who runs one, and only
  // by its owner: the subscription is keyed to a single email forever, so an
  // admin buying it would tie the org's billing to their personal address.
  const ctx = await getOrgContext();
  const isOrgPlan = planId === "company_1" || planId === "company_2";
  if (isOrgPlan && ctx.accountType !== "organization") {
    return NextResponse.json({ error: "Create an organization first, then choose Team or Business." }, { status: 400 });
  }
  if (isOrgPlan && ctx.role !== "owner") {
    return NextResponse.json({ error: "Only the organization owner can change the plan." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, referred_by")
    .eq("id", user.id)
    .single();

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || null;
  const origin = new URL(req.url).origin;

  const result = await startCheckout({
    planId: planId as PlanId,
    interval,
    userId: user.id,
    email: user.email ?? "",
    name,
    // 10% off the first payment, monthly only. priceFor returns the list price
    // for annual regardless of this flag, and the flag still rides along in meta
    // because the webhook uses it to decide whether a commission is owed.
    discounted: !!profile?.referred_by,
    returnUrl: origin + "/billing?checkout=return",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: result.reason === "not_configured" ? 503 : 400 });
  }
  return NextResponse.json({ url: result.url });
}