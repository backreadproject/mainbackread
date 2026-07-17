// Email alerts via Resend. Dormant until RESEND_API_KEY is set.
// Called server-side when a reader opens a document.
export async function notifyOwnerOfOpen(params: { ownerEmail: string; readerLabel: string; docTitle: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // not configured yet — silently no-op

  const from = process.env.ALERT_FROM_EMAIL || "BackRead <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: params.ownerEmail,
        subject: `${params.readerLabel} just opened ${params.docTitle}`,
        html: `<p><strong>${params.readerLabel}</strong> just opened <strong>${params.docTitle}</strong>.</p><p>Head to BackRead to read the reader.</p>`,
      }),
    });
  } catch { /* alerts are best-effort; never block the read */ }
}
