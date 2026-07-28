import { T } from "@/lib/theme";

/**
 * What a pending account sees instead of the app.
 *
 * Deliberately not a login failure: the account is real, the person is in a
 * queue, and telling them so is the difference between patience and a support
 * email. Approving them means they refresh and everything is already theirs.
 */
export default function Waiting({ email, locale }: { email: string; locale: "en" | "fr" }) {
  const fr = locale === "fr";
  const c = fr
    ? {
        h: "Votre compte est cr\u00e9\u00e9",
        p1: "ReadProspects n\u2019est pas encore ouvert \u00e0 tous. Votre compte existe et vous garde votre place ; il s\u2019ouvrira d\u00e8s que nous vous donnerons acc\u00e8s.",
        p2: "Vous n\u2019avez rien \u00e0 faire. Nous vous \u00e9crirons \u00e0 cette adresse.",
        signed: "Connect\u00e9 en tant que",
        out: "Se d\u00e9connecter",
        site: "Voir le site",
      }
    : {
        h: "Your account is ready",
        p1: "ReadProspects is not open to everyone yet. Your account exists and holds your place; it will open the moment we give you access.",
        p2: "Nothing to do from here. We will write to this address.",
        signed: "Signed in as",
        out: "Sign out",
        site: "View site",
      };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", background: T.canvas, fontFamily: T.font,
    }}>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke={T.green} strokeWidth="2.4" />
            <circle cx="12" cy="12" r="3.5" fill={T.green} />
          </svg>
          <span style={{ color: T.heading, fontSize: 17, fontWeight: 600, letterSpacing: T.trackingTight }}>ReadProspects</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.25 }}>
          {c.h}
        </h1>
        <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.65, margin: "14px 0 0" }}>{c.p1}</p>
        <p style={{ fontSize: 14.5, color: T.muted, lineHeight: 1.65, margin: "12px 0 0" }}>{c.p2}</p>

        <div style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid " + T.border, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: T.muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ color: T.faint }}>{c.signed} </span>{email}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <a href="https://readprospects.com" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>{c.site}</a>
            <a href="/login?signout=1" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>{c.out}</a>
          </span>
        </div>
      </div>
    </div>
  );
}