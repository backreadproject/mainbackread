"use client";
import { useState } from "react";
import SignaturePad, { type Captured } from "./SignaturePad";

// The signing panel.
//
// Everything a signer needs in one place: how they sign, who they are, and the
// option to refuse. Refusing is deliberately present rather than hidden -- a
// signer with no way to say no either signs under pressure or vanishes, and
// vanishing leaves the sender guessing.
//
// The email is REQUIRED in both modes. When the document was emailed we show
// the address it went to, which is the sender's assertion of who this is, and
// the signer confirming it is theirs is the confirming act. When it arrived as
// a link there is nothing to show and the field simply has to be filled.
export type SignerState = {
  name: string;
  sentToEmail: string | null;
  alreadySigned: { name: string; at: string }[];
  awaiting: number;
};

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
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

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

  const box = { background: "#fff", border: "1px solid #C8CFD8", borderRadius: 8, padding: 22, marginBottom: 16 } as const;
  const input = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #E4E7EC", borderRadius: 6,
    padding: "9px 11px", fontSize: 13.5, background: "#fff", color: "#101828" } as const;

  if (declining) {
    return (
      <div style={box}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#101828", marginBottom: 4 }}>Decline to sign</div>
        <p style={{ fontSize: 13, color: "#667085", margin: "0 0 14px", lineHeight: 1.55 }}>
          The sender will be told. You can say why, and they will see it.
        </p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500}
          placeholder="Optional"
          style={{ ...input, resize: "vertical", lineHeight: 1.5, marginBottom: 14 }} />
        {err && <p style={{ fontSize: 13, color: "#B42318", margin: "0 0 12px" }}>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setDeclining(false); setErr(""); }} disabled={busy}
            style={{ height: 34, padding: "0 14px", background: "#fff", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13.5, fontWeight: 500, color: "#101828", cursor: "pointer", fontFamily: "inherit" }}>Back</button>
          <button onClick={decline} disabled={busy}
            style={{ height: 34, padding: "0 16px", background: "#B42318", color: "#fff", border: "none", borderRadius: 6, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Saving..." : "Decline"}
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

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={sign} disabled={busy}
          style={{ height: 34, padding: "0 18px", background: "#1F6F4A", color: "#fff", border: "none", borderRadius: 6, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Signing..." : "Sign"}
        </button>
        <button onClick={() => setDeclining(true)} disabled={busy}
          style={{ background: "none", border: "none", padding: 0, fontSize: 13, color: "#667085", cursor: "pointer", borderBottom: "1px solid #E4E7EC", fontFamily: "inherit" }}>
          Decline to sign
        </button>
      </div>
    </div>
  );
}