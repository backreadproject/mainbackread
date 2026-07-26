import type { PlanId } from "@/lib/plans";
import { PLANS, priceFor, CURRENCY } from "@/lib/plans";
// The billing seam.
//
// Everything above this file is finished: the plan page, the gates, the
// commission ledger. Everything below it is one processor. When Flutterwave is
// live, startCheckout stops returning "not configured" and starts returning a
// URL, and nothing else in the app changes.
//
// Written against Flutterwave v3. Two constraints from their docs shape it:
//   1. Payment plans must be created WITHOUT an amount, so the amount set when
//      charging becomes that customer's subscription amount for its whole life.
//      That is the only way a persistent 5% referral discount works: the other
//      documented option discounts the first payment only.
//   2. A subscription is tied to the customer email and cannot be changed.
//      Changing an email in Account means cancelling and recreating.
export type Interval = "monthly" | "annual";
export type CheckoutResult =
  | { ok: true; url: string; reference: string }
  | { ok: false; reason: "not_configured" | "free_plan" | "failed"; message: string };
export interface CheckoutInput {
  planId: PlanId;
  interval: Interval;
  /** The paying account. For an org this is the owner; the subscription is
   *  keyed to their email because Flutterwave ties it to the email forever. */
  userId: string;
  email: string;
  name?: string | null;
  /** Set when the account arrived through a referral link. Drives both the 5%
   *  and, later, the commission row written from the webhook. */
  discounted: boolean;
  /** Where the customer lands after paying. */
  returnUrl: string;
}
export function billingConfigured(): boolean {
  return !!(process.env.FLW_SECRET_KEY && process.env.FLW_PLAN_PERSONAL_MONTHLY);
}
/** Plan code lookup. Codes are created in Flutterwave WITHOUT an amount. */
function planCode(planId: PlanId, interval: Interval): string | null {
  const key = "FLW_PLAN_" + planId.toUpperCase() + "_" + interval.toUpperCase();
  return process.env[key] || null;
}
/** A reference we can recognise coming back on the webhook, and that is unique
 *  per attempt so a retry is idempotent against the commissions ledger. */
export function newReference(userId: string): string {
  return "rp_" + userId.slice(0, 8) + "_" + Date.now().toString(36);
}
export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const plan = PLANS[input.planId];
  const amount = priceFor(input.planId, input.interval, input.discounted);
  if (amount === 0) {
    return { ok: false, reason: "free_plan", message: "The Free plan does not need a payment." };
  }
  if (!billingConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Card payment is not switched on yet. We are finishing it now and will email you the moment it opens.",
    };
  }
  const code = planCode(input.planId, input.interval);
  if (!code) {
    return { ok: false, reason: "failed", message: "That plan is not available for purchase yet." };
  }
  const reference = newReference(input.userId);
  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.FLW_SECRET_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        // Flutterwave wants major units. The plan carries the amount because
        // the plan itself was created without one.
        amount: (amount / 100).toFixed(2),
        currency: CURRENCY,
        payment_plan: code,
        redirect_url: input.returnUrl,
        customer: { email: input.email, name: input.name ?? undefined },
        customizations: { title: "ReadProspects " + plan.name, description: plan.tagline },
        meta: {
          user_id: input.userId,
          plan_id: input.planId,
          interval: input.interval,
          discounted: input.discounted ? "1" : "0",
        },
      }),
    });
    const json = (await res.json()) as { status?: string; data?: { link?: string }; message?: string };
    if (!res.ok || json.status !== "success" || !json.data?.link) {
      console.error("[billing] checkout failed:", json.message ?? res.status);
      return { ok: false, reason: "failed", message: "We could not start the payment. Please try again." };
    }
    return { ok: true, url: json.data.link, reference };
  } catch (err) {
    console.error("[billing] checkout threw:", err instanceof Error ? err.message : String(err));
    return { ok: false, reason: "failed", message: "We could not reach the payment provider." };
  }
}