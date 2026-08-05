"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

/**
 * The Elegant shell for a single route.
 *
 * CLASSIC RENDERS NOTHING EXTRA. It returns the page's own header followed by
 * the page, which is byte for byte what the route did before this existed. That
 * is the whole safety property: a route that has been converted is unchanged in
 * Classic, so the switch back is always a real way out.
 *
 * ELEGANT replaces the page's header with a strip carrying the entity, its
 * numbers and its actions, and puts an index pane beside the content. A route
 * that supplies no index simply renders full width, still in the denser style,
 * which is why routes can be converted one at a time rather than all at once.
 */

export type WorkbenchStat = {
  value: string;
  label: string;
  /** Green for something working, danger for something wrong, amber for
   *  something waiting. Absent for a plain count. */
  tone?: "green" | "amber" | "danger";
};

export default function Workbench({
  workspace,
  title,
  subtitle,
  tags,
  stats,
  actions,
  index,
  indexLabel,
  header,
  children,
}: {
  workspace: "classic" | "elegant";
  /** The entity this route is about. Shown in the strip. */
  title: string;
  subtitle?: string;
  tags?: React.ReactNode;
  stats?: WorkbenchStat[];
  actions?: React.ReactNode;
  /** The collection this route navigates. Omit it and the page renders full
   *  width, which is the correct state for a route not yet converted. */
  index?: React.ReactNode;
  indexLabel?: string;
  /** The page's own header, exactly as Classic has always rendered it. */
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const fr = useLocale() === "fr";
  const [open, setOpen] = useState(false);

  if (workspace !== "elegant") {
    return <>{header}{children}</>;
  }

  const toneOf = (t?: WorkbenchStat["tone"]) =>
    t === "green" ? T.greenText : t === "danger" ? T.dangerText : t === "amber" ? T.amberText : T.heading;

  return (
    <div className={"wb" + (open ? " wb-open" : "")}>
      <style>{`
        .wb { display:flex; flex-direction:column; height:100%; min-height:0; }
        .wb-strip { display:flex; align-items:center; gap:12px; height:50px; flex:none;
          padding:0 18px; border-bottom:1px solid ${T.border}; background:${T.canvas}; }
        .wb-title { color:${T.heading}; font-size:14.5px; font-weight:600; letter-spacing:${T.trackingTight};
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .wb-sub { font-size:12px; color:${T.muted}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .wb-nums { margin-left:auto; display:flex; align-items:stretch; }
        .wb-num { padding:0 16px; border-left:1px solid ${T.border}; display:flex; flex-direction:column; justify-content:center; }
        .wb-num .v { font-size:14px; font-weight:600; line-height:1; font-variant-numeric:tabular-nums; }
        .wb-num .k { font-size:9.5px; color:${T.faint}; margin-top:4px; letter-spacing:.02em; white-space:nowrap; }
        .wb-act { padding-left:16px; border-left:1px solid ${T.border}; display:flex; gap:7px; align-items:center; }
        .wb-panes { flex:1; display:flex; min-height:0; }
        .wb-index { width:288px; flex:none; border-right:1px solid ${T.border}; background:${T.soft};
          overflow-y:auto; }
        .wb-detail { flex:1; overflow-y:auto; min-width:0; background:${T.canvas}; }
        .wb-toggle { display:none; }
        @media (max-width: 1180px) {
          .wb-index { position:absolute; top:50px; bottom:0; left:0; z-index:30; width:288px; max-width:86vw;
            transform:translateX(-100%); transition:transform .2s ease; box-shadow:${T.overlayShadow}; }
          .wb.wb-open .wb-index { transform:translateX(0); }
          .wb-panes { position:relative; }
          .wb-toggle { display:inline-flex; }
        }
      `}</style>

      <div className="wb-strip">
        {index && (
          <button
            className="wb-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={indexLabel ?? (fr ? "Liste" : "List")}
            style={{
              width: 28, height: 28, alignItems: "center", justifyContent: "center",
              border: "1px solid " + T.border, borderRadius: T.rBtn, background: T.card,
              color: T.body, cursor: "pointer", flex: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        )}

        <span className="wb-title">{title}</span>
        {tags}
        {subtitle && <span className="wb-sub">{subtitle}</span>}

        {(stats?.length || actions) && (
          <div className="wb-nums">
            {(stats ?? []).map((s, i) => (
              <div className="wb-num" key={i}>
                <span className="v" style={{ color: toneOf(s.tone) }}>{s.value}</span>
                <span className="k">{s.label}</span>
              </div>
            ))}
            {actions && <div className="wb-act">{actions}</div>}
          </div>
        )}
      </div>

      <div className="wb-panes">
        {index && (
          <nav className="wb-index" onClick={() => setOpen(false)}>
            {index}
          </nav>
        )}
        <div className="wb-detail">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** A row in the index. Kept here so every converted route builds its index the
 *  same way and they do not drift into six slightly different list styles. */
export function WorkbenchRow({
  href,
  active = false,
  tone,
  title,
  sub,
  right,
}: {
  href: string;
  active?: boolean;
  tone?: "green" | "amber" | "danger" | "indigo";
  title: string;
  sub?: string;
  right?: string;
}) {
  const dot =
    tone === "green" ? T.green : tone === "amber" ? T.amber
    : tone === "danger" ? T.danger : tone === "indigo" ? T.indigo : T.faint;

  return (
    <a
      href={href}
      className="wb-row"
      style={{
        display: "flex", gap: 9, padding: "9px 14px", alignItems: "flex-start",
        borderBottom: "1px solid " + T.borderSoft, textDecoration: "none",
        background: active ? T.card : "transparent",
        boxShadow: active ? "inset 2px 0 0 " + T.green : "none",
      }}
    >
      {tone && <i style={{ width: 6, height: 6, borderRadius: 1, background: dot, flex: "none", marginTop: 5 }} />}
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{
          display: "block", fontSize: 12.5, color: T.heading, fontWeight: 500,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</span>
        {sub && (
          <span style={{
            display: "block", fontSize: 11.5, color: T.muted, marginTop: 3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{sub}</span>
        )}
      </span>
      {right && (
        <span style={{ fontSize: 10.5, color: T.faint, flex: "none", fontVariantNumeric: "tabular-nums" }}>{right}</span>
      )}
    </a>
  );
}

/** A heading inside the index. */
export function WorkbenchGroup({ label, count }: { label: string; count?: number | string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "13px 14px 6px", fontSize: 9, letterSpacing: ".1em",
      textTransform: "uppercase", color: T.faint, fontWeight: 500,
    }}>
      {label}
      {count !== undefined && (
        <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{count}</span>
      )}
    </div>
  );
}
