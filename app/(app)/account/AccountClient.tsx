"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#1A1D21", PAPER = "#F7F6F3", SURFACE = "#FFFFFF", MARK = "#C4442E", GRAPHITE = "#8A8778", RULE = "#E4E2DB";
const AEON = "'Aeonik', Arial, sans-serif";

export default function AccountClient({ email }: { email: string }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword() {
    if (pw.length < 6) { setMsg("Use at least 6 characters."); return; }
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? error.message : "Password updated.");
    setPw("");
    setBusy(false);
  }

  const mono = { fontFamily: AEON, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: GRAPHITE };
  const card = { background: SURFACE, border: `1px solid ${RULE}`, borderRadius: 4, padding: 24, marginBottom: 20 };

  return (
    <div style={{ fontFamily: AEON, color: INK }}>
      <style>{`.br-in3{outline:none;transition:border-color .15s}.br-in3:focus{border-color:${INK}}
        .br-b{transition:opacity .15s,transform .1s;cursor:pointer}.br-b:hover{opacity:.82}.br-b:active{transform:translateY(1px)}`}</style>

      <header style={{ borderBottom: `1px solid ${RULE}`, padding: "22px 40px" }}>
        <h1 style={{ fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", margin: 0 }}>Account</h1>
      </header>

      <main style={{ maxWidth: 560, padding: "32px 40px" }}>
        <div style={card}>
          <div style={{ ...mono, marginBottom: 6 }}>Email</div>
          <p style={{ fontSize: 16, margin: 0 }}>{email}</p>
        </div>

        <div style={card}>
          <div style={{ ...mono, marginBottom: 10 }}>Change password</div>
          <input className="br-in3" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password"
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${RULE}`, borderRadius: 2, padding: "10px 12px", fontSize: 15, fontFamily: AEON, background: "#fff", marginBottom: 12 }} />
          <button onClick={changePassword} disabled={busy || !pw} className="br-b"
            style={{ background: INK, color: PAPER, border: "none", borderRadius: 2, padding: "10px 16px", fontSize: 14, fontWeight: 500, fontFamily: AEON, opacity: busy || !pw ? 0.45 : 1 }}>
            {busy ? "Updating…" : "Update password"}
          </button>
          {msg && <p style={{ fontSize: 13, color: msg === "Password updated." ? INK : MARK, marginTop: 12 }}>{msg}</p>}
        </div>

        <div style={{ ...card, borderColor: "#E8CFCA" }}>
          <div style={{ ...mono, color: MARK, marginBottom: 6 }}>Delete account</div>
          <p style={{ fontSize: 14, color: GRAPHITE, margin: "0 0 12px", lineHeight: 1.5 }}>
            This removes your account and every document, link, and signal tied to it. It can't be undone.
          </p>
          <p style={{ fontSize: 13, color: GRAPHITE, margin: 0 }}>
            To delete your account, email support from your account address. Self-serve deletion is coming in a later build.
          </p>
        </div>
      </main>
    </div>
  );
}
