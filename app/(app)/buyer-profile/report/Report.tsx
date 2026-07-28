"use client";
import { T } from "@/lib/theme";
import { reportCopy } from "@/lib/icp-report-copy";
import { PASSES, type IcpProfile, type Pass } from "@/lib/icp-profile";
import type { Locale } from "@/lib/i18n";
import { Section, Frame, Item } from "./parts";
import { People, Demand } from "./SectionsA";
import { Market, Activation, Synthesis } from "./SectionsB";

const CONF: Record<string, string> = {
  strong: T.greenText, moderate: T.greenText, thin: T.amberText, insufficient: T.dangerText,
};

export default function Report({
  profile, locale, busy, running, onRun, onRunAll,
}: {
  profile: IcpProfile;
  locale: Locale;
  busy: boolean;
  running: Pass | null;
  onRun: (p: Pass) => void;
  onRunAll: () => void;
}) {
  const c = reportCopy(locale);
  const p = profile;
  const s = p.synthesis;
  const done = p.done.length;
  const label: Record<Pass, string> = {
    record: c.sSummary, people: c.sPersonas, demand: c.sPains,
    market: c.sChannels, activation: c.sMessages, synthesis: c.sFindings,
  };
  const btn = {
    font: "inherit", fontSize: 13, fontWeight: 500, padding: "7px 14px",
    borderRadius: T.rBtn, border: "1px solid " + T.border, background: T.card,
    color: T.heading, cursor: "pointer",
  } as const;

  return (
    <div>
      {/* Headline is the synthesis when it exists; until then the record's plainer one. */}
      {(s?.headline || p.record?.headline) && (
        <div style={{ marginTop: 20, fontSize: 21, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, lineHeight: 1.35, maxWidth: "30em" }}>
          {s?.headline || p.record?.headline}
        </div>
      )}
      {s?.profileName && (
        <div style={{ marginTop: 6, fontSize: 13, color: T.muted }}>{s.profileName}</div>
      )}
      {s?.summary && (
        <div style={{ marginTop: 14, fontSize: 14, color: T.body, lineHeight: 1.65, maxWidth: "44em" }}>{s.summary}</div>
      )}

      {/* Progress and confidence on one hairline strip. */}
      <div style={{
        display: "flex", gap: "8px 18px", alignItems: "center", flexWrap: "wrap",
        marginTop: 20, paddingTop: 12, paddingBottom: 12,
        borderTop: "1px solid " + T.border, borderBottom: "1px solid " + T.border,
        fontSize: 12.5, color: T.muted,
      }}>
        <span>{c.sectionsDone(done, PASSES.length)}</span>
        {p.confidence && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, background: CONF[p.confidence.band] ?? T.faint, display: "inline-block" }} />
            {c.confidence}: {p.confidence.pct}%
          </span>
        )}
        {running && <span style={{ color: T.greenText }}>{c.building(label[running])}</span>}
        {done < PASSES.length && !busy && (
          <span style={{ marginLeft: "auto" }}>
            <button onClick={onRunAll} style={{ ...btn, border: "none", background: T.green, color: T.onAccent }}>
              {c.buildAll}
            </button>
          </span>
        )}
      </div>

      {/* Why the number is what it is. A percentage with no explanation is a vibe. */}
      {p.confidence && p.confidence.reasons.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: T.muted, lineHeight: 1.6, maxWidth: "48em" }}>
          {p.confidence.reasons.join(" ")}
        </div>
      )}

      {/* Synthesis first: findings, tensions, opportunity, do next, risks. */}
      {s && <Synthesis d={s} c={c} />}

      {p.record && (
        <Section h={c.sSummary}>
          <Frame>
            {p.record.definition.map((d, i) => (
              <Item key={i} last={i === p.record!.definition.length - 1}>
                <div style={{ display: "grid", gridTemplateColumns: "190px minmax(0,1fr)", gap: 20, fontSize: 13.5, lineHeight: 1.55 }}>
                  <div style={{ color: T.muted, fontSize: 13 }}>{d.label}</div>
                  <div style={{ color: T.body }}>{d.value}</div>
                </div>
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {p.people && <People d={p.people} c={c} />}
      {p.demand && <Demand d={p.demand} c={c} />}
      {p.market && <Market d={p.market} c={c} />}
      {p.activation && <Activation d={p.activation} c={c} />}

      {/* Sections not yet built, each runnable on its own so one failure never
          blocks the rest. */}
      {done < PASSES.length && (
        <Section h="" >
          <Frame>
            {PASSES.filter((x) => !p.done.includes(x)).map((x, i, arr) => (
              <Item key={x} last={i === arr.length - 1}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: T.muted, fontSize: 13.5, flex: "1 1 14em" }}>{label[x]}</span>
                  <button onClick={() => onRun(x)} disabled={busy} style={{ ...btn, opacity: busy ? 0.5 : 1, cursor: busy ? "default" : "pointer" }}>
                    {running === x ? c.building(label[x]) : c.runSection}
                  </button>
                </div>
              </Item>
            ))}
          </Frame>
        </Section>
      )}

      {s?.limits && (
        <div style={{ marginTop: 36, borderLeft: "3px solid " + T.amber, padding: "2px 0 2px 14px", maxWidth: 640 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.heading, marginBottom: 4 }}>{c.sLimits}</div>
          <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, marginBottom: 8 }}>{s.limits}</div>
          <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6 }}>
            Nothing above has been checked against who actually reads your documents. That comparison starts once about twenty readers
            have gone past page three, and when it disagrees with this page, this page is the thing that was wrong.
          </div>
        </div>
      )}
    </div>
  );
}