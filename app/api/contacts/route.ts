import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Contacts already typed anywhere in the workspace.
//
// Read through the SESSION client on purpose: the recipients RLS policy already
// scopes rows to documents the caller can see, so an org member gets colleagues'
// contacts and nobody gets a stranger's. Using the admin client here would leak
// every reader in the database behind a two-character query.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ contacts: [] });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const like = "%" + q.replace(/[%_,]/g, "") + "%";
  const { data } = await supabase
    .from("recipients")
    .select("first_name, last_name, label, email, created_at")
    .or("label.ilike." + like + ",email.ilike." + like)
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);

  // One entry per address, most recent spelling of the name wins.
  const seen = new Map<string, { firstName: string; lastName: string; label: string; email: string }>();
  for (const r of data ?? []) {
    const email = ((r.email as string) || "").trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    const label = ((r.label as string) || "").trim();
    const parts = label.split(/\s+/);
    seen.set(email, {
      firstName: (r.first_name as string) || parts[0] || "",
      lastName: (r.last_name as string) || parts.slice(1).join(" ") || "",
      label: label || email,
      email,
    });
    if (seen.size >= 8) break;
  }

  return NextResponse.json({ contacts: [...seen.values()] });
}