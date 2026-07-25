import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
import SupportConversations from "./SupportConversations";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function SupportPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const low = term.toLowerCase();
  const admin = createAdminClient();
  let accounts: { id: string; email: string; name: string; banned: boolean }[] = [];
  let documents: { id: string; title: string; owner: string; created_at: string }[] = [];
  let readers: { id: string; name: string; email: string; docId: string; docTitle: string }[] = [];
  if (term) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const users = list?.users ?? [];
    const emailById = new Map(users.map((u) => [u.id, u.email ?? ""]));
    const ids = users.map((u) => u.id);
    const { data: profs } = ids.length ? await admin.from("profiles").select("id, first_name, last_name").in("id", ids) : { data: [] };
    const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
    accounts = users.map((u) => {
      const p = pmap.get(u.id) as { first_name?: string | null; last_name?: string | null } | undefined;
      return { id: u.id, email: u.email ?? "unknown",
        name: [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim() || "\u2014",
        banned: !!(u as unknown as { banned_until?: string | null }).banned_until };
    }).filter((a) => a.email.toLowerCase().includes(low) || a.name.toLowerCase().includes(low)).slice(0, 12);
    const { data: docs } = await admin.from("documents").select("id, title, owner_id, created_at").ilike("title", "%" + term + "%").limit(12);
    documents = (docs ?? []).map((d) => ({ id: d.id, title: d.title, owner: emailById.get(d.owner_id) ?? "unknown", created_at: d.created_at }));
    const { data: recs } = await admin.from("recipients").select("id, label, first_name, last_name, email, document_id").or("email.ilike.%" + term + "%,label.ilike.%" + term + "%").limit(12);
    const recDocIds = [...new Set((recs ?? []).map((r) => r.document_id))];
    const { data: rdocs } = recDocIds.length ? await admin.from("documents").select("id, title").in("id", recDocIds) : { data: [] };
    const titleById = new Map((rdocs ?? []).map((d) => [d.id, d.title as string]));
    readers = (recs ?? []).map((r) => ({
      id: r.id, name: (r.label as string | null) || [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || "Unnamed reader",
      email: (r.email as string | null) ?? "no email", docId: r.document_id, docTitle: titleById.get(r.document_id) ?? "document",
    }));
  }
  // Support chat: open conversations first, newest activity first.
  const { data: convRows } = await admin
    .from("support_conversations")
    .select("id, email, name, surface, status, last_message_at, escalated_at")
    .order("last_message_at", { ascending: false })
    .limit(40);
  const convIds = (convRows ?? []).map((c) => c.id);
  const { data: msgRows } = convIds.length
    ? await admin.from("support_messages").select("id, conversation_id, role, content, created_at").in("conversation_id", convIds).order("created_at", { ascending: true })
    : { data: [] };
  const byConv = new Map<string, { id: string; role: string; content: string; created_at: string }[]>();
  for (const m of msgRows ?? []) {
    const arr = byConv.get(m.conversation_id as string) ?? [];
    arr.push({ id: m.id as string, role: m.role as string, content: m.content as string, created_at: m.created_at as string });
    byConv.set(m.conversation_id as string, arr);
  }
  const rank: Record<string, number> = { escalated: 0, answered: 1, bot: 2, closed: 3 };
  const conversations = (convRows ?? [])
    .map((c) => ({ ...c, messages: byConv.get(c.id as string) ?? [] }))
    .sort((a, b) => (rank[a.status as string] ?? 9) - (rank[b.status as string] ?? 9)) as never[];
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 } as const;
  const head = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const total = accounts.length + documents.length + readers.length;
  const row = (i: number, len: number) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < len - 1 ? "1px solid " + T.borderSoft : "none", textDecoration: "none", fontSize: 13.5 } as const);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "34px 28px 120px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>Support</h1>
        <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>Search accounts, documents and readers in one place.</p>
        <form style={{ display: "flex", gap: 9, margin: "26px 0 18px" }}>
          <input name="q" defaultValue={term} autoFocus placeholder="Email, name, document title, reader"
            style={{ flex: 1, height: 34, boxSizing: "border-box", background: T.card, color: T.heading, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font }} />
          <button type="submit" style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" }}>Search</button>
        </form>
        {!term && <p style={{ color: T.muted, fontSize: 13.5, margin: "0 0 18px" }}>Type anything above: a customer email, a document title, or a reader&apos;s address.</p>}
        {term && total === 0 && <p style={{ color: T.muted, fontSize: 13.5, margin: "0 0 18px" }}>Nothing matches &ldquo;{term}&rdquo;.</p>}
        {accounts.length > 0 && (
          <div style={card}>
            <div style={head}><span>Accounts</span><span style={{ color: T.muted }}>{accounts.length}</span></div>
            {accounts.map((a, i) => (
              <a key={a.id} href={"/" + ADMIN_SLUG + "/accounts/" + a.id} className="t-row" style={row(i, accounts.length)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, color: T.heading }}>
                  {a.banned && <i title="Suspended" style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.danger }} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</span>
                </span>
                <span style={{ color: T.muted, flex: "none" }}>{a.name}</span>
              </a>
            ))}
          </div>
        )}
        {documents.length > 0 && (
          <div style={card}>
            <div style={head}><span>Documents</span><span style={{ color: T.muted }}>{documents.length}</span></div>
            {documents.map((d, i) => (
              <a key={d.id} href={"/" + ADMIN_SLUG + "/documents/" + d.id} className="t-row" style={row(i, documents.length)}>
                <span style={{ color: T.heading, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                <span style={{ color: T.faint, fontFamily: mono, fontSize: 12, flex: "none", whiteSpace: "nowrap" }}>{d.owner} {"\u00b7"} {new Date(d.created_at).toLocaleDateString()}</span>
              </a>
            ))}
          </div>
        )}
        {readers.length > 0 && (
          <div style={card}>
            <div style={head}><span>Readers</span><span style={{ color: T.muted }}>{readers.length}</span></div>
            {readers.map((r, i) => (
              <a key={r.id} href={"/" + ADMIN_SLUG + "/documents/" + r.docId} className="t-row" style={row(i, readers.length)}>
                <span style={{ color: T.heading, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.name} <span style={{ color: T.faint, fontFamily: mono, fontSize: 12 }}>{r.email}</span>
                </span>
                <span style={{ color: T.muted, flex: "none" }}>{r.docTitle}</span>
              </a>
            ))}
          </div>
        )}
        <SupportConversations conversations={conversations} />
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}`}</style>
    </div>
  );
}