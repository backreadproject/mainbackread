import { getLocale } from "@/lib/locale-server";
import { getDict } from "@/lib/i18n";

// The neutral landing page for the reader-delivery domain (relaydocuments.com).
// Reached when someone trims a /read/ link back to the root, or hits any non-reader
// path on that domain. Deliberately says nothing about reading analytics, verdicts,
// or how the platform works -- only that it delivers shared documents. A recipient
// who lands here learns nothing that would make them feel watched.
export default async function RelayLanding() {
  const locale = await getLocale();
  const r = getDict(locale).relayPage;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F6F3", fontFamily: "var(--font-dm-sans), system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "#E7F6EF", marginBottom: 20 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B7A4B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h11l5 5v11H4z" /><path d="M15 4v5h5" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F1729", letterSpacing: "-0.02em", margin: "0 0 10px" }}>{r.title}</h1>
        <p style={{ fontSize: 15, color: "#475467", lineHeight: 1.6, margin: 0 }}>{r.body}</p>
        <p style={{ fontSize: 13, color: "#98A2B3", lineHeight: 1.6, margin: "20px 0 0" }}>{r.hint}</p>
      </div>
    </div>
  );
}
