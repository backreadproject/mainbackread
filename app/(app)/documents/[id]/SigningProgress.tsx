"use client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// Who has signed, who has not, and what the ones who refused said.
//
// The count above this panel says 1 / 2. That is a number, not an answer: it
// cannot tell you who to chase, or that someone declined and why. decline_reason
// has been captured since signing shipped and displayed nowhere, which made the
// single most useful sentence in the feature invisible to the person who needs
// it most.
//
// Deliberately NOT a progress bar. Two of three signed is not two thirds of an
// agreement; it is nothing until it is everything, and a bar implies partial
// value that does not exist.
export type SignerRow = {
  id: string;
  label: string | null;
  is_signer?: boolean;
  signed_at?: string | null;
  declined_at?: string | null;
  decline_reason?: string | null;
  sent_at?: string | null;
  created_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
};

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_FR = ["janvier","f\u00e9vrier","mars","avril","mai","juin","juillet","ao\u00fbt","septembre","octobre","novembre","d\u00e9cembre"];

function when(iso: string, fr: boolean): string {
  const d = new Date(iso);
  const m = (fr ? MONTHS_FR : MONTHS_EN)[d.getMonth()];
  const t = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  return d.getDate() + " " + m + ", " + t;
}
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// Reading evidence is passed in ONLY to be shown against a decline.
//
// Beside a signature it would invite a use it should not have: judging whether
// someone read the contract properly before signing it, which is a question
// about the validity of their consent and not one to arm a sender with quietly.
//
// Beside a REFUSAL it is the opposite. "Declined without opening past page one"
// and "declined after forty minutes on the pricing page" are different problems
// with different responses, and the sender needs to tell them apart.
export type Reading = { opens: number; questions: number };

export default function SigningProgress({ recipients, reading = {} }: {
  recipients: SignerRow[];
  reading?: Record<string, Reading>;
}) {
  const fr = useLocale() === "fr";
  const signers = recipients.filter((r) => r.is_signer);
  if (signers.length === 0) return null;

  // Ordered by what needs attention, not alphabetically. Declined first because
  // it stops the document dead; waiting next because it is the only state the
  // sender can act on; signed last because it is finished.
  const rank = (r: SignerRow) => (r.declined_at ? 0 : r.signed_at ? 2 : 1);
  const rows = [...signers].sort((a, b) => rank(a) - rank(b) || (a.label || "").localeCompare(b.label || ""));

  const cell = { padding: "12px 16px", borderTop: "1px solid " + T.borderSoft } as const;

  return (
    <div style={{ maxWidth: 1040, padding: "0 28px" }}>
      <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 }}>
        <div style={{ padding: "10px 16px", background: T.soft, borderBottom: "1px solid " + T.border,
                      borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard,
                      fontSize: 12.5, fontWeight: 600, color: T.body }}>
          {fr ? "Signataires" : "Signers"}
        </div>

        {rows.map((r) => {
          const declined = !!r.declined_at;
          const signed = !!r.signed_at && !declined;
          const dead = !signed && !declined && (!!r.revoked_at || (!!r.expires_at && new Date(r.expires_at) < new Date()));
          // sent_at is null for a link-mode signer: nothing was sent to them, so
          // the wait is measured from when the link was made.
          const since = daysSince(r.sent_at || r.created_at);

          const state = declined
            ? { colour: T.danger, text: fr ? "A refus\u00e9" : "Declined", at: r.declined_at as string }
            : signed
            ? { colour: T.green, text: fr ? "Sign\u00e9" : "Signed", at: r.signed_at as string }
            : dead
            ? { colour: T.faint, text: fr ? "Lien ferm\u00e9" : "Link closed", at: null }
            : { colour: T.amber, text: fr ? "En attente" : "Waiting", at: null };

          return (
            <div key={r.id} style={cell}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: state.colour, alignSelf: "center" }} />
                <span style={{ fontSize: 13.5, color: T.heading, fontWeight: 500 }}>
                  {r.label || (fr ? "Signataire sans nom" : "Unnamed signer")}
                </span>
                <span style={{ fontSize: 13, color: T.body }}>{state.text}</span>
                {state.at && <span style={{ fontSize: 12.5, color: T.faint }}>{when(state.at, fr)}</span>}
                {!signed && !declined && !dead && (
                  <span style={{ fontSize: 12.5, color: since >= 7 ? T.amberText : T.faint }}>
                    {since === 0
                      ? (fr ? "aujourd\u0027hui" : "since today")
                      : since === 1
                      ? (fr ? "depuis 1 jour" : "for 1 day")
                      : (fr ? `depuis ${since} jours` : `for ${since} days`)}
                  </span>
                )}
              </div>

              {/* The reason in full, never truncated. Someone refusing to sign
                  has told you exactly what is wrong, and an ellipsis in the
                  middle of it would be the worst possible economy. */}
              {declined && r.decline_reason && (
                <p style={{ fontSize: 13.5, color: T.heading, lineHeight: 1.55, margin: "9px 0 0 16px",
                            paddingLeft: 12, borderLeft: "2px solid " + T.dangerBorder }}>
                  {r.decline_reason}
                </p>
              )}
              {declined && (() => {
                const rd = reading[r.id];
                if (!rd) return null;
                const bits = fr
                  ? [
                      rd.opens === 0 ? "n\u0027a jamais ouvert le document"
                        : rd.opens === 1 ? "a ouvert le document une fois" : `a ouvert le document ${rd.opens} fois`,
                      rd.questions > 0 ? (rd.questions === 1 ? "a pos\u00e9 1 question" : `a pos\u00e9 ${rd.questions} questions`) : null,
                    ]
                  : [
                      rd.opens === 0 ? "never opened it"
                        : rd.opens === 1 ? "opened it once" : `opened it ${rd.opens} times`,
                      rd.questions > 0 ? (rd.questions === 1 ? "asked 1 question" : `asked ${rd.questions} questions`) : null,
                    ];
                return (
                  <p style={{ fontSize: 12.5, color: T.muted, margin: "7px 0 0 16px" }}>
                    {bits.filter(Boolean).join(fr ? ", " : ", ")}
                    {rd.opens === 0 ? (fr ? " avant de refuser." : " before declining.") : (fr ? " avant de refuser." : " before declining.")}
                  </p>
                );
              })()}

              {declined && !r.decline_reason && (
                <p style={{ fontSize: 13, color: T.muted, margin: "7px 0 0 16px" }}>
                  {fr ? "Aucune raison donn\u00e9e." : "No reason given."}
                </p>
              )}
            </div>
          );
        })}

        {/* One decline ends it for everyone. Saying so here stops the sender
            waiting on people who can no longer usefully sign. */}
        {rows.some((r) => r.declined_at) && (
          <div style={{ ...cell, background: T.dangerSoft }}>
            <span style={{ fontSize: 13, color: T.dangerText, lineHeight: 1.5 }}>
              {fr
                ? "Ce document ne peut plus \u00eatre compl\u00e9t\u00e9. Les autres signataires ne peuvent plus signer."
                : "This document can no longer be completed. The remaining signers cannot sign."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}