import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import { getOrgContext } from "@/lib/org-context";
import { T } from "@/lib/theme";
import { trialInfo } from "@/lib/trial";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getOrgContext();
  const trial = trialInfo(ctx.trialStartedAt);

  let workspaceName: string | undefined;
  let isOrg = false;
  const { data: profileRow } = await supabase.from("profiles").select("workspace_name, avatar_url").eq("id", user.id).single();
  const avatarUrl = (profileRow?.avatar_url as string) || null;
  if (ctx.org) {
    workspaceName = ctx.org.name;
    isOrg = true;
  } else {
    workspaceName = profileRow?.workspace_name ?? undefined;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.canvas }}>
      <Sidebar email={user.email ?? ""} workspaceName={workspaceName} isOrg={isOrg} avatarUrl={avatarUrl} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {trial.started && trial.active && (
          <div style={{ background: "#FEF7EC", borderBottom: "1px solid #FDE7C7", padding: "8px 30px", fontSize: 13, color: "#B54708", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B54708" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>
            <span>Free trial: <strong>{trial.daysLeft} day{trial.daysLeft === 1 ? "" : "s"}</strong> left.</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
