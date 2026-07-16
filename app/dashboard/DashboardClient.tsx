"use client";

import { createClient } from "@/lib/supabase/client";

type Doc = { id: string; title: string; page_count: number; created_at: string };

export default function DashboardClient({ email, documents }: { email: string; documents: Doc[] }) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#E9EAEC", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #D3D6DA", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20, fontWeight: 600 }}>BackRead</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#6E7480" }}>{email}</span>
          <button onClick={signOut} style={{ background: "none", border: "1px solid #D3D6DA", borderRadius: 4, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>Sign out</button>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Your documents</h1>
        <p style={{ fontSize: 14, color: "#6E7480", marginBottom: 24 }}>
          Upload a document, then send a tracked link. The document reads the reader back.
        </p>

        <div style={{ background: "#fff", border: "2px dashed #D3D6DA", borderRadius: 8, padding: 40, textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 15, color: "#6E7480" }}>Upload coming in the next step.</p>
        </div>

        {documents.length === 0 ? (
          <p style={{ fontSize: 14, color: "#6E7480", textAlign: "center" }}>No documents yet.</p>
        ) : (
          documents.map((d) => (
            <div key={d.id} style={{ background: "#fff", border: "1px solid #D3D6DA", borderRadius: 6, padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500 }}>{d.title}</span>
              <span style={{ fontSize: 13, color: "#6E7480" }}>{d.page_count} pages</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
