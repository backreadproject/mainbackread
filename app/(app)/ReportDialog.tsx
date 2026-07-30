"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
// The report dialog.
//
// Reporter and recipient are per report. Company name and logo are settings,
// saved on first use so nobody types them twice: asking for branding on every
// download would be a tax on the feature customers pay for.
//
// The regenerate toggle exists because the analysis is cached on the state of
// the signals. Normally that is invisible and free; occasionally someone wants
// a fresh read of unchanged data, and hiding that would feel like the product
// was refusing to work.
type Kind = "person" | "department" | "organisation";
export default function ReportDialog({ documentId, recipientIds, recipients, onClose }: {
  documentId: string;
  /** Fixed selection, used from a single reader's page. */
  recipientIds?: string[];
  /** Choosable list, used from the document page. */
  recipients?: { id: string; label: string | null }[];
  onClose: () => void;
}) {
  // Everyone by default: the common case is the whole cohort, and starting
  // empty would make the button look broken.
  const D = getDict(useLocale()).reportDialog;
  const [picked, setPicked] = useState<string[]>(() => (recipients ?? []).map((r) => r.id));
  const [reporter, setReporter] = useState("");
  const [recipient, setRecipient] = useState("");
  const [kind, setKind] = useState<Kind>("person");
  const [company, setCompany] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [appendix, setAppendix] = useState(true);
  const [pageAttention, setPageAttention] = useState(true);
  const [neverOpened, setNeverOpened] = useState(true);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [signature, setSignature] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

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

  async function uploadLogo(file: File) {
    setUploading(true); setMsg("");
    // Checked here as well as in the picker: a customer can still drag in a file
    // the accept attribute would have refused, and a silently missing logo is
    // worse than a clear refusal.
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setMsg(D.errType);
      setUploading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMsg(D.errSignIn); setUploading(false); return; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      // The avatars bucket is public, which is what @react-pdf/renderer needs:
      // it fetches the URL at render time and cannot use a signed one that may
      // expire mid-render.
      const path = user.id + "/report-logo." + ext;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) { setMsg(D.errUpload + error.message); setUploading(false); return; }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-bust, or a replaced logo keeps rendering the old one.
      const url = pub.publicUrl + "?v=" + Date.now();
      setLogoUrl(url);
      await fetch("/api/report-settings", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyName: company, logoUrl: url, defaultReporter: reporter }),
      });
    } catch {
      setMsg(D.errLogo);
    }
    setUploading(false);
  }

  async function build() {
    setBusy(true); setMsg("");
    try {
      // Awaited, not fired and forgotten: the report route reads these settings
      // to find the logo, so a race here means the logo is missing from the
      // report the customer just configured.
      try {
        await fetch("/api/report-settings", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ companyName: company, logoUrl, defaultReporter: reporter }),
        });
      } catch { /* the report still builds, just without saved branding */ }

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentId,
          recipientIds: recipientIds ?? (recipients && picked.length < recipients.length ? picked : undefined),
          reporter, recipient, recipientKind: kind, companyName: company, note, refresh,
          sections: { appendix, pageAttention, neverOpened },
          headerText, footerText, signature,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error || D.errBuild);
        setBusy(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = D.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setMsg(D.errReach);
      setBusy(false);
    }
  }

  const input = {
    width: "100%", boxSizing: "border-box" as const, height: 36, background: T.card, color: T.heading,
    border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 11px", fontSize: 13.5, fontFamily: T.font,
  };
  const label = { display: "block", fontSize: 12.5, color: T.body, marginBottom: 5, marginTop: 14 };

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.45)", zIndex: 90, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, width: "100%", maxWidth: 460, marginTop: 40, fontFamily: T.font }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid " + T.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{D.title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}>&times;</button>
        </div>

        <div style={{ padding: 18 }}>
          {!loaded ? (
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{D.loading}</p>
          ) : (
            <>
              {recipients && recipients.length > 0 && (
                <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid " + T.borderSoft }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, color: T.body }}>
                      {D.readers} <span style={{ color: T.muted }}>{picked.length} {D.of} {recipients.length}</span>
                    </span>
                    <button
                      onClick={() => setPicked(picked.length === recipients.length ? [] : recipients.map((r) => r.id))}
                      style={{ background: "none", border: "none", padding: 0, fontSize: 12.5, color: T.greenText, cursor: "pointer" }}>
                      {picked.length === recipients.length ? D.clearAll : D.selectAll}
                    </button>
                  </div>
                  <div style={{ maxHeight: 132, overflowY: "auto", border: "1px solid " + T.border, borderRadius: T.rInput }}>
                    {recipients.map((r, i) => (
                      <label key={r.id}
                        style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 11px", cursor: "pointer",
                          borderTop: i ? "1px solid " + T.borderSoft : "none" }}>
                        <input type="checkbox" checked={picked.includes(r.id)}
                          onChange={(e) => setPicked(e.target.checked ? [...picked, r.id] : picked.filter((x) => x !== r.id))} />
                        <span style={{ fontSize: 12.5, color: T.heading }}>{r.label || D.unnamed}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label style={{ ...label, marginTop: 0 }}>{D.preparedBy}</label>
              <input style={input} value={reporter} onChange={(e) => setReporter(e.target.value)} placeholder={D.yourName} />

              <label style={label}>{D.preparedFor}</label>
              <input style={input} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={D.forPlaceholder} />
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {(["person", "department", "organisation"] as Kind[]).map((k) => (
                  <button key={k} onClick={() => setKind(k)}
                    style={{ flex: 1, height: 30, fontSize: 12, fontFamily: T.font, cursor: "pointer",
                      background: kind === k ? T.greenSoft : "transparent",
                      color: kind === k ? T.greenText : T.muted,
                      border: "1px solid " + (kind === k ? T.greenBorder : T.border),
                      borderRadius: T.rBtn }}>
                    {k === "person" ? D.kPerson : k === "department" ? D.kDepartment : D.kOrganisation}
                  </button>
                ))}
              </div>

              <label style={label}>{D.yourCompany}</label>
              <input style={input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder={D.coverPlaceholder} />

              <label style={label}>{D.logo} <span style={{ color: T.faint, fontWeight: 400 }}>{D.logoHint}</span></label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {logoUrl && <img src={logoUrl} alt="" style={{ width: 34, height: 34, objectFit: "contain", border: "1px solid " + T.border, borderRadius: 4 }} />}
                <label style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 12px", border: "1px solid " + T.border, borderRadius: T.rBtn, fontSize: 12.5, color: T.heading, cursor: "pointer" }}>
                  {uploading ? D.uploading : logoUrl ? D.replace : D.upload}
                  <input type="file" accept="image/png,image/jpeg" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
                </label>
                {logoUrl && (
                  <button onClick={() => { setLogoUrl(null); fetch("/api/report-settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ companyName: company, logoUrl: null, defaultReporter: reporter }) }); }}
                    style={{ background: "none", border: "none", color: T.muted, fontSize: 12.5, cursor: "pointer", padding: 0 }}>{D.remove}</button>
                )}
              </div>

              <label style={label}>{D.note}</label>
              <input style={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder={D.notePlaceholder} />

              <label style={label}>{D.header} <span style={{ color: T.faint, fontWeight: 400 }}>{D.headerHint}</span></label>
              <input style={input} value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder={D.headerPlaceholder} />

              <label style={label}>{D.footer} <span style={{ color: T.faint, fontWeight: 400 }}>{D.footerHint}</span></label>
              <input style={input} value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder={D.footerPlaceholder} />

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + T.borderSoft }}>
                <div style={{ fontSize: 12.5, color: T.body, marginBottom: 9 }}>{D.include}</div>
                {([
                  [D.incAppendix, appendix, setAppendix, D.incAppendixHint],
                  [D.incPages, pageAttention, setPageAttention, D.incPagesHint],
                  [D.incNever, neverOpened, setNeverOpened, D.incNeverHint],
                  [D.incSignature, signature, setSignature, D.incSignatureHint],
                ] as [string, boolean, (v: boolean) => void, string][]).map(([lbl, val, set, hint]) => (
                  <label key={lbl} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 9, cursor: "pointer" }}>
                    <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} style={{ marginTop: 3 }} />
                    <span style={{ fontSize: 12.5, color: T.body, lineHeight: 1.5 }}>
                      {lbl}<span style={{ color: T.muted }}> {"\u2014"} {hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={refresh} onChange={(e) => setRefresh(e.target.checked)} style={{ marginTop: 3 }} />
                <span style={{ fontSize: 12.5, color: T.body, lineHeight: 1.5 }}>
                  {D.reread}
                  <span style={{ color: T.muted }}> {D.rereadHint}</span>
                </span>
              </label>

              <button onClick={build} disabled={busy || (!!recipients && picked.length === 0)}
                style={{ width: "100%", marginTop: 18, height: 38, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, fontSize: 14, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                {busy ? D.building : D.build}
              </button>
              {msg && <p style={{ fontSize: 13, color: T.dangerText, lineHeight: 1.5, margin: "12px 0 0" }}>{msg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}