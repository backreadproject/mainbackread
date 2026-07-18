import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org-context";
import { NextResponse } from "next/server";

// Returns the org members + whether the caller can manage a given document,
// so the document detail (which we don't want to modify server-side) can
// fetch what it needs for the Share dialog.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");

  const ctx = await getOrgContext();
  if (ctx.accountType !== "organization" || !ctx.org) {
    return NextResponse.json({ isOrg: false, members: [], canManage: false });
  }

  const supabase = await createClient();
  const { data: mem } = await supabase.from("organization_members").select("user_id, email").eq("organization_id", ctx.org.id);
  const members = (mem ?? []).map((m) => ({ userId: m.user_id, email: (m.email as string | null) ?? null }));

  let canManage = false;
  if (docId) {
    const { data: perm } = await supabase.rpc("my_document_permission", { doc: docId });
    canManage = perm === "manage";
  }

  return NextResponse.json({ isOrg: true, members, canManage });
}
