import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ found: false });

  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ found: false });

  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers();
  const found = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
  if (!found) return NextResponse.json({ found: false });

  const { data: prof } = await admin.from("profiles").select("first_name, last_name").eq("id", found.id).single();
  return NextResponse.json({
    found: true,
    firstName: (prof?.first_name as string) || (found.user_metadata?.first_name as string) || "",
    lastName: (prof?.last_name as string) || (found.user_metadata?.last_name as string) || "",
  });
}
