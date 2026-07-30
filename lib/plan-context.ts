// Resolves an account's plan (trial-aware) and enforces limits. Reads plan config
// from lib/plans.ts and the 7-day trial from lib/trial.ts.
//
// Access states:
//   active  - subscribed, OR a personal account.
//   trial   - company account inside its 7-day window.
//   locked  - company account whose trial lapsed, or whose subscription ended.
//             Data and reader links stay live; the app itself is walled off
//             except /billing, so they can see what happened and restart it.
//   pending - signed up while the door is invite-only, not yet approved.

import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type PlanConfig } from "@/lib/plans";
import { trialInfo } from "@/lib/trial";

type Admin = ReturnType<typeof createAdminClient>;

export type AccessState = "active" | "trial" | "locked" | "pending";
export interface PlanContext {
  userId: string;
  scope: "personal" | "org";
  orgId: string | null;
  plan: PlanConfig;
  access: AccessState;
  trialDaysLeft: number;
  /** True once a payment has ever succeeded. Distinguishes a lapsed
   *  subscription from a trial that ran out without one. */
  everPaid: boolean;
}

/** First instant of the current month, UTC. Caps reset on the 1st. */
export function monthStartISO(d: Date = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function resolvePlanForUser(admin: Admin, userId: string): Promise<PlanContext> {
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type, active_org_id, trial_started_at, plan, approved_at, subscribed_at, subscription_active")
    .eq("id", userId)
    .single();
  const p = (profile ?? {}) as {
    account_type?: string; active_org_id?: string | null; trial_started_at?: string | null;
    plan?: string; approved_at?: string | null; subscribed_at?: string | null;
    subscription_active?: boolean;
  };
  const isCompany = p.account_type === "company" || p.account_type === "organization";

  // THE DOOR, FIRST, for every account type.
  //
  // This used to sit inside the personal branch, so a COMPANY account signing up
  // while invite-only skipped it entirely and was handed a seven-day Business
  // trial without approval. The door has to be the outermost check or it does
  // not hold against the accounts that matter most.
  const { data: door } = await admin
    .from("app_settings").select("invite_only").eq("id", true).maybeSingle();
  if (door?.invite_only && !p.approved_at) {
    return {
      userId,
      scope: isCompany ? "org" : "personal",
      orgId: isCompany ? (p.active_org_id ?? null) : null,
      plan: getPlan(p.plan),
      access: "pending",
      trialDaysLeft: 0,
      everPaid: !!p.subscribed_at,
    };
  }

  // ---- personal accounts: Free or Personal, no trial ----
  if (!isCompany) {
    // Clamped. A personal profile holding an org plan would otherwise be handed
    // org features; only bad data reaches that, and it should not be rewarded.
    const personalPlan = p.plan === "personal" ? "personal" : "free";

    // A cancelled Personal subscriber used to stay active forever: this branch
    // hardcoded "active" and never read subscription_active, while the webhook
    // dutifully set it false. Twenty dollars a month, indefinitely, for free.
    //
    // Free is always active -- there is nothing to lapse. Personal is active
    // only while the subscription is live, and locked once it is not.
    const access: AccessState = personalPlan === "free" ? "active"
      : p.subscription_active === true ? "active" : "locked";

    return {
      userId,
      scope: "personal",
      orgId: null,
      plan: getPlan(personalPlan),
      access,
      trialDaysLeft: 0,
      everPaid: !!p.subscribed_at,
    };
  }

  // ---- company accounts: trial-aware, plan lives on the organization ----
  let planId: string | undefined = "team";
  let subscribed = false;
  let everPaid = false;
  let orgId: string | null = null;
  if (p.active_org_id) {
    const { data: org } = await admin
      .from("organizations")
      .select("id, plan, subscription_active, subscribed_at")
      .eq("id", p.active_org_id)
      .single();
    if (org) {
      const o = org as { id: string; plan?: string; subscription_active?: boolean; subscribed_at?: string | null };
      orgId = o.id;
      planId = o.plan ?? "team";
      subscribed = o.subscription_active === true;
      everPaid = !!o.subscribed_at;
    }
  }
  const plan = getPlan(planId);

  let access: AccessState = "locked";
  let trialDaysLeft = 0;
  if (subscribed) {
    access = "active";
  } else if (p.trial_started_at) {
    const info = trialInfo(p.trial_started_at);
    trialDaysLeft = info.daysLeft;
    access = info.active ? "trial" : "locked";
  }
  // No subscription and no clock is not an entitlement. Every account is given a
  // clock at signup, so reaching the default means the subscription ended or the
  // record is incomplete. Either way there is nothing to grant.

  return { userId, scope: "org", orgId, plan, access, trialDaysLeft, everPaid };
}

/** True when create-actions must be refused (trial lapsed, unpaid). */
export function isLocked(ctx: PlanContext): boolean {
  return ctx.access === "locked" || ctx.access === "pending";
}

/** Signed up, not yet let in. Distinct from locked, which means a lapsed trial. */
export function isPending(ctx: PlanContext): boolean {
  return ctx.access === "pending";
}

export interface GateResult { allowed: boolean; limit: number | null; used: number; }
const OK: GateResult = { allowed: true, limit: null, used: 0 };

export async function checkDocumentQuota(admin: Admin, plan: PlanConfig, userId: string): Promise<GateResult> {
  const limit = plan.limits.documentsPerMonth;
  if (limit === null) return OK;
  const { count } = await admin.from("documents")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId).gte("created_at", monthStartISO());
  const used = count ?? 0;
  return { allowed: used < limit, limit, used };
}

export async function checkVerdictQuota(admin: Admin, plan: PlanConfig, documentId: string): Promise<GateResult> {
  const limit = plan.limits.verdictsPerDocumentPerMonth;
  if (limit === null) return OK;
  const { count } = await admin.from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", "verdict").eq("document_id", documentId).gte("created_at", monthStartISO());
  const used = count ?? 0;
  return { allowed: used < limit, limit, used };
}

export async function checkRecipientLimit(admin: Admin, plan: PlanConfig, documentId: string): Promise<GateResult> {
  const limit = plan.limits.recipientsPerDocument;
  if (limit === null) return OK;
  const { count } = await admin.from("recipients")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);
  const used = count ?? 0;
  return { allowed: used < limit, limit, used };
}

export async function checkSendQuota(admin: Admin, plan: PlanConfig, userId: string): Promise<GateResult> {
  const limit = plan.limits.sendsPerMonth;
  if (limit === null) return OK;
  const { count } = await admin.from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", "send").eq("user_id", userId).gte("created_at", monthStartISO());
  const used = count ?? 0;
  return { allowed: used < limit, limit, used };
}

export async function checkSeatLimit(admin: Admin, plan: PlanConfig, orgId: string): Promise<GateResult> {
  const limit = plan.limits.seats;
  if (limit === null) return OK;
  const { count } = await admin.from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organization_id", orgId);
  const used = count ?? 0;
  return { allowed: used < limit, limit, used };
}

export async function logUsage(admin: Admin, kind: "verdict" | "send", opts: { userId: string; orgId?: string | null; documentId?: string | null }): Promise<void> {
  const { error } = await admin.from("usage_events").insert({
    user_id: opts.userId, org_id: opts.orgId ?? null, kind, document_id: opts.documentId ?? null,
  });
  if (error) console.error("[usage] log failed:", kind, error.message);
}
