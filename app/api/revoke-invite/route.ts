import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { inviteId } = await req.json();
  if (!inviteId) return NextResponse.json({ error: "Missing invite id." }, { status: 400 });

  const admin = createAdminClient();
  // Confirm caller is owner/admin of the invite's org.
  const { data: inv } = await admin.from("invitations").select("organization_id").eq("id", inviteId).single();
  if (!inv) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  const { data: mem } = await supabase.from("organization_members").select("role").eq("organization_id", inv.organization_id).eq("user_id", user.id).single();
  if (!mem || !["owner", "admin"].includes(mem.role)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  await admin.from("invitations").update({ status: "revoked" }).eq("id", inviteId);
  return NextResponse.json({ ok: true });
}
