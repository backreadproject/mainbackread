"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, pageHeading } from "@/lib/theme";
export default function AccountClient({ email, firstName: initialFirst = "", lastName: initialLast = "", avatarUrl: initialAvatar = null }: { email: string; firstName?: string; lastName?: string; avatarUrl?: string | null }) {
  const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(""); const [delBusy, setDelBusy] = useState(false); const [delMsg, setDelMsg] = useState("");
  const [firstName, setFirstName] = useState(initialFirst); const [lastName, setLastName] = useState(initialLast);
  const [nameMsg, setNameMsg] = useState(""); const [nameBusy, setNameBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [avatarBusy, setAvatarBusy] = useState(false); const [avatarMsg, setAvatarMsg] = useState("");
  const initials = `${(initialFirst[0] ?? "").toUpperCase()}${(initialLast[0] ?? "").toUpperCase()}` || (email[0] ?? "?").toUpperCase();

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarMsg("Choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarMsg("Image must be under 2MB."); return; }
    setAvatarBusy(true); setAvatarMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAvatarMsg("Session expired."); setAvatarBusy(false); return; }
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setAvatarMsg("Upload failed. " + upErr.message); setAvatarBusy(false); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: url, updated_at: new Date().toISOString() });
    setAvatarUrl(url); setAvatarMsg("Photo updated."); setAvatarBusy(false);
  }
  const needsName = !initialFirst || !initialLast;
  const canDelete = confirm.trim().toLowerCase() === "delete";
  async function saveName() {
    if (!firstName.trim() || !lastName.trim()) { setNameMsg("First and last name are required."); return; }
    setNameBusy(true); setNameMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNameMsg("Session expired."); setNameBusy(false); return; }
    await supabase.auth.updateUser({ data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName.trim()} ${lastName.trim()}` } });
    const { error } = await supabase.from("profiles").upsert({ id: user.id, first_name: firstName.trim(), last_name: lastName.trim(), updated_at: new Date().toISOString() });
    // Also update the org membership email row's display if present is not needed; name lives on profile.
    setNameMsg(error ? error.message : "Name saved.");
    setNameBusy(false);
  }
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
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
          </div>
          <div style={{ flex: 1 }}>
            <span style={label}>Profile photo</span>
            <label className="t-b" style={{ display: "inline-block", background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "8px 14px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={avatarBusy} style={{ display: "none" }} />
              {avatarBusy ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
            </label>
            {avatarMsg && <p style={{ fontSize: 13, color: avatarMsg === "Photo updated." ? T.greenText : "#B42318", margin: "10px 0 0" }}>{avatarMsg}</p>}
          </div>
        </div>
        <div style={card}><span style={label}>Email</span><p style={{ fontSize: 16, color: T.heading, margin: 0 }}>{email}</p></div>
        <div style={{ ...card, ...(needsName ? { border: `1px solid ${T.green}`, background: T.greenSoft } : {}) }}>
          <span style={label}>Your name</span>
          {needsName && <p style={{ fontSize: 13, color: T.greenText, margin: "0 0 12px", lineHeight: 1.5 }}>Add your name so teammates and prospects see who shared a document, not just your email.</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <input className="t-in" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={{ ...input, flex: 1 }} />
            <input className="t-in" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={{ ...input, flex: 1 }} />
          </div>
          <button onClick={saveName} disabled={nameBusy || !firstName.trim() || !lastName.trim()} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, opacity: nameBusy || !firstName.trim() || !lastName.trim() ? 0.45 : 1 }}>{nameBusy ? "Saving…" : "Save name"}</button>
          {nameMsg && <p style={{ fontSize: 13, color: nameMsg === "Name saved." ? T.greenText : "#B42318", marginTop: 12 }}>{nameMsg}</p>}
        </div>
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
