import { requireAdminPage } from "@/lib/admin";
import MobileShell from "@/app/(app)/MobileShell";
import AdminSidebar from "./AdminSidebar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAdminPage();
  const base = "/console-7f3ab9c2";
  const allowed = [
    base,
    ...(s.can("documents.read") ? [base + "/documents"] : []),
    ...(s.can("accounts.read") ? [base + "/accounts", base + "/orgs"] : []),
    ...(s.can("billing.manage") ? [base + "/tiers", base + "/billing"] : []),
    ...(s.can("support.handle") ? [base + "/support"] : []),
    ...(s.can("erasure.handle") ? [base + "/erasures"] : []),
    ...(s.can("audit.read") ? [base + "/audit"] : []),
    ...(s.can("roles.manage") ? [base + "/team"] : []),
  ];
  return (
    <MobileShell sidebar={<AdminSidebar email={s.email ?? ""} role={s.role} allowed={allowed} />}>
      <main style={{ padding: "34px 28px 120px" }}>{children}</main>
    </MobileShell>
  );
}
