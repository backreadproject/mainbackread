"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Doc = { id: string; title: string; page_count: number; created_at: string };

export default function DashboardClient({ email, documents }: { email: string; documents: Doc[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please choose a PDF.");
      return;
    }

    setUploading(true);
    setError("");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not signed in."); setUploading(false); return; }

    // Path: {user_id}/{timestamp}-{filename} — matches the storage RLS policy.
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;

    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setError("Upload failed: " + upErr.message); setUploading(false); return; }

    const title = file.name.replace(/\.pdf$/i, "");
    const { error: dbErr } = await supabase.from("documents").insert({
      owner_id: user.id,
      title,
      storage_path: path,
    });
    if (dbErr) { setError("Saved file but could not record it: " + dbErr.message); setUploading(false); return; }

    window.location.reload();
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

        <label style={{ display: "block", background: "#fff", border: "2px dashed #D3D6DA", borderRadius: 8, padding: 40, textAlign: "center", marginBottom: 28, cursor: uploading ? "default" : "pointer" }}>
          <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} style={{ display: "none" }} />
          <p style={{ fontSize: 15, color: "#6E7480", margin: 0 }}>
            {uploading ? "Uploading..." : "Click to upload a PDF"}
          </p>
        </label>

        {error && <p style={{ color: "#FF5C35", fontSize: 14, marginBottom: 16 }}>{error}</p>}

        {documents.length === 0 ? (
          <p style={{ fontSize: 14, color: "#6E7480", textAlign: "center" }}>No documents yet.</p>
        ) : (
          documents.map((d) => (
            <div key={d.id} style={{ background: "#fff", border: "1px solid #D3D6DA", borderRadius: 6, padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 500 }}>{d.title}</span>
              <span style={{ fontSize: 13, color: "#6E7480" }}>{new Date(d.created_at).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
