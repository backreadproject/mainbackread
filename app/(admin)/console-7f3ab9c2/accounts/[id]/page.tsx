import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import { T } from "@/lib/theme";
import PlanForm from "./PlanForm";
import AccountActions from "./AccountActions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Prof = { first_name: string | null; last_name: string | null; workspace_name: string | null; account_type: string | null; approved_at?: string | null; active_org_id: string | null; plan: string | null; trial_started_at: string | null };
type Org = { id: string; name: string | null; domain: string | null; plan: string | null; subscription_active: boolean | null };
export default async function AccountDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("accounts.detail");
  const { id } = await params;
  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  const u = authUser?.user;
  const banned = !!(u as unknown as { banned_until?: string | null } | undefined)?.banned_until;
  const { data: profile } = await admin.from("profiles").select("first_name, last_name, workspace_name, account_type, active_org_id, plan, trial_started_at, approved_at").eq("id", id).single();
  const p = (profile ?? {}) as Prof;
  const isOrg = p.account_type === "organization";
  let org: Org | null = null;
  if (isOrg && p.active_org_id) {
    const { data } = await admin.from("organizations").select("id, name, domain, plan, subscription_active").eq("id", p.active_org_id).single();
    org = (data as Org) ?? null;
  }
  // Deleting this user cascades through organizations_created_by_fkey, so the
  // console must say which organisation goes with them.
  const { data: ownedOrgs } = await admin.from("organizations").select("id, name").eq("created_by", id);
  const createdOrg = ((ownedOrgs ?? []) as { id: string; name: string }[])[0] ?? null;
  const { data: orgMemberRows } = createdOrg
    ? await admin.from("organization_members").select("id").eq("organization_id", createdOrg.id)
    : { data: [] as { id: string }[] };
  const createdOrgMembers = (orgMemberRows ?? []).length;

  const { data: docs } = await admin.from("documents").select("id, title, created_at, archived_at").eq("owner_id", id).order("created_at", { ascending: false });
  const documents = docs ?? [];
  const docIds = documents.map((d) => d.id);
  const { data: recs } = docIds.length ? await admin.from("recipients").select("id, document_id").in("document_id", docIds) : { data: [] };
  const recipients = recs ?? [];
  const recIds = recipients.map((r) => r.id);
  const { data: sigs } = recIds.length ? await admin.from("signals").select("recipient_id, kind").in("recipient_id", recIds) : { data: [] };
  const signals = sigs ?? [];
  const { data: usage } = await admin.from("usage_events").select("kind").eq("user_id", id);
  const usageEvents = usage ?? [];
  const recToDoc = new Map(recipients.map((r) => [r.id, r.document_id]));
  const recByDoc = new Map<string, number>();
  for (const r of recipients) recByDoc.set(r.document_id, (recByDoc.get(r.document_id) ?? 0) + 1);
  const per = new Map<string, { opens: number; questions: number; forwards: number }>();
  const tot = { opens: 0, questions: 0, forwards: 0 };
  for (const s of signals) {
    const d = recToDoc.get(s.recipient_id); if (!d) continue;
    const a = per.get(d) ?? { opens: 0, questions: 0, forwards: 0 };
    if (s.kind === "opened") { a.opens++; tot.opens++; }
    else if (s.kind === "question") { a.questions++; tot.questions++; }
    else if (s.kind === "forwarded") { a.forwards++; tot.forwards++; }
    per.set(d, a);
  }
  const verdicts = usageEvents.filter((e) => e.kind === "verdict").length;
  const sends = usageEvents.filter((e) => e.kind === "send").length;
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.workspace_name || "\u2014";
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 } as const;
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const cells: [number, string][] = [
    [documents.length, "Documents"], [recipients.length, "Recipients"], [tot.opens, "Opens"],
    [tot.questions, "Questions"], [tot.forwards, "Forwards"], [verdicts, "Verdicts"], [sends, "Sends"],
  ];
  const meta = (l: string, v: string, ink?: string) => (
    <div>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 2 }}>{l}</div>
      <div style={{ fontSize: 13.5, color: ink ?? T.heading }}>{v}</div>
    </div>
  );
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body }}>
      <main style={{ maxWidth: 1000, padding: "34px 28px 120px" }}>
        <a href={"/" + ADMIN_SLUG + "/accounts"} style={{ fontSize: 13, color: T.muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}><span>{"\u2039"}</span> All accounts</a>
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 10 }}>
              {banned && <i title="Suspended" style={{ width: 7, height: 7, borderRadius: 2, flex: "none", background: T.danger }} />}
              {name}
            </h1>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "7px 0 0", fontFamily: mono }}>
              {u?.email ?? "\u2014"} {"\u00b7"} {p.account_type ?? "personal"} {"\u00b7"} joined {u?.created_at ? new Date(u.created_at).toLocaleDateString() : "\u2014"}
              {u?.last_sign_in_at ? " \u00b7 last seen " + new Date(u.last_sign_in_at).toLocaleDateString() : " \u00b7 never signed in"}
              {banned ? " \u00b7 suspended" : ""}
            </p>
          </div>
          <AccountActions targetUserId={id} email={u?.email ?? ""} suspended={banned} approved={!!p?.approved_at} createdOrg={createdOrg?.name ?? null} createdOrgMembers={createdOrgMembers} />
        </div>
        <div className="stat-strip" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden", background: T.card, margin: "26px 0 14px" }}>
          {cells.map(([v, l], i) => (
            <div key={l} style={{ padding: "15px 16px", borderLeft: i ? "1px solid " + T.border : "none" }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: T.heading, letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={head}>Plan</div>
          <div style={{ padding: 18 }}>
            <PlanForm targetUserId={id} scope={isOrg ? "org" : "personal"} currentPlan={isOrg ? (org?.plan ?? "team") : (p.plan ?? "free")} subscriptionActive={!!org?.subscription_active} orgName={org?.name ?? null} />
            <div className="lim-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16, marginTop: 18, paddingTop: 16, borderTop: "1px solid " + T.borderSoft }}>
              {meta("Trial started", p.trial_started_at ? new Date(p.trial_started_at).toLocaleDateString() : "not started")}
              {org && meta("Subscription", org.subscription_active ? "active" : "inactive", org.subscription_active ? T.greenText : T.body)}
              {org && meta("Org domain", org.domain || "\u2014")}
            </div>
          </div>
        </div>
        <div style={card}>
          <div style={head}>Documents {"\u00b7"} {documents.length}</div>
          {documents.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13.5 }}>None.</div>}
          {documents.map((d, i) => {
            const a = per.get(d.id) ?? { opens: 0, questions: 0, forwards: 0 };
            return (
              <a key={d.id} href={"/" + ADMIN_SLUG + "/documents/" + d.id} className="t-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < documents.length - 1 ? "1px solid " + T.borderSoft : "none", fontSize: 13.5, textDecoration: "none" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {d.archived_at && <i title="Archived" style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: T.faint }} />}
                  <span style={{ color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                </span>
                <span style={{ color: T.faint, fontFamily: mono, fontSize: 12, flex: "none", whiteSpace: "nowrap" }}>{recByDoc.get(d.id) ?? 0} readers {"\u00b7"} {a.opens} opens {"\u00b7"} {a.questions} questions {"\u00b7"} {a.forwards} forwards</span>
              </a>
            );
          })}
        </div>
      </main>
      <style>{`.t-row{transition:background .12s}.t-row:hover{background:var(--rp-hover)}@media (max-width: 1000px){ .stat-strip{ grid-template-columns: 1fr 1fr 1fr !important; } }@media (max-width: 620px){ .lim-grid{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  );
}