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
 */

export type Identity = {
  id: string;
  label: string | null;
  email: string | null;
  company: string | null;
  roles: string[];
  roleOther: string | null;
  delivery: string | null;
  createdAt: string;
};

export default function IdentityCard({ recipient }: { recipient: Identity }) {
  const locale = useLocale();
  const fr = locale === "fr";

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [company, setCompany] = useState(recipient.company ?? "");
  const [roles, setRoles] = useState<string[]>(recipient.roles ?? []);
  const [roleOther, setRoleOther] = useState(recipient.roleOther ?? "");

  const [saved, setSaved] = useState({
    company: recipient.company ?? "",
    roles: recipient.roles ?? [],
    roleOther: recipient.roleOther ?? "",
  });

  const c = {
    who: fr ? "Qui est cette personne" : "Who this is",
    edit: fr ? "Modifier" : "Edit",
    cancel: fr ? "Annuler" : "Cancel",
    save: fr ? "Enregistrer" : "Save",
    saving: fr ? "Enregistrement\u2026" : "Saving\u2026",
    email: fr ? "E-mail" : "Email",
    company: fr ? "Entreprise" : "Company",
    role: fr ? "R\u00f4le" : "Role",
    added: fr ? "Ajout\u00e9" : "Added",
    how: fr ? "Re\u00e7u par" : "Received by",
    link: fr ? "Lien" : "Link",
    byEmail: fr ? "E-mail" : "Email",
    none: fr ? "Non renseign\u00e9" : "Not recorded",
    companyHint: fr
      ? "Regroupe les lecteurs d\u2019une m\u00eame entreprise, m\u00eame avec des adresses personnelles."
      : "Groups readers from the same company, even on personal email addresses.",
    prompt: fr
      ? "Sans r\u00f4le, ce lecteur ne correspond \u00e0 aucun persona et affaiblit l\u2019analyse des \u00e9carts."
      : "With no role recorded, this reader matches no persona and weakens the gap analysis.",
    addNow: fr ? "Renseigner maintenant" : "Add it now",
  };

  const shown = editing
    ? { company, roles, roleOther }
    : saved;

  const roleText = [
    ...shown.roles.map((r) => roleLabel(r) ?? r),
    ...(shown.roleOther.trim() ? [shown.roleOther.trim()] : []),
  ].join(", ");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/recipient", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient.id,
          roles,
          roleOther: roleOther.trim() || undefined,
          company: company.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || (fr ? "\u00c9chec de l\u2019enregistrement." : "Could not save."));
        return;
      }
      setSaved({ company: company.trim(), roles, roleOther: roleOther.trim() });
      setEditing(false);
    } catch {
      setError(fr ? "\u00c9chec de l\u2019enregistrement." : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setCompany(saved.company);
    setRoles(saved.roles);
    setRoleOther(saved.roleOther);
    setError("");
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
  };

  const pri: React.CSSProperties = {
    ...btn,
    background: T.green,
    borderColor: T.green,
    color: "#fff",
  };

  const dt: React.CSSProperties = { fontSize: 12.5, color: T.muted };
  const dd: React.CSSProperties = { fontSize: 13.5, color: T.body, lineHeight: 1.55 };
  const dim: React.CSSProperties = { fontSize: 13.5, color: T.faint };

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
            <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 }}>{c.company}</span>
            <input
              className="t-in"
              value={company}
              autoComplete="off"
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Northwind"
              style={{ width: "100%", marginBottom: 6 }}
            />
            <p style={{ fontSize: 12.5, color: T.faint, margin: "0 0 14px", lineHeight: 1.45 }}>{c.companyHint}</p>

            <RolePicker
              roles={roles}
              other={roleOther}
              onChange={(r, o) => {
                setRoles(r);
                setRoleOther(o);
              }}
            />

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
              <dt style={dt}>{c.email}</dt>
              <dd style={recipient.email ? dd : dim}>{recipient.email || c.none}</dd>

              <dt style={dt}>{c.company}</dt>
              <dd style={saved.company ? dd : dim}>{saved.company || c.none}</dd>

              <dt style={dt}>{c.role}</dt>
              <dd style={roleText ? dd : dim}>{roleText || c.none}</dd>

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
