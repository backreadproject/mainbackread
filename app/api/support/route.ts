import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAI, supportTask, type SupportTurn } from "@/lib/ai";
import { resolvePlanForUser } from "@/lib/plan-context";
import { sendEmail } from "@/lib/email";
import { getLocale } from "@/lib/locale-server";

export const runtime = "nodejs";
// Model calls plus Supabase round trips exceed Vercel's 10s default,
// which returns a 504 HTML page rather than JSON. 60s is the Hobby ceiling.
export const maxDuration = 60;

const PER_SESSION_PER_HOUR = 20;
const PER_SESSION_PER_DAY = 60;
const MAX_LEN = 600;

function hourWindow(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())).toISOString();
}
function dayWindow(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function POST(req: NextRequest) {
  const { sessionToken, message, email, name, surface } = await req.json();

  if (typeof sessionToken !== "string" || sessionToken.length < 20) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Say something first." }, { status: 400 });
  }
  if (message.length > MAX_LEN) {
    return NextResponse.json({ error: `Keep it under ${MAX_LEN} characters.` }, { status: 400 });
  }

  const admin = createAdminClient();

  // The language of the person typing. The support KB stays English; only the
  // reply is translated.
  const locale = await getLocale();
  const fr = locale === "fr";

  // Rate limit before any AI spend. This endpoint is reachable without a login,
  // so it is the same exposure the reader Ask endpoint has, and gets the same guard.
  const [h, d] = await Promise.all([
    admin.rpc("bump_rate_limit", { p_bucket: `support:${sessionToken}:h`, p_window: hourWindow() }),
    admin.rpc("bump_rate_limit", { p_bucket: `support:${sessionToken}:d`, p_window: dayWindow() }),
  ]);
  if (!h.error && Number(h.data) > PER_SESSION_PER_HOUR) {
    return NextResponse.json({ answer: fr ? "Vous avez pos\u00e9 beaucoup de questions en peu de temps. Attendez une heure, ou \u00e9crivez \u00e0 support@readprospects.com et une personne prendra le relais." : "You have asked a lot in a short time. Give it an hour, or email support@readprospects.com and a person will pick it up.", escalate: false, limited: true });
  }
  if (!d.error && Number(d.data) > PER_SESSION_PER_DAY) {
    return NextResponse.json({ answer: fr ? "C\u2019est tout ce que je peux faire aujourd\u2019hui. \u00c9crivez \u00e0 support@readprospects.com et une personne prendra le relais." : "That is as much as I can help with today. Email support@readprospects.com and a person will pick it up.", escalate: false, limited: true });
  }

  // Who is asking, when we can tell. Never used to unlock anything.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let who: { signedIn: boolean; name?: string | null; plan?: string | null; isOrg?: boolean } = { signedIn: false };
  if (user) {
    const { data: prof } = await admin.from("profiles").select("first_name, last_name").eq("id", user.id).single();
    const ctx = await resolvePlanForUser(admin, user.id);
    who = {
      signedIn: true,
      name: (prof as { first_name?: string | null } | null)?.first_name ?? null,
      plan: ctx.plan.name,
      isOrg: ctx.scope === "org",
    };
  }

  // Find or open the conversation.
  const { data: existing } = await admin
    .from("support_conversations")
    .select("id, status, escalated_at")
    .eq("session_token", sessionToken)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;
  if (!conversationId) {
    const { data: created, error } = await admin.from("support_conversations").insert({
      user_id: user?.id ?? null,
      session_token: sessionToken,
      email: user?.email ?? (typeof email === "string" ? email.trim() || null : null),
      name: (typeof name === "string" ? name.trim() : "") || who.name || null,
      surface: surface === "app" ? "app" : "marketing",
    }).select("id").single();
    if (error || !created) return NextResponse.json({ error: "Could not start a conversation." }, { status: 500 });
    conversationId = created.id as string;
  } else if (user?.id || (typeof email === "string" && email.trim())) {
    // Fill in identity if we learn it mid-conversation. These are two separate
    // writes on purpose: the account link must land even when an email is already
    // stored, and the email must not be overwritten once we have one.
    if (user?.id) {
      await admin.from("support_conversations").update({ user_id: user.id }).eq("id", conversationId);
    }
    const learnedEmail = user?.email ?? (typeof email === "string" ? email.trim() : "");
    if (learnedEmail) {
      await admin.from("support_conversations").update({ email: learnedEmail }).eq("id", conversationId).is("email", null);
    }
  }

  const { data: past } = await admin
    .from("support_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);
  const history: SupportTurn[] = (past ?? []).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content as string,
  }));

  await admin.from("support_messages").insert({ conversation_id: conversationId, role: "user", content: message.trim() });

  // A person may already be involved. The bot keeps helping with anything else,
  // it just does not re-escalate or promise to resolve what was raised. Going silent
  // on someone who is still typing is worse than a partial answer.
  const humanWaiting = existing?.status === "escalated" || existing?.status === "answered";
  // Notify once per escalation. A follow-up only re-notifies if we already replied,
  // because that means they came back after we thought it was handled. Nine emails
  // from one conversation is an inbox nobody reads.
  if (existing?.status === "answered") {
    await notifyHuman(conversationId, message.trim(), "they replied after our answer");
  }

  const { data } = await runAI(supportTask, { question: message.trim(), history, who, humanWaiting, locale });

  await admin.from("support_messages").insert({ conversation_id: conversationId, role: "assistant", content: data.answer });
  const alreadyWaiting = existing?.status === "escalated" && !!existing?.escalated_at;
  const startsNewWait = data.escalate && !alreadyWaiting;
  await admin.from("support_conversations").update({
    last_message_at: new Date().toISOString(),
    status: humanWaiting || data.escalate ? "escalated" : "bot",
    ...(startsNewWait ? { escalated_at: new Date().toISOString() } : {}),
  }).eq("id", conversationId);

  if (data.escalate && !humanWaiting) await notifyHuman(conversationId, message.trim(), data.reason);

  return NextResponse.json({ answer: data.answer, escalate: data.escalate, conversationId });
}

/** Email the operator. Best effort: support must not fail because email did. */
async function notifyHuman(conversationId: string, message: string, reason: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: conv } = await admin
      .from("support_conversations")
      .select("email, name, surface, user_id")
      .eq("id", conversationId)
      .single();
    const c = (conv ?? {}) as { email: string | null; name: string | null; surface: string; user_id: string | null };
    const who = [c.name, c.email].filter(Boolean).join(", ") || "an anonymous visitor";
    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#F8F9FA;padding:24px;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #EAECEF;border-radius:12px;padding:22px;">
        <p style="font-size:13px;color:#98A2B3;margin:0 0 6px;">Support needs you</p>
        <p style="font-size:16px;font-weight:700;color:#0F1729;margin:0 0 12px;">${who}</p>
        <p style="font-size:14px;color:#475467;line-height:1.55;margin:0 0 14px;">${message.replace(/</g, "&lt;")}</p>
        <p style="font-size:12.5px;color:#98A2B3;margin:0 0 16px;">Why: ${reason} &middot; from the ${c.surface} site${c.user_id ? " &middot; signed in" : ""}</p>
        <a href="https://app.readprospects.com/console-7f3ab9c2/support" style="display:inline-block;background:#0B7A4B;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;">Open in the console</a>
      </div></body></html>`;
    const to = process.env.SUPPORT_NOTIFY_EMAIL || "readprospects@gmail.com";
    await sendEmail("readprospects", { to, subject: `Support: ${who}`, html });
  } catch (err) {
    console.error("[support] notify failed:", err instanceof Error ? err.message : String(err));
  }
}

/** Read a conversation back. The session token is the secret, exactly like a
 *  share token, which is why it must be long and random. No AI, so no spend. */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("session") ?? "";
  if (token.length < 20) return NextResponse.json({ error: "Invalid session." }, { status: 400 });

  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("support_conversations")
    .select("id, status, email")
    .eq("session_token", token)
    .maybeSingle();
  if (!conv) return NextResponse.json({ messages: [], status: "new", hasEmail: false });

  const { data: msgs } = await admin
    .from("support_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(60);

  return NextResponse.json({
    messages: msgs ?? [],
    status: conv.status,
    hasEmail: !!conv.email,
  });
}


