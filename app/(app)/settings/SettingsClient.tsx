"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const INK = "#0A0E17", CARD = "#FFFFFF", BLUE = "#1D4ED8", SLATE = "#475569", LINE = "#E7EBF2", GREEN = "#059669";
const INTER = "var(--font-geist-sans), system-ui, sans-serif";
const SHADOW = "0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

export default function SettingsClient({ initialWorkspace, email }: { initialWorkspace: string; email: string }) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Your session expired. Sign in again."); setBusy(false); return; }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, workspace_name: workspace.trim() || null, updated_at: new Date().toISOString() });
    setMsg(error ? error.message : "Saved.");
    setBusy(false);
  }

  const label = { fontSize: 13, fontWeight: 400, color: SLATE, marginBottom: 8, display: "block" };
  const card = { background: CARD, borderRadius: 14, padding: 24, marginBottom: 18, boxShadow: SHADOW };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${LINE}`, borderRadius: 10, padding: "11px 13px", fontSize: 15, fontFamily: INTER, background: "#fff", outline: "none", marginBottom: 12 };

  return (
    <div style={{ fontFamily: INTER, color: INK, minHeight: "100vh" }}>
      <style>{`.fx-in:focus{border-color:${BLUE}}.fx-b{transition:box-shadow .15s,transform .1s;cursor:pointer}.fx-b:hover{box-shadow:0 6px 18px rgba(45,107,255,0.28)}.fx-b:active{transform:translateY(1px)}`}</style>
      <main style={{ maxWidth: 520, padding: "28px 36px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 24px" }}>Settings</h1>

        <div style={card}>
          <span style={label}>Workspace name</span>
          <p style={{ fontSize: 13, color: SLATE, margin: "0 0 12px", lineHeight: 1.5 }}>Shown across your dashboard. Just for you — readers never see it.</p>
          <input className="fx-in" value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="Acme Inc." style={input} />
          <button onClick={save} disabled={busy} className="fx-b" style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 400, fontFamily: INTER, opacity: busy ? 0.5 : 1 }}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          {msg && <p style={{ fontSize: 13, color: msg === "Saved." ? GREEN : "#DC2626", marginTop: 12 }}>{msg}</p>}
        </div>

        <div style={card}>
          <span style={label}>Signed in as</span>
          <p style={{ fontSize: 15, margin: 0 }}>{email}</p>
          <p style={{ fontSize: 13, color: SLATE, margin: "8px 0 0" }}>Manage your password on the <a href="/account" style={{ color: BLUE, textDecoration: "none" }}>Account</a> page.</p>
        </div>
      </main>
    </div>
  );
}
