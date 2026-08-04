import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlanForUser } from "@/lib/plan-context";
import { hasFeature } from "@/lib/plans";
import { observeProfile, summarise } from "@/lib/observed";
import { matchPersona } from "@/lib/persona-match";
import PersonaClient, { type PersonaView, slugify } from "./PersonaClient";

export const dynamic = "force-dynamic";

type StoredPersona = {
  name: string;
  roleInDeal?: string;
  afraidOf?: string;
  titleVariants?: string[];
  reportsTo?: string;
  measuredOn?: string;
  wants?: string;
  budgetAuthority?: string;
  objectionTheyRaise?: string;
  respondsTo?: string;
  losesThem?: string;
  gathersAt?: string[];
};

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id, slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const ctx = await resolvePlanForUser(admin, user.id);
  if (!hasFeature(ctx.plan.id, "icp")) redirect("/buyer-profiles/" + id);

  // RLS decides. A profile in someone else's workspace returns no row.
  const { data: profile } = await supabase
    .from("buyer_profiles")
    .select("id, name, objective, threshold")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  // Personas belong to the newest complete ASSERTED revision. Never a refined
  // one: a persona the system wrote is not a persona the customer stands behind.
  const { data: rev } = await supabase
    .from("icp_profiles")
    .select("revision, output")
    .eq("profile_id", id)
    .eq("status", "complete")
    .eq("source", "asserted")
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();

  const output = (rev?.output ?? null) as { people?: { personas?: StoredPersona[] } } | null;
  const personas = output?.people?.personas ?? [];
  if (!personas.length) notFound();

  const persona = personas.find((p) => slugify(p.name) === slug);
  if (!persona) notFound();

  const threshold = (profile.threshold as number) ?? 20;
  const { readers } = await observeProfile(supabase, id, threshold, Boolean(rev));

  // Matched on what the sender recorded, so it costs nothing and cannot drift
  // from the profile. A reader matching nothing is an answer, not a failure.
  const shapes = personas.map((p) => ({ name: p.name, titleVariants: p.titleVariants ?? [] }));
  const mine = readers.filter((r) => {
    const m = matchPersona({ roles: r.roles, roleOther: r.roleOther, name: r.name }, shapes);
    return m.persona === persona.name;
  });

  const view: PersonaView = {
    name: persona.name,
    roleInDeal: persona.roleInDeal ?? "",
    afraidOf: persona.afraidOf ?? "",
    titleVariants: persona.titleVariants ?? [],
    reportsTo: persona.reportsTo ?? "",
    measuredOn: persona.measuredOn ?? "",
    wants: persona.wants ?? "",
    budgetAuthority: persona.budgetAuthority ?? "",
    objectionTheyRaise: persona.objectionTheyRaise ?? "",
    respondsTo: persona.respondsTo ?? "",
    losesThem: persona.losesThem ?? "",
    gathersAt: persona.gathersAt ?? [],
  };

  return (
    <PersonaClient
      profile={{ id: profile.id as string, name: profile.name as string, threshold }}
      persona={view}
      siblings={personas.map((p) => ({ name: p.name, slug: slugify(p.name) }))}
      summary={summarise(mine)}
      totalReaders={readers.length}
    />
  );
}
