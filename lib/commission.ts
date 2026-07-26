import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, REFERRAL_DISCOUNT, type PlanId } from "@/lib/plans";
// Writing a commission row. One function, deliberately, so that swapping payment
// processor later is an adapter around this rather than a rewrite of it.
//
// The rules it enforces, all decided before any code existed:
//   - 25% of what was actually collected, not of list price.
//   - Three monthly cycles, or one annual. Never scheduled ahead: a row exists
//     only because a payment succeeded, so a subscriber who cancels after one
//     month leaves exactly one row and is owed nothing further.
//   - A cancelled subscription closes the window permanently. If they come back
//     later they came back on their own, not through the referral.
//   - 30 day hold before it can be withdrawn.
//   - processor_ref is UNIQUE, and that is the whole idempotency guarantee.
//     Flutterwave retries webhooks; without it a retry pays the referrer twice.
export const COMMISSION_RATE = 0.25;
export const MAX_MONTHLY_CYCLES = 3;
export type CommissionInput = {
  /** The paying customer's auth id. */
  subscriberId: string;
  subscriberEmail: string | null;
  planId: PlanId;
  interval: "monthly" | "annual";
  /** Minor units, as actually charged. Includes the 5% referral discount. */
  grossCollected: number;
  currency: string;
  /** The processor's own id for this charge. Must be stable across retries. */
  processorRef: string;
};
export type CommissionResult =
  | { written: true; amount: number; cycle: number }
  | { written: false; reason: "no_referrer" | "window_closed" | "cycles_exhausted" | "duplicate" | "free" | "error" };
export async function recordCommission(input: CommissionInput): Promise<CommissionResult> {
  if (input.grossCollected <= 0) return { written: false, reason: "free" };
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by, commission_window_closed_at")
    .eq("id", input.subscriberId)
    .maybeSingle();
  const p = profile as { referred_by: string | null; commission_window_closed_at: string | null } | null;

  if (!p?.referred_by) return { written: false, reason: "no_referrer" };
  if (p.commission_window_closed_at) return { written: false, reason: "window_closed" };

  // How many cycles this subscriber has already generated. Counting rows rather
  // than trusting a counter: the ledger is the only thing that cannot drift.
  const { count } = await admin
    .from("commissions")
    .select("id", { count: "exact", head: true })
    .eq("subscriber_id", input.subscriberId)
    .eq("interval", input.interval);
  const already = count ?? 0;
  const cap = input.interval === "annual" ? 1 : MAX_MONTHLY_CYCLES;
  if (already >= cap) return { written: false, reason: "cycles_exhausted" };

  const amount = Math.round(input.grossCollected * COMMISSION_RATE);
  const { error } = await admin.from("commissions").insert({
    referrer_id: p.referred_by,
    subscriber_id: input.subscriberId,
    subscriber_email: input.subscriberEmail,
    plan: input.planId,
    interval: input.interval,
    gross_collected: input.grossCollected / 100,
    rate: COMMISSION_RATE,
    amount: amount / 100,
    currency: input.currency,
    cycle: already + 1,
    processor_ref: input.processorRef,
  });

  if (error) {
    // 23505 is the unique violation on processor_ref: this exact charge has
    // already been recorded. A retry, not a failure, and the right answer is
    // to do nothing and report success upstream.
    if (error.code === "23505") return { written: false, reason: "duplicate" };
    console.error("[commission] insert failed:", error.message);
    return { written: false, reason: "error" };
  }
  return { written: true, amount, cycle: already + 1 };
}
/** A subscription ended. No further commission is ever earned for this
 *  subscriber, even if they subscribe again later. */
export async function closeCommissionWindow(subscriberId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ commission_window_closed_at: new Date().toISOString() })
    .eq("id", subscriberId)
    .is("commission_window_closed_at", null);
}
/** A payment was refunded or charged back. The commission earned on it is
 *  reversed whether or not it has already become available. */
export async function clawBackCommission(processorRef: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("commissions")
    .update({ status: "clawed_back", note: "Reversed: payment refunded or charged back" })
    .eq("processor_ref", processorRef)
    .neq("status", "clawed_back");
  if (error) console.error("[commission] clawback failed:", error.message);
}
/** What the 5% costs us on a given charge, for reconciliation. Not used in the
 *  hot path; kept here so the discount and the commission stay in one file. */
export function discountOn(planId: PlanId, interval: "monthly" | "annual"): number {
  return Math.round(PLANS[planId].price[interval] * REFERRAL_DISCOUNT);
}