import { requireAdminPage, ADMIN_SLUG } from "@/lib/admin";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const base = `/${ADMIN_SLUG}`;
  const nav = { color: "#93A79C", textDecoration: "none", fontSize: 14 } as const;
  return (
    <div style={{ minHeight: "100vh", background: "#0B0F0D", color: "#E7EDEA", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #1E2A24", padding: "14px 20px", display: "flex", gap: 18, alignItems: "center" }}>
        <strong style={{ color: "#33E6A2" }}>ReadProspects Admin</strong>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href={base} style={nav}>Dashboard</Link>
          <Link href={`${base}/accounts`} style={nav}>Accounts</Link>
          <Link href={`${base}/audit`} style={nav}>Audit log</Link>
        </nav>
      </header>
      <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>{children}</main>
    </div>
  );
}
