import { T } from "@/lib/theme";
import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";

/**
 * Where an unconfirmed signup lands.
 *
 * Reached only when signUp returns a user with no session, which is what email
 * confirmation does. It names the address back to them: the commonest reason a
 * confirmation never arrives is a typo nobody can see once the form has gone.
 */
export default async function CheckEmailPage({
  searchParams,
}: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const C = getDict(await getLocale()).chrome;
  const addr = (email ?? "").trim();

  return (
    <div style={{
      minHeight: "100vh", background: T.canvas, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "40px 24px", fontFamily: T.font, color: T.body,
    }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke={T.green} strokeWidth="2.4" />
            <circle cx="12" cy="12" r="3.5" fill={T.green} />
          </svg>
          <span style={{ color: T.heading, fontSize: 14, fontWeight: 600, letterSpacing: T.trackingTight }}>ReadProspects</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.25 }}>
          Confirm your email
        </h1>
        <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.65, margin: "14px 0 0" }}>
          {addr ? "We have sent a link to " : "We have sent you a link. "}
          {addr && <strong style={{ color: T.heading, fontWeight: 500 }}>{addr}</strong>}
          {addr ? ". Click it and you are in." : "Click it and you are in."}
        </p>
        <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.65, margin: "12px 0 0" }}>
          Your account is already created, so nothing is lost if you close this tab.
          If the email does not arrive within a minute or two, check the spam folder.
        </p>

        <div style={{ marginTop: 26, paddingTop: 16, borderTop: "1px solid " + T.border, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
          <a href="/login" style={{ color: T.greenText, fontWeight: 500, textDecoration: "none" }}>{C.backToSignIn}</a>
          <a href="https://readprospects.com" style={{ marginLeft: "auto", color: T.muted, textDecoration: "none" }}>readprospects.com</a>
        </div>
      </div>
    </div>
  );
}