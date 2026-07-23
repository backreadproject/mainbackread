import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel } from "@/lib/theme";
import DocumentActions from "./DocumentActions";
import EraseReader from "./EraseReader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Sig = { recipient_id: string; kind: string; page: number | null; value: unknown; created_at: string };

export default async function AdminDocumentDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: doc } = await admin
    .from("documents")
    .select("id, title, owner_id, organization_id, project_id, created_at, archived_at, page_count, storage_path, extract_method, needs_page_ocr, extracted_text")
    .eq("id", id)
    .single();
  if (!doc) return <div style={{ padding: 30, fontFamily: T.font }}>Document not found.</div>;

  const { data: owner } = await admin.auth.admin.getUserById(doc.owner_id);
  const { data: recs } = await admin.from("recipients").select("id, label, first_name, last_name, email, delivery, share_token, created_at").eq("document_id", id).order("created_at", { ascending: false });
  const recipients = recs ?? [];
  const recIds = recipients.map((r) => r.id);

  const { data: sigsRaw } = recIds.length ? await admin.from("signals").select("recipient_id, kind, page, value, created_at").in("recipient_id", recIds).order("created_at", { ascending: false }) : { data: [] };
  const signals = (sigsRaw ?? []) as Sig[];
  const { data: msgs } = await admin.from("reader_messages").select("id, recipient_id, role, content, page, escalate, out_of_scope, created_at").eq("document_id", id).order("created_at", { ascending: true });
  const messages = msgs ?? [];
  const { data: vRuns } = await admin.from("usage_events").select("id, created_at, user_id").eq("kind", "verdict").eq("document_id", id).order("created_at", { ascending: false });
  const verdictRuns = vRuns ?? [];

  const per = new Map<string, { opens: number; questions: number; forwards: number; dwellMs: number; pages: Set<number>; last: string }>();
  for (const s of signals) {
    const a = per.get(s.recipient_id) ?? { opens: 0, questions: 0, forwards: 0, dwellMs: 0, pages: new Set<number>(), last: s.created_at };
    if (s.kind === "opened") a.opens++;
    else if (s.kind === "question") a.questions++;
    else if (s.kind === "forwarded") a.forwards++;
    else if (s.kind === "page_dwell") {
      const v = (s.value ?? {}) as Record<string, unknown>;
      a.dwellMs += Number(v.ms) || 0;
      if (s.page != null) a.pages.add(s.page);
    }
    if (new Date(s.created_at) > new Date(a.last)) a.last = s.created_at;
    per.set(s.recipient_id, a);
  }
  const msgsByRec = new Map<string, typeof messages>();
  for (const m of messages) {
    const arr = msgsByRec.get(m.recipient_id) ?? [];
    arr.push(m); msgsByRec.set(m.recipient_id, arr);
  }

  const mono = "'DM Mono', ui-monospace, monospace";
  const box = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, padding: 18, marginBottom: 16 } as const;
  const nameOf = (r: { label: string | null; first_name: string | null; last_name: string | null }) =>
    r.label || [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Unnamed reader";
  const secs = (ms: number) => (ms >= 60000 ? `${Math.round(ms / 60000)}m` : `${Math.round(ms / 1000)}s`);

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "26px 30px 60px" }}>
        <a href={`/${ADMIN_SLUG}/documents`} style={{ fontSize: 13, color: T.green, fontWeight: 600, textDecoration: "none", display: "inline-block", marginBottom: 14 }}>&larr; All documents</a>

        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
          <div>
            <h1 style={pageHeading}>{doc.title}</h1>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "5px 0 0", fontFamily: mono }}>
              {owner?.user?.email ?? "unknown owner"} {"\u00b7"} {doc.page_count ?? "?"} pages {"\u00b7"} added {new Date(doc.created_at).toLocaleDateString()}
              {doc.archived_at ? " \u00b7 archived" : ""}
            </p>
          </div>
          <DocumentActions documentId={doc.id} title={doc.title} archived={!!doc.archived_at} />
        </div>

        <div style={box}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Ingestion</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 26, fontSize: 13 }}>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Extract method</div><div style={{ color: T.heading }}>{doc.extract_method || "unknown"}</div></div>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Needs OCR</div><div style={{ color: doc.needs_page_ocr ? "#B54708" : T.heading }}>{doc.needs_page_ocr ? "yes" : "no"}</div></div>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Extracted text</div><div style={{ color: T.heading }}>{(doc.extracted_text ?? "").length.toLocaleString()} chars</div></div>
            <div><div style={{ ...microLabel, marginBottom: 4 }}>Verdicts run</div><div style={{ color: T.heading }}>{verdictRuns.length}</div></div>
          </div>
        </div>

        <div style={box}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Readers ({recipients.length})</h2>
          {recipients.length === 0 && <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Nobody has been sent this yet.</p>}
          {recipients.map((r, i) => {
            const a = per.get(r.id) ?? { opens: 0, questions: 0, forwards: 0, dwellMs: 0, pages: new Set<number>(), last: "" };
            const convo = msgsByRec.get(r.id) ?? [];
            return (
              <div key={r.id} style={{ borderTop: i ? `1px solid ${T.border}` : "none", padding: "14px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{nameOf(r)}</div>
                    <div style={{ fontSize: 11.5, color: T.muted, fontFamily: mono, marginTop: 2 }}>{r.email || "no email"} {"\u00b7"} {r.delivery || "link"}</div>
                  </div>
                  <EraseReader recipientId={r.id} expected={(r.email || nameOf(r)) as string} />
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: mono }}>
                    {a.opens} opens {"\u00b7"} {a.questions} Q {"\u00b7"} {a.forwards} fwd {"\u00b7"} {secs(a.dwellMs)} on {a.pages.size} pages
                    {a.last ? ` \u00b7 last ${new Date(a.last).toLocaleDateString()}` : ""}
                  </div>
                </div>
                {convo.length > 0 && (
                  <div style={{ marginTop: 10, background: "#FBFCFC", border: `1px solid ${T.borderSoft}`, borderRadius: 10, padding: "10px 12px" }}>
                    {convo.map((m) => (
                      <div key={m.id} style={{ display: "flex", gap: 10, padding: "6px 0", alignItems: "flex-start" }}>
                        <span style={{ flex: "none", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: T.rPill, background: m.role === "user" ? "#E6EEFB" : T.greenSoft, color: m.role === "user" ? "#2563EB" : T.greenText, marginTop: 2 }}>
                          {m.role === "user" ? "reader" : "ai"}
                        </span>
                        <span style={{ fontSize: 13, color: T.heading, lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                          {m.content}
                          {m.page != null && <span style={{ color: T.muted, fontFamily: mono, fontSize: 11 }}> {"\u00b7"} p{m.page}</span>}
                          {m.escalate && <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: T.rPill, background: "#FEF0C7", color: "#B54708" }}>escalated</span>}
                          {m.out_of_scope && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: T.rPill, background: T.pillNeutralBg, color: T.body }}>out of scope</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={box}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: "0 0 12px" }}>Raw signals ({signals.length})</h2>
          {signals.length === 0 && <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>None yet.</p>}
          {signals.slice(0, 60).map((s, i) => {
            const r = recipients.find((x) => x.id === s.recipient_id);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderTop: i ? `1px solid ${T.borderSoft}` : "none", fontSize: 12.5 }}>
                <span style={{ color: T.heading }}>{r ? nameOf(r) : "unknown"} <span style={{ color: T.green, fontWeight: 600 }}>{s.kind}</span>{s.page != null ? <span style={{ color: T.muted }}> p{s.page}</span> : null}</span>
                <span style={{ color: T.muted, fontFamily: mono, fontSize: 11 }}>{new Date(s.created_at).toLocaleString()}</span>
              </div>
            );
          })}
          {signals.length > 60 && <p style={{ color: T.muted, fontSize: 12, marginTop: 10 }}>Showing the 60 most recent of {signals.length}.</p>}
        </div>
      </main>
    </div>
  );
}

