import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F6FA" }}>
      <Sidebar email={user.email ?? ""} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
