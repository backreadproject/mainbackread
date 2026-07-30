import { createAdminClient } from "@/lib/supabase/admin";
import type { ReportInput, ReportReader } from "@/lib/ai";
// Assembling the evidence a report is written from.
//
// Deliberately no AI in this file. Gathering is cheap and deterministic;
// reasoning is expensive and is one call at the end. Keeping them apart means
// the assembly can be checked without spending anything.
type Admin = ReturnType<typeof createAdminClient>;
type Sig = { recipient_id: string; kind: string; page: number | null; value: unknown; created_at: string };
type Rec = { id: string; label: string | null; first_name: string | null; last_name: string | null; email: string | null };
function nameOf(r: Rec): string {
  return (
    r.label?.trim() ||
    [r.first_name, r.last_name].filter(Boolean).join(" ").trim() ||
    r.email?.split("@")[0] ||
    "A reader"
  );
}
function orgOf(r: Rec): string {
  const domain = r.email?.split("@")[1];
  if (!domain) return "";
  // Consumer domains say nothing about who they work for.
  const generic = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me"];
  return generic.includes(domain.toLowerCase()) ? "" : domain;
}
function str(v: unknown, key: string): string {
  if (v && typeof v === "object" && key in (v as Record<string, unknown>)) {
    const x = (v as Record<string, unknown>)[key];
    return typeof x === "string" ? x : "";
  }
  return "";
}
/** page_dwell stores milliseconds under "ms", already capped by /api/signal.
 *  Reading the wrong key here is what made every dwell figure zero. */
function dwellSeconds(v: unknown): number {
  if (v && typeof v === "object" && "ms" in (v as Record<string, unknown>)) {
    const ms = (v as Record<string, unknown>).ms;
    return typeof ms === "number" ? Math.round(ms / 1000) : 0;
  }
  return 0;
}
function num(v: unknown, key: string): number {
  if (v && typeof v === "object" && key in (v as Record<string, unknown>)) {
    const x = (v as Record<string, unknown>)[key];
    return typeof x === "number" ? x : 0;
  }
  return 0;
}
export type AssembledReport = {
  input: ReportInput;
  /** Kept alongside for the PDF: the model sees a reduced view, the document
   *  shows the full detail. */
  detail: {
    id: string;
    name: string;
    org: string;
    email: string | null;
    opens: number;
    seconds: number;
    questions: { text: string; page: number | null }[];
    replies: string[];
    forwardedTo: string[];
    pages: { page: number; seconds: number; visits: number }[];
    lastSeen: string | null;
    /** The stored verdict, where one has been run. The report prints it rather
     *  than re-deriving: this is the product's own read of the reader and the
     *  document should carry it. */
    verdict: { headline: string; reasoning: string; nextAction: string; confidence: string } | null;
  }[];
  documentTitle: string;
  totalRecipients: number;
};
export async function assembleReport(
  admin: Admin,
  documentId: string,
  recipientIds: string[] | null,
  locale: "en" | "fr" = "en"
): Promise<AssembledReport | null> {
  const { data: docRow } = await admin
    .from("documents")
    .select("id, title, extracted_text")
    .eq("id", documentId)
    .maybeSingle();
  const doc = docRow as { id: string; title: string; extracted_text: string | null } | null;
  if (!doc) return null;

  let q = admin
    .from("recipients")
    .select("id, label, first_name, last_name, email")
    .eq("document_id", documentId);
  if (recipientIds && recipientIds.length) q = q.in("id", recipientIds);
  const { data: recRows } = await q;
  const recipients = (recRows ?? []) as Rec[];
  if (recipients.length === 0) return null;

  const ids = recipients.map((r) => r.id);
  const { data: sigRows } = await admin
    .from("signals")
    .select("recipient_id, kind, page, value, created_at")
    .in("recipient_id", ids)
    .order("created_at", { ascending: true });
  const signals = (sigRows ?? []) as Sig[];

  const byRec = new Map<string, Sig[]>();
  for (const s of signals) {
    const arr = byRec.get(s.recipient_id) ?? [];
    arr.push(s);
    byRec.set(s.recipient_id, arr);
  }

  // Aggregate dwell across everyone. A page one reader lingered on is that
  // reader's habit; a page the whole cohort stops at is a fact about the
  // document, and only the aggregate can tell them apart.
  const pageAgg = new Map<number, { seconds: number; readers: Set<string> }>();
  for (const s of signals) {
    if (s.kind !== "page_dwell" || s.page == null) continue;
    const cur = pageAgg.get(s.page) ?? { seconds: 0, readers: new Set<string>() };
    cur.seconds += dwellSeconds(s.value);
    cur.readers.add(s.recipient_id);
    pageAgg.set(s.page, cur);
  }
  const pageTotals = [...pageAgg.entries()]
    .map(([page, v]) => ({ page, seconds: Math.round(v.seconds), readers: v.readers.size }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 12);

  const detail: AssembledReport["detail"] = recipients.map((r) => {
    const rows = byRec.get(r.id) ?? [];
    const perPage = new Map<number, { seconds: number; visits: number }>();
    let seconds = 0;
    let opens = 0;
    const questions: { text: string; page: number | null }[] = [];
    const replies: string[] = [];
    const forwardedTo: string[] = [];
    let lastSeen: string | null = null;

    for (const s of rows) {
      lastSeen = s.created_at;
      if (s.kind === "opened") opens++;
      else if (s.kind === "page_dwell" && s.page != null) {
        const sec = dwellSeconds(s.value);
        seconds += sec;
        const cur = perPage.get(s.page) ?? { seconds: 0, visits: 0 };
        cur.seconds += sec;
        cur.visits += 1;
        perPage.set(s.page, cur);
      } else if (s.kind === "question") {
        const text = str(s.value, "text");
        if (text) questions.push({ text, page: s.page });
      } else if (s.kind === "replied") {
        const text = str(s.value, "text");
        if (text) replies.push(text);
      } else if (s.kind === "forwarded") {
        const v = s.value as { colleagues?: { email?: string }[] } | null;
        for (const c of v?.colleagues ?? []) if (c?.email) forwardedTo.push(c.email);
      }
    }
    const pages = [...perPage.entries()]
      .map(([page, v]) => ({ page, seconds: Math.round(v.seconds), visits: v.visits }))
      .sort((a, b) => b.seconds - a.seconds);
    return {
      id: r.id,
      name: nameOf(r),
      org: orgOf(r),
      email: r.email,
      opens,
      seconds: Math.round(seconds),
      questions,
      replies,
      forwardedTo,
      pages,
      lastSeen,
      verdict: null,
    };
  });

  // Stored verdicts, where they exist. A report reuses rather than regenerating:
  // twenty-three fresh verdicts would neither finish in time nor say more than
  // one synthesis over the same evidence.
  const { data: vRows } = await admin
    .from("verdicts")
    .select("recipient_id, headline, reasoning, next_action, confidence")
    .in("recipient_id", ids);
  const full = new Map(
    ((vRows ?? []) as { recipient_id: string; headline: string; reasoning: string; next_action: string; confidence: string }[])
      .map((v) => [v.recipient_id, { headline: v.headline, reasoning: v.reasoning, nextAction: v.next_action, confidence: v.confidence }])
  );
  for (const d of detail) d.verdict = full.get(d.id) ?? null;
  const verdicts = new Map([...full].map(([k, v]) => [k, { headline: v.headline, confidence: v.confidence }]));

  const notOpened = detail.filter((d) => d.opens === 0).length;

  // The model sees a reduced view: enough to reason over, not the whole trail.
  // Sorted by engagement so the interesting readers are not buried if the list
  // has to be truncated.
  const readers: ReportReader[] = detail
    .slice()
    .sort((a, b) => (b.replies.length - a.replies.length) || (b.questions.length - a.questions.length) || (b.seconds - a.seconds))
    .slice(0, 40)
    .map((d) => ({
      name: d.name,
      org: d.org,
      opens: d.opens,
      totalSeconds: d.seconds,
      questions: d.questions.map((q) => q.text),
      replies: d.replies,
      forwardedTo: d.forwardedTo,
      topPages: d.pages.slice(0, 4),
      verdict: verdicts.get(d.id) ?? null,
    }));

  return {
    input: {
      documentTitle: doc.title,
      // The model does not need the whole document to reason about how it was
      // read, and sending it on every report is the single largest cost here.
      documentText: (doc.extracted_text ?? "").slice(0, 12000),
      scope: recipientIds && recipientIds.length ? "selection" : "document",
      readers,
      pageTotals,
      notOpened,
      locale,
    },
    detail,
    documentTitle: doc.title,
    totalRecipients: recipients.length,
  };
}