"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, primaryBtn } from "@/lib/theme";

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

  const input = { background: "#fff", color: T.heading, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 11px", fontSize: 14, fontFamily: T.font } as const;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
      {scope === "org" && orgName && <span style={{ fontSize: 12, color: T.muted }}>Org: {orgName}</span>}
      <label style={{ fontSize: 12, color: T.body, display: "flex", flexDirection: "column", gap: 5 }}>Plan id
        <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="free / personal / company_1 / company_2" style={{ ...input, width: 260 }} />
      </label>
      {scope === "org" && (
        <label style={{ fontSize: 13, color: T.body, display: "flex", gap: 7, alignItems: "center", marginTop: 16 }}>
          <input type="checkbox" checked={sub} onChange={(e) => setSub(e.target.checked)} /> subscription active
        </label>
      )}
      <button onClick={save} disabled={busy} style={{ ...primaryBtn, marginTop: 16, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving\u2026" : "Save"}</button>
      {msg && <span style={{ fontSize: 12, color: msg === "Saved." ? T.greenText : "#B42318", marginTop: 16 }}>{msg}</span>}
    </div>
  );
}
