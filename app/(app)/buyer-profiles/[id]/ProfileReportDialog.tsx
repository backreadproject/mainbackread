"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import type { ProfileSections } from "@/lib/pdf/ProfileReport";

/**
 * Exporting a buyer profile.
 *
 * Branding is the same settings the reading report uses, loaded and saved
 * through the same route, so a customer sets their logo once for both.
 *
 * Two shapes, because they go to different people. The full report is for
 * whoever is deciding; search criteria only is two pages for whoever is
 * building the list, and sending them nine pages of personas would be sending
 * them somebody else's homework.
 */

type Kind = "person" | "department" | "organisation";
type Mode = "full" | "criteria";

const FULL: ProfileSections = { market: true, personas: true, criteria: true, calendars: true, evidence: true, gap: true };
const CRITERIA_ONLY: ProfileSections = { market: false, personas: false, criteria: true, calendars: true, evidence: false, gap: false };

export default function ProfileReportDialog({
  profileId,
  profileName,
  onClose,
}: {
  profileId: string;
  profileName: string;
  onClose: () => void;
}) {
  const locale = useLocale();
  const fr = locale === "fr";

  const [mode, setMode] = useState<Mode>("full");
  const [sections, setSections] = useState<ProfileSections>(FULL);
  const [reporter, setReporter] = useState("");
  const [recipient, setRecipient] = useState("");
  const [kind, setKind] = useState<Kind>("person");
  const [company, setCompany] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [signature, setSignature] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  const c = {
    title: fr ? "Exporter en rapport" : "Export as a report",
    sub: fr
      ? "Le m\u00eame moteur que vos rapports de document, donc la couverture et l\u2019image de marque sont celles que vous avez d\u00e9j\u00e0 d\u00e9finies."
      : "The same report engine as your document reports, so the cover and branding are the ones you already set.",
    loading: fr ? "Chargement\u2026" : "Loading\u2026",
    modeH: fr ? "Quelle version" : "Which version",
    fullT: fr ? "Rapport complet" : "Full report",
    fullD: fr ? "Toutes les sections, avec la base indiqu\u00e9e partout." : "Every section, basis labels printed throughout.",
    critT: fr ? "Crit\u00e8res de recherche seulement" : "Search criteria only",
    critD: fr ? "Pour celui qui construit la liste." : "For whoever is building the list.",
    preparedBy: fr ? "Pr\u00e9par\u00e9 par" : "Prepared by",
    yourName: fr ? "Votre nom" : "Your name",
    preparedFor: fr ? "Pr\u00e9par\u00e9 pour" : "Prepared for",
    forPlaceholder: fr ? "\u00c9quipe commerciale" : "Sales team",
    kPerson: fr ? "Une personne" : "A person",
    kDepartment: fr ? "Une \u00e9quipe" : "A team",
    kOrganisation: fr ? "Une organisation" : "An organisation",
    yourCompany: fr ? "Votre organisation" : "Your company",
    coverPlaceholder: fr ? "Appara\u00eet sur la couverture" : "Appears on the cover",
    logo: fr ? "Logo" : "Logo",
    logoHint: fr ? "PNG ou JPEG" : "PNG or JPEG",
    upload: fr ? "T\u00e9l\u00e9verser" : "Upload",
    replace: fr ? "Remplacer" : "Replace",
    uploading: fr ? "Envoi\u2026" : "Uploading\u2026",
    remove: fr ? "Retirer" : "Remove",
    note: fr ? "Note de couverture" : "Cover note",
    notePlaceholder: fr ? "Facultatif" : "Optional",
    header: fr ? "En-t\u00eate" : "Header",
    headerHint: fr ? "sur chaque page" : "on every page",
    footer: fr ? "Pied de page" : "Footer",
    footerHint: fr ? "en bas \u00e0 gauche" : "bottom left",
    include: fr ? "Inclure" : "Include",
    sMarket: fr ? "D\u00e9finition du march\u00e9 et d\u00e9clencheurs" : "Market definition and triggers",
    sPersonas: fr ? "Personas et angles" : "Personas and angles",
    sCriteria: fr ? "Crit\u00e8res de recherche, six plateformes" : "Search criteria, six platforms",
    sCalendars: fr ? "Calendriers de travail" : "Working calendars",
    sEvidence: fr ? "Ce que les lecteurs ont fait" : "Reader evidence",
    sGap: fr ? "Analyse des \u00e9carts" : "Gap analysis",
    bStated: fr ? "\u00c9nonc\u00e9" : "Stated",
    bPublic: fr ? "Fait public" : "Public fact",
    bObserved: fr ? "Observ\u00e9" : "Observed",
    sig: fr ? "La ligne \u00ab\u00a0Generated from ReadProspects\u00a0\u00bb" : "The \u201cGenerated from ReadProspects\u201d line",
    build: fr ? "T\u00e9l\u00e9charger le PDF" : "Download PDF",
    building: fr ? "Construction\u2026" : "Building\u2026",
    errType: fr ? "Le logo doit \u00eatre un PNG ou un JPEG." : "The logo must be a PNG or a JPEG.",
    errSignIn: fr ? "Reconnectez-vous." : "Sign in again.",
    errUpload: fr ? "\u00c9chec du t\u00e9l\u00e9versement : " : "Upload failed: ",
    errLogo: fr ? "\u00c9chec du logo." : "Could not upload the logo.",
    errBuild: fr ? "\u00c9chec de la construction du rapport." : "Could not build the report.",
    errReach: fr ? "Serveur injoignable." : "Could not reach the server.",
    filename: "buyer-profile.pdf",
    free: fr
      ? "Cet export ne co\u00fbte aucun appel de mod\u00e8le : chaque section existe d\u00e9j\u00e0."
      : "This export costs no model call. Every section already exists.",
  };

  useEffect(() => {
    fetch("/api/report-settings")
      .then((r) => r.json())
      .then((j) => {
        const s = j.settings as { company_name: string | null; logo_url: string | null; default_reporter: string | null } | null;
        if (s) {
          setCompany(s.company_name ?? "");
          setLogoUrl(s.logo_url);
          setReporter(s.default_reporter ?? "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function pickMode(m: Mode) {
    setMode(m);
    setSections(m === "full" ? FULL : CRITERIA_ONLY);
  }

  async function uploadLogo(file: File) {
    setUploading(true); setMsg("");
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setMsg(c.errType);
      setUploading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMsg(c.errSignIn); setUploading(false); return; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = user.id + "/report-logo." + ext;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) { setMsg(c.errUpload + error.message); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl + "?v=" + Date.now();
      setLogoUrl(url);
      await fetch("/api/report-settings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyName: company, logoUrl: url, defaultReporter: reporter }),
      });
    } catch {
      setMsg(c.errLogo);
    }
    setUploading(false);
  }

  async function build() {
    setBusy(true); setMsg("");
    try {
      // Awaited, not fired and forgotten: the route reads these settings to find
      // the logo, so a race means the logo is missing from the report the
      // customer just configured.
      try {
        await fetch("/api/report-settings", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ companyName: company, logoUrl, defaultReporter: reporter }),
        });
      } catch { /* the report still builds, just without saved branding */ }

      const res = await fetch("/api/profile-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profileId, reporter, recipient, recipientKind: kind,
          companyName: company, note, sections, headerText, footerText, signature,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error || c.errBuild);
        setBusy(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = profileName.replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) + " - buyer profile.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setMsg(c.errReach);
      setBusy(false);
    }
  }

  const input: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", height: 36, background: T.card, color: T.heading,
    border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font,
  };
  const label: React.CSSProperties = { display: "block", fontSize: 12.5, color: T.body, marginBottom: 5, marginTop: 14 };

  const TOGGLES: [keyof ProfileSections, string, string][] = [
    ["market", c.sMarket, c.bStated],
    ["personas", c.sPersonas, c.bStated],
    ["criteria", c.sCriteria, c.bPublic],
    ["calendars", c.sCalendars, c.bPublic],
    ["evidence", c.sEvidence, c.bObserved],
    ["gap", c.sGap, c.bObserved],
  ];

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.45)", zIndex: 90, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, width: "100%", maxWidth: 460, marginTop: 40, fontFamily: T.font }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid " + T.border, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{c.title}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{c.sub}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}>&times;</button>
        </div>

        <div style={{ padding: 18 }}>
          {!loaded ? (
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{c.loading}</p>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: T.body, marginBottom: 8 }}>{c.modeH}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {([["full", c.fullT, c.fullD], ["criteria", c.critT, c.critD]] as [Mode, string, string][]).map(([m, t, d]) => (
                  <button key={m} type="button" onClick={() => pickMode(m)}
                    style={{
                      border: "1px solid " + (mode === m ? T.green : T.border),
                      boxShadow: mode === m ? "inset 0 0 0 1px " + T.green : "none",
                      borderRadius: T.rBtn, background: T.card, padding: "10px 12px",
                      textAlign: "left", cursor: "pointer", fontFamily: T.font,
                    }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: T.heading }}>{t}</span>
                    <span style={{ display: "block", fontSize: 12, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{d}</span>
                  </button>
                ))}
              </div>

              <label style={label}>{c.preparedBy}</label>
              <input style={input} value={reporter} onChange={(e) => setReporter(e.target.value)} placeholder={c.yourName} />

              <label style={label}>{c.preparedFor}</label>
              <input style={input} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={c.forPlaceholder} />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {(["person", "department", "organisation"] as Kind[]).map((k) => (
                  <button key={k} onClick={() => setKind(k)}
                    style={{ flex: 1, height: 30, fontSize: 12, fontFamily: T.font, cursor: "pointer",
                      background: kind === k ? T.greenSoft : "transparent",
                      color: kind === k ? T.greenText : T.muted,
                      border: "1px solid " + (kind === k ? T.greenBorder : T.border),
                      borderRadius: T.rBtn }}>
                    {k === "person" ? c.kPerson : k === "department" ? c.kDepartment : c.kOrganisation}
                  </button>
                ))}
              </div>

              <label style={label}>{c.yourCompany}</label>
              <input style={input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder={c.coverPlaceholder} />

              <label style={label}>{c.logo} <span style={{ color: T.faint, fontWeight: 400 }}>{c.logoHint}</span></label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {logoUrl && <img src={logoUrl} alt="" style={{ width: 34, height: 34, objectFit: "contain", border: "1px solid " + T.border, borderRadius: 4 }} />}
                <label style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 12px", border: "1px solid " + T.border, borderRadius: T.rBtn, fontSize: 12.5, color: T.heading, cursor: "pointer" }}>
                  {uploading ? c.uploading : logoUrl ? c.replace : c.upload}
                  <input type="file" accept="image/png,image/jpeg" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); }} />
                </label>
                {logoUrl && (
                  <button onClick={() => { setLogoUrl(null); void fetch("/api/report-settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ companyName: company, logoUrl: null, defaultReporter: reporter }) }); }}
                    style={{ background: "none", border: "none", color: T.muted, fontSize: 12.5, cursor: "pointer", padding: 0 }}>{c.remove}</button>
                )}
              </div>

              <label style={label}>{c.note}</label>
              <input style={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder={c.notePlaceholder} />

              <label style={label}>{c.header} <span style={{ color: T.faint, fontWeight: 400 }}>{c.headerHint}</span></label>
              <input style={input} value={headerText} onChange={(e) => setHeaderText(e.target.value)} />

              <label style={label}>{c.footer} <span style={{ color: T.faint, fontWeight: 400 }}>{c.footerHint}</span></label>
              <input style={input} value={footerText} onChange={(e) => setFooterText(e.target.value)} />

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + T.borderSoft }}>
                <div style={{ fontSize: 12.5, color: T.body, marginBottom: 9 }}>{c.include}</div>
                {TOGGLES.map(([key, lbl, basis]) => (
                  <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 9, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={sections[key]}
                      onChange={(e) => setSections((x) => ({ ...x, [key]: e.target.checked }))}
                      style={{ marginTop: 3 }}
                    />
                    <span style={{ fontSize: 12.5, color: T.body, lineHeight: 1.5 }}>
                      {lbl}
                      <span style={{ color: T.faint }}>{"  \u00b7  " + basis}</span>
                    </span>
                  </label>
                ))}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 4, cursor: "pointer" }}>
                  <input type="checkbox" checked={signature} onChange={(e) => setSignature(e.target.checked)} style={{ marginTop: 3 }} />
                  <span style={{ fontSize: 12.5, color: T.body, lineHeight: 1.5 }}>{c.sig}</span>
                </label>
              </div>

              <button onClick={() => void build()} disabled={busy}
                style={{ width: "100%", marginTop: 18, height: 38, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, fontSize: 14, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                {busy ? c.building : c.build}
              </button>
              <p style={{ fontSize: 11.5, color: T.faint, margin: "10px 0 0", lineHeight: 1.5 }}>{c.free}</p>
              {msg && <p style={{ fontSize: 13, color: T.dangerText, lineHeight: 1.5, margin: "12px 0 0" }}>{msg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
