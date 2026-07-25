// A reader does not attend to one page for hours. Past this ceiling the number
// is a tab left open, not attention, and once it reaches the table it owns
// every scale, average and verdict that touches it.
export const DWELL_CAP_MS = 15 * 60 * 1000;

export function clampDwellMs(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.round(n), DWELL_CAP_MS);
}

// A capped value is shown as a floor, not a figure, because the true number is
// unknowable and printing "900.0s" would imply precision we do not have.
export function formatDwell(ms: number): string {
  if (ms >= DWELL_CAP_MS) return "15m+";
  const s = ms / 1000;
  if (s < 60) return s.toFixed(1) + "s";
  return Math.floor(s / 60) + "m " + Math.round(s % 60) + "s";
}