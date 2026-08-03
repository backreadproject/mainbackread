"use client";
import { useState } from "react";
import SignaturePad, { type Captured } from "./SignaturePad";

// The signing panel.
//
// Three ways out, not two. Decline used to carry both "I will not sign this"
// and "not yet, I have a problem", which are different acts with different
// consequences -- and collapsing them meant the sender could not tell which had
// happened. Now decline is genuinely terminal and a concern is a conversation.
//
// The email is REQUIRED in both modes. When the document was emailed we show the
// address it went to, which is the sender's assertion of who this is, and the
// signer confirming it is theirs is the confirming act. When it arrived as a
// link there is nothing to show and the field simply has to be filled.
export type SignerState = {
  name: string;
  sentToEmail: string | null;
  alreadySigned: { name: string; at: string }[];
  awaiting: number;
};

const MIN_CONCERN = 10;

export default function SigningPanel({
  token, state, onSigned, onDeclined,
}: {
  token: string;
  state: SignerState;
  onSigned: () => void;
  onDeclined: () => void;
}) {
  const [sig, setSig] = useState<Captured | null>(null);
  const [email, setEmail] = useState(state.sentToEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState<"sign" | "decline" | "concern">("sign");
  const [reason, setReason] = useState("");
  const [concern, setConcern] = useState("");
  const [raised, setRaised] = useState(false);

  const others = state.alreadySigned.filter((s) => s.name);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/sign", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, ...body }),
    });
    const raw = await res.text();
    let json: { error?: string } = {};
    try { json = JSON.parse(raw); } catch { throw new Error("Server returned " + res.status + "."); }
    if (!res.ok) throw new Error(json.error ?? "Could not save that.");
  }

  async function sign() {
    if (!sig) { setErr("Add your signature first."); return; }
    const clean = email.trim();
    if (!clean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setErr("Enter the email address you want on the record.");
      return;
    }
    setBusy(true); setErr("");
    try {
      await post({ action: "sign", kind: sig.kind, data: sig.data, email: clean });
      onSigned();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not sign.");
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true); setErr("");
    try {
      await post({ action: "decline", reason: reason.trim().slice(0, 500) });
      onDeclined();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save that.");
      setBusy(false);
    }
  }

  async function raise() {
    const text = concern.trim();
    if (text.length < MIN_CONCERN) { setErr("Tell the sender what the problem is."); return; }
    setBusy(true); setErr("");
    try {
      await post({ action: "concern", body: text });
      // Back to the signing form, not out of it. The whole point is that the
      // signer can still sign once this is answered.
      setRaised(true); setConcern(""); setMode("sign");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send that.");
    } finally { setBusy(false); }
  }

  const box = { background: "#fff", border: "1px solid #C8CFD8", borderRadius: 8, padding: 22, marginBottom: 16 } as const;
  const input = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #E4E7EC", borderRadius: 6,
    padding: "9px 11px", fontSize: 13.5, background: "#fff", color: "#101828" } as const;
  const cancelBtn = { height: 34, padding: "0 14px", background: "#fff", border: "1px solid #E4E7EC",
    borderRadius: 6, fontSize: 13.5, fontWeight: 500, color: "#101828", cursor: "pointer", fontFamily: "inherit" } as const;
  const quietLink = { background: "none", border: "none", padding: 0, fontSize: 13, color: "#667085",
    cursor: "pointer", borderBottom: "1px solid #E4E7EC", fontFamily: "inherit" } as const;

  if (mode === "decline") {
    return (
      <div style={box}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#101828", marginBottom: 4 }}>Decline to sign</div>
        <p style={{ fontSize: 13, color: "#667085", margin: "0 0 14px", lineHeight: 1.55 }}>
          This ends it. The sender will be told, and nobody else will be able to sign this document.
          If you only need something changed or explained, raise a concern instead.
        </p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500}
          placeholder="Optional" style={{ ...input, resize: "vertical", lineHeight: 1.5, marginBottom: 14 }} />
        {err && <p style={{ fontSize: 13, color: "#B42318", margin: "0 0 12px" }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => { setMode("sign"); setErr(""); }} disabled={busy} style={cancelBtn}>Cancel</button>
          <button onClick={decline} disabled={busy}
            style={{ height: 34, padding: "0 16px", background: "#B42318", color: "#fff", border: "none", borderRadius: 6, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            {busy ? "Saving..." : "Decline"}
          </button>
          <button onClick={() => { setMode("concern"); setErr(""); }} disabled={busy} style={{ ...quietLink, marginLeft: "auto" }}>
            Raise a concern instead
          </button>
        </div>
      </div>
    );
  }

  if (mode === "concern") {
    return (
      <div style={box}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#101828", marginBottom: 4 }}>Raise a concern</div>
        <p style={{ fontSize: 13, color: "#667085", margin: "0 0 14px", lineHeight: 1.55 }}>
          Tell the sender what needs changing or explaining. Nothing is signed and nothing is refused.
          You can still sign once they have come back to you.
        </p>
        <textarea value={concern} onChange={(e) => setConcern(e.target.value)} rows={4} maxLength={2000}
          placeholder="What is the problem?" style={{ ...input, resize: "vertical", lineHeight: 1.5, marginBottom: 14 }} />
        {err && <p style={{ fontSize: 13, color: "#B42318", margin: "0 0 12px" }}>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setMode("sign"); setErr(""); }} disabled={busy} style={cancelBtn}>Cancel</button>
          <button onClick={raise} disabled={busy}
            style={{ height: 34, padding: "0 16px", background: "#B54708", color: "#fff", border: "none", borderRadius: 6, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            {busy ? "Sending..." : "Send to the sender"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#101828", marginBottom: 4 }}>Sign this document</div>
      <p style={{ fontSize: 13, color: "#667085", margin: "0 0 16px", lineHeight: 1.55 }}>
        You are signing as {state.name}.
        {others.length > 0 && " " + others.map((s) => s.name).join(" and ") + (others.length === 1 ? " has" : " have") + " already signed."}
      </p>

      {raised && (
        <p style={{ fontSize: 13, color: "#B54708", background: "#FFFAEB", border: "1px solid #FEDF89",
                    borderRadius: 6, padding: "10px 12px", margin: "0 0 16px", lineHeight: 1.55 }}>
          Your concern has been sent. You can wait for a reply, or sign now if you are happy to.
        </p>
      )}

      <SignaturePad name={state.name} value={sig} onChange={setSig}
        labels={{
          type: "Type it", draw: "Draw it", upload: "Upload an image", clear: "Clear",
          drawHint: "Use your mouse or finger", uploadHint: "Choose a PNG or JPEG of your signature",
        }} />

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12.5, color: "#667085", marginBottom: 6 }}>Your email address</div>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com" style={input} />
        <div style={{ fontSize: 12, color: "#98A2B3", marginTop: 6, lineHeight: 1.55 }}>
          {state.sentToEmail
            ? `This document was sent to ${state.sentToEmail}. Confirming your address is how you tell us it is you signing.`
            : "Required. This is how you tell us it is you signing."}
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#667085", lineHeight: 1.6, margin: "16px 0" }}>
        By signing you agree to be bound by this document. We record your name, email address, the date and your IP address.
      </p>

      {err && <p style={{ fontSize: 13, color: "#B42318", margin: "0 0 12px" }}>{err}</p>}

      {/* Three options, weighted. Sign is the action; the other two are quiet
          links, with the concern first because it is the lighter of the two and
          the one most people actually need. A signer whose only exit is refusal
          either signs under pressure or vanishes. */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button onClick={sign} disabled={busy}
          style={{ height: 34, padding: "0 18px", background: "#1F6F4A", color: "#fff", border: "none", borderRadius: 6, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          {busy ? "Signing..." : "Sign"}
        </button>
        <button onClick={() => { setMode("concern"); setErr(""); }} disabled={busy} style={quietLink}>
          Raise a concern
        </button>
        <button onClick={() => { setMode("decline"); setErr(""); }} disabled={busy} style={quietLink}>
          Decline to sign
        </button>
      </div>
    </div>
  );
}