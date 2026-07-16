import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

// This layout wraps every page in the (app) group. Auth is checked ONCE here,
// so individual pages don't each repeat it. Any new screen dropped in this
// folder automatically gets the sidebar and the auth gate.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F6F3" }}>
      <Sidebar email={user.email ?? ""} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
