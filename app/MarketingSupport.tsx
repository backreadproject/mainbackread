import { headers } from "next/headers";
import SupportWidget from "./SupportWidget";

/**
 * Mounts the support widget on the marketing host only.
 *
 * The root layout wraps all three surfaces, so this has to be selective:
 * relaydocuments.com must stay neutral for readers, and app.readprospects.com
 * mounts its own widget with surface="app" so it knows who is signed in.
 */
export default async function MarketingSupport() {
  const host = ((await headers()).get("x-forwarded-host") || (await headers()).get("host") || "").split(":")[0].toLowerCase();

  if (host.includes("relaydocuments")) return null;
  if (host.startsWith("app.")) return null;
  if (host.startsWith("referrals.")) return null;

  return <SupportWidget surface="marketing" />;
}
