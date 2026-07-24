// Single source of truth for ReadProspects's plans: limits + feature gates.
// Everything that enforces a tier (caps on create actions, Company-only features)
// reads from here. Billing later just sets which plan an account is on; it does
// not change this file. Compiled from the approved plan structure.

export type PlanId = "free" | "personal" | "company_1" | "company_2";

export const PLAN_ORDER: PlanId[] = ["free", "personal", "company_1", "company_2"];

/** A limit of null means unlimited. */
export interface PlanLimits {
  documentsPerMonth: number | null;
  verdictsPerDocumentPerMonth: number | null;
  recipientsPerDocument: number | null;
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
  | "zapier";

export interface PlanConfig {
  id: PlanId;
  name: string;
  tagline: string;
  limits: PlanLimits;
  features: Record<FeatureFlag, boolean>;
}

const ALL_OFF: Record<FeatureFlag, boolean> = {
  emailSend: false, projects: false, linkCustomization: false,
  conversationPersistence: false, verdictHistory: false, composeWorkspace: false,
  attachDraftContext: false, compoundingAcrossSends: false, weeklyDigest: false,
  exportData: false, organizations: false, compareReaders: false,
  accountAnalytics: false, granularPermissions: false, sso: false, auditLog: false,
  customRetention: false, abVersions: false, webhookAlerts: false, zapier: false,
};

// Personal unlocks the individual power features (no org).
const PERSONAL_FEATURES: Record<FeatureFlag, boolean> = {
  ...ALL_OFF,
  emailSend: true, projects: true, linkCustomization: true,
  conversationPersistence: true, verdictHistory: true, composeWorkspace: true,
  attachDraftContext: true, compoundingAcrossSends: true, weeklyDigest: true,
  exportData: true,
};

// Company I adds the organization layer + team analytics.
const COMPANY_1_FEATURES: Record<FeatureFlag, boolean> = {
  ...PERSONAL_FEATURES,
  organizations: true, compareReaders: true, accountAnalytics: true,
};

// Company II adds the security set + the three integrations being built now.
const COMPANY_2_FEATURES: Record<FeatureFlag, boolean> = {
  ...COMPANY_1_FEATURES,
  granularPermissions: true, sso: false, auditLog: true, customRetention: true,
  abVersions: true, webhookAlerts: true, zapier: true,
};

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Highly limited. A taste of the real thing.",
    limits: {
      documentsPerMonth: 2,
      verdictsPerDocumentPerMonth: 2,
      recipientsPerDocument: 1,
      sendsPerMonth: 5,
      seats: 1,
    },
    features: { ...ALL_OFF },
  },
  personal: {
    id: "personal",
    name: "Personal",
    tagline: "Paid. Does everything, but cannot run an organization.",
    limits: {
      documentsPerMonth: null,
      verdictsPerDocumentPerMonth: null,
      recipientsPerDocument: null,
      sendsPerMonth: null,
      seats: 1,
    },
    features: { ...PERSONAL_FEATURES },
  },
  company_1: {
    id: "company_1",
    name: "Company I",
    tagline: "First company plan. Organizations and what comes with them.",
    limits: {
      documentsPerMonth: null,
      verdictsPerDocumentPerMonth: null,
      recipientsPerDocument: null,
      sendsPerMonth: null,
      seats: 20,
    },
    features: { ...COMPANY_1_FEATURES },
  },
  company_2: {
    id: "company_2",
    name: "Company II",
    tagline: "Second company plan. By design, does more than Company I.",
    limits: {
      documentsPerMonth: null,
      verdictsPerDocumentPerMonth: null,
      recipientsPerDocument: null,
      sendsPerMonth: null,
      seats: null,
    },
    features: { ...COMPANY_2_FEATURES },
  },
};

// ---- helpers ---------------------------------------------------------------

export function isValidPlan(x: unknown): x is PlanId {
  return typeof x === "string" && (PLAN_ORDER as string[]).includes(x);
}

/** Never throws on a bad/missing value; unknown plans fall back to Free (safest). */
export function getPlan(planId: string | null | undefined): PlanConfig {
  return isValidPlan(planId) ? PLANS[planId] : PLANS.free;
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

