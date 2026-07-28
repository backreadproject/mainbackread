"use client";
import { T } from "@/lib/theme";
import type { ReportCopy } from "@/lib/icp-report-copy";
import type { IcpPeople } from "@/lib/ai/tasks/icp-people";
import type { IcpDemand } from "@/lib/ai/tasks/icp-demand";
import { Section, Frame, Item, Head, Fields, Trace, Chips, Prov, Rank } from "./parts";

export function People({ d, c }: { d: IcpPeople; c: ReportCopy }) {
  return (
    <>
      {d.segments.length > 0 && (
        <Section
          h={c.sSegments}
          note={d.segments.length > 1
            ? "You described more than one population. They do not buy the same way, and averaging them produces a profile that fits nobody."
            : undefined}>
          <Frame>
            {d.segments.map((s, i) => (
              <Item key={i} last={i === d.segments.length - 1}>
                <Head text={s.name} rank={s.priority} c={c} />
                <div style={{ color: T.body, fontSize: 13.5, marginTop: 4, lineHeight: 1.55 }}>{s.who}</div>
                <Fields rows={[
                  [c.fDiffers, s.howTheyDiffer],
                  [c.fFrequency, s.frequency],
                  [c.fSoWhat, s.why],
                ]} />
                <Trace basis={s.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.personas.length > 0 && (
        <Section h={c.sPersonas}>
          <Frame>
            {d.personas.map((p, i) => (
              <Item key={i} last={i === d.personas.length - 1}>
                <Head text={p.name} s={p.source} rank={p.role} c={c} />
                {p.titles.length > 0 && <div style={{ marginTop: 7 }}><Chips xs={p.titles} /></div>}
                <Fields rows={[
                  [c.fJudged, p.judgedOn.join(" \u00b7 ")],
                  [c.fAuthority, p.authority],
                  [c.fTenure, p.tenure],
                  [c.fReports, p.reportsTo],
                  ["", p.owns],
                  ["", p.background],
                ]} />
                <Trace basis={p.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.committee.length > 0 && (
        <Section h={c.sCommittee} note="Including the people who arrive late and stall things.">
          <Frame>
            {d.committee.map((x, i) => (
              <Item key={i} last={i === d.committee.length - 1}>
                <Head text={x.role} s={x.source} rank={x.influence} c={c} />
                <Fields rows={[
                  [c.fWants, x.wants],
                  [c.fFears, x.fears],
                  [c.fWin, x.winThemWith],
                  [c.fInfluence, x.interest],
                ]} />
                <Trace basis={x.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {(d.motivations.length + d.fears.length + d.beliefs.length + d.temperament.length) > 0 && (
        <Section h={c.sPsych}>
          <Frame>
            {[...d.motivations, ...d.fears, ...d.beliefs, ...d.temperament].map((x, i, arr) => (
              <Item key={i} last={i === arr.length - 1}>
                <Head text={x.text} s={x.source} c={c} />
                <Trace basis={x.basis} unless={x.unless} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.antiPersonas.length > 0 && (
        <Section h={c.sAnti}>
          <Frame>
            {d.antiPersonas.map((x, i) => (
              <Item key={i} last={i === d.antiPersonas.length - 1}>
                <Head text={x.who} c={c} />
                <Fields rows={[["", x.looksRight], [c.fSoWhat, x.whyNot]]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}
    </>
  );
}

export function Demand({ d, c }: { d: IcpDemand; c: ReportCopy }) {
  return (
    <>
      {d.pains.length > 0 && (
        <Section h={c.sPains} note="Ranked by what it costs them, not by how loudly it is complained about.">
          <Frame>
            {d.pains.map((p, i) => (
              <Item key={i} last={i === d.pains.length - 1}>
                <Head text={p.pain} s={p.source} rank={p.severity} c={c} />
                <Fields rows={[
                  [c.fFelt, p.feltBy],
                  [c.fCost, p.cost],
                  [c.fCadence, p.cadence],
                ]} />
                <Trace basis={p.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.outcomes.length > 0 && (
        <Section h={c.sOutcomes} note="What they ask for, and the state they are actually trying to reach.">
          <Frame>
            {d.outcomes.map((o, i) => (
              <Item key={i} last={i === d.outcomes.length - 1}>
                <Head text={o.theyActuallyWant} s={o.source} c={c} />
                <Fields rows={[
                  [c.fTheyAsk, o.theyAsk],
                  [c.fMeasured, o.measuredBy],
                ]} />
                <Trace basis={o.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.triggers.length > 0 && (
        <Section h={c.sTriggers} note="Events an outsider can observe. A trigger you cannot detect is a wish.">
          <Frame>
            {d.triggers.map((t, i) => (
              <Item key={i} last={i === d.triggers.length - 1}>
                <Head text={t.event} s={t.source} rank={t.window} c={c} />
                <Fields rows={[
                  [c.fWhere, t.whereVisible],
                  [c.fSoWhat, t.whyItStarts],
                ]} />
                <Trace basis={t.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.objections.length > 0 && (
        <Section h={c.sObjections} note="What gets said, and what is meant. They are rarely the same.">
          <Frame>
            {d.objections.map((o, i) => (
              <Item key={i} last={i === d.objections.length - 1}>
                <Head text={o.objection} s={o.source} c={c} />
                <Fields rows={[
                  [c.fRealConcern, o.realConcern],
                  [c.fRaisedBy, o.raisedBy + (o.stage ? " \u00b7 " + o.stage : "")],
                  [c.fAnswer, o.answer],
                ]} />
                <Trace basis={o.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.criteria.length > 0 && (
        <Section h={c.sCriteria} note="Including the ones they say matter and that do not.">
          <Frame>
            {d.criteria.map((x, i) => (
              <Item key={i} last={i === d.criteria.length - 1}>
                <Head text={x.criterion} s={x.source} rank={x.weight} c={c} />
                {x.why && <div style={{ color: T.muted, fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{x.why}</div>}
                <Trace basis={x.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.journey.length > 0 && (
        <Section h={c.sJourney} note="Where it goes quiet is where you can intervene.">
          <Frame>
            {d.journey.map((j, i) => (
              <Item key={i} last={i === d.journey.length - 1}>
                <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span style={{ color: T.faint, fontSize: 12, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Head text={j.stage} s={j.source} rank={j.typicalDuration} c={c} />
                    <div style={{ color: T.body, fontSize: 13.5, marginTop: 3, lineHeight: 1.55 }}>{j.whatHappens}</div>
                    <Fields rows={[
                      ["", j.whoDrives],
                      [c.fStalls, j.stallsWhen],
                    ]} />
                  </div>
                </div>
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.killers.length > 0 && (
        <Section h={c.sKillers}>
          <Frame>
            {d.killers.map((k, i) => (
              <Item key={i} last={i === d.killers.length - 1}>
                <Head text={k.killer} rank={k.stage} c={c} />
                <Fields rows={[
                  [c.fEarly, k.earlyWarning],
                  [c.fPrevent, k.prevention],
                ]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}
    </>
  );
}