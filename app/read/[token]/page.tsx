import { createAdminClient } from "@/lib/supabase/admin";
import PdfReader from "./PdfReader";
import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";

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
    .select("id, documents ( title, storage_path )")
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

  const { data: signed } = await admin.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 3600);

  return <PdfReader title={doc.title} fileUrl={signed?.signedUrl ?? ""} token={token} />;
}
