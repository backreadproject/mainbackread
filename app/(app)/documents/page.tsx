import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const ctx = await getOrgContext();
  const isOrg = !!ctx.org;

  // Projects available for assignment (RLS-limited to what I can see).
  let projects: { id: string; name: string }[] = [];
  if (isOrg && ctx.org) {
    const { data: projs } = await supabase.from("projects").select("id, name").eq("organization_id", ctx.org.id).order("name");
    projects = projs ?? [];
  }

  const { data: docs } = await supabase.from("documents").select("id, title, created_at, archived_at, project_id").order("created_at", { ascending: false });
  const documents = docs ?? [];
  const docIds = documents.map((d) => d.id);

  // recipients for these docs
  const { data: recips } = docIds.length ? await supabase.from("recipients").select("id, document_id").in("document_id", docIds) : { data: [] };
  const recipients = recips ?? [];
  const recIds = recipients.map((r) => r.id);
  const recByDoc: Record<string, number> = {};
  for (const r of recipients) recByDoc[r.document_id] = (recByDoc[r.document_id] ?? 0) + 1;

  // signals for these recipients
  const { data: sigs } = recIds.length ? await supabase.from("signals").select("recipient_id, kind, value").in("recipient_id", recIds) : { data: [] };
  const signals = sigs ?? [];

  // map recipient -> document
  const recToDoc: Record<string, string> = {};
  for (const r of recipients) recToDoc[r.id] = r.document_id;

  // per-doc: reads (opened recipients), questions
  const openedByDoc: Record<string, Set<string>> = {};
  const questionsByDoc: Record<string, number> = {};
  let totalReads = 0, totalQuestions = 0, totalEscalated = 0;
  const openedRecipients = new Set<string>();
  for (const s of signals) {
    const docId = recToDoc[s.recipient_id];
    if (!docId) continue;
    if (s.kind === "opened") {
      (openedByDoc[docId] ??= new Set()).add(s.recipient_id);
      openedRecipients.add(s.recipient_id);
    }
    if (s.kind === "question") {
      questionsByDoc[docId] = (questionsByDoc[docId] ?? 0) + 1;
      totalQuestions++;
      if (s.value && typeof s.value === "object" && "escalated" in s.value && (s.value as {escalated?:boolean}).escalated) totalEscalated++;
    }
  }
  totalReads = openedRecipients.size;

  const projMap = new Map(projects.map((p) => [p.id, p.name]));
  const rows = documents.map((d) => ({
    id: d.id, title: d.title, createdAt: d.created_at, archived: !!d.archived_at,
    projectId: (d.project_id as string | null) ?? null,
    projectName: d.project_id ? (projMap.get(d.project_id) ?? null) : null,
    recipients: recByDoc[d.id] ?? 0,
    reads: (openedByDoc[d.id]?.size) ?? 0,
    questions: questionsByDoc[d.id] ?? 0,
  }));

  const stats = {
    documents: documents.length,
    shared: documents.length,
    totalReads,
    pendingReads: Math.max(0, recipients.length - totalReads),
    questions: totalQuestions,
    escalated: totalEscalated,
    activeReaders: recipients.length,
  };

  // A/B variants are a Company II feature and an organization one.
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const planCtx = user ? await resolvePlanForUser(admin, user.id) : null;
  const abEnabled = isOrg && !!planCtx && hasFeature(planCtx.plan.id, "abVersions");

  return <DocumentsClient rows={rows} stats={stats} isOrg={isOrg} orgId={ctx.org?.id ?? null} projects={projects} abEnabled={abEnabled} />;
}

