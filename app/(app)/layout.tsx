import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileShell from "./MobileShell";
import { getOrgContext } from "@/lib/org-context";
import { T } from "@/lib/theme";
import { trialInfo } from "@/lib/trial";
import SupportWidget from "@/app/SupportWidget";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser, isPending } from "@/lib/plan-context";
import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";
import Waiting from "./Waiting";
import Lapsed from "./Lapsed";
import { headers } from "next/headers";
import { isLocked } from "@/lib/plan-context";
import { resolveWorkspace, workspaceClass } from "@/lib/workspace";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolved once here rather than awaited at each use.
  const locale = await getLocale();
  const C = getDict(locale).chrome;
  const planCtx = await resolvePlanForUser(createAdminClient(), user.id);
  if (isPending(planCtx)) {
    return <Waiting email={user.email ?? ""} locale={locale} />;
  }

  // The wall. A lapsed subscription blocks every page except /billing, which
  // must stay reachable or there is no way to pay and the lock is permanent.
  //
  // A layout cannot see the pathname, so proxy passes it as a header.
  // If that header is ever missing the wall still holds -- an empty pathname
  // does not match /billing, so the safe outcome is the walled one.
  const ctx = await getOrgContext();
  if (isLocked(planCtx) && !isPending(planCtx)) {
    const path = (await headers()).get("x-rp-pathname") ?? "";
    if (!path.startsWith("/billing")) {
      return (
        <Lapsed
          email={user.email ?? ""}
          orgName={ctx.org?.name ?? null}
          planName={planCtx.plan.name}
          everPaid={planCtx.everPaid}
          locale={locale}
        />
      );
    }
  }

  const trial = trialInfo(ctx.trialStartedAt);

  // Which shell. Never throws: an unreadable preference falls back to the
  // one that has always worked.
  const workspace = await resolveWorkspace(createAdminClient(), user.id);

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
    <MobileShell
      workspace={workspace}
      sidebar={<Sidebar email={user.email ?? ""} workspaceName={workspaceName} isOrg={isOrg} avatarUrl={avatarUrl} workspace={workspace} />}
    >
      {trial.started && trial.active && (
        <div style={{ background: "var(--rp-amber-soft)", borderBottom: "1px solid var(--rp-amber-border)", padding: "8px 20px", fontSize: 13, color: "var(--rp-amber-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--rp-amber-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>
            <span>{C.freeTrial} <strong>{trial.daysLeft} {trial.daysLeft === 1 ? C.day : C.days}</strong> {C.leftSuffix}</span>
          <a href="/billing" style={{ marginLeft: "auto", color: "var(--rp-amber-text)", fontWeight: 600, textDecoration: "underline" }}>{C.seePlans}</a>
        </div>
      )}
      {children}
      <SupportWidget surface="app" firstName={(profileRow?.first_name as string) || null} />
    </MobileShell>
  );
}


