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

  return <ProjectDetailClient project={project} documents={docs ?? []} canManage={ctx.role === "owner" || ctx.role === "admin"} />;
}
