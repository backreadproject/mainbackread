import type { VerdictInput } from "@/lib/ai/tasks/verdict";
import { clampDwellMs, DWELL_CAP_MS } from "@/lib/dwell";

export type SignalRow = { kind: string; page: number | null; value: unknown; created_at?: string };
export type RecipientLite = { label?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null };
export type DocLite = { title?: string | null; extracted_text?: string | null };

// Turn a recipient's raw signal rows into the VerdictInput the AI expects.
// Reads every kind the reader (and the forward route) actually writes:
//   opened      -> openCount
//   question    -> questionsAsked (value.text)
//   forwarded   -> forwardedTo    (value.colleagues[].email)
//   page_dwell  -> per-page seconds + visits, and a backtrack trail
export function buildVerdictInput(recipient: RecipientLite, doc: DocLite, rows: SignalRow[]): VerdictInput {
  const dwellByPage: Record<number, { seconds: number; visits: number; capped: boolean }> = {};
  const questionsAsked: string[] = [];
  const forwardedTo: string[] = [];
  const dwellSeq: number[] = [];
  let openCount = 0;

  for (const s of rows) {
    const v: Record<string, unknown> = s.value && typeof s.value === "object" ? (s.value as Record<string, unknown>) : {};
    if (s.kind === "opened") {
      openCount++;
    } else if (s.kind === "question") {
      if (typeof v.text === "string" && v.text.trim()) questionsAsked.push(v.text.trim());
    } else if (s.kind === "forwarded") {
      const cols = Array.isArray(v.colleagues) ? v.colleagues : [];
      for (const c of cols) {
        if (c && typeof c === "object" && "email" in c) {
          const email = String((c as { email: unknown }).email || "").trim();
          if (email) forwardedTo.push(email);
        }
      }
    } else if (s.kind === "page_dwell" && s.page != null && typeof v.ms !== "undefined") {
      // Rows written before the cap existed still hold raw values, so clamp
      // here too rather than trusting the table.
      const raw = Number(v.ms) || 0;
      const ms = clampDwellMs(raw);
      const cur = dwellByPage[s.page] ?? { seconds: 0, visits: 0, capped: false };
      dwellByPage[s.page] = { seconds: Math.max(cur.seconds, Math.round(ms / 1000)), visits: cur.visits + 1, capped: cur.capped || raw > DWELL_CAP_MS || v.capped === true };
      dwellSeq.push(s.page);
    }
  }

  const pages = Object.entries(dwellByPage)
    .map(([page, d]) => ({ page: Number(page), title: d.capped ? `Page ${page} (dwell capped, tab likely left open, treat as unreliable)` : `Page ${page}`, seconds: d.seconds, visits: d.visits }))
    .sort((a, b) => b.seconds - a.seconds);

  const back: string[] = [];
  for (let i = 1; i < dwellSeq.length && back.length < 6; i++) {
    if (dwellSeq[i] < dwellSeq[i - 1]) back.push(`returned from page ${dwellSeq[i - 1]} to page ${dwellSeq[i]}`);
  }
  for (const p of pages) {
    if (p.visits > 1 && back.length < 8) back.push(`re-read page ${p.page} (${p.visits} times)`);
  }
  const backtracks = [...new Set(back)];

  const readerName = recipient.label || `${recipient.first_name ?? ""} ${recipient.last_name ?? ""}`.trim() || "Reader";
  const email = recipient.email || "";
  const readerOrg = email.includes("@") ? email.split("@")[1] : "";
  const documentText = (doc.extracted_text ?? "").trim() || doc.title || "this document";

  return { documentText, documentTitle: doc.title || "this document", readerName, readerOrg, pages, backtracks, questionsAsked, forwardedTo, openCount };
}
