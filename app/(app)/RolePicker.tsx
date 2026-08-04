"use client";

import { useMemo, useRef, useState } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { searchRoles, roleLabel, ROLE_COUNT } from "@/lib/roles";

/**
 * Role is a property of the RECIPIENT, not of any buyer profile. It is captured
 * once here and holds across every document that person ever receives. Buyer
 * profiles consume it at analysis time, so attaching a different profile
 * re-matches every reader without touching a stored row.
 *
 * Optional by design: a required field at the moment of adding someone is where
 * people abandon. The document page prompts later for engaged readers who have
 * no role recorded, which is the moment it is actually worth asking.
 */

export const MAX_ROLES = 6;

export default function RolePicker({
  roles,
  other,
  onChange,
}: {
  roles: string[];
  other: string;
  onChange: (roles: string[], other: string) => void;
}) {
  const locale = useLocale();
  const fr = locale === "fr";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  const c = {
    label: fr ? "R\u00f4le (facultatif)" : "Role (optional)",
    hint: fr
      ? "Ce que fait cette personne. Sert \u00e0 comparer vos lecteurs r\u00e9els \u00e0 votre profil d\u2019acheteur."
      : "What this person does. Used to compare your real readers against your buyer profile.",
    add: fr ? "Choisir un r\u00f4le" : "Choose a role",
    search: fr ? "Rechercher parmi " + ROLE_COUNT + " r\u00f4les" : "Search " + ROLE_COUNT + " roles",
    none: fr ? "Aucun r\u00f4le ne correspond" : "No role matches that",
    useTyped: fr ? "Utiliser tel quel" : "Use it as typed",
    typedNote: fr
      ? "Un r\u00f4le saisi est conserv\u00e9 tel quel. Il n\u2019est jamais ajout\u00e9 \u00e0 la liste."
      : "A typed role is kept as you wrote it. It is never added to the list.",
    full: fr ? "Six r\u00f4les au maximum" : "Six roles at most",
    done: fr ? "Termin\u00e9" : "Done",
    remove: fr ? "Retirer" : "Remove",
  };

  const groups = useMemo(() => searchRoles(q), [q]);
  const hits = groups.reduce((n, g) => n + g.roles.length, 0);
  const chosen = roles.length + (other.trim() ? 1 : 0);
  const full = chosen >= MAX_ROLES;

  function toggle(id: string) {
    if (roles.includes(id)) {
      onChange(roles.filter((r) => r !== id), other);
      return;
    }
    if (full) return;
    onChange([...roles, id], other);
  }

  function useTyped() {
    const v = q.trim().slice(0, 80);
    if (!v || full) return;
    onChange(roles, v);
    setQ("");
  }

  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid " + T.border,
    borderRadius: 4,
    padding: "4px 6px 4px 9px",
    fontSize: 12.5,
    color: T.body,
    background: T.soft,
  };

  const x: React.CSSProperties = {
    border: "none",
    background: "none",
    padding: 0,
    lineHeight: 1,
    fontSize: 14,
    color: T.faint,
    cursor: "pointer",
  };

  return (
    <div style={{ marginBottom: 14 }} ref={boxRef}>
      <span style={{ fontSize: 12.5, color: T.muted, display: "block", marginBottom: 6 }}>{c.label}</span>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {roles.map((id) => (
          <span key={id} style={chip}>
            {roleLabel(id) ?? id}
            <button type="button" aria-label={c.remove} style={x} onClick={() => toggle(id)}>
              &times;
            </button>
          </span>
        ))}

        {other.trim() ? (
          <span key="__other" style={{ ...chip, borderStyle: "dashed" }}>
            {other.trim()}
            <button type="button" aria-label={c.remove} style={x} onClick={() => onChange(roles, "")}>
              &times;
            </button>
          </span>
        ) : null}

        {!open && !full && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              border: "1px solid " + T.border,
              borderRadius: 4,
              background: "#fff",
              padding: "4px 9px",
              fontSize: 12.5,
              color: T.muted,
              cursor: "pointer",
            }}
          >
            {chosen ? "+" : c.add}
          </button>
        )}

        {full && !open && <span style={{ fontSize: 12, color: T.faint }}>{c.full}</span>}
      </div>

      {open && (
        <div
          style={{
            marginTop: 8,
            border: "1px solid " + T.border,
            borderRadius: 6,
            background: "#fff",
          }}
        >
          <div style={{ padding: 8, borderBottom: "1px solid " + T.border }}>
            <input
              className="t-in"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={c.search}
              style={{ width: "100%", marginBottom: 0 }}
            />
          </div>

          <div style={{ maxHeight: 240, overflowY: "auto", padding: 4 }}>
            {hits === 0 ? (
              <div style={{ padding: "14px 10px" }}>
                <div style={{ fontSize: 13, color: T.heading, marginBottom: 6 }}>{c.none}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55, marginBottom: 10 }}>{c.typedNote}</div>
                <button
                  type="button"
                  onClick={useTyped}
                  disabled={full}
                  style={{
                    border: "1px solid " + T.border,
                    borderRadius: 4,
                    background: "#fff",
                    padding: "5px 10px",
                    fontSize: 12.5,
                    color: full ? T.faint : T.body,
                    cursor: full ? "not-allowed" : "pointer",
                  }}
                >
                  {c.useTyped}: {q.trim().slice(0, 40)}
                </button>
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.id}>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: T.faint,
                      padding: "9px 8px 4px",
                    }}
                  >
                    {g.label}
                  </div>
                  {g.roles.map((r) => {
                    const on = roles.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "6px 8px",
                          fontSize: 13,
                          color: !on && full ? T.faint : T.body,
                          cursor: !on && full ? "not-allowed" : "pointer",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={!on && full}
                          onChange={() => toggle(r.id)}
                          style={{ width: 14, height: 14, margin: 0, accentColor: T.green }}
                        />
                        {r.label}
                      </label>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: 8,
              borderTop: "1px solid " + T.border,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: T.faint }}>
              {chosen} / {MAX_ROLES}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              style={{
                marginLeft: "auto",
                border: "1px solid " + T.border,
                borderRadius: 4,
                background: "#fff",
                padding: "4px 10px",
                fontSize: 12.5,
                color: T.body,
                cursor: "pointer",
              }}
            >
              {c.done}
            </button>
          </div>
        </div>
      )}

      {!open && !chosen && (
        <div style={{ fontSize: 12, color: T.faint, marginTop: 6, lineHeight: 1.5 }}>{c.hint}</div>
      )}
    </div>
  );
}
