"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import NotificationBell from "@/app/(app)/NotificationBell";

const NAV_MAIN = [
  { href: "/overview", label: "Overview", d: "M4 4h7v7H4z M13 4h7v4h-7z M13 11h7v9h-7z M4 14h7v6H4z" },
  { href: "/documents", label: "Documents", d: "M5 3h8l4 4v14H5z M13 3v4h4" },
  { href: "/projects", label: "Projects", d: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  { href: "/activity", label: "Activity", d: "M3 12h4l3 8 4-16 3 8h4" },
  { href: "/recipients", label: "Recipients", d: "M8 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M22 20a6 6 0 00-4-5.6" },
];
const NAV_CONFIG = [
  { href: "/members", label: "Members", d: "M8 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M22 20a6 6 0 00-4-5.6" },
  { href: "/settings", label: "Settings", d: "M12 9a3 3 0 100 6 3 3 0 000-6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" },
  { href: "/account", label: "Account", d: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0" },
];

export default function Sidebar({ email, workspaceName, isOrg = false, avatarUrl = null }: { email: string; workspaceName?: string; isOrg?: boolean; avatarUrl?: string | null }) {
  const pathname = usePathname();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  const initial = (email[0] ?? "?").toUpperCase();
  const wsInitial = (workspaceName?.trim()?.[0] ?? "B").toUpperCase();
  const ws = workspaceName?.trim() || "BackRead";

  const item = (n: { href: string; label: string; d: string }) => {
    const active = pathname === n.href || pathname.startsWith(n.href + "/");
    return (
      <a key={n.href} href={n.href} className="t-nav"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, textDecoration: "none",
          color: active ? T.sidebarTextActive : T.sidebarText, background: active ? T.sidebarActive : "transparent", fontSize: 14, fontWeight: active ? 600 : 400, marginBottom: 3 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={n.d} /></svg>
        {n.label}
      </a>
    );
  };

  const section = (label: string) => (
    <div style={{ fontSize: 10, color: T.sidebarSection, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, padding: "0 6px 8px", marginTop: 14 }}>{label}</div>
  );

  return (
    <aside style={{ width: 232, background: T.sidebarGradient, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", fontFamily: T.font, letterSpacing: T.tracking, padding: "20px 16px" }}>
      <style>{`.t-nav{transition:background .12s}.t-nav:hover{background:${T.sidebarHover}}.t-out{transition:background .12s}.t-out:hover{background:${T.sidebarHover}}`}</style>

      <a href="/" title="Back to site" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px 18px", textDecoration: "none" }}>
        <span style={{ color: T.brandGreen, fontSize: 18 }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{display:"inline-block",verticalAlign:"-0.1em"}}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg></span>
        <span style={{ color: "#fff", fontSize: 19, fontWeight: 700, letterSpacing: T.trackingTight }}>BackRead</span>
      </a>

      <div style={{ background: T.sidebarCard, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.brandGreen, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{wsInitial}</div>
        <div style={{ lineHeight: 1.2, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 9, color: T.sidebarSection, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{isOrg ? "Organization" : "Workspace"}</div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws}</div>
        </div>
        <NotificationBell />
      </div>

      <nav style={{ flex: 1 }}>
        {section("Main")}
        {NAV_MAIN.map(item)}
        {section("Configure")}
        {NAV_CONFIG.map(item)}
      </nav>

      <div style={{ borderTop: `1px solid ${T.sidebarCard}`, paddingTop: 12, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.brandGreen, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{email}</div>
        </div>
        <a href="/" className="t-out" style={{ display: "block", width: "100%", boxSizing: "border-box", textAlign: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: T.font, color: "rgba(255,255,255,0.7)", textDecoration: "none", marginBottom: 8 }}>View site</a>
        <button onClick={signOut} className="t-out" style={{ width: "100%", textAlign: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: T.font, color: "rgba(255,255,255,0.85)", cursor: "pointer" }}>Sign out</button>
      </div>
    </aside>
  );
}
