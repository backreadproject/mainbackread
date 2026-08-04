"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { Profile } from "@/lib/buyer-profile";
import type { ObservedView } from "@/lib/observed";
import { Tier, StatedTab, FindTab } from "./Tabs";
import ObservedTab from "./ObservedTab";

/**
 * The sample profile, read only.
 *
 * A separate component rather than a mode on ProfileDetailClient, because that
 * one owns the whole generate flow: it fetches the draft on mount, saves
 * answers, runs passes and offers to re-answer. None of that can happen here,
 * and threading a readOnly flag through it would mean every future change to
 * the real flow has to remember this case exists.
 *
 * The three tabs themselves are the real ones. That is the point: what is on
 * screen is what a finished profile actually looks like, not a picture of one.
 */

export default function SampleDetail({
  profile,
  output,
  documents,
  observed,
}: {
  profile: { id: string; name: string; objectiveLabel: string; threshold: number; revision: number };
  output: Profile;
  documents: { id: string; title: string }[];
  observed: ObservedView;
}) {
  const locale = useLocale();
  const fr = locale === "fr";
  const [tab, setTab] = useState<"stated" | "find" | "observed">("stated");

  const c = {
    back: fr ? "Profils d\u2019acheteur" : "Buyer profiles",
    sample: fr ? "Exemple" : "Sample",
    banner: fr
      ? "Ceci est un exemple. Les donn\u00e9es sont invent\u00e9es et il n\u2019appartient \u00e0 personne : il ne compte pas dans votre limite de plan, il ne peut \u00eatre ni modifi\u00e9 ni supprim\u00e9, et il n\u2019appara\u00eet nulle part ailleurs dans l\u2019application. Il est l\u00e0 pour montrer \u00e0 quoi ressemble un profil termin\u00e9 avant que vous en construisiez un."
      : "This is an example. The data is invented and it belongs to nobody: it does not count against your plan limit, it cannot be edited or deleted, and it appears nowhere else in the app. It is here to show what a finished profile looks like before you build one.",
    rev: fr ? "R\u00e9vision" : "Revision",
    asserted: fr ? "\u00e9crite par le vendeur" : "written by the sender",
    attached: fr ? "Li\u00e9 \u00e0 " : "Attached to ",
    docs: fr ? " documents" : " documents",
    tStated: fr ? "\u00c9nonc\u00e9" : "Stated",
    tFind: fr ? "O\u00f9 les trouver" : "Where to find them",
    tObs: fr ? "Observ\u00e9" : "Observed",
    bStated: fr
      ? "Vient de ce que le vendeur a dit. Non v\u00e9rifi\u00e9 contre quoi que ce soit."
      : "From what the sender told us. Not checked against anything.",
    bFind: fr
      ? "Raisonn\u00e9 \u00e0 partir des personas et des march\u00e9s. Le raisonnement est montr\u00e9 pour qu\u2019il puisse \u00eatre contest\u00e9."
      : "Reasoned from the personas and the markets. The reasoning is shown so it can be disagreed with.",
    bObs: fr
      ? "Vient des lecteurs qui ont r\u00e9ellement ouvert les documents."
      : "From readers who actually opened the documents.",
    publicFact: fr ? "Fait public" : "Public fact",
    needed: fr ? " lecteurs engag\u00e9s requis" : " engaged readers needed",
    revisions: fr ? "Toutes les r\u00e9visions" : "All revisions",
    gap: fr ? "Analyse des \u00e9carts" : "Gap analysis",
    yours: fr ? "Cr\u00e9er le v\u00f4tre" : "Build your own",
  };

  const link: React.CSSProperties = { fontSize: 13, color: T.green, textDecoration: "none" };
  const primary: React.CSSProperties = {
    height: 32, boxSizing: "border-box", padding: "0 14px",
    border: "1px solid " + T.green, borderRadius: T.rBtn,
    background: T.green, color: T.onAccent, fontSize: 13, fontWeight: 500,
    fontFamily: T.font, display: "inline-flex", alignItems: "center", textDecoration: "none",
  };

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <a href="/buyer-profiles" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: T.faint, textDecoration: "none", display: "inline-block", marginBottom: 9 }}>
          {c.back}
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>
            {profile.name}
          </h1>
          <span style={{
            border: "1px solid " + T.indigo, borderRadius: 4, background: "#F5F5FF",
            color: T.indigo, fontSize: 11, fontWeight: 500, padding: "2px 7px", whiteSpace: "nowrap",
          }}>
            {c.sample}
          </span>
        </div>

        <p style={{ fontSize: 13.5, color: T.muted, margin: "7px 0 0", lineHeight: 1.55 }}>
          {profile.objectiveLabel} {"\u00b7"} {c.rev} {profile.revision}, {c.asserted} {"\u00b7"} {c.attached}{documents.length}{c.docs}
        </p>

        <p style={{ margin: "8px 0 0" }}>
          <a href={"/buyer-profiles/" + profile.id + "/revisions"} style={link}>{c.revisions}</a>
          <span style={{ color: T.faint, margin: "0 8px" }}>{"\u00b7"}</span>
          <a href={"/buyer-profiles/" + profile.id + "/gap"} style={link}>{c.gap}</a>
        </p>

        <div style={{ borderLeft: "3px solid " + T.indigo, background: "#F5F5FF", padding: "11px 14px", marginTop: 20, fontSize: 12.5, lineHeight: 1.6, color: "#2C2E9E" }}>
          {c.banner}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "22px 0 18px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flex: 1, minWidth: 320, border: "1px solid " + T.border, borderRadius: T.rCard, overflow: "hidden" }}>
            {([["stated", c.tStated], ["find", c.tFind], ["observed", c.tObs]] as const).map(([k, label], i) => (
              <button key={k} onClick={() => setTab(k)} style={{
                flex: 1, padding: "11px 14px", fontSize: 12.5, cursor: "pointer",
                border: "none", borderLeft: i === 0 ? "none" : "1px solid " + T.border,
                background: tab === k ? T.soft : T.card,
                color: tab === k ? T.heading : T.muted, fontWeight: tab === k ? 500 : 400,
                fontFamily: T.font, textAlign: "left",
              }}>{label}</button>
            ))}
          </div>
          <a href="/buyer-profiles" style={primary}>{c.yours}</a>
        </div>

        {tab === "stated" && (
          <Tier tone={T.faint} name={c.tStated} basis={c.bStated}>
            <StatedTab p={output} locale={locale} attachedDoc={null} profileId={profile.id} />
          </Tier>
        )}
        {tab === "find" && (
          <Tier tone={T.indigo} name={c.publicFact} basis={c.bFind}>
            <FindTab p={output} locale={locale} />
          </Tier>
        )}
        {tab === "observed" && (
          <Tier
            tone={T.green}
            name={c.tObs}
            basis={c.bObs}
            right={observed.summary.engaged + " / " + profile.threshold + c.needed}
          >
            <ObservedTab locale={locale} threshold={profile.threshold} view={observed} profileId={profile.id} />
          </Tier>
        )}
      </main>
    </div>
  );
}
