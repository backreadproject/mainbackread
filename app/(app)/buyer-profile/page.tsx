import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { getLocale } from "@/lib/locale-server";
import IcpClient from "./IcpClient";

// Locale is resolved here, on the server, and passed down as a prop.
//
// Every other client component in the app reads it from a cookie after mount,
// which is why French users see an English flash. On a table that flash is a
// row of headers. This page is almost entirely prose, so the flash would be the
// whole screen changing language. The page was already a server component
// rendering one client component, so avoiding it costs nothing here.
export default async function BuyerProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  const locale = await getLocale();

  return <IcpClient enabled={hasFeature(ctx.plan.id, "icp")} planName={ctx.plan.name} locale={locale} />;
}