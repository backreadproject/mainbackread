import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileShell from "./MobileShell";
import ResponsiveStyles from "./ResponsiveStyles";
import { getOrgContext } from "@/lib/org-context";
import { T } from "@/lib/theme";
import { trialInfo } from "@/lib/trial";
import SupportWidget from "@/app/SupportWidget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getOrgContext();
  const trial = trialInfo(ctx.trialStartedAt);

  let workspaceName: string | undefined;
  let isOrg = false;
  const { data: profileRow } = await supabase.from("profiles").select("first_name, last_name, avatar_url").eq("id", user.id).single();
  const avatarUrl = (profileRow?.avatar_url as string) || null;
  if (ctx.org) {
    workspaceName = ctx.org.name;
    isOrg = true;
  } else {
    const fn = (profileRow?.first_name as string) || "";
    const ln = (profileRow?.last_name as string) || "";
    workspaceName = `${fn} ${ln}`.trim() || undefined;
  }

  return (
    <MobileShell sidebar={<Sidebar email={user.email ?? ""} workspaceName={workspaceName} isOrg={isOrg} avatarUrl={avatarUrl} />}>
      <ResponsiveStyles />
      {trial.started && trial.active && (
        <div style={{ background: "#FEF7EC", borderBottom: "1px solid #FDE7C7", padding: "8px 20px", fontSize: 13, color: "#B54708", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B54708" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>
          <span>Free trial: <strong>{trial.daysLeft} day{trial.daysLeft === 1 ? "" : "s"}</strong> left.</span>
        </div>
      )}
      {children}
      <SupportWidget surface="app" />
    </MobileShell>
  );
}

