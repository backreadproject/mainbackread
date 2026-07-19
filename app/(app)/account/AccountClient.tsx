"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, pageHeading } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
export default function AccountClient({ email, firstName: initialFirst = "", lastName: initialLast = "", avatarUrl: initialAvatar = null }: { email: string; firstName?: string; lastName?: string; avatarUrl?: string | null }) {
  const locale = useLocale();
  const ac = getDict(locale).accountPage;
  const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [msgOk, setMsgOk] = useState(false); const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(""); const [delBusy, setDelBusy] = useState(false); const [delMsg, setDelMsg] = useState("");
  const [firstName, setFirstName] = useState(initialFirst); const [lastName, setLastName] = useState(initialLast);
  const [nameMsg, setNameMsg] = useState(""); const [nameOk, setNameOk] = useState(false); const [nameBusy, setNameBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [avatarBusy, setAvatarBusy] = useState(false); const [avatarMsg, setAvatarMsg] = useState(""); const [avatarOk, setAvatarOk] = useState(false);
  const initials = `${(initialFirst[0] ?? "").toUpperCase()}${(initialLast[0] ?? "").toUpperCase()}` || (email[0] ?? "?").toUpperCase();

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarOk(false); setAvatarMsg(ac.chooseImage); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarOk(false); setAvatarMsg(ac.imageUnder2mb); return; }
    setAvatarBusy(true); setAvatarMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAvatarOk(false); setAvatarMsg(ac.sessionExpired); setAvatarBusy(false); return; }
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setAvatarOk(false); setAvatarMsg(ac.uploadFailed + upErr.message); setAvatarBusy(false); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: url, updated_at: new Date().toISOString() });
    setAvatarUrl(url); setAvatarOk(true); setAvatarMsg(ac.photoUpdated); setAvatarBusy(false);
  }
  const needsName = !initialFirst || !initialLast;
  const canDelete = confirm.trim().toLowerCase() === "delete";
  async function saveName() {
    if (!firstName.trim() || !lastName.trim()) { setNameOk(false); setNameMsg(ac.nameRequired); return; }
    setNameBusy(true); setNameMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNameOk(false); setNameMsg(ac.sessionExpired); setNameBusy(false); return; }
    await supabase.auth.updateUser({ data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName.trim()} ${lastName.trim()}` } });
    const { error } = await supabase.from("profiles").upsert({ id: user.id, first_name: firstName.trim(), last_name: lastName.trim(), updated_at: new Date().toISOString() });
    // Also update the org membership email row's display if present is not needed; name lives on profile.
    setNameOk(!error); setNameMsg(error ? error.message : ac.nameSaved);
    setNameBusy(false);
  }
  async function changePassword() { if (pw.length < 6) { setMsgOk(false); setMsg(ac.passwordTooShort); return; } setBusy(true); setMsg(""); const supabase = createClient(); const { error } = await supabase.auth.updateUser({ password: pw }); setMsgOk(!error); setMsg(error ? error.message : ac.passwordUpdated); setPw(""); setBusy(false); }
  async function deleteAccount() { if (!canDelete) return; setDelBusy(true); setDelMsg(""); const res = await fetch("/api/delete-account", { method: "POST" }); const json = await res.json(); if (!res.ok) { setDelMsg(json.error ?? ac.couldntDelete); setDelBusy(false); return; } const supabase = createClient(); await supabase.auth.signOut(); window.location.href = "/login"; }
  const label = { fontSize: 13, fontWeight: 600, color: T.heading, marginBottom: 8, display: "block" };
  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 22, marginBottom: 16 };
  const input = { width: "100%", boxSizing: "border-box" as const, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 12px", fontSize: 15, fontFamily: T.font, background: "#fff", marginBottom: 12 };
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{border-color:${T.green};outline:none}.t-in-d:focus{border-color:#B42318;outline:none}.t-b{cursor:pointer}`}</style>
      <main style={{ maxWidth: 560, padding: "26px 30px" }}>
        <h1 style={{ ...pageHeading, marginBottom: 20 }}>{ac.title}</h1>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
          </div>
          <div style={{ flex: 1 }}>
            <span style={label}>{ac.profilePhoto}</span>
            <label className="t-b" style={{ display: "inline-block", background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.rBtn, padding: "8px 14px", fontSize: 14, fontWeight: 600, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={avatarBusy} style={{ display: "none" }} />
              {avatarBusy ? ac.uploading : avatarUrl ? ac.changePhoto : ac.uploadPhoto}
            </label>
            {avatarMsg && <p style={{ fontSize: 13, color: avatarOk ? T.greenText : "#B42318", margin: "10px 0 0" }}>{avatarMsg}</p>}
          </div>
        </div>
        <div style={card}><span style={label}>{ac.email}</span><p style={{ fontSize: 16, color: T.heading, margin: 0 }}>{email}</p></div>
        <div style={{ ...card, ...(needsName ? { border: `1px solid ${T.green}`, background: T.greenSoft } : {}) }}>
          <span style={label}>{ac.yourName}</span>
          {needsName && <p style={{ fontSize: 13, color: T.greenText, margin: "0 0 12px", lineHeight: 1.5 }}>{ac.nameNudge}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <input className="t-in" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={ac.firstName} style={{ ...input, flex: 1 }} />
            <input className="t-in" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={ac.lastName} style={{ ...input, flex: 1 }} />
          </div>
          <button onClick={saveName} disabled={nameBusy || !firstName.trim() || !lastName.trim()} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, opacity: nameBusy || !firstName.trim() || !lastName.trim() ? 0.45 : 1 }}>{nameBusy ? ac.saving : ac.saveName}</button>
          {nameMsg && <p style={{ fontSize: 13, color: nameOk ? T.greenText : "#B42318", marginTop: 12 }}>{nameMsg}</p>}
        </div>
        <div style={card}>
          <span style={label}>{ac.changePassword}</span>
          <input className="t-in" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={ac.newPassword} style={input} />
          <button onClick={changePassword} disabled={busy || !pw} className="t-b" style={{ background: T.green, color: "#fff", border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, opacity: busy || !pw ? 0.45 : 1 }}>{busy ? ac.updating : ac.updatePassword}</button>
          {msg && <p style={{ fontSize: 13, color: msgOk ? T.greenText : "#B42318", marginTop: 12 }}>{msg}</p>}
        </div>
        <div style={{ ...card, border: "1px solid #FDA29B" }}>
          <span style={{ ...label, color: "#B42318" }}>{ac.deleteAccount}</span>
          <p style={{ fontSize: 14, color: T.body, margin: "0 0 14px", lineHeight: 1.5 }}>{ac.deleteBody}</p>
          <label style={{ fontSize: 13, color: T.body, display: "block", marginBottom: 6 }}>{ac.typeToConfirmA}<span style={{ fontWeight: 600, color: "#B42318" }}>{ac.deleteWord}</span>{ac.typeToConfirmB}</label>
          <input className="t-in-d" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={ac.deleteWord} style={{ ...input, borderColor: canDelete ? "#B42318" : T.border }} />
          <button onClick={deleteAccount} disabled={!canDelete || delBusy} className="t-b" style={{ background: canDelete ? "#D92D20" : T.pillNeutralBg, color: canDelete ? "#fff" : T.body, border: "none", borderRadius: T.rBtn, padding: "10px 16px", fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: canDelete ? "pointer" : "default", opacity: delBusy ? 0.6 : 1 }}>{delBusy ? ac.deleting : ac.deleteMyAccount}</button>
          {delMsg && <p style={{ fontSize: 13, color: "#B42318", marginTop: 12 }}>{delMsg}</p>}
        </div>
      </main>
    </div>
  );
}
