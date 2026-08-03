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

// The reference is DERIVED from the document id, never stored. Two people
// holding the same certificate compute the same string, and there is no second
// place for it to drift from the document it names.
//
// Twelve hex characters, not eight. Eight is 4.3 billion, which sounds ample
// until you remember the birthday problem: collisions become likely at tens of
// thousands of documents, not billions. Twelve is 281 trillion and the string
// is four characters longer. Grouped in fours so it can be read off paper and
// typed without losing your place.
export function certificateRef(documentId: string): string {
  const h = documentId.replace(/-/g, "").slice(0, 12).toUpperCase();
  return "RP-SIG-" + h.slice(0, 4) + "-" + h.slice(4, 8) + "-" + h.slice(8, 12);
}

// Accepts anything a person might type: spaces, missing dashes, lower case,
// with or without the RP-SIG prefix. Returns null if it is not a reference.
export function parseRef(input: string): string | null {
  const s = (input || "").toUpperCase().replace(/[^0-9A-F]/g, "");
  const body = s.startsWith("RPSIG") ? s.slice(5) : s;
  return /^[0-9A-F]{12}$/.test(body) ? body.toLowerCase() : null;
}

// A uuid cannot be pattern-matched through PostgREST, so the twelve hex
// characters become a RANGE over the primary key instead: everything from
// prefix-0000... to prefix-ffff.... Uses the pk index rather than scanning.
export function refRange(hex12: string): { lo: string; hi: string } {
  const a = hex12.slice(0, 8), b = hex12.slice(8, 12);
  return {
    lo: a + "-" + b + "-0000-0000-000000000000",
    hi: a + "-" + b + "-ffff-ffff-ffffffffffff",
  };
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

// VIEWED is not a column. The first "opened" signal already records it, and a
// second home for the same fact is how the two drift apart.
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