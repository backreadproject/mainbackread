import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Prefer profile names, fall back to auth metadata.
  const { data: profile } = await supabase.from("profiles").select("first_name, last_name, avatar_url").eq("id", user.id).single();
  const firstName = (profile?.first_name as string) || (user.user_metadata?.first_name as string) || "";
  const lastName = (profile?.last_name as string) || (user.user_metadata?.last_name as string) || "";

  const avatarUrl = (profile?.avatar_url as string) || null;
  return <AccountClient email={user.email ?? ""} firstName={firstName} lastName={lastName} avatarUrl={avatarUrl} />;
}
