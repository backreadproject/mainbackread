"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#0B1220", CARD = "#FFFFFF", BLUE = "#2D6BFF", SLATE = "#64748B", LINE = "#E7EBF2", RED = "#DC2626", RED_BG = "#FEF2F2", GREEN = "#059669";
const INTER = "'Moderat', 'Inter', sans-serif";
const SHADOW = "0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

export default function AccountClient({ email }: { email: string }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [confirm, setConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState("");
  const canDelete = confirm.trim().toLowerCase() === "delete";

  async function changePassword() {
    if (pw.length < 6) { setMsg("Use at least 6 characters."); return; }
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? error.message : "Password updated.");
    setPw(""); setBusy(false);
  }

  async function deleteAccount() {
    if (!canDelete) return;
    setDelBusy(true); setDelMsg("");
    const res = await fetch("/api/delete-account", { method: "POST" });
    const json = await res.json();
    if (!res.ok) { setDelMsg(json.error ?? "Couldn't delete your account."); setDelBusy(false); return; }
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const label = { fontSize: 13, fontWeight: 500, color: SLATE, marginBottom: 8, display: "block" };
  const card = { background: CARD, borderRadius: 14, padding: 24, marginBottom: 18, boxShadow: SHADOW };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px", fontSize: 15, fontFamily: INTER, background: "#fff", outline: "none", marginBottom: 12 };

  return (
    <div style={{ fontFamily: INTER, color: INK, minHeight: "100vh" }}>
      <style>{`.fx-in:focus{border-color:${BLUE}}.fx-in-d:focus{border-color:${RED}}.fx-b{transition:box-shadow .15s,transform .1s;cursor:pointer}.fx-b:hover{box-shadow:0 6px 18px rgba(45,107,255,0.28)}.fx-b:active{transform:translateY(1px)}`}</style>
      <main style={{ maxWidth: 580, padding: "40px 40px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", margin: "0 0 24px" }}>Account</h1>

        <div style={card}>
          <span style={label}>Email</span>
          <p style={{ fontSize: 16, margin: 0 }}>{email}</p>
        </div>

        <div style={card}>
          <span style={label}>Change password</span>
          <input className="fx-in" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" style={input} />
          <button onClick={changePassword} disabled={busy || !pw} className="fx-b" style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 500, fontFamily: INTER, opacity: busy || !pw ? 0.45 : 1 }}>
            {busy ? "Updating…" : "Update password"}
          </button>
          {msg && <p style={{ fontSize: 13, color: msg === "Password updated." ? GREEN : RED, marginTop: 12 }}>{msg}</p>}
        </div>

        <div style={{ ...card, border: "1px solid #FBE3E3" }}>
          <span style={{ ...label, color: RED }}>Delete account</span>
          <p style={{ fontSize: 14, color: SLATE, margin: "0 0 14px", lineHeight: 1.5 }}>
            This permanently removes your account and every document, link, and signal tied to it. It can't be undone.
          </p>
          <label style={{ fontSize: 13, color: SLATE, display: "block", marginBottom: 6 }}>Type <span style={{ fontWeight: 500, color: RED }}>delete</span> to confirm</label>
          <input className="fx-in-d" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="delete"
            style={{ ...input, marginBottom: 12, borderColor: canDelete ? RED : LINE }} />
          <button onClick={deleteAccount} disabled={!canDelete || delBusy} className="fx-b"
            style={{ background: canDelete ? RED : "#F1F5F9", color: canDelete ? "#fff" : SLATE, border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 500, fontFamily: INTER, cursor: canDelete ? "pointer" : "default", opacity: delBusy ? 0.6 : 1 }}>
            {delBusy ? "Deleting…" : "Delete my account"}
          </button>
          {delMsg && <p style={{ fontSize: 13, color: RED, marginTop: 12 }}>{delMsg}</p>}
        </div>
      </main>
    </div>
  );
}
