import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReportOutput } from "@/lib/ai";
type Admin = ReturnType<typeof createAdminClient>;
// Caching the synthesis, not the document.
//
// A report over the same readers with the same signals reaches the same
// conclusions. Regenerating it is a model call spent to produce something the
// customer already has, so the analysis is cached and the PDF is rendered fresh
// every time. Branding therefore costs nothing to change: the same analysis can
// go to five departments with five different cover pages for one call.
//
// This is also why the feature needs no monthly allowance. A quota would make a
// customer ration the most shareable thing the product makes; caching means the
// cost only lands when the underlying data has actually moved.
/**
 * Identifies the state a report was written from.
 *
 * Three things can change the conclusions: which readers are included, how many
 * signals exist, and when the newest one arrived. A new signal moves the
 * timestamp; a deleted one moves the count; a different selection moves the ids.
 * Cheap to compute and does not require reading signal bodies.
 */
export async function reportFingerprint(
  admin: Admin,
  documentId: string,
  recipientIds: string[] | null
): Promise<string> {
  let q = admin.from("recipients").select("id").eq("document_id", documentId);
  if (recipientIds && recipientIds.length) q = q.in("id", recipientIds);
  const { data: recs } = await q;
  const ids = ((recs ?? []) as { id: string }[]).map((r) => r.id).sort();
  if (ids.length === 0) return "empty";

  const { count } = await admin
    .from("signals")
    .select("recipient_id", { count: "exact", head: true })
    .in("recipient_id", ids);

  const { data: newest } = await admin
    .from("signals")
    .select("created_at")
    .in("recipient_id", ids)
    .order("created_at", { ascending: false })
    .limit(1);
  const last = ((newest ?? []) as { created_at: string }[])[0]?.created_at ?? "none";

  // Replies and verdicts change the analysis even when the signal count has not
  // moved much, so they are named rather than left to the aggregate.
  const { count: replies } = await admin
    .from("signals")
    .select("recipient_id", { count: "exact", head: true })
    .in("recipient_id", ids)
    .eq("kind", "replied");

  const material = [ids.join(","), count ?? 0, last, replies ?? 0].join("|");
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
}
export async function getCachedReport(
  admin: Admin,
  documentId: string,
  fingerprint: string
): Promise<ReportOutput | null> {
  const { data } = await admin
    .from("report_cache")
    .select("report")
    .eq("document_id", documentId)
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  const row = data as { report: ReportOutput } | null;
  return row?.report ?? null;
}
export async function putCachedReport(
  admin: Admin,
  documentId: string,
  fingerprint: string,
  report: ReportOutput,
  readerCount: number
): Promise<void> {
  const { error } = await admin.from("report_cache").upsert(
    { document_id: documentId, fingerprint, report, reader_count: readerCount },
    { onConflict: "document_id,fingerprint" }
  );
  // Non-fatal: a report the customer received but we failed to cache is a
  // wasted call next time, not a broken download.
  if (error) console.error("[report-cache] could not store:", error.message);
}
/** What appears on the cover. Reporter and recipient are per report; company
 *  name and logo are settings. */
export type Branding = {
  companyName: string | null;
  logoUrl: string | null;
  reporter: string | null;
  recipient: string | null;
  recipientKind: "person" | "department" | "organisation" | null;
  note: string | null;
};
export async function loadBrandingDefaults(admin: Admin, userId: string): Promise<{ companyName: string | null; logoUrl: string | null; defaultReporter: string | null }> {
  const { data } = await admin
    .from("report_settings")
    .select("company_name, logo_url, default_reporter")
    .eq("user_id", userId)
    .maybeSingle();
  const row = data as { company_name: string | null; logo_url: string | null; default_reporter: string | null } | null;
  return {
    companyName: row?.company_name ?? null,
    logoUrl: row?.logo_url ?? null,
    defaultReporter: row?.default_reporter ?? null,
  };
}