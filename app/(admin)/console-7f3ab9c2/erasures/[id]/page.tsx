import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
import { ERASURE_ACTIONS, erasureRef } from "../page";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ENTITY = "ReadProspects Technologies Nigeria";
const RC = "RC 9702396";
const ADDRESS = "325 Enugu Road, FCDA, Bwari, Abuja, Nigeria";
const CONTACT = "privacy@readprospects.com";
export default async function ErasureReport({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const { view } = await searchParams;
  // Two audiences, two documents. The internal copy carries everything. The
  // subject copy must not name the sender or their documents: telling a third
  // party which company was pitching whom would resolve one person's data rights
  // by breaching another party's confidence.
  const forSubject = view === "subject";
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("admin_audit")
    .select("id, action, actor_email, target_user_id, detail, created_at")
    .eq("id", id)
    .single();
  if (!row || !ERASURE_ACTIONS.includes(row.action as string)) {
    return <div style={{ padding: 40, fontFamily: T.font, color: T.body }}>No erasure record with that reference.</div>;
  }
  const d = (row.detail ?? {}) as Record<string, unknown>;
  const ref = erasureRef(row.id as string);
  const when = new Date(row.created_at as string);
  const subject = (d.email as string) || (d.name as string) || "not recorded";
  const recRows = Number(d.recipientRowsRemoved ?? (d.recipientId ? 1 : 0));
  const sigs = Number(d.signalsRemoved ?? 0);
  const msgs = Number(d.messagesRemoved ?? 0);
  const mentions = Number(d.signalsUpdated ?? 0);
  const mono = "'DM Mono', ui-monospace, monospace";
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 14 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  const line = (label: string, value: string, i: number, len: number) => (
    <div key={label} style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", gap: 16, padding: "11px 18px", borderBottom: i < len - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13.5 }}>
      <span style={{ color: T.muted }}>{label}</span>
      <span style={{ color: T.heading, overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
  const categories: [string, string][] = [
    ["Reader records", recRows + (recRows === 1 ? " record" : " records") + " deleted, including the private access link"],
    ["Reading activity", sigs + " recorded " + (sigs === 1 ? "signal" : "signals") + " deleted: opens, time on page, questions and forwards"],
    ["Conversations", msgs + " " + (msgs === 1 ? "message" : "messages") + " with the document companion deleted"],
    ["Third-party mentions", mentions + " forwarding " + (mentions === 1 ? "record" : "records") + " amended to remove the name and email address"],
  ];
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main className="rep" style={{ maxWidth: 760, padding: "34px 28px 120px" }}>
        <div className="noprint" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <a href={"/" + ADMIN_SLUG + "/erasures"} style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}><span>{"\u2039"}</span> All erasures</a>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a href={"?view=internal"} style={{ height: 30, display: "inline-flex", alignItems: "center", padding: "0 11px", borderRadius: T.rBtn, fontSize: 12.5, fontWeight: forSubject ? 400 : 600, textDecoration: "none", border: "1px solid " + (forSubject ? T.border : T.greenBorder), background: forSubject ? T.card : T.greenSoft, color: forSubject ? T.body : T.greenText }}>Internal file copy</a>
            <a href={"?view=subject"} style={{ height: 30, display: "inline-flex", alignItems: "center", padding: "0 11px", borderRadius: T.rBtn, fontSize: 12.5, fontWeight: forSubject ? 600 : 400, textDecoration: "none", border: "1px solid " + (forSubject ? T.greenBorder : T.border), background: forSubject ? T.greenSoft : T.card, color: forSubject ? T.greenText : T.body }}>Copy for the person</a>
          </div>
        </div>
        {forSubject && (
          <div className="noprint" style={{ background: T.amberSoft, border: "1px solid " + T.amberBorder, borderRadius: T.rCard, padding: "11px 13px", fontSize: 13, color: T.amberText, marginBottom: 18, lineHeight: 1.55 }}>
            This version is safe to send. It names no sender, no organisation and no document, because that would disclose a customer&apos;s commercial activity to a third party.
          </div>
        )}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12.5, color: T.muted, fontFamily: mono, marginBottom: 6 }}>{ref}</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.25 }}>Certificate of erasure</h1>
          <p style={{ fontSize: 14, color: T.muted, margin: "8px 0 0", lineHeight: 1.55 }}>
            Issued by {ENTITY} ({RC}), {ADDRESS}. Enquiries: {CONTACT}
          </p>
        </div>
        <div style={card}>
          <div style={head}>The request</div>
          {[
            ["Reference", ref] as [string, string],
            ["Data subject", subject],
            ["Completed", when.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" })],
            ["Erasure route", row.action === "erase_reader" ? "Single reader record" : "All records matching the email address"],
          ].map(([k, v], i, a) => line(k, v, i, a.length))}
        </div>
        <div style={card}>
          <div style={head}>What was erased</div>
          {categories.map(([k, v], i) => line(k, v, i, categories.length))}
        </div>
        <div style={card}>
          <div style={head}>Confirmation</div>
          <div style={{ padding: 18, fontSize: 13.5, color: T.body, lineHeight: 1.65 }}>
            <p style={{ margin: "0 0 12px" }}>
              The personal data described above has been permanently deleted from our production systems. Deletion cascades to every associated record, and the data cannot be restored by us.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              A record of the forwarding events themselves has been retained without any identifying details, so that our customer&apos;s own activity records remain accurate. That retained record does not identify the data subject.
            </p>
            <p style={{ margin: 0 }}>
              This certificate is itself retained as evidence that the request was carried out, under Article 5(2) of the GDPR and section 24 of the Nigeria Data Protection Act 2023.
            </p>
          </div>
        </div>
        {!forSubject && (
          <div style={{ ...card, borderColor: T.amberBorder }}>
            <div style={{ ...head, background: T.amberSoft, color: T.amberText, borderBottomColor: T.amberBorder }}>Internal only, do not send</div>
            {[
              ["Performed by", (row.actor_email as string) || "unknown"] as [string, string],
              ["Audit record id", row.id as string],
              ["Affected account", (row.target_user_id as string) || "not recorded"],
              ["Raw detail", JSON.stringify(row.detail ?? {})],
            ].map(([k, v], i, a) => line(k, v, i, a.length))}
          </div>
        )}
        <p style={{ fontSize: 12, color: T.faint, marginTop: 18, lineHeight: 1.6 }}>
          Generated from audit record {row.id as string} on {new Date().toLocaleString()}. This document is rendered from the audit log itself, so it cannot diverge from the record it describes.
        </p>
        <div className="noprint" style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12.5, color: T.muted, margin: 0 }}>Print with Ctrl+P and choose Save as PDF.</p>
        </div>
      </main>
      <style>{`
        @media print {
          .noprint { display: none !important; }
          /* MobileShell sets height:100vh and overflow:hidden on the app shell,
             which would print one clipped page and silently lose the rest. */
          html, body, .app-shell, .app-body, .app-content {
            height: auto !important; max-height: none !important; overflow: visible !important;
          }
          .app-sidebar-wrap, .app-topbar { display: none !important; }
          .rep { max-width: none !important; padding: 0 !important; }
          a { text-decoration: none !important; color: inherit !important; }
        }
      `}</style>
    </div>
  );
}