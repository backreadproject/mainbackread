import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type WebhookEvent = "reader.opened" | "reader.question" | "reader.forwarded" | "reader.replied";
export const WEBHOOK_EVENTS: WebhookEvent[] = ["reader.opened", "reader.question", "reader.forwarded", "reader.replied"];

// SSRF guard. Customer-supplied URLs must not be able to reach our own network.
const BLOCKED = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/i;

export function isSafeWebhookUrl(raw: string): { ok: boolean; error?: string } {
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, error: "That is not a valid URL." }; }
  if (u.protocol !== "https:") return { ok: false, error: "The URL must start with https://" };
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "::1" || BLOCKED.test(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, error: "That address is not reachable from our servers." };
  }
  return { ok: true };
}

export function newWebhookSecret(): string {
  return "whsec_" + crypto.randomBytes(24).toString("hex");
}

function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

type Payload = {
  event: WebhookEvent;
  createdAt: string;
  document: { id: string; title: string };
  reader: { id: string; name: string; email: string | null };
  data: Record<string, unknown>;
};

function slackBlurb(p: Payload): string {
  const who = p.reader.name;
  if (p.event === "reader.question") {
    const q = String(p.data.question ?? "");
    const a = String(p.data.answer ?? "").trim();
    const short = a.length > 320 ? a.slice(0, 320) + "\u2026" : a;
    return `*${who}* asked a question on _${p.document.title}_: "${q}"` + (short ? `\n> ${short}` : "");
  }
  if (p.event === "reader.replied") {
    const t = String(p.data.text ?? "").trim();
    const short = t.length > 400 ? t.slice(0, 400) + "\u2026" : t;
    return `*${who}* replied on _${p.document.title}_:` + (short ? `\n> ${short}` : "");
  }
  if (p.event === "reader.forwarded") return `*${who}* forwarded _${p.document.title}_ to ${Number(p.data.colleagueCount ?? 0)} colleague(s).`;
  return `*${who}* opened _${p.document.title}_.`;
}

async function postOnce(url: string, body: string, headers: Record<string, string>): Promise<{ ok: boolean; status?: number; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch(url, { method: "POST", headers, body, signal: ctrl.signal });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

/** Resolves the recipient's document and organization, then fires every matching
 *  Settings webhook AND every Zapier/Make REST Hook subscription. Personal
 *  accounts have no organization, so nothing fires for them.
 *  Never throws: a webhook problem must never break a reader's action. */
export async function deliverForRecipient(recipientId: string, event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: rec } = await admin
      .from("recipients")
      .select("id, label, first_name, last_name, email, documents ( id, title, organization_id )")
      .eq("id", recipientId)
      .single();
    const doc = rec?.documents as unknown as { id: string; title: string; organization_id: string | null } | undefined;
    if (!rec || !doc?.organization_id) return;

    const { data: hooks } = await admin
      .from("webhooks")
      .select("id, url, secret, events, active")
      .eq("organization_id", doc.organization_id)
      .eq("active", true);
    const targets = (hooks ?? []).filter((h) => (h.events as string[]).includes(event));

    const readerName = (rec.label as string | null)
      || [rec.first_name, rec.last_name].filter(Boolean).join(" ").trim()
      || "A reader";

    const payload: Payload = {
      event, createdAt: new Date().toISOString(),
      document: { id: doc.id, title: doc.title },
      reader: { id: rec.id as string, name: readerName, email: (rec.email as string | null) ?? null },
      data,
    };

    // Zapier / Make REST Hook subscribers. Plain JSON, no signature: the
    // subscription URL is itself the secret, which is how REST Hooks work.
    const { data: subs } = await admin
      .from("api_subscriptions")
      .select("id, target_url")
      .eq("organization_id", doc.organization_id)
      .eq("event", event);
    await Promise.all((subs ?? []).map(async (s) => {
      const b = JSON.stringify(payload);
      let r = await postOnce(s.target_url as string, b, { "content-type": "application/json" });
      if (!r.ok) r = await postOnce(s.target_url as string, b, { "content-type": "application/json" });
      // Zapier returns 410 Gone when a Zap is deleted: clean the subscription up.
      if (r.status === 410) await admin.from("api_subscriptions").delete().eq("id", s.id);
    }));

    await Promise.all(targets.map(async (h) => {
      const isSlack = /hooks\.slack\.com/i.test(h.url as string);
      const body = isSlack ? JSON.stringify({ text: slackBlurb(payload) }) : JSON.stringify(payload);
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (!isSlack) {
        headers["x-readprospects-event"] = event;
        headers["x-readprospects-signature"] = sign(h.secret as string, body);
      }

      let res = await postOnce(h.url as string, body, headers);
      if (!res.ok) res = await postOnce(h.url as string, body, headers);

      await admin.from("webhook_deliveries").insert({
        webhook_id: h.id, event, ok: res.ok, status_code: res.status ?? null, error: res.error ?? null,
      });
      await admin.from("webhooks").update({
        last_status: res.status ?? null,
        last_delivery_at: new Date().toISOString(),
        failure_count: res.ok ? 0 : 1,
      }).eq("id", h.id);
    }));
  } catch (err) {
    console.error("[webhooks]", err instanceof Error ? err.message : String(err));
  }
}

/** Sends a sample payload so a customer can confirm their endpoint works. */
export async function sendTestDelivery(webhookId: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const admin = createAdminClient();
  const { data: h } = await admin.from("webhooks").select("id, url, secret").eq("id", webhookId).single();
  if (!h) return { ok: false, error: "Webhook not found." };

  const payload: Payload = {
    event: "reader.opened", createdAt: new Date().toISOString(),
    document: { id: "test", title: "Test document" },
    reader: { id: "test", name: "Test reader", email: null },
    data: { test: true },
  };
  const isSlack = /hooks\.slack\.com/i.test(h.url as string);
  const body = isSlack ? JSON.stringify({ text: "ReadProspects test alert. Your webhook is connected." }) : JSON.stringify(payload);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (!isSlack) {
    headers["x-readprospects-event"] = "reader.opened";
    headers["x-readprospects-signature"] = sign(h.secret as string, body);
  }
  const res = await postOnce(h.url as string, body, headers);
  await admin.from("webhook_deliveries").insert({
    webhook_id: h.id, event: "test", ok: res.ok, status_code: res.status ?? null, error: res.error ?? null,
  });
  return res;
}
