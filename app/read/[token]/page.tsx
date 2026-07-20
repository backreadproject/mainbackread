import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import PdfReader from "./PdfReader";
import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";

// Neutral, un-branded metadata for the reader surface. This runs on relaydocuments.com
// and must never fall back to the marketing default title (which names ReadProspects). We show
// the document's own name in the tab and mark the page no-index so nothing branded leaks.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  let name = "Document";
  try {
    const { token } = await params;
    const admin = createAdminClient();
    const { data } = await admin
      .from("recipients")
      .select("documents ( title )")
      .eq("share_token", token)
      .single();
    const doc = data?.documents as unknown as { title?: string } | undefined;
    if (doc?.title && doc.title.trim()) name = doc.title.trim();
  } catch {
    /* fall back to the neutral default title */
  }
  return {
    title: { absolute: name },
    description: "You have received a document.",
    robots: { index: false, follow: false },
    openGraph: { title: name, description: "You have received a document." },
  };
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const r = getDict(locale).readerPage;
  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from("recipients")
    .select("id, first_name, documents ( title, storage_path )")
    .eq("share_token", token)
    .single();
  const doc = recipient?.documents as unknown as
    | { title: string; storage_path: string }
    | undefined;
  if (!recipient || !doc) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#E9EAEC", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#6E7480" }}>{r.invalidLink}</p>
      </div>
    );
  }
  const firstName = (recipient.first_name as string | null)?.trim() || "";
  const greeting = firstName ? `${r.hiName} ${firstName}` : r.hiThere;
  const { data: signed } = await admin.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 3600);

  // Load the saved conversation (server-side, service-role only) so it restores on any
  // device that opens this link. reader_messages is invisible to account holders.
  const { data: messages } = await admin
    .from("reader_messages")
    .select("role, content")
    .eq("recipient_id", recipient.id as string)
    .order("created_at", { ascending: true });
  const initialThread = (messages ?? []).map((m) => ({
    role: (m.role === "doc" ? "doc" : "user") as "user" | "doc",
    text: (m.content as string) ?? "",
  }));

  return <PdfReader title={doc.title} fileUrl={signed?.signedUrl ?? ""} token={token} greeting={greeting} initialThread={initialThread} />;
}
