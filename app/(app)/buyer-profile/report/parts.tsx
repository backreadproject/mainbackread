"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import type { ReportCopy } from "@/lib/icp-report-copy";

type Src = "stated" | "inferred" | "market";

/**
 * The provenance chip.
 *
 * Three kinds of claim, told apart by shape as well as by word: stated is plain
 * (it is the customer's own), inferred is solid-bordered, market is dashed. The
 * dashed edge is the only one in the app, so the section that did not come from
 * their answers reads as a different kind of claim before anyone reads the label.
 */
export function Prov({ s, c }: { s: Src; c: ReportCopy }) {
  const label = s === "stated" ? c.stated : s === "inferred" ? c.inferred : c.market;
  const colour = s === "stated" ? T.faint : s === "inferred" ? T.greenText : T.indigoText;
  const border = s === "market" ? "1px dashed " + T.indigoBorder : s === "inferred" ? "1px solid " + T.greenBorder : "1px solid " + T.border;
  return (
    <span style={{
      display: "inline-block", border, borderRadius: T.rPill, padding: "1px 6px",
      fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase",
      color: colour, whiteSpace: "nowrap", flexShrink: 0,
    }}>{label}</span>
  );
}

const BAND_COLOUR: Record<string, string> = {
  strong: T.greenText, mixed: T.amberText, weak: T.dangerText, unknown: T.faint,
};

export function BandTag({ band, c }: { band: "strong" | "mixed" | "weak" | "unknown"; c: ReportCopy }) {
  const label = band === "strong" ? c.strong : band === "mixed" ? c.mixed : band === "weak" ? c.weak : c.unknown;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.body, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, background: BAND_COLOUR[band] ?? T.faint, display: "inline-block" }} />
      {label}
    </span>
  );
}

/** Ranked words rendered as words. A five-point scale drawn as bars invites
 *  comparison between things that were never measured on the same axis. */
export function Rank({ v }: { v: string }) {
  const hot = /^(critical|decisive|very high|constant|daily|immediate|strong)$/i.test(v);
  const warm = /^(high|important|weekly|weeks)$/i.test(v);
  return (
    <span style={{
      fontSize: 12, letterSpacing: "0.03em", textTransform: "uppercase",
      color: hot ? T.dangerText : warm ? T.amberText : T.muted, whiteSpace: "nowrap",
    }}>{v}</span>
  );
}

export function Section({ h, note, right, children }: {
  h: string; note?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: 0, letterSpacing: T.trackingTight }}>{h}</h2>
        {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
      </div>
      {note && <div style={{ color: T.muted, fontSize: 13, marginTop: 2, maxWidth: "56em", lineHeight: 1.55 }}>{note}</div>}
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

export function Frame({ dashed, children }: { dashed?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ border: (dashed ? "1px dashed " : "1px solid ") + (dashed ? T.indigoBorder : T.border), borderRadius: T.rCard }}>
      {children}
    </div>
  );
}

export function Item({ last, dashed, children }: { last?: boolean; dashed?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ padding: "13px 14px", borderBottom: last ? "none" : (dashed ? "1px dashed " : "1px solid ") + (dashed ? T.indigoBorder : T.border) }}>
      {children}
    </div>
  );
}

/** Title line with its provenance and any ranking pushed right. */
export function Head({ text, s, rank, c }: { text: string; s?: Src; rank?: string; c: ReportCopy }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
      <span style={{ color: T.heading, fontWeight: 500, lineHeight: 1.5, flex: "1 1 20em", minWidth: 0 }}>{text}</span>
      {rank && <Rank v={rank} />}
      {s && <Prov s={s} c={c} />}
    </div>
  );
}

/**
 * Label/value pairs under a heading.
 *
 * A grid with a fixed label column, not flex with a gap: flex bunches the pair
 * at the left and leaves the rest of the card empty, which has been rejected here before.
 */
export function Fields({ rows }: { rows: [string, string | undefined | null][] }) {
  const live = rows.filter(([, v]) => v && String(v).trim());
  if (!live.length) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "132px minmax(0,1fr)", gap: "5px 12px", marginTop: 8, fontSize: 13, lineHeight: 1.55 }}>
      {live.map(([k, v], i) => (
        <div key={i} style={{ display: "contents" }}>
          <div style={{ color: T.faint }}>{k}</div>
          <div style={{ color: T.body }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

/** basis and unless, shown on every inferred and market claim. The falsifier is
 *  the point: a claim you cannot attack is one you cannot trust. */
export function Trace({ basis, unless, c }: { basis?: string; unless?: string; c: ReportCopy }) {
  if (!basis?.trim() && !unless?.trim()) return null;
  return (
    <div style={{ marginTop: 7, fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>
      {basis?.trim() && <span><span style={{ color: T.faint }}>{c.basis} </span>{basis}</span>}
      {basis?.trim() && unless?.trim() && <span style={{ color: T.faint }}> &middot; </span>}
      {unless?.trim() && <span><span style={{ color: T.faint }}>{c.unless} </span>{unless}</span>}
    </div>
  );
}

export function Chips({ xs }: { xs: string[] }) {
  if (!xs?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {xs.map((x, i) => (
        <span key={i} style={{ border: "1px solid " + T.border, borderRadius: T.rPill, padding: "2px 8px", fontSize: 12.5, color: T.body }}>{x}</span>
      ))}
    </div>
  );
}

/** Anything meant to leave the page: search strings, filters, drafted messages.
 *  A message you have to select by hand is one nobody sends. */
export function Copyable({ text, c, mono }: { text: string; c: ReportCopy; mono?: boolean }) {
  const [hit, setHit] = useState(false);
  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <div style={{
        fontFamily: mono ? "ui-monospace, Consolas, monospace" : undefined,
        fontSize: mono ? 12.5 : 13.5, color: T.body, background: T.soft,
        border: "1px solid " + T.border, borderRadius: T.rPill,
        padding: "10px 74px 10px 11px", lineHeight: 1.6,
        whiteSpace: "pre-wrap", overflowWrap: "anywhere",
      }}>{text}</div>
      <button
        onClick={() => { void navigator.clipboard.writeText(text); setHit(true); setTimeout(() => setHit(false), 1600); }}
        style={{
          position: "absolute", top: 7, right: 7, font: "inherit", fontSize: 12,
          padding: "3px 9px", borderRadius: T.rPill, border: "1px solid " + T.border,
          background: T.card, color: hit ? T.greenText : T.muted, cursor: "pointer",
        }}>{hit ? c.copied : c.copy}</button>
    </div>
  );
}