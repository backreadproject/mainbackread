import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin";
import PlanForm from "./PlanForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Prof = { first_name: string | null; last_name: string | null; account_type: string | null; active_org_id: string | null; plan: string | null; trial_started_at: string | null };
type Org = { id: string; name: string | null; domain: string | null; plan: string | null; subscription_active: boolean | null };

export default async function AccountDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: authUser } = await admin.auth.admin.getUserById(id);
  const { data: profile } = await admin.from("profiles").select("first_name, last_name, account_type, active_org_id, plan, trial_started_at").eq("id", id).single();
  const p = (profile ?? {}) as Prof;
  const isOrg = p.account_type === "company" || p.account_type === "organization";

  let org: Org | null = null;
  if (isOrg && p.active_org_id) {
    const { data } = await admin.from("organizations").select("id, name, domain, plan, subscription_active").eq("id", p.active_org_id).single();
    org = (data as Org) ?? null;
  }

  const { data: docs } = await admin.from("documents").select("id, title, created_at, archived_at").eq("owner_id", id).order("created_at", { ascending: false });
  const documents = docs ?? [];
  const docIds = documents.map((d) => d.id);
  const { data: recs } = docIds.length ? await admin.from("recipients").select("id, document_id").in("document_id", docIds) : { data: [] };
  const recipients = recs ?? [];
  const recIds = recipients.map((r) => r.id);
  const { data: sigs } = recIds.length ? await admin.from("signals").select("recipient_id, kind").in("recipient_id", recIds) : { data: [] };
  const signals = sigs ?? [];

  const recToDoc = new Map(recipients.map((r) => [r.id, r.document_id]));
  const recByDoc = new Map<string, number>();
  for (const r of recipients) recByDoc.set(r.document_id, (recByDoc.get(r.document_id) ?? 0) + 1);
  const per = new Map<string, { opens: number; questions: number; forwards: number }>();
  for (const s of signals) {
    const d = recToDoc.get(s.recipient_id); if (!d) continue;
    const a = per.get(d) ?? { opens: 0, questions: 0, forwards: 0 };
    if (s.kind === "opened") a.opens++;
    else if (s.kind === "question") a.questions++;
    else if (s.kind === "forwarded") a.forwards++;
    per.set(d, a);
  }

  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "—";
  const box = { border: "1px solid #1E2A24", borderRadius: 10, padding: 16, marginBottom: 16 } as const;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>{name}</h1>
      <p style={{ color: "#93A79C", fontSize: 13, marginBottom: 16 }}>
        {authUser?.user?.email ?? "—"} · {p.account_type ?? "personal"} · joined {authUser?.user?.created_at ? new Date(authUser.user.created_at).toLocaleDateString() : "—"}
      </p>

      <div style={box}>
        <h2 style={{ fontSize: 14, marginBottom: 10 }}>Plan</h2>
        <PlanForm targetUserId={id} scope={isOrg ? "org" : "personal"} currentPlan={isOrg ? (org?.plan ?? "company_1") : (p.plan ?? "free")} subscriptionActive={!!org?.subscription_active} orgName={org?.name ?? null} />
      </div>

      <div style={box}>
        <h2 style={{ fontSize: 14, marginBottom: 10 }}>Documents ({documents.length})</h2>
        {documents.length === 0 && <p style={{ color: "#93A79C", fontSize: 13 }}>None.</p>}
        {documents.map((d) => {
          const a = per.get(d.id) ?? { opens: 0, questions: 0, forwards: 0 };
          return (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #1E2A24", fontSize: 13 }}>
              <span>{d.title}{d.archived_at ? " (archived)" : ""}</span>
              <span style={{ color: "#93A79C" }}>{recByDoc.get(d.id) ?? 0} recipients · {a.opens} opens · {a.questions} Q · {a.forwards} fwd</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
