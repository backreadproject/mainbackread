import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Signing is not asking. A reader asks many questions; a signer signs once, or
// twice if the first attempt failed. So the ceiling is low, and the per-document
// bucket matters more than the per-token one: the cheap attack is enumerating
// share tokens against one document, not hammering a single link.
export const SIGN_LIMITS = {
  perTokenPerHour: 12,
  perTokenPerDay: 40,
  perDocumentPerHour: 60,
};

export const ASK_LIMITS = {
  perTokenPerHour: 20,
  perTokenPerDay: 70,
  perDocumentPerDay: 200,
};

function hourWindow(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())).toISOString();
}
function dayWindow(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

// Returns the new count for this bucket/window. On failure it returns 0, which
// means we fail OPEN: a limiter outage must never stop a genuine reader.
async function bump(admin: Admin, bucket: string, windowStart: string): Promise<number> {
  const { data, error } = await admin.rpc("bump_rate_limit", { p_bucket: bucket, p_window: windowStart });
  if (error) {
    console.error("[rate-limit]", bucket, error.message);
    return 0;
  }
  return Number(data) || 0;
}

export type LimitVerdict = { allowed: boolean; bucket?: string };

/** Counts the attempt, then decides. A blocked reader keeps incrementing, so
 *  hammering does not shorten the cool-off. */
export async function checkAskLimits(token: string, documentId: string | null): Promise<LimitVerdict> {
  const admin = createAdminClient();
  const h = hourWindow();
  const d = dayWindow();

  const [tokenHour, tokenDay, docDay] = await Promise.all([
    bump(admin, `ask:token:${token}:h`, h),
    bump(admin, `ask:token:${token}:d`, d),
    documentId ? bump(admin, `ask:doc:${documentId}:d`, d) : Promise.resolve(0),
  ]);

  if (tokenHour > ASK_LIMITS.perTokenPerHour) return { allowed: false, bucket: "token_hour" };
  if (tokenDay > ASK_LIMITS.perTokenPerDay) return { allowed: false, bucket: "token_day" };
  if (documentId && docDay > ASK_LIMITS.perDocumentPerDay) return { allowed: false, bucket: "document_day" };
  return { allowed: true };
}

/** Signing and declining. Counts first, then decides, so hammering does not
 *  shorten the cool-off. Fails OPEN like the others: a limiter outage must never
 *  stop someone signing a contract. */
export async function checkSignLimits(token: string, documentId: string | null): Promise<LimitVerdict> {
  const admin = createAdminClient();
  const h = hourWindow();
  const d = dayWindow();
  const [tokenHour, tokenDay, docHour] = await Promise.all([
    bump(admin, `sign:token:${token}:h`, h),
    bump(admin, `sign:token:${token}:d`, d),
    documentId ? bump(admin, `sign:doc:${documentId}:h`, h) : Promise.resolve(0),
  ]);
  if (tokenHour > SIGN_LIMITS.perTokenPerHour) return { allowed: false, bucket: "token_hour" };
  if (tokenDay > SIGN_LIMITS.perTokenPerDay) return { allowed: false, bucket: "token_day" };
  if (documentId && docHour > SIGN_LIMITS.perDocumentPerHour) return { allowed: false, bucket: "document_hour" };
  return { allowed: true };
}
