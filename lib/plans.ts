// Single source of truth for ReadProspects's plans: limits + feature gates.
// Everything that enforces a tier (caps on create actions, Company-only features)
// reads from here. Billing later just sets which plan an account is on; it does
// not change this file. Compiled from the approved plan structure.

export type PlanId = "free" | "personal" | "team" | "business";

export const PLAN_ORDER: PlanId[] = ["free", "personal", "team", "business"];

/** A limit of null means unlimited. */
export interface PlanLimits {
  documentsPerMonth: number | null;
  verdictsPerDocumentPerMonth: number | null;
  recipientsPerDocument: number | null;
  /** Named buyer profiles, not revisions. Re-answering the questionnaire makes
   *  a revision, so this counts distinct markets rather than edits. Generous by
   *  design: a profile says nothing until about twenty engaged readers have been
   *  measured against it, so evidence density binds long before a cap does. */
  buyerProfiles: number | null;
  sendsPerMonth: number | null;
  seats: number | null;
}

/** Feature gates that differ by plan. Core intelligence (Ask, verdict, tracking,
 *  timelines, alerts) is baseline on every plan and governed by the limits above,
 *  not by a flag. These flags are only the things a plan does or does not unlock. */
export type FeatureFlag =
  | "emailSend"
  | "projects"
  | "linkCustomization"
  | "conversationPersistence"
  | "verdictHistory"
  | "composeWorkspace"
  | "attachDraftContext"
  | "compoundingAcrossSends"
  | "weeklyDigest"
  | "exportData"
  | "organizations"
  | "compareReaders"
  | "accountAnalytics"
  | "granularPermissions"
  | "sso"
  | "auditLog"
  | "customRetention"
  | "abVersions"
  | "webhookAlerts"
  | "zapier"
  | "reports"
  | "icp";

export interface PlanPrice {
  /** US cents. Integer arithmetic only. */
  monthly: number;
  annual: number;
}
export interface PlanConfig {
  id: PlanId;
  name: string;
  tagline: string;
  limits: PlanLimits;
  price: PlanPrice;
  features: Record<FeatureFlag, boolean>;
}
export const CURRENCY = "USD";
/** 10% off the FIRST payment, monthly plans only. See DISCOUNT_INTERVALS below. */
export const REFERRAL_DISCOUNT = 0.10;
/** Monthly only, and one payment. On annual the same percentage is real money
 *  (USD 110 on Business) for a line nobody would post anyway. */
export const DISCOUNT_INTERVALS: readonly ("monthly" | "annual")[] = ["monthly"];
/** What a plan costs a given customer, in cents. */
export function priceFor(planId: PlanId, interval: "monthly" | "annual", discounted = false): number {
  const base = PLANS[planId].price[interval];
  if (!discounted || base === 0 || !DISCOUNT_INTERVALS.includes(interval)) return base;
  return Math.round(base * (1 - REFERRAL_DISCOUNT));
}
export function formatPrice(cents: number): string {
  return "$" + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}
/** Annual saving as a percentage, derived rather than stated, so it can never
 *  disagree with the prices above. */
export function annualSaving(planId: PlanId): number {
  const p = PLANS[planId].price;
  if (!p.monthly) return 0;
  return Math.round((1 - p.annual / (p.monthly * 12)) * 100);
}

const ALL_OFF: Record<FeatureFlag, boolean> = {
  emailSend: false, projects: false, linkCustomization: false,
  conversationPersistence: false, verdictHistory: false, composeWorkspace: false,
  attachDraftContext: false, compoundingAcrossSends: false, weeklyDigest: false,
  exportData: false, organizations: false, compareReaders: false,
  accountAnalytics: false, granularPermissions: false, sso: false, auditLog: false,
  customRetention: false, abVersions: false, webhookAlerts: false, zapier: false, reports: false, icp: false,
};

// Personal unlocks the individual power features (no org).
const PERSONAL_FEATURES: Record<FeatureFlag, boolean> = {
  ...ALL_OFF,
  emailSend: true, projects: true, linkCustomization: true,
  conversationPersistence: true, verdictHistory: true, composeWorkspace: true,
  attachDraftContext: true, compoundingAcrossSends: true, weeklyDigest: true,
  exportData: true, reports: true, icp: true,
};

// Company I adds the organization layer + team analytics.
const TEAM_FEATURES: Record<FeatureFlag, boolean> = {
  ...PERSONAL_FEATURES,
  organizations: true, compareReaders: true, accountAnalytics: true,
};

// Company II adds the security set + the three integrations being built now.
const BUSINESS_FEATURES: Record<FeatureFlag, boolean> = {
  ...TEAM_FEATURES,
  granularPermissions: true, sso: false, auditLog: true, customRetention: true,
  abVersions: true, webhookAlerts: true, zapier: true,
};

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Highly limited. A taste of the real thing.",
    price: { monthly: 0, annual: 0 },
    limits: {
      documentsPerMonth: 2,
      verdictsPerDocumentPerMonth: 2,
      recipientsPerDocument: 1,
      buyerProfiles: 0,
      sendsPerMonth: 5,
      seats: 1,
    },
    features: { ...ALL_OFF },
  },
  personal: {
    id: "personal",
    name: "Personal",
    tagline: "Paid. Does everything, but cannot run an organization.",
    price: { monthly: 2000, annual: 23000 },
    limits: {
      documentsPerMonth: null,
      verdictsPerDocumentPerMonth: null,
      recipientsPerDocument: null,
      buyerProfiles: 3,
      sendsPerMonth: null,
      seats: 1,
    },
    features: { ...PERSONAL_FEATURES },
  },
  team: {
    id: "team",
    name: "Team",
    tagline: "Your whole team, reading together.",
    price: { monthly: 5900, annual: 65500 },
    limits: {
      documentsPerMonth: null,
      verdictsPerDocumentPerMonth: null,
      recipientsPerDocument: null,
      buyerProfiles: 15,
      sendsPerMonth: null,
      seats: 20,
    },
    features: { ...TEAM_FEATURES },
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "Unlimited seats, fully locked down.",
    price: { monthly: 9900, annual: 110000 },
    limits: {
      documentsPerMonth: null,
      verdictsPerDocumentPerMonth: null,
      recipientsPerDocument: null,
      buyerProfiles: null,
      sendsPerMonth: null,
      seats: null,
    },
    features: { ...BUSINESS_FEATURES },
  },
};

// ---- helpers ---------------------------------------------------------------

/** Narrows an unknown value to a PlanId, or null. */
export function canonicalPlanId(x: unknown): PlanId | null {
  if (typeof x !== "string") return null;
  if ((PLAN_ORDER as string[]).includes(x)) return x as PlanId;
  return null;
}

export function isValidPlan(x: unknown): x is PlanId {
  return canonicalPlanId(x) !== null;
}

/** Never throws on a bad/missing value; unknown plans fall back to Free (safest). */
export function getPlan(planId: string | null | undefined): PlanConfig {
  const id = canonicalPlanId(planId);
  return id ? PLANS[id] : PLANS.free;
}

export function hasFeature(planId: string | null | undefined, flag: FeatureFlag): boolean {
  return getPlan(planId).features[flag] === true;
}

export function getLimit(planId: string | null | undefined, key: keyof PlanLimits): number | null {
  return getPlan(planId).limits[key];
}

/** True when `current` usage is still allowed to grow by one. null limit = unlimited. */
export function withinLimit(current: number, limit: number | null): boolean {
  return limit === null || current < limit;
}

/** Convenience: does this plan permit one more of a limited thing? */
export function canAddOne(planId: string | null | undefined, key: keyof PlanLimits, current: number): boolean {
  return withinLimit(current, getLimit(planId, key));
}

