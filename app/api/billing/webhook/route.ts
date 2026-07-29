import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPlan, type PlanId } from "@/lib/plans";
import { recordCommission, closeCommissionWindow, clawBackCommission } from "@/lib/commission";
export const runtime = "nodejs";
// Flutterwave webhooks. This is the only thing that may change what a customer
// has paid for, so it is written to be suspicious of everything.
//
// Three rules it never breaks:
//   1. Nothing happens until verif-hash matches. Without that check anyone who
//      finds this URL can grant themselves a plan and mint referral commission.
//   2. The redirect is never trusted, only the webhook. A customer can reach the
//      return URL without paying; only this endpoint sees the money.
//   3. Every write is idempotent. Flutterwave retries, so a second delivery of
//      the same charge must change nothing.
type FlwCustomer = { email?: string; name?: string };
type FlwData = {
  id?: number | string;
  tx_ref?: string;
  flw_ref?: string;
  status?: string;
  amount?: number;
  currency?: string;
  customer?: FlwCustomer;
  meta?: Record<string, string> | null;
};
type FlwEvent = { event?: string; "event.type"?: string; type?: string; data?: FlwData };
function eventName(body: FlwEvent): string {
  return (body.type || body.event || body["event.type"] || "").toLowerCase();
}
/** Resolve the paying account. The first charge carries the meta we sent at
 *  checkout; a renewal months later may not, so email is the fallback. Email is
 *  safe as a key here precisely because Flutterwave ties a subscription to one
 *  email for its whole life and will not let it change. */
async function findUser(data: FlwData): Promise<{ id: string; email: string | null } | null> {
  const admin = createAdminClient();
  const metaId = data.meta?.user_id;
  if (metaId) {
    const { data: u } = await admin.auth.admin.getUserById(metaId);
    if (u?.user) return { id: u.user.id, email: u.user.email ?? null };
  }
  const email = data.customer?.email?.trim().toLowerCase();
  if (!email) return null;
  const { data: list } = await admin.auth.admin.listUsers();
  const hit = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
  return hit ? { id: hit.id, email: hit.email ?? null } : null;
}
/** Personal plans live on profiles, organization plans on organizations. Which
 *  one is decided by the plan bought, not by what the account looks like now. */
/** Personal plans live on profiles, organization plans on organizations. Which
 *  one is decided by the plan bought, not by what the account looks like now.
 *
 *  Every write is checked and THROWS on failure, so the route's catch returns
 *  500 and Flutterwave retries. This function previously discarded its errors:
 *  the profiles update named a column that did not exist, so it failed every
 *  time while the route still answered ok with a plan name. A paying customer
 *  would have stayed on Free with nothing in the logs to say why.
 *  A payment that did not apply must fail loudly. */
async function applyPlan(userId: string, planId: PlanId, active: boolean): Promise<void> {
  const admin = createAdminClient();
  const isOrgPlan = planId === "team" || planId === "business";

  if (!isOrgPlan) {
    const { error } = await admin
      .from("profiles")
      .update({ plan: planId, subscription_active: active })
      .eq("id", userId);
    if (error) throw new Error("applyPlan: profile " + userId + " -> " + error.message);
    return;
  }

  // Only the owner can buy an org plan (enforced at checkout), so the org to
  // update is the one they own.
  const { data: org, error: findErr } = await admin
    .from("organizations")
    .select("id")
    .eq("created_by", userId)
    .maybeSingle();
  if (findErr) throw new Error("applyPlan: looking up organization -> " + findErr.message);
  if (!org) {
    // Not thrown: retrying cannot conjure an organization. This one needs a
    // human, and the log is the only place it will surface.
    console.error("[billing/webhook] org plan bought but no organization found for", userId);
    return;
  }

  const { error: orgErr } = await admin
    .from("organizations")
    .update({ plan: planId, subscription_active: active })
    .eq("id", (org as { id: string }).id);
  if (orgErr) throw new Error("applyPlan: organization -> " + orgErr.message);

  const { error: flagErr } = await admin
    .from("profiles")
    .update({ subscription_active: active })
    .eq("id", userId);
  if (flagErr) throw new Error("applyPlan: subscription flag -> " + flagErr.message);
}
export async function POST(req: NextRequest) {
  // 1. Authenticate the sender before reading anything else.
  const expected = process.env.FLW_SECRET_HASH;
  if (!expected) {
    console.error("[billing/webhook] FLW_SECRET_HASH is not set; refusing every delivery");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (req.headers.get("verif-hash") !== expected) {
    console.warn("[billing/webhook] rejected: bad or missing verif-hash");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: FlwEvent;
  try { body = (await req.json()) as FlwEvent; } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const event = eventName(body);
  const data = body.data ?? {};
  // flw_ref is the processor's own id and is stable across retries. tx_ref is
  // ours and only exists on the first charge, so it cannot key a renewal.
  const ref = String(data.flw_ref || data.id || data.tx_ref || "");
  if (!ref) return NextResponse.json({ ok: true, ignored: "no reference" });

  try {
    // ---- money in -------------------------------------------------------
    if (event.includes("charge") && (data.status ?? "").toLowerCase().match(/success|completed|succeeded/)) {
      const user = await findUser(data);
      if (!user) {
        console.error("[billing/webhook] paid charge with no matching user:", ref, data.customer?.email);
        // 200 on purpose: retrying will not conjure the account, and a failure
        // response makes Flutterwave hammer us. This needs a human, not a retry.
        return NextResponse.json({ ok: true, unmatched: true });
      }
      const planId = data.meta?.plan_id;
      const interval = data.meta?.interval === "annual" ? "annual" : "monthly";
      if (!isValidPlan(planId)) {
        console.error("[billing/webhook] paid charge with no usable plan in meta:", ref);
        return NextResponse.json({ ok: true, unmatched: "plan" });
      }

      await applyPlan(user.id, planId, true);

      // Flutterwave reports major units; the ledger works in minor.
      const cents = Math.round(Number(data.amount ?? 0) * 100);
      const result = await recordCommission({
        subscriberId: user.id,
        subscriberEmail: user.email,
        planId,
        interval,
        grossCollected: cents,
        currency: (data.currency || "USD").toUpperCase(),
        processorRef: ref,
      });
      return NextResponse.json({ ok: true, plan: planId, commission: result });
    }

    // ---- subscription ended --------------------------------------------
    if (event.includes("cancel") || event.includes("subscription.disable")) {
      const user = await findUser(data);
      if (user) {
        await applyPlan(user.id, "free", false);
        // Permanently. If they subscribe again later they returned on their
        // own, not through the referral.
        await closeCommissionWindow(user.id);
      }
      return NextResponse.json({ ok: true, cancelled: true });
    }

    // ---- money back out -------------------------------------------------
    if (event.includes("refund") || event.includes("chargeback") || event.includes("dispute")) {
      await clawBackCommission(ref);
      return NextResponse.json({ ok: true, clawedBack: true });
    }

    // A failed charge is not a cancellation: Flutterwave retries three times
    // before giving up, and only then sends the cancellation we act on above.
    return NextResponse.json({ ok: true, ignored: event || "unknown" });
  } catch (err) {
    console.error("[billing/webhook] threw:", err instanceof Error ? err.message : String(err));
    // 500 so Flutterwave retries: an exception here means we may not have
    // applied a plan someone paid for, and a retry is the safety net.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}