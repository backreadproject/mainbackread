import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

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
