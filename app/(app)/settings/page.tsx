import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_name")
    .eq("id", user?.id ?? "")
    .single();

  return <SettingsClient initialWorkspace={profile?.workspace_name ?? ""} email={user?.email ?? ""} />;
}
