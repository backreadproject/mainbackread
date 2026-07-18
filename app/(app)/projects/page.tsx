import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
  const ctx = await getOrgContext();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch projects: org projects for org accounts, personal (org-less) projects otherwise.
  // RLS (can_see_project) already limits rows appropriately, but we scope the query too.
  let projectsQuery = supabase.from("projects").select("id, name, created_at").order("created_at", { ascending: false });
  if (ctx.org) {
    projectsQuery = projectsQuery.eq("organization_id", ctx.org.id);
  } else {
    projectsQuery = projectsQuery.is("organization_id", null).eq("created_by", user?.id ?? "");
  }
  const { data: projects } = await projectsQuery;

  // Doc counts per project (RLS-limited).
  const ids = (projects ?? []).map((p) => p.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: docs } = await supabase.from("documents").select("id, project_id").in("project_id", ids);
    for (const d of docs ?? []) if (d.project_id) counts[d.project_id] = (counts[d.project_id] ?? 0) + 1;
  }

  const rows = (projects ?? []).map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at, docCount: counts[p.id] ?? 0 }));
  return <ProjectsClient projects={rows} orgless={false} personal={!ctx.org} />;
}
