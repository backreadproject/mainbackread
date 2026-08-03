import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";
import { certificateRef, parseRef, refRange } from "@/lib/pdf/certificate-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public certificate lookup.
//
// Deliberately OUTSIDE app/(app): that layout demands a session and applies the
// lapsed wall, and the person checking a signed contract has neither an account
// nor any relationship with the sender's billing.
//
// It also stays live for a lapsed customer, exactly as reader links do. A
// counterparty verifying a contract must not find it dead because someone's
// card expired.
export const metadata: Metadata = {
  title: { absolute: "Verify a certificate" },
  robots: { index: false, follow: false },
};

const INK = "#101828", BODY = "#344054", MUTED = "#667085", FAINT = "#98A2B3", LINE = "#E4E7EC";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
function when(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, `
       + `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

type Found = {
  reference: string;
  title: string;
  completedAt: string;
  fingerprint: string | null;
  signers: { name: string; signedAt: string | null }[];
};

async function lookup(raw: string): Promise<Found | null> {
  const hex = parseRef(raw);
  if (!hex) return null;

  const admin = createAdminClient();
  const { lo, hi } = refRange(hex);

  // A uuid cannot be pattern-matched through PostgREST, so the reference
  // becomes a RANGE over the primary key. Uses the pk index, no scan.
  const { data: docs } = await admin
    .from("documents")
    .select("id, title, storage_path, signing_completed_at")
    .gte("id", lo)
    .lte("id", hi)
    .limit(2);

  // Two matches means the reference is ambiguous, and answering with either one
  // would be a guess on a document whose whole purpose is being checkable.
  if (!docs || docs.length !== 1) return null;
  const doc = docs[0];
  if (!doc.signing_completed_at) return null;

  const { data: recs } = await admin
    .from("recipients")
    .select("label, first_name, last_name, signed_at")
    .eq("document_id", doc.id as string)
    .eq("is_signer", true)
    .order("signed_at", { ascending: true });

  // The fingerprint is recomputed from the stored original rather than kept in
  // a column, so it cannot drift from the file it describes.
  let fingerprint: string | null = null;
  if (doc.storage_path) {
    const { data: file } = await admin.storage.from("documents").download(doc.storage_path as string);
    if (file) fingerprint = createHash("sha256").update(new Uint8Array(await file.arrayBuffer())).digest("hex");
  }

  return {
    reference: certificateRef(String(doc.id)),
    title: String(doc.title || "Document"),
    completedAt: String(doc.signing_completed_at),
    fingerprint,
    // NAMES ONLY. Emails and IP addresses are on the certificate, for the
    // parties who hold it. On an open page they would turn a printed reference
    // into a lookup service for personal data.
    signers: (recs ?? []).map((r) => ({
      name: String(r.label || [r.first_name, r.last_name].filter(Boolean).join(" ") || "Signer"),
      signedAt: (r.signed_at as string) ?? null,
    })),
  };
}

export default async function VerifyPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const found = await lookup(decodeURIComponent(ref));

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: "#fff", color: BODY,
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  display: "flex", justifyContent: "center", padding: "64px 20px" }}>
      <main style={{ width: "100%", maxWidth: 620 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 30 }}>
          <svg width="20" height="20" viewBox="0 0 64 64" aria-hidden>
            <rect width="64" height="64" rx="14" fill="#071812" />
            <circle cx="32" cy="32" r="17" fill="none" stroke="#33E6A2" strokeWidth="5" />
            <circle cx="32" cy="32" r="7.5" fill="#33E6A2" />
          </svg>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>ReadProspects</span>
        </div>
        {children}
      </main>
    </div>
  );

  // One message for a malformed reference, an unknown one, and a document that
  // is not fully signed. Telling them apart would let someone probing learn
  // which references are real.
  if (!found) {
    return shell(
      <>
        <h1 style={{ fontSize: 21, fontWeight: 600, color: INK, letterSpacing: "-0.021em", margin: "0 0 8px" }}>
          No certificate found
        </h1>
        <p style={{ fontSize: 13.5, lineHeight: 1.65, margin: 0, color: MUTED }}>
          We hold no completed certificate for that reference. Check it against the printed
          copy, including the dashes. If it still does not resolve, the certificate may not
          have been issued by ReadProspects.
        </p>
      </>
    );
  }

  const row = (label: string, value: React.ReactNode, mono = false) => (
    <div style={{ display: "grid", gridTemplateColumns: "150px minmax(0,1fr)", gap: 16,
                  padding: "11px 0", borderTop: `1px solid ${LINE}` }}>
      <span style={{ fontSize: 12.5, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 13, color: INK, fontFamily: mono ? "ui-monospace, monospace" : "inherit",
                     wordBreak: mono ? "break-all" : "normal" }}>{value}</span>
    </div>
  );

  return shell(
    <>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: "#1F6F4A" }} />
        <span style={{ fontSize: 12, letterSpacing: "0.06em", color: "#1F6F4A", fontWeight: 500 }}>
          CERTIFICATE ON RECORD
        </span>
      </div>
      <h1 style={{ fontSize: 21, fontWeight: 600, color: INK, letterSpacing: "-0.021em", margin: "0 0 6px" }}>
        {found.title}
      </h1>
      <p style={{ fontSize: 13, color: MUTED, margin: "0 0 24px", fontFamily: "ui-monospace, monospace" }}>
        {found.reference}
      </p>

      {row("Completed", when(found.completedAt))}
      {row("Signers", String(found.signers.length))}
      {found.signers.map((s, i) => row(i === 0 ? "Signed by" : "", (
        <>
          {s.name}
          {s.signedAt ? <span style={{ color: FAINT }}>{"  ·  " + when(s.signedAt)}</span> : null}
        </>
      )))}
      {found.fingerprint ? row("Original SHA-256", found.fingerprint, true) : null}

      <p style={{ fontSize: 12, color: FAINT, lineHeight: 1.65, marginTop: 26,
                  borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
        This record confirms that a certificate with this reference exists and that the
        signing was completed. It does not verify the identity of any signer beyond the
        assertion each of them made. Email addresses and IP addresses appear on the
        certificate itself and are not published here.
        {found.fingerprint ? " The SHA-256 value identifies the document as it stood before any signature was applied, so a copy you hold can be checked against it." : ""}
      </p>
    </>
  );
}