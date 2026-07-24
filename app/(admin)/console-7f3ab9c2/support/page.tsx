import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SLUG } from "@/lib/admin";
import { T, pageHeading, microLabel } from "@/lib/theme";
import ForwardMentions from "./ForwardMentions";
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

    const { data: docs } = await admin.from("documents").select("id, title, owner_id, created_at").ilike("title", `%${term}%`).limit(12);
    documents = (docs ?? []).map((d) => ({ id: d.id, title: d.title, owner: emailById.get(d.owner_id) ?? "unknown", created_at: d.created_at }));

    const { data: recs } = await admin.from("recipients").select("id, label, first_name, last_name, email, document_id").or(`email.ilike.%${term}%,label.ilike.%${term}%`).limit(12);
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

  const box = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 16, overflow: "hidden" } as const;
  const head = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: `1px solid ${T.border}` } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const total = accounts.length + documents.length + readers.length;

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "26px 30px 60px" }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={pageHeading}>Support</h1>
          <p style={{ fontSize: 14, color: T.body, margin: "3px 0 0" }}>Search accounts, documents and readers in one place.</p>
        </div>

        <form style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          <input name="q" defaultValue={term} autoFocus placeholder="Email, name, document title, reader..."
            style={{ flex: 1, background: "var(--rp-card)", color: T.heading, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "11px 14px", fontSize: 15, fontFamily: T.font }} />
          <button type="submit" style={{ background: T.green, color: "var(--rp-on-accent)", border: "none", borderRadius: T.rBtn, padding: "11px 22px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: "pointer" }}>Search</button>
        </form>

        {!term && <p style={{ color: T.muted, fontSize: 14 }}>Type anything above: a customer email, a document title, or a reader&apos;s address.</p>}
        {term && total === 0 && <p style={{ color: T.muted, fontSize: 14 }}>Nothing matches &ldquo;{term}&rdquo;.</p>}

        {accounts.length > 0 && (
          <div style={box}>
            <div style={head}><h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: 0 }}>Accounts</h2><span style={{ ...microLabel }}>{accounts.length}</span></div>
            {accounts.map((a, i) => (
              <a key={a.id} href={`/${ADMIN_SLUG}/accounts/${a.id}`} className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i ? `1px solid ${T.border}` : "none", textDecoration: "none", fontSize: 14 }}>
                <span style={{ color: T.heading, fontWeight: 600 }}>{a.email}{a.banned && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: T.rPill, background: "var(--rp-danger-soft)", color: "var(--rp-danger-text)" }}>suspended</span>}</span>
                <span style={{ color: T.muted, fontSize: 13 }}>{a.name}</span>
              </a>
            ))}
          </div>
        )}

        {documents.length > 0 && (
          <div style={box}>
            <div style={head}><h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: 0 }}>Documents</h2><span style={{ ...microLabel }}>{documents.length}</span></div>
            {documents.map((d, i) => (
              <a key={d.id} href={`/${ADMIN_SLUG}/documents/${d.id}`} className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i ? `1px solid ${T.border}` : "none", textDecoration: "none", fontSize: 14 }}>
                <span style={{ color: T.heading, fontWeight: 600 }}>{d.title}</span>
                <span style={{ color: T.muted, fontFamily: mono, fontSize: 12 }}>{d.owner} {"\u00b7"} {new Date(d.created_at).toLocaleDateString()}</span>
              </a>
            ))}
          </div>
        )}

        {readers.length > 0 && (
          <div style={box}>
            <div style={head}><h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: 0 }}>Readers</h2><span style={{ ...microLabel }}>{readers.length}</span></div>
            {readers.map((r, i) => (
              <a key={r.id} href={`/${ADMIN_SLUG}/documents/${r.docId}`} className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i ? `1px solid ${T.border}` : "none", textDecoration: "none", fontSize: 14 }}>
                <span style={{ color: T.heading, fontWeight: 600 }}>{r.name} <span style={{ color: T.muted, fontWeight: 400, fontFamily: mono, fontSize: 12 }}>{r.email}</span></span>
                <span style={{ color: T.muted, fontSize: 13 }}>{r.docTitle}</span>
              </a>
            ))}
          </div>
        )}
        <SupportConversations conversations={conversations} />
        <ForwardMentions />
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-soft)}`}</style>
    </div>
  );
}



