import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_name")
    .eq("id", user.id)
    .single();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FBFBFA" }}>
      <Sidebar email={user.email ?? ""} workspaceName={profile?.workspace_name ?? undefined} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
