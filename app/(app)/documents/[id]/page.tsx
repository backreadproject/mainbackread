import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import DocumentDetailClient from "./DocumentDetailClient";
import { groupReaders, type GroupableReader } from "@/lib/accounts";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures this only returns the document if the current user owns it.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, created_at")
    .eq("id", id)
    .single();

  if (!doc) notFound();

  const { data: recipients } = await supabase
    .from("recipients")
    .select("id, label, share_token, created_at, variant_id, email, forwarded_by, outcome")
    .eq("document_id", id)
    .order("created_at", { ascending: false });

  const recs = recipients ?? [];

  // Pull all signals for these recipients in one query.
  const ids = recs.map((r) => r.id);
  const { data: signals } = ids.length
    ? await supabase
        .from("signals")
        .select("recipient_id, kind, page, value, created_at")
        .in("recipient_id", ids)
        .order("created_at", { ascending: true })
    : { data: [] };

  // A/B variants. document_variants is service-role only (RLS with no policies),
  // so it is read with the admin client AFTER RLS above has proven ownership.
  // Who is reading this, grouped into the companies behind them. Two
  // relations: a shared company domain, and the forward chain -- and the
  // chain is the one nobody without forwarding can produce.
  const agg = new Map<string, { opens: number; questions: number; replied: boolean; lastAt: string }>();
  for (const sig of signals ?? []) {
    const a = agg.get(sig.recipient_id) ?? { opens: 0, questions: 0, replied: false, lastAt: sig.created_at };
    if (sig.kind === "opened") a.opens++;
    if (sig.kind === "question") a.questions++;
    if (sig.kind === "replied") a.replied = true;
    if (new Date(sig.created_at) > new Date(a.lastAt)) a.lastAt = sig.created_at;
    agg.set(sig.recipient_id, a);
  }
  const groupable: GroupableReader[] = recs.map((r) => {
    const a = agg.get(r.id) ?? { opens: 0, questions: 0, replied: false, lastAt: "" };
    return {
      id: r.id,
      name: (r.label as string | null) || "Unnamed reader",
      email: (r.email as string | null) ?? null,
      forwardedBy: (r.forwarded_by as string | null) ?? null,
      opens: a.opens,
      questions: a.questions,
      replied: a.replied,
      outcome: (r.outcome as string | null) ?? null,
      lastAt: a.lastAt,
    };
  });
  const grouped = groupReaders(groupable);

  const admin = createAdminClient();
  const { data: variants } = await admin
    .from("document_variants")
    .select("id, label, note, active, storage_path")
    .eq("document_id", id)
    .order("label", { ascending: true });

  return (
    <DocumentDetailClient
      doc={doc}
      recipients={recs}
      signals={signals ?? []}
      variants={variants ?? []}
      grouped={grouped}
    />
  );
}
