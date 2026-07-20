import { createAdminClient } from "@/lib/supabase/admin";

type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  email?: { to: string; subject: string; html: string } | null; // optional email dispatch
};

// Creates an in-app notification and optionally sends an email.
// Safe to call from any server route; uses admin client (bypasses RLS).
export async function notify(input: NotifyInput): Promise<void> {
  const admin = createAdminClient();
  try {
    await admin.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
  } catch {
    // Non-fatal: never let a notification failure break the main action.
  }

  if (input.email) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM = process.env.PROSPECT_FROM_EMAIL || "ReadProspects <onboarding@resend.dev>";
    if (!RESEND_API_KEY) return;
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [input.email.to], subject: input.email.subject, html: input.email.html }),
      });
    } catch {
      // Non-fatal.
    }
  }
}

// Small branded email wrapper for notification emails.
export function notifyEmail(heading: string, message: string, actionUrl?: string, actionLabel?: string): string {
  const button = actionUrl ? `<a href="${actionUrl}" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;margin-top:8px;">${actionLabel ?? "Open ReadProspects"}</a>` : "";
  return `<!doctype html><html><body style="margin:0;background:#F8F9FA;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="display:inline-block;width:20px;height:20px;border:2px solid #1FA971;border-radius:50%;position:relative;"><span style="position:absolute;inset:5px;background:#1FA971;border-radius:50%;"></span></span>
      <span style="font-size:19px;font-weight:700;color:#0F1729;">ReadProspects</span>
    </div>
    <div style="background:#fff;border:1px solid #EAECEF;border-radius:14px;padding:28px;">
      <p style="font-size:17px;font-weight:700;color:#0F1729;margin:0 0 10px;">${heading}</p>
      <p style="font-size:15px;color:#475467;line-height:1.55;margin:0 0 16px;">${message}</p>
      ${button}
    </div>
    <p style="font-size:12px;color:#98A2B3;text-align:center;margin:24px 0 0;">Sent via ReadProspects. The document reads the reader.</p>
  </div></body></html>`;
}
