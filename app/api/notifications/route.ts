import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [], unread: 0 });

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, params, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.read_at).length;
  return NextResponse.json({ notifications, unread });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id, all } = await req.json();
  const now = new Date().toISOString();
  if (all) {
    await supabase.from("notifications").update({ read_at: now }).is("read_at", null);
  } else if (id) {
    await supabase.from("notifications").update({ read_at: now }).eq("id", id);
  }
  return NextResponse.json({ ok: true });
}
