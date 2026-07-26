import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
// Branding a customer sets once: company name, logo, and the name that appears
// as the author. Reporter and recipient can still be overridden per report.
//
// RLS on report_settings scopes to auth.uid(), so this uses the session client
// rather than the admin one: the policy is the check.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { data } = await supabase
    .from("report_settings")
    .select("company_name, logo_url, default_reporter")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ settings: data ?? null });
}
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { companyName?: string; logoUrl?: string | null; defaultReporter?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const { error } = await supabase.from("report_settings").upsert({
    user_id: user.id,
    company_name: (body.companyName ?? "").trim() || null,
    logo_url: body.logoUrl === null ? null : (body.logoUrl ?? "").trim() || null,
    default_reporter: (body.defaultReporter ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("[report-settings]", error.message);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}