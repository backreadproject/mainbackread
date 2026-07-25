"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import { postJson, errMsg } from "@/lib/fetch-json";
export default function AccountClient({ email, firstName: initialFirst = "", lastName: initialLast = "", avatarUrl: initialAvatar = null }: { email: string; firstName?: string; lastName?: string; avatarUrl?: string | null }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const ac = getDict(locale).accountPage;
  const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [msgOk, setMsgOk] = useState(false); const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(""); const [delBusy, setDelBusy] = useState(false); const [delMsg, setDelMsg] = useState("");
  const [firstName, setFirstName] = useState(initialFirst); const [lastName, setLastName] = useState(initialLast);
  const [nameMsg, setNameMsg] = useState(""); const [nameOk, setNameOk] = useState(false); const [nameBusy, setNameBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [avatarBusy, setAvatarBusy] = useState(false); const [avatarMsg, setAvatarMsg] = useState(""); const [avatarOk, setAvatarOk] = useState(false);
  const initials = ((initialFirst[0] ?? "").toUpperCase() + (initialLast[0] ?? "").toUpperCase()) || (email[0] ?? "?").toUpperCase();
  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarOk(false); setAvatarMsg(ac.chooseImage); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarOk(false); setAvatarMsg(ac.imageUnder2mb); return; }
    setAvatarBusy(true); setAvatarMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAvatarOk(false); setAvatarMsg(ac.sessionExpired); setAvatarBusy(false); return; }
    const ext = file.name.split(".").pop() || "png";
    const path = user.id + "/avatar." + ext;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setAvatarOk(false); setAvatarMsg(ac.uploadFailed + upErr.message); setAvatarBusy(false); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl + "?t=" + Date.now();
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
    await supabase.auth.updateUser({ data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: firstName.trim() + " " + lastName.trim() } });
    const { error } = await supabase.from("profiles").upsert({ id: user.id, first_name: firstName.trim(), last_name: lastName.trim(), updated_at: new Date().toISOString() });
    setNameOk(!error); setNameMsg(error ? error.message : ac.nameSaved);
    setNameBusy(false);
  }
  async function changePassword() { if (pw.length < 6) { setMsgOk(false); setMsg(ac.passwordTooShort); return; } setBusy(true); setMsg(""); const supabase = createClient(); const { error } = await supabase.auth.updateUser({ password: pw }); setMsgOk(!error); setMsg(error ? error.message : ac.passwordUpdated); setPw(""); setBusy(false); }
  async function deleteAccount() {
    if (!canDelete) return;
    setDelBusy(true); setDelMsg("");
    try {
      await postJson("/api/delete-account", {});
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e) {
      setDelMsg(errMsg(e, ac.couldntDelete));
      setDelBusy(false);
    }
  }
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow, marginBottom: 14 };
  const head = { padding: "10px 18px", background: T.soft, borderBottom: "1px solid " + T.border, borderTopLeftRadius: T.rCard, borderTopRightRadius: T.rCard, fontSize: 12.5, fontWeight: 600, color: T.body };
  const body = { padding: 18 };
  const input = { width: "100%", height: 34, boxSizing: "border-box" as const, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font, background: T.card, color: T.heading, marginBottom: 12 };
  const btn = { height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer" };  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <style>{`.t-in:focus{outline:none;border-color:var(--rp-green)}.t-in-d:focus{outline:none;border-color:var(--rp-danger)}`}</style>
      <main className="set-grid" style={{ maxWidth: 1040, padding: "34px 28px 120px" }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: 0, lineHeight: 1.2 }}>{ac.title}</h1>
          <p style={{ fontSize: 14, color: T.muted, margin: "7px 0 0" }}>{fr ? "Votre profil, votre mot de passe et votre compte." : "Your profile, your password and your account."}</p>
        </div>

        <div style={card}>
          <div style={head}>{ac.profilePhoto}</div>
          <div style={{ ...body, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: T.rCard, border: "1px solid " + T.border, background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, flexShrink: 0, overflow: "hidden" }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ display: "inline-flex", alignItems: "center", height: 34, background: T.card, border: "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, color: T.heading, cursor: "pointer" }}>
                <input type="file" accept="image/*" onChange={uploadAvatar} disabled={avatarBusy} style={{ display: "none" }} />
                {avatarBusy ? ac.uploading : avatarUrl ? ac.changePhoto : ac.uploadPhoto}
              </label>
              {avatarMsg && <p style={{ fontSize: 13, color: avatarOk ? T.greenText : T.dangerText, margin: "10px 0 0" }}>{avatarMsg}</p>}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={head}>{ac.email}</div>
          <div style={body}><p style={{ fontSize: 14, color: T.heading, margin: 0 }}>{email}</p></div>
        </div>

        <div style={needsName ? { ...card, borderColor: T.greenBorder } : card}>
          <div style={needsName ? { ...head, background: T.greenSoft, color: T.greenText, borderBottomColor: T.greenBorder } : head}>{ac.yourName}</div>
          <div style={body}>
            {needsName && <p style={{ fontSize: 13.5, color: T.muted, margin: "0 0 12px", lineHeight: 1.55 }}>{ac.nameNudge}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <input className="t-in" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={ac.firstName} style={{ ...input, flex: 1 }} />
              <input className="t-in" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={ac.lastName} style={{ ...input, flex: 1 }} />
            </div>
            <button onClick={saveName} disabled={nameBusy || !firstName.trim() || !lastName.trim()} style={{ ...btn, opacity: nameBusy || !firstName.trim() || !lastName.trim() ? 0.45 : 1 }}>{nameBusy ? ac.saving : ac.saveName}</button>
            {nameMsg && <p style={{ fontSize: 13, color: nameOk ? T.greenText : T.dangerText, margin: "12px 0 0" }}>{nameMsg}</p>}
          </div>
        </div>

        <div style={card}>
          <div style={head}>{ac.changePassword}</div>
          <div style={body}>
            <input className="t-in" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={ac.newPassword} style={input} />
            <button onClick={changePassword} disabled={busy || !pw} style={{ ...btn, opacity: busy || !pw ? 0.45 : 1 }}>{busy ? ac.updating : ac.updatePassword}</button>
            {msg && <p style={{ fontSize: 13, color: msgOk ? T.greenText : T.dangerText, margin: "12px 0 0" }}>{msg}</p>}
          </div>
        </div>

        <div style={{ ...card, border: "1px solid " + T.dangerBorder }}>
          <div style={{ ...head, background: T.dangerSoft, color: T.dangerText, borderBottom: "1px solid " + T.dangerBorder }}>{ac.deleteAccount}</div>
          <div style={body}>
            <p style={{ fontSize: 13.5, color: T.body, margin: "0 0 14px", lineHeight: 1.55 }}>{ac.deleteBody}</p>
            <label style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 }}>{ac.typeToConfirmA}<span style={{ fontWeight: 600, color: T.dangerText }}>{ac.deleteWord}</span>{ac.typeToConfirmB}</label>
            <input className="t-in-d" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={ac.deleteWord} style={{ ...input, borderColor: canDelete ? T.danger : T.border }} />
            <button onClick={deleteAccount} disabled={!canDelete || delBusy} style={{ height: 34, background: canDelete ? T.danger : T.soft, color: canDelete ? T.onAccent : T.faint, border: canDelete ? "none" : "1px solid " + T.border, borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: canDelete ? "pointer" : "default", opacity: delBusy ? 0.6 : 1 }}>{delBusy ? ac.deleting : ac.deleteMyAccount}</button>
            {delMsg && <p style={{ fontSize: 13, color: T.dangerText, margin: "12px 0 0" }}>{delMsg}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}