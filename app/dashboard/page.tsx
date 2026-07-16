import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

// Server component: checks who is logged in BEFORE rendering anything.
// If nobody, bounce to /login. RLS means this user only ever sees their own rows.
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, page_count, created_at")
    .order("created_at", { ascending: false });

  return <DashboardClient email={user.email ?? ""} documents={documents ?? []} />;
}
