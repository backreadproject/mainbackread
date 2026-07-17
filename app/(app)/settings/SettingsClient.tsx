"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, pageHeading } from "@/lib/theme";
export default function SettingsClient({ initialWorkspace, email }: { initialWorkspace: string; email: string }) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Session expired. Sign in again."); setBusy(false); return; }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, workspace_name: workspace.trim() || null, updated_at: new Date().toISOString() });
    setMsg(error ? error.message : "Saved."); setBusy(false);
  }
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 8, display: "block" };
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 22, marginBottom: 16 };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-b{cursor:pointer}`}</style>
      <main style={{ maxWidth: 560, padding: "26px 30px" }}>
        <h1 style={{ ...pageHeading, marginBottom: 20 }}>Settings</h1>
        <div style={card}>
          <span style={label}>Workspace name</span>
          <p style={{ fontSize: 13, color: T.body, margin: "0 0 12px", lineHeight: 1.5 }}>Shown across your dashboard. Just for you — readers never see it.</p>
          <input className="t-in" value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="Acme Inc." style={input} />
          <button onClick={save} disabled={busy} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, opacity: busy ? 0.5 : 1 }}>{busy ? "Saving…" : "Save changes"}</button>
          {msg && <p style={{ fontSize: 13, color: msg === "Saved." ? T.greenText : "#B42318", marginTop: 12 }}>{msg}</p>}
        </div>
        <div style={card}>
          <span style={label}>Signed in as</span>
          <p style={{ fontSize: 15, color: T.heading, margin: 0 }}>{email}</p>
          <p style={{ fontSize: 13, color: T.body, margin: "8px 0 0" }}>Manage your password on the <a href="/account" style={{ color: T.green, textDecoration: "none", fontWeight: 600 }}>Account</a> page.</p>
        </div>
      </main>
    </div>
  );
}
