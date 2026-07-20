// Resolves an account's plan (trial-aware) and enforces limits. Reads plan config
// from lib/plans.ts and the 7-day trial from lib/trial.ts.
//
// Access states:
//   active  - subscribed, OR a personal account, OR a grandfathered company
//             account with no trial clock set (e.g. legacy accounts).
//   trial   - company account inside its 7-day window.
//   locked  - company account whose trial lapsed without a subscription.
//             Soft lock: create-actions are blocked; existing data/readers stay.
//
// Only Free carries volume limits (documents, verdicts, recipients, sends);
// only the company plans carry seat limits. Counting uses the admin client.

import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type PlanConfig } from "@/lib/plans";
import { trialInfo } from "@/lib/trial";

type Admin = ReturnType<typeof createAdminClient>;

export type AccessState = "active" | "trial" | "locked";
export interface PlanContext {
  userId: string;
  scope: "personal" | "org";
  orgId: string | null;
  plan: PlanConfig;
  access: AccessState;
  trialDaysLeft: number;
}

/** First instant of the current month, UTC. Caps reset on the 1st. */
export function monthStartISO(d: Date = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function resolvePlanForUser(admin: Admin, userId: string): Promise<PlanContext> {
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type, active_org_id, trial_started_at, plan")
    .eq("id", userId)
    .single();
  const p = (profile ?? {}) as {
    account_type?: string; active_org_id?: string | null; trial_started_at?: string | null; plan?: string;
  };
  const isCompany = p.account_type === "company" || p.account_type === "organization";

  // Personal accounts: Free or Personal, always active, no trial.
  if (!isCompany) {
    return { userId, scope: "personal", orgId: null, plan: getPlan(p.plan), access: "active", trialDaysLeft: 0 };
  }

  // Company account (may or may not have created its org yet).
  let planId: string | undefined = "company_1";
  let subscribed = false;
  let orgId: string | null = null;
  if (p.active_org_id) {
    const { data: org } = await admin
      .from("organizations")
      .select("id, plan, subscription_active")
      .eq("id", p.active_org_id)
      .single();
    if (org) {
      const o = org as { id: string; plan?: string; subscription_active?: boolean };
      orgId = o.id;
      planId = o.plan ?? "company_1";
      subscribed = o.subscription_active === true;
    }
  }
  const plan = getPlan(planId);

  let access: AccessState = "active";
  let trialDaysLeft = 0;
  if (subscribed) {
    access = "active";
  } else if (p.trial_started_at) {
    const info = trialInfo(p.trial_started_at);
    trialDaysLeft = info.daysLeft;
    access = info.active ? "trial" : "locked";
  } else {
    access = "active"; // grandfathered: company account with no trial clock (e.g. legacy)
  }

  return { userId, scope: "org", orgId, plan, access, trialDaysLeft };
}

/** True when create-actions must be refused (trial lapsed, unpaid). */
export function isLocked(ctx: PlanContext): boolean {
  return ctx.access === "locked";
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
