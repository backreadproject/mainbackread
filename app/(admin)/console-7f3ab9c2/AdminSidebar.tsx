"use client";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { LayoutGrid, FileText, Users, Building2, Layers, LifeBuoy, ScrollText, type LucideIcon } from "lucide-react";

const ADMIN_SLUG = "console-7f3ab9c2";

type Item = { href: string; label: string; Icon: LucideIcon };

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const base = `/${ADMIN_SLUG}`;
  const NAV: Item[] = [
    { href: base, label: "Dashboard", Icon: LayoutGrid },
    { href: `${base}/documents`, label: "Documents", Icon: FileText },
    { href: `${base}/accounts`, label: "Accounts", Icon: Users },
    { href: `${base}/orgs`, label: "Organizations", Icon: Building2 },
    { href: `${base}/tiers`, label: "Tiers", Icon: Layers },
    { href: `${base}/support`, label: "Support", Icon: LifeBuoy },
    { href: `${base}/audit`, label: "Audit log", Icon: ScrollText },
  ];
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  const initial = (email[0] ?? "?").toUpperCase();
  const item = (n: Item) => {
    const active = n.href === base ? pathname === base : (pathname === n.href || pathname.startsWith(n.href + "/"));
    return (
      <a key={n.href} href={n.href} className="t-nav"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, textDecoration: "none",
          color: active ? T.sidebarTextActive : T.sidebarText, background: active ? T.sidebarActive : "transparent", fontSize: 14, fontWeight: active ? 600 : 400, marginBottom: 3 }}>
        <n.Icon size={17} strokeWidth={1.75} />
        {n.label}
      </a>
    );
  };
  return (
    <aside style={{ width: 232, boxSizing: "border-box", background: T.sidebarGradient, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", maxHeight: "100vh", overflow: "hidden", fontFamily: T.font, letterSpacing: T.tracking, padding: "20px 16px" }}>
      <style>{`.t-nav{transition:background .12s}.t-nav:hover{background:${T.sidebarHover}}.t-out{transition:background .12s}.t-out:hover{background:${T.sidebarHover}}.rp-navscroll{scrollbar-width:none;-ms-overflow-style:none}.rp-navscroll::-webkit-scrollbar{width:0;height:0;display:none}`}</style>
      <a href="/overview" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px 18px", textDecoration: "none" }}>
        <span style={{ color: T.brandGreen, fontSize: 18 }}><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" style={{display:"inline-block",verticalAlign:"-0.1em",filter:"drop-shadow(0 0 3px rgba(51,230,162,0.55))"}}><circle cx="12" cy="12" r="9" stroke="#33E6A2" strokeWidth="2.4"/><circle cx="12" cy="12" r="3.5" fill="#33E6A2"/></svg></span>
        <span style={{ color: "#fff", fontSize: 19, fontWeight: 700, letterSpacing: T.trackingTight }}>ReadProspects</span>
      </a>
      <div style={{ background: T.sidebarCard, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.brandGreen, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>A</div>
        <div style={{ lineHeight: 1.2, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 9, color: T.sidebarSection, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Console</div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Admin</div>
        </div>
      </div>
      <nav className="rp-navscroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ fontSize: 10, color: T.sidebarSection, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, padding: "0 6px 8px", marginTop: 14 }}>Admin</div>
        {NAV.map(item)}
      </nav>
      <div style={{ borderTop: `1px solid ${T.sidebarCard}`, paddingTop: 12, marginTop: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.brandGreen, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initial}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{email}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/overview" className="t-out" style={{ flex: 1, boxSizing: "border-box", textAlign: "center", whiteSpace: "nowrap", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 10px", fontSize: 13, fontFamily: T.font, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Exit to app</a>
          <button onClick={signOut} className="t-out" style={{ flex: 1, textAlign: "center", whiteSpace: "nowrap", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "9px 10px", fontSize: 13, fontFamily: T.font, color: "rgba(255,255,255,0.85)", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>
    </aside>
  );
}




