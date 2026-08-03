"use client";
import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";

// Who has signed, who has not, what the ones who refused said, and what anyone
// has objected to.
//
// The count above says 2 / 2. That is a number, not an answer: it cannot tell
// you who to chase, that someone declined and why, or that a signer asked for a
// change before signing. decline_reason was captured for weeks and displayed
// nowhere, which made the most useful sentence in the feature invisible.
//
// Deliberately NOT a progress bar. Two of three signed is not two thirds of an
// agreement; it is nothing until it is everything.
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

export type Reading = { opens: number; questions: number };

export type Concern = {
  id: string;
  recipientId: string;
  body: string;
  createdAt: string;
  resolvedAt: string | null;
};

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_FR = ["janvier","f\u00e9vrier","mars","avril","mai","juin","juillet","ao\u00fbt","septembre","octobre","novembre","d\u00e9cembre"];

function when(iso: string, fr: boolean): string {
  const d = new Date(iso);
  const m = (fr ? MONTHS_FR : MONTHS_EN)[d.getMonth()];
  return d.getDate() + " " + m + ", " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function SigningProgress({ recipients, reading = {}, concerns = [] }: {
  recipients: SignerRow[];
  reading?: Record<string, Reading>;
  concerns?: Concern[];
}) {
  const fr = useLocale() === "fr";
  const [rows, setRows] = useState<Concern[]>(concerns);
  const [busy, setBusy] = useState("");

  const signers = recipients.filter((r) => r.is_signer);
  if (signers.length === 0) return null;

  async function resolve(id: string, reopen: boolean) {
    setBusy(id);
    try {
      const res = await fetch("/api/concern", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, reopen }),
      });
      if (res.ok) {
        setRows((p) => p.map((x) => (x.id === id ? { ...x, resolvedAt: reopen ? null : new Date().toISOString() } : x)));
      }
    } finally { setBusy(""); }
  }

  // Declined first because it stops the document dead, then anyone with an open
  // concern because that is the only state the sender can act on, then waiting,
  // then signed.
  const openFor = (id: string) => rows.filter((x) => x.recipientId === id && !x.resolvedAt);
  const rank = (r: SignerRow) => (r.declined_at ? 0 : openFor(r.id).length ? 1 : r.signed_at ? 3 : 2);
  const ordered = [...signers].sort((a, b) => rank(a) - rank(b) || (a.label || "").localeCompare(b.label || ""));

  const cell = { padding: "12px 16px", borderTop: "1px solid " + T.borderSoft } as const;
  const quote = { fontSize: 13.5, color: T.heading, lineHeight: 1.55, margin: "9px 0 0 16px", paddingLeft: 12 } as const;
  const act = { background: "none", border: "none", padding: 0, fontSize: 12.5, fontFamily: T.font,
    color: T.greenText, cursor: "pointer", borderBottom: "1px solid " + T.greenBorder } as const;

  return (
    <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, marginBottom: 16 }}>
      <div style={{ padding: "10px 16px", background: T.soft, borderBottom: "1px solid " + T.border,
                    borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard,
                    fontSize: 12.5, fontWeight: 600, color: T.body }}>
        {fr ? "Signataires" : "Signers"}
      </div>

      {ordered.map((r) => {
        const declined = !!r.declined_at;
        const signed = !!r.signed_at && !declined;
        const dead = !signed && !declined && (!!r.revoked_at || (!!r.expires_at && new Date(r.expires_at) < new Date()));
        const since = daysSince(r.sent_at || r.created_at);
        const mine = rows.filter((x) => x.recipientId === r.id);
        const open = mine.filter((x) => !x.resolvedAt);

        const state = declined
          ? { colour: T.danger, text: fr ? "A refus\u00e9" : "Declined", at: r.declined_at as string }
          : signed
          ? { colour: T.green, text: fr ? "Sign\u00e9" : "Signed", at: r.signed_at as string }
          : dead
          ? { colour: T.faint, text: fr ? "Lien ferm\u00e9" : "Link closed", at: null }
          : { colour: open.length ? T.amber : T.amber, text: fr ? "En attente" : "Waiting", at: null };

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
                  {since === 0 ? (fr ? "aujourd\u0027hui" : "since today")
                    : since === 1 ? (fr ? "depuis 1 jour" : "for 1 day")
                    : (fr ? `depuis ${since} jours` : `for ${since} days`)}
                </span>
              )}
              {open.length > 0 && (
                <span style={{ fontSize: 12.5, color: T.amberText }}>
                  {open.length === 1
                    ? (fr ? "1 point soulev\u00e9" : "1 concern raised")
                    : (fr ? `${open.length} points soulev\u00e9s` : `${open.length} concerns raised`)}
                </span>
              )}
            </div>

            {/* Concerns in full, oldest first, never truncated. Someone raising
                one has told you exactly what is wrong. A resolved one stays
                visible but recedes: it is the record that they objected before
                signing, and that is precisely what matters later. */}
            {mine.map((x) => (
              <div key={x.id} style={{ ...quote, borderLeft: "2px solid " + (x.resolvedAt ? T.borderSoft : T.amberBorder),
                                       color: x.resolvedAt ? T.muted : T.heading }}>
                <p style={{ margin: 0 }}>{x.body}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: T.faint }}>{when(x.createdAt, fr)}</span>
                  {x.resolvedAt ? (
                    <>
                      <span style={{ fontSize: 12, color: T.faint }}>{fr ? "R\u00e9solu" : "Resolved"}</span>
                      <button onClick={() => resolve(x.id, true)} disabled={busy === x.id} style={{ ...act, color: T.muted, borderBottomColor: T.border }}>
                        {fr ? "R\u00e9ouvrir" : "Reopen"}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => resolve(x.id, false)} disabled={busy === x.id} style={act}>
                      {busy === x.id ? (fr ? "..." : "...") : (fr ? "Marquer r\u00e9solu" : "Mark resolved")}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {declined && r.decline_reason && (
              <p style={{ ...quote, borderLeft: "2px solid " + T.dangerBorder }}>{r.decline_reason}</p>
            )}
            {declined && !r.decline_reason && (
              <p style={{ fontSize: 13, color: T.muted, margin: "7px 0 0 16px" }}>
                {fr ? "Aucune raison donn\u00e9e." : "No reason given."}
              </p>
            )}

            {/* Reading evidence ONLY against a refusal. Beside a signature it
                would invite judging whether someone read the contract properly
                before signing, which is a question about the validity of their
                consent. Beside a refusal it is the opposite: "never opened it"
                and "forty minutes on the pricing page" are different problems. */}
            {declined && reading[r.id] && (
              <p style={{ fontSize: 12.5, color: T.muted, margin: "7px 0 0 16px" }}>
                {(() => {
                  const rd = reading[r.id];
                  const bits = [
                    rd.opens === 0 ? (fr ? "n\u0027a jamais ouvert le document" : "never opened it")
                      : rd.opens === 1 ? (fr ? "a ouvert le document une fois" : "opened it once")
                      : (fr ? `a ouvert le document ${rd.opens} fois` : `opened it ${rd.opens} times`),
                    rd.questions > 0
                      ? (rd.questions === 1 ? (fr ? "a pos\u00e9 1 question" : "asked 1 question")
                          : (fr ? `a pos\u00e9 ${rd.questions} questions` : `asked ${rd.questions} questions`))
                      : null,
                  ].filter(Boolean);
                  return bits.join(", ") + (fr ? " avant de refuser." : " before declining.");
                })()}
              </p>
            )}
          </div>
        );
      })}

      {ordered.some((r) => r.declined_at) && (
        <div style={{ ...cell, background: T.dangerSoft }}>
          <span style={{ fontSize: 13, color: T.dangerText, lineHeight: 1.5 }}>
            {fr
              ? "Ce document ne peut plus \u00eatre compl\u00e9t\u00e9. Les autres signataires ne peuvent plus signer."
              : "This document can no longer be completed. The remaining signers cannot sign."}
          </span>
        </div>
      )}
    </div>
  );
}