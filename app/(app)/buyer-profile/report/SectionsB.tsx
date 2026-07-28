"use client";
import { T } from "@/lib/theme";
import type { ReportCopy } from "@/lib/icp-report-copy";
import type { IcpMarket } from "@/lib/ai/tasks/icp-market";
import type { IcpActivation } from "@/lib/ai/tasks/icp-activation";
import type { IcpSynthesis } from "@/lib/ai/tasks/icp-synthesis";
import { Section, Frame, Item, Head, Fields, Trace, Chips, Copyable, BandTag, Rank } from "./parts";

/** Dashed throughout: none of this came from their answers. */
export function Market({ d, c }: { d: IcpMarket; c: ReportCopy }) {
  return (
    <>
      {d.stack.length > 0 && (
        <Section h={c.sStack} note="What this kind of company already runs. Integration arguments and prospecting filters both come from here.">
          <Frame dashed>
            {d.stack.map((x, i) => (
              <Item key={i} dashed last={i === d.stack.length - 1}>
                <Head text={x.category} s={x.source} c={c} />
                {x.tools.length > 0 && <div style={{ marginTop: 7 }}><Chips xs={x.tools} /></div>}
                {x.note && <div style={{ color: T.muted, fontSize: 13, marginTop: 5, lineHeight: 1.55 }}>{x.note}</div>}
                <Trace basis={x.basis} unless={x.unless} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.channels.length > 0 && (
        <Section h={c.sChannels} note="Named places, and whether an outsider can actually get to them there.">
          <Frame dashed>
            {d.channels.map((x, i) => (
              <Item key={i} dashed last={i === d.channels.length - 1}>
                <Head text={x.place} s={x.source} rank={x.reachable} c={c} />
                <div style={{ color: T.body, fontSize: 13.5, marginTop: 3, lineHeight: 1.55 }}>{x.behaviour}</div>
                <Trace basis={x.basis} unless={x.unless} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.searchIntent.length > 0 && (
        <Section h={c.sSearch} note="What they type when the problem is biting. Ad keywords and content briefs start here.">
          <Frame dashed>
            {d.searchIntent.map((x, i) => (
              <Item key={i} dashed last={i === d.searchIntent.length - 1}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 13, color: T.heading, flex: "1 1 18em", minWidth: 0 }}>{x.query}</span>
                  <Rank v={x.stage} />
                </div>
                {x.why && <div style={{ color: T.muted, fontSize: 13, marginTop: 4, lineHeight: 1.55 }}>{x.why}</div>}
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.alternatives.length > 0 && (
        <Section h={c.sAlternatives} note="Usually a spreadsheet or a habit rather than a competitor.">
          <Frame dashed>
            {d.alternatives.map((x, i) => (
              <Item key={i} dashed last={i === d.alternatives.length - 1}>
                <Head text={x.alternative} s={x.source} rank={x.kind} c={c} />
                <Fields rows={[[c.fWhyChosen, x.whyChosen], [c.fWeakness, x.weakness]]} />
                <Trace basis={x.basis} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.detectableSignals.length > 0 && (
        <Section h={c.sSignals}>
          <Frame dashed>
            {d.detectableSignals.map((x, i) => (
              <Item key={i} dashed last={i === d.detectableSignals.length - 1}>
                <Head text={x.signal} c={c} />
                <Fields rows={[[c.fWhere, x.whereVisible], [c.fMeaning, x.meaning]]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {(d.content.length + d.outreachNorms.length) > 0 && (
        <Section h={c.sContent}>
          <Frame dashed>
            {[...d.content, ...d.outreachNorms].map((x, i, arr) => (
              <Item key={i} dashed last={i === arr.length - 1}>
                <Head text={x.text} s={x.source} c={c} />
                <Trace basis={x.basis} unless={x.unless} c={c} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}
    </>
  );
}

export function Activation({ d, c }: { d: IcpActivation; c: ReportCopy }) {
  const f = d.prospectFilters;
  const filterRows: [string, string][] = [
    ["Titles", f.titles.join(", ")],
    ["Exclude titles", f.excludeTitles.join(", ")],
    ["Headcount", f.headcount],
    ["Industries", f.industries.join(", ")],
    ["Exclude industries", f.excludeIndustries.join(", ")],
    ["Geographies", f.geographies.join(", ")],
    ["Technologies", f.technologies.join(", ")],
    ["Keywords", f.keywords.join(", ")],
    ["Hiring signals", f.hiringSignals.join(", ")],
    ["Funding", f.fundingStages.join(", ")],
  ];
  const filterText = filterRows.filter(([, v]) => v.trim()).map(([k, v]) => k + ": " + v).join("\n");

  return (
    <>
      {d.messages.length > 0 && (
        <Section h={c.sMessages} note="Written to send, not to finish.">
          {d.messages.map((m, i) => (
            <div key={i} style={{ marginTop: i ? 18 : 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ color: T.heading, fontWeight: 500, fontSize: 13.5 }}>{m.kind}</span>
                <span style={{ color: T.muted, fontSize: 13 }}>{m.forWhom}</span>
              </div>
              {m.subject && <div style={{ color: T.body, fontSize: 13, marginTop: 5 }}><span style={{ color: T.faint }}>Subject </span>{m.subject}</div>}
              <Copyable text={m.subject ? m.subject + "\n\n" + m.body : m.body} c={c} />
              {m.restsOn && <div style={{ color: T.muted, fontSize: 12.5, marginTop: 6 }}><span style={{ color: T.faint }}>{c.fRestsOn} </span>{m.restsOn}</div>}
            </div>
          ))}
        </Section>
      )}

      {d.hooks.length > 0 && (
        <Section h={c.sHooks}>
          <Frame>
            {d.hooks.map((h, i) => (
              <Item key={i} last={i === d.hooks.length - 1}>
                <Head text={h.hook} rank={h.channel} c={c} />
                <Fields rows={[["", h.forWhom], [c.fWorksBecause, h.worksBecause]]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.channels.length > 0 && (
        <Section h={c.sOutreach} note="Including where not to spend.">
          <Frame>
            {d.channels.map((x, i) => (
              <Item key={i} last={i === d.channels.length - 1}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ color: T.heading, fontWeight: 500, flex: "1 1 16em" }}>{x.channel}</span>
                  <Rank v={x.cost} />
                  <BandTag band={x.fit} c={c} />
                </div>
                <div style={{ color: T.body, fontSize: 13.5, marginTop: 4, lineHeight: 1.55 }}>{x.why}</div>
                <Fields rows={[[c.fFirstMove, x.firstMove]]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {filterText && (
        <Section h={c.sFilters} note="Pasteable as they are.">
          <Frame>
            {filterRows.filter(([, v]) => v.trim()).map(([k, v], i, arr) => (
              <Item key={i} last={i === arr.length - 1}>
                <div style={{ display: "grid", gridTemplateColumns: "150px minmax(0,1fr)", gap: 14, fontSize: 13, lineHeight: 1.55 }}>
                  <div style={{ color: T.muted }}>{k}</div>
                  <div style={{ color: T.body }}>{v}</div>
                </div>
              </Item>
            ))}
          </Frame>
          <Copyable text={filterText} c={c} mono />
          {f.searchStrings.map((s, i) => (
            <div key={i} style={{ marginTop: 12 }}>
              <div style={{ color: T.muted, fontSize: 12.5 }}>{s.tool}</div>
              <Copyable text={s.query} c={c} mono />
            </div>
          ))}
        </Section>
      )}

      {d.scoring.length > 0 && (
        <Section h={c.sScoring} note="Every one checkable somewhere real.">
          <Frame>
            {d.scoring.map((x, i) => (
              <Item key={i} last={i === d.scoring.length - 1}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ width: 6, height: 6, marginTop: 7, flexShrink: 0, background: x.direction === "positive" ? T.green : T.danger, display: "inline-block" }} />
                  <span style={{ color: T.heading, fontWeight: 500, flex: "1 1 18em", minWidth: 0, lineHeight: 1.5 }}>{x.signal}</span>
                  <Rank v={x.weight} />
                </div>
                <Fields rows={[[c.fHowCheck, x.howToCheck]]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.qualification.length > 0 && (
        <Section h={c.sQualify}>
          <Frame>
            {d.qualification.map((q, i) => (
              <Item key={i} last={i === d.qualification.length - 1}>
                <Head text={q.dimension} c={c} />
                <Fields rows={[
                  [c.fAsk, q.askThis],
                  [c.fGood, q.goodAnswer],
                  [c.fWalk, q.walkAwayIf],
                ]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {(d.pricingNotes.length > 0 || d.motion.why) && (
        <Section h={c.sPricing}>
          <Frame>
            {d.pricingNotes.map((p, i) => (
              <Item key={i}>
                <div style={{ color: T.body, lineHeight: 1.55 }}>{p.note}</div>
                <Trace basis={p.basis} unless={p.unless} c={c} />
              </Item>
            ))}
            {d.motion.why && (
              <Item last>
                <Head text={c.sMotion + ": " + d.motion.recommended} c={c} />
                <Fields rows={[["", d.motion.why], [c.fNotThis, d.motion.notThis]]} />
              </Item>
            )}
          </Frame>
        </Section>
      )}
    </>
  );
}

export function Synthesis({ d, c }: { d: IcpSynthesis; c: ReportCopy }) {
  const e = d.economics;
  return (
    <>
      {d.findings.length > 0 && (
        <Section h={c.sFindings} note="Each cites what it rests on, so you can check it or reject it.">
          <Frame>
            {d.findings.map((f, i) => (
              <Item key={i} last={i === d.findings.length - 1}>
                <Head text={f.finding} rank={f.confidence} c={c} />
                <Fields rows={[[c.follows, f.basis], [c.fSoWhat, f.soWhat]]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.tensions.length > 0 && (
        <Section h={c.sTensions}>
          <div style={{ border: "1px solid " + T.border, borderLeft: "3px solid " + T.amber, borderRadius: T.rCard }}>
            {d.tensions.map((t, i) => (
              <Item key={i} last={i === d.tensions.length - 1}>
                <div style={{ color: T.heading, fontWeight: 500, lineHeight: 1.5 }}>{t.observation}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{t.why}</div>
              </Item>
            ))}
          </div>
        </Section>
      )}

      {(d.opportunity.length > 0 || e.dealSize || e.repeatShape) && (
        <Section h={c.sOpportunity}>
          <Frame>
            {d.opportunity.map((o, i) => (
              <Item key={i} last={!e.dealSize && !e.repeatShape && i === d.opportunity.length - 1}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span style={{ color: T.heading, flex: "1 1 14em" }}>{o.dimension}</span>
                  <BandTag band={o.band} c={c} />
                </div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{o.why}</div>
              </Item>
            ))}
            {(e.dealSize || e.repeatShape) && (
              <Item last>
                <Head text={c.sEconomics} c={c} />
                <Fields rows={[
                  ["", e.dealSize],
                  ["", e.cycleLength],
                  ["", e.committeeSize],
                  [c.fFrequency, e.repeatShape],
                ]} />
                <Trace basis={e.basis} c={c} />
              </Item>
            )}
          </Frame>
        </Section>
      )}

      {d.doNext.length > 0 && (
        <Section h={c.sDoNext}>
          <Frame>
            {d.doNext.map((x, i) => (
              <Item key={i} last={i === d.doNext.length - 1}>
                <Head text={x.action} rank={x.when} c={c} />
                <Fields rows={[["", x.why], [c.fExpect, x.expect]]} />
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {d.risks.length > 0 && (
        <Section h={c.sRisks} note="What would make this profile wrong, and the cheapest way to find out.">
          <div style={{ border: "1px solid " + T.border, borderLeft: "3px solid " + T.danger, borderRadius: T.rCard }}>
            {d.risks.map((r, i) => (
              <Item key={i} last={i === d.risks.length - 1}>
                <div style={{ color: T.heading, fontWeight: 500, lineHeight: 1.5 }}>{r.risk}</div>
                <Fields rows={[[c.fIfTrue, r.ifTrue], [c.fCheckBy, r.checkBy]]} />
              </Item>
            ))}
          </div>
        </Section>
      )}

      {d.unknowns.length > 0 && (
        <Section h={c.sUnknowns}>
          <Frame>
            {d.unknowns.map((u, i) => (
              <Item key={i} last={i === d.unknowns.length - 1}>
                <div style={{ color: T.heading, fontWeight: 500, lineHeight: 1.5 }}>{u.question}</div>
                <div style={{ color: T.muted, fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{u.whyItMatters}</div>
              </Item>
            ))}
          </Frame>
        </Section>
      )}
    </>
  );
}