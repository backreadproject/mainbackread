import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import { getOrgContext } from "@/lib/org-context";
import { T } from "@/lib/theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getOrgContext();

  let workspaceName: string | undefined;
  let isOrg = false;
  if (ctx.accountType === "organization" && ctx.org) {
    workspaceName = ctx.org.name;
    isOrg = true;
  } else {
    const { data: profile } = await supabase.from("profiles").select("workspace_name").eq("id", user.id).single();
    workspaceName = profile?.workspace_name ?? undefined;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.canvas }}>
      <Sidebar email={user.email ?? ""} workspaceName={workspaceName} isOrg={isOrg} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
