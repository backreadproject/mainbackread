import { T } from "@/lib/theme";

/**
 * What a locked account sees instead of the app.
 *
 * The soft lock used to block create-actions only, which meant a lapsed customer
 * wandered a product that refused them without explanation. This is one wall with
 * one message and one route out.
 *
 * Their data is untouched and their reader links keep working: a prospect reading
 * a proposal should not have it break because the sender's card expired.
 */
export default function Lapsed({
  email, orgName, planName, locale, everPaid,
}: { email: string; orgName: string | null; planName: string; locale: "en" | "fr"; everPaid: boolean }) {
  const fr = locale === "fr";
  const c = fr
    ? {
        h: everPaid ? "Votre abonnement a pris fin" : "Votre essai gratuit est termin\u00e9",
        p1: orgName
          ? "L\u2019acc\u00e8s \u00e0 " + orgName + " est suspendu, mais rien n\u2019a \u00e9t\u00e9 supprim\u00e9. Vos documents, vos lecteurs et tout ce qu\u2019ils ont r\u00e9v\u00e9l\u00e9 vous attendent."
          : "L\u2019acc\u00e8s est suspendu, mais rien n\u2019a \u00e9t\u00e9 supprim\u00e9. Vos documents, vos lecteurs et tout ce qu\u2019ils ont r\u00e9v\u00e9l\u00e9 vous attendent.",
        p2: "Les liens d\u00e9j\u00e0 envoy\u00e9s continuent de fonctionner : vos prospects peuvent toujours lire ce que vous leur avez adress\u00e9. Vous ne verrez simplement pas ce qu\u2019ils font, jusqu\u2019\u00e0 votre retour.",
        cta: everPaid ? "Reprendre l\u2019abonnement" : "Choisir une formule",
        was: everPaid ? "Formule pr\u00e9c\u00e9dente" : "Essai sur",
        signed: "Connect\u00e9 en tant que",
        out: "Se d\u00e9connecter",
      }
    : {
        h: everPaid ? "Your subscription has ended" : "Your free trial has ended",
        p1: orgName
          ? "Access to " + orgName + " is paused, but nothing has been deleted. Your documents, your readers and everything they revealed are waiting."
          : "Access is paused, but nothing has been deleted. Your documents, your readers and everything they revealed are waiting.",
        p2: "Links you already sent still work: your prospects can read what you sent them. You simply will not see what they do with it until you are back.",
        cta: everPaid ? "Restart your subscription" : "Choose a plan",
        was: everPaid ? "You were on" : "You were trialling",
        signed: "Signed in as",
        out: "Sign out",
      };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", background: T.canvas, fontFamily: T.font,
    }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke={T.green} strokeWidth="2.4" />
            <circle cx="12" cy="12" r="3.5" fill={T.green} />
          </svg>
          <span style={{ color: T.heading, fontSize: 14, fontWeight: 600, letterSpacing: T.trackingTight }}>ReadProspects</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.25 }}>
          {c.h}
        </h1>
        <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.65, margin: "14px 0 0" }}>{c.p1}</p>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.65, margin: "12px 0 0" }}>{c.p2}</p>

        <div style={{ marginTop: 24 }}>
          <a href="/billing" style={{
            display: "inline-block", background: T.green, color: T.onAccent,
            fontSize: 14, fontWeight: 500, padding: "10px 18px",
            borderRadius: T.rBtn, textDecoration: "none",
          }}>{c.cta}</a>
        </div>

        <div style={{ marginTop: 26, paddingTop: 16, borderTop: "1px solid " + T.border, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: T.muted }}>
          <span><span style={{ color: T.faint }}>{c.was} </span>{planName}</span>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ color: T.faint }}>{c.signed} </span>{email}
          </span>
          <a href="/login?signout=1" style={{ marginLeft: "auto", color: T.muted, textDecoration: "none" }}>{c.out}</a>
        </div>
      </div>
    </div>
  );
}