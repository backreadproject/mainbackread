"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, pageHeading } from "@/lib/theme";
export default function AccountClient({ email }: { email: string }) {
  const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(""); const [delBusy, setDelBusy] = useState(false); const [delMsg, setDelMsg] = useState("");
  const canDelete = confirm.trim().toLowerCase() === "delete";
  async function changePassword() { if (pw.length < 6) { setMsg("Use at least 6 characters."); return; } setBusy(true); setMsg(""); const supabase = createClient(); const { error } = await supabase.auth.updateUser({ password: pw }); setMsg(error ? error.message : "Password updated."); setPw(""); setBusy(false); }
  async function deleteAccount() { if (!canDelete) return; setDelBusy(true); setDelMsg(""); const res = await fetch("/api/delete-account", { method: "POST" }); const json = await res.json(); if (!res.ok) { setDelMsg(json.error ?? "Couldn't delete."); setDelBusy(false); return; } const supabase = createClient(); await supabase.auth.signOut(); window.location.href = "/login"; }
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 8, display: "block" };
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 22, marginBottom: 16 };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-in-d:focus{border-color:#B42318;outline:none}.t-b{cursor:pointer}`}</style>
      <main style={{ maxWidth: 560, padding: "26px 30px" }}>
        <h1 style={{ ...pageHeading, marginBottom: 20 }}>Account</h1>
        <div style={card}><span style={label}>Email</span><p style={{ fontSize: 16, color: T.heading, margin: 0 }}>{email}</p></div>
        <div style={card}>
          <span style={label}>Change password</span>
          <input className="t-in" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" style={input} />
          <button onClick={changePassword} disabled={busy || !pw} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, opacity: busy || !pw ? 0.45 : 1 }}>{busy ? "Updating…" : "Update password"}</button>
          {msg && <p style={{ fontSize: 13, color: msg === "Password updated." ? T.greenText : "#B42318", marginTop: 12 }}>{msg}</p>}
        </div>
        <div style={{ ...card, border: "1px solid #FDA29B" }}>
          <span style={{ ...label, color: "#B42318" }}>Delete account</span>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 14px", lineHeight: 1.5 }}>This permanently removes your account and every document, link, and signal tied to it. It can't be undone.</p>
          <label style={{ fontSize: 13, color: T.body, display: "block", marginBottom: 6 }}>Type <span style={{ fontWeight: 600, color: "#B42318" }}>delete</span> to confirm</label>
          <input className="t-in-d" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="delete" style={{ ...input, borderColor: canDelete ? "#B42318" : T.border }} />
          <button onClick={deleteAccount} disabled={!canDelete || delBusy} className="t-b" style={{ background: canDelete ? "#D92D20" : T.pillNeutralBg, color: canDelete ? "#fff" : T.body, border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: canDelete ? "pointer" : "default", opacity: delBusy ? 0.6 : 1 }}>{delBusy ? "Deleting…" : "Delete my account"}</button>
          {delMsg && <p style={{ fontSize: 13, color: "#B42318", marginTop: 12 }}>{delMsg}</p>}
        </div>
      </main>
    </div>
  );
}
