import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// How this customer sells.
//
// Written through the SESSION client, not the admin one: RLS scopes the row to
// auth.uid(), so the database enforces ownership and there is no second
// permission model to keep in step.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const days = Number(body.quietDays);
  if (!Number.isFinite(days) || days < 1 || days > 90) {
    return NextResponse.json({ error: "Choose between 1 and 90 days." }, { status: 400 });
  }

  // Upsert: the row is created on first save rather than at signup, so a
  // customer who never opens Settings has no row and gets the defaults.
  const { error } = await supabase
    .from("sales_settings")
    .upsert({ user_id: user.id, quiet_days: Math.round(days), updated_at: new Date().toISOString() },
            { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Could not save that." }, { status: 500 });

  return NextResponse.json({ ok: true, quietDays: Math.round(days) });
}