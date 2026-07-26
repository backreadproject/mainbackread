import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, checkDocumentQuota, checkSendQuota, checkSeatLimit } from "@/lib/plan-context";
import { billingConfigured } from "@/lib/billing";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// What a customer is on, what they are using, and what else they could buy.
//
// The app has told people to upgrade since it shipped and never showed them
// where. It also never showed anyone what plan they were on, so a paying
// customer could not confirm what they were paying for.
export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);

  // Usage against the caps that actually bite. Unlimited plans return null and
  // the client hides the bar rather than drawing a full one.
  const [docs, sends, seats] = await Promise.all([
    checkDocumentQuota(admin, ctx.plan, user.id),
    checkSendQuota(admin, ctx.plan, user.id),
    ctx.orgId ? checkSeatLimit(admin, ctx.plan, ctx.orgId) : Promise.resolve(null),
  ]);

  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .single();

  return (
    <BillingClient
      currentPlan={ctx.plan.id}
      scope={ctx.scope}
      access={ctx.access}
      trialDaysLeft={ctx.trialDaysLeft}
      discounted={!!profile?.referred_by}
      configured={billingConfigured()}
      usage={{
        documents: { used: docs.used, limit: docs.limit },
        sends: { used: sends.used, limit: sends.limit },
        seats: seats ? { used: seats.used, limit: seats.limit } : null,
      }}
    />
  );
}