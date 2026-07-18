import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
  const ctx = await getOrgContext();
  if (ctx.accountType !== "organization" || !ctx.org) {
    return <ProjectsClient projects={[]} orgless />;
  }
  const supabase = await createClient();
  // RLS already limits to projects I can see (creator or granted).
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false });

  // Doc counts per project (only docs I can see, RLS-limited).
  const ids = (projects ?? []).map((p) => p.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: docs } = await supabase.from("documents").select("id, project_id").in("project_id", ids);
    for (const d of docs ?? []) if (d.project_id) counts[d.project_id] = (counts[d.project_id] ?? 0) + 1;
  }

  const rows = (projects ?? []).map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at, docCount: counts[p.id] ?? 0 }));
  return <ProjectsClient projects={rows} orgless={false} />;
}
