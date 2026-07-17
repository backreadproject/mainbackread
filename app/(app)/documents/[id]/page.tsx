import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import DocumentDetailClient from "./DocumentDetailClient";

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
    .select("id, label, share_token, created_at")
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

  return (
    <DocumentDetailClient
      doc={doc}
      recipients={recs}
      signals={signals ?? []}
    />
  );
}
