"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg("");
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setMsg(error ? error.message : "Account created. You are signed in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    }
    setBusy(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#E9EAEC", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #D3D6DA", borderRadius: 8, padding: 36, width: 360 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>BackRead</h1>
        <p style={{ fontSize: 13, color: "#6E7480", marginBottom: 24 }}>
          {mode === "signin" ? "Sign in to your account" : "Create your account"}
        </p>

        <input
          type="email" placeholder="you@company.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", marginBottom: 10, border: "1px solid #D3D6DA", borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #D3D6DA", borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
        />

        <button
          onClick={submit} disabled={busy || !email || !password}
          style={{ width: "100%", padding: "11px", background: "#15171C", color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: busy ? 0.5 : 1 }}
        >
          {busy ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
        </button>

        {msg && <p style={{ fontSize: 13, color: "#6E7480", marginTop: 14 }}>{msg}</p>}

        <p style={{ fontSize: 13, color: "#6E7480", marginTop: 20, textAlign: "center" }}>
          {mode === "signin" ? "No account yet? " : "Already have one? "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
            style={{ background: "none", border: "none", color: "#15171C", fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
