"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { roleLabel } from "@/lib/roles";
import RolePicker from "../../RolePicker";

/**
 * Who this reader is, and the only place to fix it after the fact.
 *
 * Readers added before roles existed, added in a hurry, or imported by CSV all
 * arrive with nothing here. This is where that gets corrected, which matters
 * because an unlabelled reader silently widens the "no persona match" bucket
 * and weakens the gap analysis rather than showing up as an error.
 *
 * The link address is edited here too. It is an ALIAS, never a replacement:
 * the original share_token keeps resolving to this same reader forever, so a
 * link already sitting in a prospect's inbox stays live while the sender
 * tidies up how it reads. Clearing the field removes the alias and leaves the
 * token address, which is why there is no confirmation step.
 *
 * Name and email lock once the reader has signed. The certificate already
 * asserts who signed, and the app must not end up disagreeing with a PDF it
 * issued.
 */

export type Identity = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  company: string | null;
  roles: string[];
  roleOther: string | null;
  delivery: string | null;
  createdAt: string;
  shareToken: string;
  customSlug: string | null;
  signedAt: string | null;
  readerOrigin: string;
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

export default function IdentityCard({ recipient }: { recipient: Identity }) {
  const locale = useLocale();
  const fr = locale === "fr";

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [copied, setCopied] = useState(false);

  const locked = !!recipient.signedAt;

  const [firstName, setFirstName] = useState(recipient.firstName ?? "");
  const [lastName, setLastName] = useState(recipient.lastName ?? "");
  const [email, setEmail] = useState(recipient.email ?? "");
  const [company, setCompany] = useState(recipient.company ?? "");
  const [roles, setRoles] = useState<string[]>(recipient.roles ?? []);
  const [roleOther, setRoleOther] = useState(recipient.roleOther ?? "");
  const [slug, setSlug] = useState(recipient.customSlug ?? "");

  const [saved, setSaved] = useState({
    firstName: recipient.firstName ?? "",
    lastName: recipient.lastName ?? "",
    email: recipient.email ?? "",
    company: recipient.company ?? "",
    roles: recipient.roles ?? [],
    roleOther: recipient.roleOther ?? "",
    slug: recipient.customSlug ?? "",
  });

  const c = {
    who: fr ? "Qui est cette personne" : "Who this is",
    edit: fr ? "Modifier" : "Edit",
    cancel: fr ? "Annuler" : "Cancel",
    save: fr ? "Enregistrer" : "Save",
    saving: fr ? "Enregistrement\u2026" : "Saving\u2026",
    name: fr ? "Nom" : "Name",
    first: fr ? "Pr\u00e9nom" : "First name",
    last: fr ? "Nom de famille" : "Last name",
    email: fr ? "E-mail" : "Email",
    company: fr ? "Entreprise" : "Company",
    role: fr ? "R\u00f4le" : "Role",
    added: fr ? "Ajout\u00e9" : "Added",
    how: fr ? "Re\u00e7u par" : "Received by",
    link: fr ? "Lien" : "Link",
    byEmail: fr ? "E-mail" : "Email",
    none: fr ? "Non renseign\u00e9" : "Not recorded",
    copy: fr ? "Copier" : "Copy",
    copied: fr ? "Copi\u00e9" : "Copied",
    emailHint: fr
      ? "Sert \u00e0 les nommer dans ce que vous envoyez d\u2019ici. La modifier ne renvoie rien."
      : "Used to address them in anything you send from here. Changing it does not resend anything.",
    companyHint: fr
      ? "Regroupe les lecteurs d\u2019une m\u00eame entreprise, m\u00eame avec des adresses personnelles."
      : "Groups readers from the same company, even on personal email addresses.",
    prompt: fr
      ? "Sans r\u00f4le, ce lecteur ne correspond \u00e0 aucun persona et affaiblit l\u2019analyse des \u00e9carts."
      : "With no role recorded, this reader matches no persona and weakens the gap analysis.",
    addNow: fr ? "Renseigner maintenant" : "Add it now",
    addr: fr ? "Adresse du lien" : "Link address",
    addrNote: fr
      ? "La fin de l\u2019URL, la seule chose que le lecteur voit avant d\u2019ouvrir."
      : "The last part of the URL, which is the only thing the reader sees before they open it.",
    addrRules: fr
      ? "Lettres minuscules, chiffres et tirets. Entre 3 et 48 caract\u00e8res."
      : "Lowercase letters, numbers and hyphens. Between 3 and 48 characters.",
    keepsWorking: fr ? "L\u2019adresse d\u2019origine continue de fonctionner." : "The original address keeps working.",
    keepsWorkingBody: fr
      ? "Toute personne qui d\u00e9tient d\u00e9j\u00e0 cette adresse peut toujours ouvrir le document, et tout ce qu\u2019elle fait est rattach\u00e9 au m\u00eame lecteur. Vider le champ ne laisse que cette adresse."
      : "Anyone already holding this address can still open the document, and everything they do lands on this same reader. Clearing the field leaves only that address.",
    lockedNote: fr
      ? "Sign\u00e9. Le nom et l\u2019e-mail figurent sur le certificat et ne peuvent plus changer."
      : "Signed. The name and email are recorded on the certificate and can no longer change.",
    failed: fr ? "\u00c9chec de l\u2019enregistrement." : "Could not save.",
  };

  const shown = editing
    ? { firstName, lastName, email, company, roles, roleOther, slug }
    : saved;

  const nameText = [shown.firstName.trim(), shown.lastName.trim()].filter(Boolean).join(" ")
    || (recipient.label ?? "").trim();

  const roleText = [
    ...shown.roles.map((r) => roleLabel(r) ?? r),
    ...(shown.roleOther.trim() ? [shown.roleOther.trim()] : []),
  ].join(", ");

  const host = recipient.readerOrigin.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const prefix = host + "/read/";
  const tokenAddress = prefix + recipient.shareToken;
  const shownAddress = saved.slug ? prefix + saved.slug : tokenAddress;

  async function copy() {
    try {
      await navigator.clipboard.writeText("https://" + shownAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard refused, nothing useful to say */
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    setSlugError("");
    try {
      const res = await fetch("/api/recipient", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient.id,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          roles,
          roleOther: roleOther.trim() || undefined,
          company: company.trim() || undefined,
          customSlug: slug.trim().toLowerCase(),
        }),
      });
      const json = (await res.json()) as { error?: string; field?: string };
      if (!res.ok) {
        if (json.field === "customSlug") setSlugError(json.error || c.failed);
        else setError(json.error || c.failed);
        return;
      }
      setSaved({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        company: company.trim(),
        roles,
        roleOther: roleOther.trim(),
        slug: slug.trim().toLowerCase(),
      });
      setEditing(false);
    } catch {
      setError(c.failed);
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setFirstName(saved.firstName);
    setLastName(saved.lastName);
    setEmail(saved.email);
    setCompany(saved.company);
    setRoles(saved.roles);
    setRoleOther(saved.roleOther);
    setSlug(saved.slug);
    setError("");
    setSlugError("");
    setEditing(false);
  }

  const btn: React.CSSProperties = {
    height: 27,
    padding: "0 9px",
    border: "1px solid " + T.border,
    borderRadius: 6,
    background: "#fff",
    fontSize: 12,
    color: T.body,
    cursor: "pointer",
    fontFamily: T.font,
  };

  const pri: React.CSSProperties = {
    ...btn,
    background: T.green,
    borderColor: T.green,
    color: "#fff",
  };

  const dt: React.CSSProperties = { fontSize: 12.5, color: T.muted };
  const dd: React.CSSProperties = { fontSize: 13.5, color: T.body, lineHeight: 1.55, margin: 0 };
  const dim: React.CSSProperties = { ...dd, color: T.faint };
  const lbl: React.CSSProperties = { fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 };
  const hint: React.CSSProperties = { fontSize: 12.5, color: T.faint, margin: "6px 0 14px", lineHeight: 1.45 };

  const bare = !saved.company && saved.roles.length === 0 && !saved.roleOther;

  return (
    <div style={{ border: "1px solid " + T.border, borderRadius: 6, marginBottom: 20 }}>
      <div
        style={{
          background: T.soft,
          borderBottom: "1px solid " + T.border,
          padding: "9px 14px",
          fontSize: 11.5,
          color: T.muted,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {c.who}
        {!editing && (
          <button type="button" style={{ ...btn, marginLeft: "auto" }} onClick={() => setEditing(true)}>
            {c.edit}
          </button>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {editing ? (
          <>
            {locked && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  color: T.muted,
                  background: T.soft,
                  border: "1px solid " + T.border,
                  borderRadius: 4,
                  padding: "9px 12px",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                <i style={{ width: 6, height: 6, borderRadius: 2, background: T.faint, flex: "none" }} />
                {c.lockedNote}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 14 }}>
              <div>
                <span style={lbl}>{c.first}</span>
                <input
                  className="t-in"
                  value={firstName}
                  disabled={locked}
                  autoComplete="off"
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <span style={lbl}>{c.last}</span>
                <input
                  className="t-in"
                  value={lastName}
                  disabled={locked}
                  autoComplete="off"
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <span style={lbl}>{c.email}</span>
            <input
              className="t-in"
              value={email}
              disabled={locked}
              autoComplete="off"
              inputMode="email"
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%" }}
            />
            <p style={hint}>{c.emailHint}</p>

            <span style={lbl}>{c.company}</span>
            <input
              className="t-in"
              value={company}
              autoComplete="off"
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Northwind"
              style={{ width: "100%" }}
            />
            <p style={hint}>{c.companyHint}</p>

            <RolePicker
              roles={roles}
              other={roleOther}
              onChange={(r, o) => {
                setRoles(r);
                setRoleOther(o);
              }}
            />

            <hr style={{ border: 0, borderTop: "1px solid " + T.border, margin: "20px -16px" }} />

            <p style={{ fontSize: 12.5, fontWeight: 600, color: T.heading, margin: "0 0 4px" }}>{c.addr}</p>
            <p style={{ fontSize: 12.5, color: T.faint, lineHeight: 1.5, margin: "0 0 14px" }}>{c.addrNote}</p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 32,
                border: "1px solid " + (slugError ? T.dangerText : T.border),
                borderRadius: 6,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <span style={{ padding: "0 2px 0 9px", fontSize: 13, color: T.faint, whiteSpace: "nowrap", fontFamily: MONO }}>
                {prefix}
              </span>
              <input
                value={slug}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder={recipient.shareToken.slice(0, 12)}
                style={{
                  flex: 1,
                  height: "100%",
                  border: 0,
                  outline: "none",
                  padding: "0 9px 0 0",
                  fontSize: 13,
                  color: T.heading,
                  fontFamily: MONO,
                  background: "transparent",
                  minWidth: 0,
                }}
              />
            </div>
            {slugError ? (
              <p style={{ fontSize: 12.5, color: T.dangerText, margin: "6px 0 14px", lineHeight: 1.45 }}>{slugError}</p>
            ) : (
              <p style={hint}>{c.addrRules}</p>
            )}

            <div
              style={{
                borderLeft: "3px solid " + T.green,
                background: T.greenSoft,
                padding: "11px 14px",
                marginBottom: 14,
                fontSize: 12.5,
                lineHeight: 1.6,
                color: T.greenText,
              }}
            >
              <b style={{ fontWeight: 600 }}>{c.keepsWorking}</b>{" "}
              <span style={{ fontFamily: MONO }}>{tokenAddress}</span>. {c.keepsWorkingBody}
            </div>

            {error && (
              <p style={{ fontSize: 12.5, color: T.dangerText, margin: "0 0 12px", lineHeight: 1.45 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={pri} disabled={busy} onClick={() => void save()}>
                {busy ? c.saving : c.save}
              </button>
              <button type="button" style={btn} disabled={busy} onClick={cancel}>
                {c.cancel}
              </button>
            </div>
          </>
        ) : (
          <>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "130px minmax(0, 1fr)",
                gap: "10px 16px",
                margin: 0,
              }}
            >
              <dt style={dt}>{c.name}</dt>
              <dd style={nameText ? dd : dim}>{nameText || c.none}</dd>

              <dt style={dt}>{c.email}</dt>
              <dd style={saved.email ? dd : dim}>{saved.email || c.none}</dd>

              <dt style={dt}>{c.company}</dt>
              <dd style={saved.company ? dd : dim}>{saved.company || c.none}</dd>

              <dt style={dt}>{c.role}</dt>
              <dd style={roleText ? dd : dim}>{roleText || c.none}</dd>

              <dt style={dt}>{c.addr}</dt>
              <dd style={{ ...dd, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: 12.5, color: T.heading, wordBreak: "break-all" }}>
                  {shownAddress}
                </span>
                <button type="button" style={btn} onClick={() => void copy()}>
                  {copied ? c.copied : c.copy}
                </button>
              </dd>

              <dt style={dt}>{c.how}</dt>
              <dd style={dd}>{recipient.delivery === "email" ? c.byEmail : c.link}</dd>

              <dt style={dt}>{c.added}</dt>
              <dd style={dd}>
                {new Date(recipient.createdAt).toLocaleDateString(fr ? "fr-FR" : "en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </dd>
            </dl>

            {bare && (
              <div
                style={{
                  borderLeft: "3px solid " + T.amber,
                  background: "#FFFBF5",
                  padding: "11px 14px",
                  marginTop: 16,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: "#7A3D0A",
                }}
              >
                {c.prompt}{" "}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    font: "inherit",
                    color: "#7A3D0A",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    cursor: "pointer",
                  }}
                >
                  {c.addNow}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
