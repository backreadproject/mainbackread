import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org-context";
import { notFound } from "next/navigation";
import ProjectDetailClient from "./ProjectDetailClient";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getOrgContext();
  const supabase = await createClient();

  // RLS: I only get the project row if I can_see_project(id).
  const { data: project } = await supabase.from("projects").select("id, name, created_at").eq("id", id).single();
  if (!project) notFound();

  // Documents in this project that I can see (RLS-limited).
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // Org members for the share picker (only if org context).
  let members: { userId: string; email: string | null }[] = [];
  if (ctx.org) {
    const { data: mem } = await supabase.from("organization_members").select("user_id, email").eq("organization_id", ctx.org.id);
    members = (mem ?? []).map((m) => ({ userId: m.user_id, email: (m.email as string | null) ?? null }));
  }

  const canManage = ctx.org ? (ctx.role === "owner" || ctx.role === "admin") : true;
  return <ProjectDetailClient project={project} documents={docs ?? []} canManage={canManage} members={members} />;
}
