import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import PdfReader from "./PdfReader";
import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";
import { sourceForRecipient } from "@/lib/variants";

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
    .select("id, label, first_name, email, document_id, expires_at, revoked_at, is_signer, signed_at, declined_at, documents ( owner_id, organization_id, title, signing_enabled, signing_completed_at )")
    .eq("share_token", token)
    .single();
  const doc = recipient ? await sourceForRecipient(admin, recipient.id as string) : null;

  const readerEmail = ((recipient?.email as string | null) ?? "").trim();
  const recDoc = recipient?.documents as unknown as { owner_id: string; organization_id: string | null } | undefined;

  // Was this reader forwarded the document by another reader? If so we must not
  // name the sender: a forwarded colleague was told "Hero shared this with you"
  // and has never heard of the account holder. Naming them would disclose a
  // customer to someone the neutral domain exists to keep them from.
  //
  // A forwarded recipient always has an email, because /api/forward requires
  // one, so a link-mode reader can never be forwarded and this never runs for
  // them. Scoped to this document: being forwarded document A says nothing
  // about how you received document B.
  //
  // RESOLVED BEFORE the failure branch, because an expired link should be able
  // to say who to ask -- under exactly the same rule.
  let wasForwarded = false;
  if (recipient && readerEmail) {
    const { data: fwd } = await admin
      .from("signals")
      .select("id, recipients!inner ( document_id )")
      .eq("kind", "forwarded")
      .eq("recipients.document_id", recipient.document_id as string)
      .contains("value", { colleagues: [{ email: readerEmail }] })
      .limit(1);
    wasForwarded = (fwd ?? []).length > 0;
  }

  // Who shared this, named only for readers who were told that name already.
  let senderName = "";
  if (recDoc?.owner_id && !wasForwarded) {
    const [{ data: prof }, orgRes] = await Promise.all([
      admin.from("profiles").select("first_name, last_name").eq("id", recDoc.owner_id).single(),
      recDoc.organization_id
        ? admin.from("organizations").select("name").eq("id", recDoc.organization_id).single()
        : Promise.resolve({ data: null }),
    ]);
    const personName = `${(prof?.first_name as string) || ""} ${(prof?.last_name as string) || ""}`.trim();
    const orgName = ((orgRes as { data: { name?: string } | null }).data?.name ?? "").trim();
    senderName = personName || orgName;
  }
  const senderFirst = senderName.split(/\s+/)[0] || "";

  const revoked = !!recipient?.revoked_at;
  const expired = !!recipient?.expires_at && new Date(recipient.expires_at as string) < new Date();

  if (!recipient || !doc || !doc.storagePath || revoked || expired) {
    // Three situations, not one. A link that never existed gets the old vague
    // line, because there is nothing honest to add. A withdrawn or expired one
    // can say what happened and who to ask -- and names that person only when
    // this reader was told the name already.
    const headline = revoked ? r.linkRevoked : expired ? r.linkExpired : r.invalidLink;
    const followUp = (revoked || expired)
      ? (senderFirst ? `${r.askSenderNamed} ${senderFirst}.` : r.askSenderAnon)
      : "";
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#E9EAEC", fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <p style={{ color: "#3C4450", fontSize: 15, margin: 0, lineHeight: 1.5 }}>{headline}</p>
          {followUp && <p style={{ color: "#6E7480", fontSize: 14, margin: "8px 0 0", lineHeight: 1.55 }}>{followUp}</p>}
        </div>
      </div>
    );
  }

  const firstName = (recipient.first_name as string | null)?.trim() || "";
  const greeting = firstName ? `${r.hiName} ${firstName}` : r.hiThere;

  const recDocFull = recipient.documents as unknown as { title?: string; signing_enabled?: boolean; signing_completed_at?: string | null } | undefined;
  const iSign = !!recipient.is_signer && !!recDocFull?.signing_enabled;
  let signing: {
    name: string; sentToEmail: string | null;
    alreadySigned: { name: string; at: string }[];
    awaiting: number;
    mySignedAt: string | null; myDeclinedAt: string | null;
    fields: { page: number; x: number; y: number; w: number; h: number; kind: string }[];
    documentDeclined: boolean;
    documentCompleted: boolean;
  } | null = null;
  if (iSign) {
    const [{ data: co }, { data: myFields }] = await Promise.all([
      admin.from("recipients").select("id, label, signed_at, declined_at").eq("document_id", recipient.document_id as string).eq("is_signer", true),
      admin.from("signature_fields").select("page, x, y, w, h, kind").eq("recipient_id", recipient.id as string),
    ]);
    const others = (co ?? []).filter((s) => s.id !== recipient.id);
    signing = {
      name: (recipient.label as string) || (recipient.first_name as string) || "",
      sentToEmail: (recipient.email as string | null) ?? null,
      alreadySigned: others.filter((s) => s.signed_at).map((s) => ({ name: (s.label as string) || "", at: s.signed_at as string })),
      awaiting: others.filter((s) => !s.signed_at && !s.declined_at).length,
      mySignedAt: (recipient.signed_at as string | null) ?? null,
      myDeclinedAt: (recipient.declined_at as string | null) ?? null,
      fields: (myFields ?? []).map((x) => ({ page: Number(x.page), x: Number(x.x), y: Number(x.y), w: Number(x.w), h: Number(x.h), kind: String(x.kind) })),
      documentDeclined: (co ?? []).some((s) => s.declined_at),
      documentCompleted: !!recDocFull?.signing_completed_at,
    };
  }

  const { data: signed } = await admin.storage
    .from("documents")
    .createSignedUrl(doc.storagePath, 3600);

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

  return (
    <PdfReader
      title={doc.title}
      fileUrl={signed?.signedUrl ?? ""}
      token={token}
      greeting={greeting}
      initialThread={initialThread}
      senderName={senderName}
      senderFirst={senderFirst}
      readerEmail={readerEmail}
      signing={signing}
    />
  );
}