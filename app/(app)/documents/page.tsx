import { createClient } from "@/lib/supabase/server";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, page_count, created_at")
    .order("created_at", { ascending: false });

  return <DocumentsClient documents={documents ?? []} />;
}
