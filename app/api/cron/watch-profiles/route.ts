import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { observeProfile } from "@/lib/observed";
import { runGapFor, GapFailed } from "@/lib/gap-run";
import { notify } from "@/lib/notify";
import {
  dueForCheck, diffCheck, personaLastSeen, readCheck, readNotify, emptyCheck,
  type Cadence, type WatchEvent,
} from "@/lib/profile-watch";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * The scheduled check.
 *
 * Everything the bell says is a difference from the last time this ran, which
 * is why it has to run on its own. A notification that only fires when you open
 * the page is telling you about something you are already looking at.
 *
 * Runs daily. Each profile is skipped unless its own cadence says it is due, so
 * a weekly profile is looked at once a week and a manual one never.
 */

const BATCH = 40;

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Vercel signs its own cron calls with this header. A missing secret means
  // the job refuses rather than running open to the internet.
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === "Bearer " + secret;
}

type ProfileRow = {
  id: string;
  name: string;
  threshold: number;
  cadence: Cadence;
  notify: unknown;
  last_checked_at: string | null;
  owner_id: string | null;
  created_by: string | null;
};

/** Who hears about it. For an organisation's profile that is the person who
 *  built it, not every member: a weekly notice fanned out to twenty people is
 *  how a team learns to ignore the bell. */
function audience(p: ProfileRow): string | null {
  return p.owner_id ?? p.created_by ?? null;
}

function describe(e: WatchEvent, profileName: string): { type: string; title: string; body: string; params: Record<string, string> } {
  switch (e.kind) {
    case "threshold":
      return {
        type: "bp_threshold",
        title: profileName + " has enough readers",
        body: String(e.engaged) + " engaged readers. The Observed tab can now tell you things.",
        params: { profile: profileName, engaged: String(e.engaged), threshold: String(e.threshold) },
      };
    case "gap":
      return {
        type: "bp_gap",
        title: "Your readers disagree with " + profileName,
        body: e.headline,
        params: { profile: profileName, headline: e.headline },
      };
    case "findingMoved":
      return {
        type: "bp_finding_moved",
        title: profileName + ": the finding changed direction",
        body: e.headline,
        params: { profile: profileName, headline: e.headline, agrees: e.nowAgrees ? "1" : "" },
      };
    case "personaQuiet":
      return {
        type: "bp_persona_quiet",
        title: e.persona + " has gone quiet",
        body: "No reader matching this persona has engaged in " + String(e.days) + " days. It may not be in the deal at all.",
        params: { profile: profileName, persona: e.persona, days: String(e.days) },
      };
  }
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: profiles, error } = await admin
    .from("buyer_profiles")
    .select("id, name, threshold, cadence, notify, last_checked_at, owner_id, created_by")
    .is("archived_at", null)
    .neq("cadence", "manual")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(BATCH);

  if (error) {
    console.error("[watch] could not list profiles", error.message);
    return NextResponse.json({ error: "Could not list profiles." }, { status: 500 });
  }

  const rows = (profiles ?? []) as unknown as ProfileRow[];
  let checked = 0, notified = 0, skipped = 0;
  const failures: string[] = [];

  for (const p of rows) {
    if (!dueForCheck(p.cadence, p.last_checked_at, now)) { skipped += 1; continue; }

    try {
      const threshold = p.threshold ?? 20;

      const { data: rev } = await admin
        .from("icp_profiles")
        .select("id, output")
        .eq("profile_id", p.id)
        .eq("status", "complete")
        .eq("source", "asserted")
        .order("revision", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { readers, summary } = await observeProfile(admin, p.id, threshold, Boolean(rev));

      const out = (rev?.output ?? null) as {
        people?: { personas?: { name: string; titleVariants?: string[] }[] };
      } | null;
      const personas = (out?.people?.personas ?? []).map((x) => ({
        name: x.name, titleVariants: x.titleVariants ?? [],
      }));

      // The analysis, but only when it would not refuse. Refusing costs
      // nothing; running it below the threshold would cost money to produce a
      // sentence saying there is not enough data.
      let gap: { id: string | null; agrees: boolean; headline: string } | null = null;
      let previousGap: { agrees: boolean } | null = null;
      try {
        const result = await runGapFor(admin, admin, p.id, { locale: "en" });
        if ("run" in result) {
          gap = { id: result.run.id, agrees: result.run.output.agrees, headline: result.run.output.headline };
          previousGap = result.previous ? { agrees: result.previous.output.agrees } : null;
        }
      } catch (e) {
        if (!(e instanceof GapFailed)) throw e;
        // A failed analysis is not a failed check. Everything else still runs.
        failures.push(p.id + ": " + e.message);
      }

      const { data: prevRow } = await admin
        .from("buyer_profile_checks")
        .select("engaged, readers, identified, persona_seen, notified, crossed_threshold_at")
        .eq("profile_id", p.id)
        .maybeSingle();

      const previous = prevRow ? readCheck(prevRow) : emptyCheck();

      const { events, next } = diffCheck({
        now,
        threshold,
        settings: readNotify(p.notify),
        previous,
        engaged: summary.engaged,
        readers: summary.readers,
        identified: readers.filter((r) => r.roles.length > 0 || r.roleOther || r.company).length,
        personaSeen: personaLastSeen(readers, personas),
        personas: personas.map((x) => x.name),
        gap,
        previousGap,
      });

      // The snapshot is written whether or not anything was worth saying. Skip
      // it on a quiet check and the next one compares against something stale.
      await admin.from("buyer_profile_checks").upsert({
        profile_id: p.id,
        engaged: next.engaged,
        readers: next.readers,
        identified: next.identified,
        persona_seen: next.personaSeen,
        notified: next.notified,
        crossed_threshold_at: next.crossedThresholdAt,
        checked_at: now.toISOString(),
      });

      await admin
        .from("buyer_profiles")
        .update({ last_checked_at: now.toISOString() })
        .eq("id", p.id);

      const to = audience(p);
      if (to) {
        for (const e of events) {
          const d = describe(e, p.name);
          await notify({
            userId: to,
            type: d.type,
            title: d.title,
            body: d.body,
            link: "/buyer-profiles/" + p.id + (e.kind === "personaQuiet" ? "" : "/gap"),
            params: d.params,
          });
          notified += 1;
        }
      }

      checked += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[watch] profile failed", { profileId: p.id, error: msg });
      failures.push(p.id + ": " + msg);
      // One broken profile must not stop the other thirty-nine.
    }
  }

  console.log(JSON.stringify({ evt: "watch.run", checked, skipped, notified, failures: failures.length }));
  return NextResponse.json({ checked, skipped, notified, failures });
}
