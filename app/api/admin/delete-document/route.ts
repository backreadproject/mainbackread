import { NextRequest, NextResponse } from "next/server";
import { deleteDocumentAction, setDocumentArchivedAction } from "@/lib/admin-actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { documentId, mode, confirmText, archived } = await req.json();
  const res = mode === "archive"
    ? await setDocumentArchivedAction(documentId, !!archived)
    : await deleteDocumentAction(documentId, confirmText ?? "");
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status ?? 400 });
  return NextResponse.json({ ok: true });
}
