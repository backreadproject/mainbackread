"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlanForm({ targetUserId, scope, currentPlan, subscriptionActive, orgName }: {
  targetUserId: string; scope: "org" | "personal"; currentPlan: string; subscriptionActive: boolean; orgName: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [sub, setSub] = useState(subscriptionActive);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/set-plan", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetUserId, scope, plan: plan.trim(), subscriptionActive: sub }),
    });
    setBusy(false);
    if (res.ok) { setMsg("Saved."); router.refresh(); }
    else { const j = await res.json().catch(() => ({})); setMsg(j.error || "Failed."); }
  }

  const input = { background: "#0B0F0D", color: "#E7EDEA", border: "1px solid #2A3A32", borderRadius: 8, padding: "8px 10px", fontSize: 13 } as const;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      {scope === "org" && orgName && <span style={{ fontSize: 12, color: "#93A79C" }}>Org: {orgName}</span>}
      <label style={{ fontSize: 12, color: "#93A79C" }}>Plan id{" "}
        <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="free / personal / company_1 / company_2" style={{ ...input, width: 240 }} />
      </label>
      {scope === "org" && (
        <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={sub} onChange={(e) => setSub(e.target.checked)} /> subscription active
        </label>
      )}
      <button onClick={save} disabled={busy} style={{ background: "#1FA971", color: "#04120B", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
        {busy ? "Saving…" : "Save"}
      </button>
      {msg && <span style={{ fontSize: 12, color: msg === "Saved." ? "#33E6A2" : "#F1A5A5" }}>{msg}</span>}
    </div>
  );
}
