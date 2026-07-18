// Trial helpers. 7-day trial for company accounts.
export const TRIAL_DAYS = 7;

export function trialInfo(trialStartedAt: string | null): { active: boolean; daysLeft: number; started: boolean } {
  if (!trialStartedAt) return { active: false, daysLeft: 0, started: false };
  const start = new Date(trialStartedAt).getTime();
  const end = start + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const daysLeft = Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
  return { active: now < end, daysLeft, started: true };
}
