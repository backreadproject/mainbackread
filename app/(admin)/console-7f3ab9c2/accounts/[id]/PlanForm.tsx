"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, primaryBtn } from "@/lib/theme";

const PERSONAL_PLANS = [["free", "Free"], ["personal", "Personal"]];
const ORG_PLANS = [["company_1", "Company I"], ["company_2", "Company II"]];

export default function PlanForm({ targetUserId, scope, currentPlan, subscriptionActive, orgName }: {
  targetUserId: string; scope: "org" | "personal"; currentPlan: string; subscriptionActive: boolean; orgName: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [sub, setSub] = useState(subscriptionActive);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const options = scope === "org" ? ORG_PLANS : PERSONAL_PLANS;

  async function save() {
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/set-plan", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetUserId, scope, plan, subscriptionActive: sub }),
    });
    setBusy(false);
    if (res.ok) { setMsg("Saved."); router.refresh(); }
    else { const j = await res.json().catch(() => ({})); setMsg(j.error || "Failed."); }
  }

  const field = { background: "#fff", color: T.heading, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "9px 11px", fontSize: 14, fontFamily: T.font } as const;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
      {scope === "org" && orgName && <span style={{ fontSize: 12, color: T.muted, paddingBottom: 10 }}>Org: {orgName}</span>}
      <label style={{ fontSize: 12, color: T.body, display: "flex", flexDirection: "column", gap: 5 }}>Plan
        <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{ ...field, width: 200 }}>
          {options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      {scope === "org" && (
        <label style={{ fontSize: 13, color: T.body, display: "flex", gap: 7, alignItems: "center", paddingBottom: 10 }}>
          <input type="checkbox" checked={sub} onChange={(e) => setSub(e.target.checked)} /> subscription active
        </label>
      )}
      <button onClick={save} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving\u2026" : "Save"}</button>
      {msg && <span style={{ fontSize: 12, color: msg === "Saved." ? T.greenText : "#B42318", paddingBottom: 10 }}>{msg}</span>}
    </div>
  );
}
