import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi, writeAudit } from "@/lib/admin";
import { isWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";

/**
 * The workspace default for everyone.
 *
 * Owner only, and audited, because it changes what every customer sees. It does
 * not touch anybody who has already chosen for themselves, which is why it is
 * not a destructive action and needs no type-to-confirm.
 */

export async function POST(req: NextRequest) {
  const gate = await requireAdminApi("roles.manage");
  if ("error" in gate) return gate.error;

  const body = await req.json().catch(() => ({}));
  const workspace = body.workspace;
  if (!isWorkspace(workspace)) {
    return NextResponse.json({ error: "Unknown workspace." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: before } = await admin.from("app_settings").select("workspace").limit(1).maybeSingle();
  const previous = (before as { workspace?: string } | null)?.workspace ?? "classic";

  // app_settings is a single row, forced by its primary key. Upsert rather than
  // update so this works on an installation where the row was never written.
  const { error } = await admin
    .from("app_settings")
    .upsert({ id: true, workspace, updated_at: new Date().toISOString(), updated_by: gate.session.id });

  if (error) {
    console.error("[workspace] could not set the default:", error.message);
    return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  }

  await writeAudit({
    actorId: gate.session.id,
    actorEmail: gate.session.email,
    action: "set_workspace",
    detail: { from: previous, to: workspace },
  });

  return NextResponse.json({ ok: true, workspace });
}
