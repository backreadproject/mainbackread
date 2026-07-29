"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { postJson, errMsg } from "@/lib/fetch-json";
import { PLANS } from "@/lib/plans";
const PERSONAL_PLANS: [string, string][] = [["free", PLANS.free.name], ["personal", PLANS.personal.name]];
const ORG_PLANS: [string, string][] = [["team", PLANS.team.name], ["business", PLANS.business.name]];
export default function PlanForm({ targetUserId, scope, currentPlan, subscriptionActive, orgName }: {
  targetUserId: string; scope: "org" | "personal"; currentPlan: string; subscriptionActive: boolean; orgName: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [sub, setSub] = useState(subscriptionActive);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const options = scope === "org" ? ORG_PLANS : PERSONAL_PLANS;
  async function save() {
    setBusy(true); setMsg("");
    try {
      await postJson("/api/admin/set-plan", { targetUserId, scope, plan, subscriptionActive: sub });
      setOk(true); setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setOk(false); setMsg(errMsg(e, "Failed."));
    } finally {
      setBusy(false);
    }
  }
  const field = { height: 34, boxSizing: "border-box" as const, background: T.card, color: T.heading, border: "1px solid " + T.border, borderRadius: T.rInput, padding: "0 10px", fontSize: 13.5, fontFamily: T.font } as const;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
      {scope === "org" && orgName && <span style={{ fontSize: 12.5, color: T.muted, paddingBottom: 9 }}>Org: {orgName}</span>}
      <label style={{ fontSize: 12.5, color: T.muted, display: "flex", flexDirection: "column", gap: 5 }}>Plan
        <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{ ...field, width: 200 }}>
          {options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      {scope === "org" && (
        <label style={{ fontSize: 13.5, color: T.body, display: "flex", gap: 8, alignItems: "center", paddingBottom: 9, cursor: "pointer" }}>
          <input type="checkbox" checked={sub} onChange={(e) => setSub(e.target.checked)} style={{ width: 15, height: 15, accentColor: T.green, cursor: "pointer" }} /> Subscription active
        </label>
      )}
      <button onClick={save} disabled={busy} style={{ height: 34, background: T.green, color: T.onAccent, border: "none", borderRadius: T.rBtn, padding: "0 13px", fontSize: 13.5, fontWeight: 500, fontFamily: T.font, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Saving..." : "Save"}</button>
      {msg && <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: ok ? T.greenText : T.dangerText, paddingBottom: 9 }}>
        <i style={{ width: 6, height: 6, borderRadius: 2, background: ok ? T.green : T.danger }} />{msg}
      </span>}
    </div>
  );
}