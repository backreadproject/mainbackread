import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RecipientDetailClient from "./RecipientDetailClient";

export default async function RecipientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipient } = await supabase
    .from("recipients")
    .select("id, label, share_token, document_id, created_at, documents ( title )")
    .eq("id", id)
    .single();

  if (!recipient) notFound();
  const doc = recipient.documents as unknown as { title: string } | undefined;

  const { data: signals } = await supabase
    .from("signals")
    .select("kind, page, value, created_at")
    .eq("recipient_id", id)
    .order("created_at", { ascending: true });

  return <RecipientDetailClient
    recipient={{ id: recipient.id, label: recipient.label, shareToken: recipient.share_token, documentId: recipient.document_id, documentTitle: doc?.title ?? "Untitled" }}
    signals={signals ?? []}
  />;
}
