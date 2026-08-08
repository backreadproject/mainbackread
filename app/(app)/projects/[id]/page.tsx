import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org-context";
import { notFound } from "next/navigation";
import ProjectDetailClient from "./ProjectDetailClient";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getOrgContext();
  const supabase = await createClient();

  // RLS: I only get the project row if I can_see_project(id).
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, created_at, buyer_profile_id")
    .eq("id", id)
    .single();
  if (!project) notFound();

  // The two profile columns are read so the band can say how many documents
  // actually follow the project's profile, rather than claiming it reaches all
  // of them. A document with its own profile keeps it, and that is invisible
  // unless it is counted here.
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, created_at, buyer_profile_id, buyer_profile_detached")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const docRows = docs ?? [];
  const counts = {
    following: docRows.filter((d) => !d.buyer_profile_id && !d.buyer_profile_detached).length,
    overriding: docRows.filter((d) => Boolean(d.buyer_profile_id)).length,
    detached: docRows.filter((d) => Boolean(d.buyer_profile_detached)).length,
  };

  // Every profile in the workspace, for the picker. RLS scopes it, and the
  // scope trigger refuses anything from a different workspace anyway.
  const { data: profileRows } = await supabase
    .from("buyer_profiles")
    .select("id, name, objective")
    .order("created_at", { ascending: false });
  const profiles = (profileRows ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    objective: (p.objective as string) ?? "",
  }));

  const attachedId = (project.buyer_profile_id as string | null) ?? null;
  const attached = attachedId ? profiles.find((p) => p.id === attachedId) ?? null : null;

  // Org members for the share picker (only if org context).
  let members: { userId: string; email: string | null }[] = [];
  if (ctx.org) {
    const { data: mem } = await supabase.from("organization_members").select("user_id, email").eq("organization_id", ctx.org.id);
    members = (mem ?? []).map((m) => ({ userId: m.user_id, email: (m.email as string | null) ?? null }));
  }

  const canManage = ctx.org ? (ctx.role === "owner" || ctx.role === "admin") : true;
  return (
    <ProjectDetailClient
      project={{ id: project.id, name: project.name, created_at: project.created_at }}
      documents={docRows.map((d) => ({ id: d.id, title: d.title, created_at: d.created_at }))}
      canManage={canManage}
      members={members}
      profiles={profiles}
      attached={attached}
      counts={counts}
    />
  );
}
