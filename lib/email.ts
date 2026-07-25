// Two Resend accounts, one per sending domain:
//   "relay"         -> reader emails from relaydocuments.com (document shares, forwards)
//                      Uses your CURRENT Resend account (relaydocuments.com verified).
//   "readprospects" -> app emails from readprospects.com (member invites, notifications)
//                      Uses a SECOND Resend account (readprospects.com verified).
//
// Env vars:
//   RESEND_API_KEY_RELAYDOCUMENTS   (required) key for the relaydocuments.com account
//   RESEND_API_KEY_READPROSPECTS    (recommended) key for the readprospects.com account
//   RELAYDOCUMENTS_FROM_EMAIL       (optional) default: Documents <documents@relaydocuments.com>
//   READPROSPECTS_FROM_EMAIL        (optional) default: ReadProspects <onboarding@resend.dev>
//
// Until RESEND_API_KEY_READPROSPECTS is set, ReadProspects emails fall back to the
// relaydocuments key and Resend's shared onboarding@resend.dev sender, so invites and
// notifications keep working during the migration. Once the second account exists, set
// its key (and READPROSPECTS_FROM_EMAIL) and the fallback is never used.
export type EmailAccount = "readprospects" | "relay";

function config(account: EmailAccount): { apiKey: string; from: string } {
  const relayKey = process.env.RESEND_API_KEY_RELAYDOCUMENTS || "";
  if (account === "relay") {
    return {
      apiKey: relayKey,
      from: process.env.RELAYDOCUMENTS_FROM_EMAIL || "Documents <documents@relaydocuments.com>",
    };
  }
  return {
    apiKey: process.env.RESEND_API_KEY_READPROSPECTS || relayKey,
    from: process.env.READPROSPECTS_FROM_EMAIL || "ReadProspects <onboarding@resend.dev>",
  };
}

export function emailFrom(account: EmailAccount): string { return config(account).from; }
export function emailConfigured(account: EmailAccount): boolean { return !!config(account).apiKey; }

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail(
  account: EmailAccount,
  msg: { to: string | string[]; subject: string; html: string; from?: string; replyTo?: string }
): Promise<SendResult> {
  const { apiKey, from } = config(account);
  if (!apiKey) return { ok: false, skipped: true };
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      // reply_to is omitted entirely when absent. Resend rejects an empty string,
      // and a broken Reply-To is worse than none: the reply bounces instead of
      // going to the default From.
      body: JSON.stringify({
        from: msg.from || from,
        to: Array.isArray(msg.to) ? msg.to : [msg.to],
        subject: msg.subject,
        html: msg.html,
        ...(msg.replyTo && msg.replyTo.includes("@") ? { reply_to: msg.replyTo } : {}),
      }),
    });
    if (!resp.ok) return { ok: false, error: (await resp.text()).slice(0, 200) };
    return { ok: true };
  } catch {
    return { ok: false, error: "unreachable" };
  }
}
