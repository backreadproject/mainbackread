import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";

export type CertRow = {
  name: string;
  email: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  ip: string | null;
  method: string | null;
  signature: string | null;
};

// The reference is derived from the document id, never stored. Two people
// holding the same certificate compute the same string, and there is no second
// place for it to drift out of step with the document it names.
export function certificateRef(documentId: string): string {
  return "RP-SIG-" + documentId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function verifyUrl(documentId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.readprospects.com";
  return base.replace(/\/+$/, "") + "/verify/" + certificateRef(documentId);
}

// Rendered at generation time and embedded. A QR fetched from an image service
// would put a third party between a reader and a legal document.
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 320,
    color: { dark: "#101828FF", light: "#FFFFFFFF" },
  });
}

// VIEWED is not a column. The first "opened" signal already records it, and
// adding a second place for the same fact is how the two drift apart.
export async function firstOpens(
  admin: ReturnType<typeof createAdminClient>,
  recipientIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!recipientIds.length) return out;
  const { data } = await admin
    .from("signals")
    .select("recipient_id, created_at")
    .in("recipient_id", recipientIds)
    .eq("kind", "opened")
    .order("created_at", { ascending: true });
  for (const row of data ?? []) {
    const id = row.recipient_id as string;
    if (!out.has(id)) out.set(id, row.created_at as string);
  }
  return out;
}