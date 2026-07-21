import { requireAdminPage } from "@/lib/admin";
import MobileShell from "@/app/(app)/MobileShell";
import AdminSidebar from "./AdminSidebar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <MobileShell sidebar={<AdminSidebar email={user.email ?? ""} />}>
      {children}
    </MobileShell>
  );
}
