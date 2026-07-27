"use client";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/theme";
import { LayoutGrid, FileText, Folder, Activity, Users, UsersRound, Settings, CreditCard, CircleUser, type LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import NotificationBell from "@/app/(app)/NotificationBell";
import ThemeToggle from "@/app/(app)/ThemeToggle";
import LanguageSwitcher from "@/lib/LanguageSwitcher";
type NavItem = { href: string; key: string; Icon: LucideIcon; orgOnly?: boolean };
const NAV_MAIN: NavItem[] = [
  { href: "/overview", key: "overview", Icon: LayoutGrid },
  { href: "/documents", key: "documents", Icon: FileText },
  { href: "/projects", key: "projects", Icon: Folder },
  { href: "/activity", key: "activity", Icon: Activity },
  { href: "/recipients", key: "recipients", Icon: Users },
];
const NAV_CONFIG: NavItem[] = [
  { href: "/members", key: "members", Icon: UsersRound, orgOnly: true },
  { href: "/settings", key: "settings", Icon: Settings },
  { href: "/billing", key: "billing", Icon: CreditCard },
  { href: "/account", key: "account", Icon: CircleUser },
];
export default function Sidebar({ email, workspaceName, isOrg = false, avatarUrl = null }: { email: string; workspaceName?: string; isOrg?: boolean; avatarUrl?: string | null }) {
  const pathname = usePathname();
  const locale = useLocale();
  const s = getDict(locale).sidebar;
  const label = (key: string) => (s as Record<string, string>)[key] ?? key;
  // French labels are a touch longer; shrink the footer buttons so they stay on one line.
  const outFont = locale === "fr" ? 11 : 12.5;
  const outPad = locale === "fr" ? "8px 6px" : "8px 10px";
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  const initial = (email[0] ?? "?").toUpperCase();
  const emailName = (email?.split("@")[0] ?? "").trim();
  const displayName = workspaceName?.trim() || (isOrg ? "ReadProspects" : (emailName || "ReadProspects"));
  const wsInitial = (displayName?.[0] ?? "B").toUpperCase();
  const ws = displayName;
  const item = (n: NavItem) => {
    const active = pathname === n.href || pathname.startsWith(n.href + "/");
    return (
      <a key={n.href} href={n.href} className="t-nav"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: T.rBtn, textDecoration: "none",
          color: active ? T.sidebarTextActive : T.sidebarText, background: active ? T.sidebarActive : "transparent", fontSize: 14, fontWeight: active ? 600 : 400, marginBottom: 3 }}>
        <n.Icon size={17} strokeWidth={1.75} />
        {label(n.key)}
      </a>
    );
  };
  const section = (text: string) => (
    <div style={{ fontSize: 10, color: T.sidebarSection, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, padding: "0 6px 8px", marginTop: 14 }}>{text}</div>
  );
  return (
    <aside style={{ width: 232, boxSizing: "border-box", background: T.sidebarBg, borderRight: "1px solid " + T.sidebarBorder, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", maxHeight: "100vh", overflow: "hidden", fontFamily: T.font, letterSpacing: T.tracking, padding: "20px 16px" }}>
      <style>{`.t-nav{transition:background .12s}.t-nav:hover{background:${T.sidebarHover}}.t-out{transition:background .12s}.t-out:hover{background:${T.sidebarHover}}.rp-navscroll{scrollbar-width:none;-ms-overflow-style:none}.rp-navscroll::-webkit-scrollbar{width:0;height:0;display:none}`}</style>
      <a href="/" title={label("backToSite")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px 18px", textDecoration: "none" }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
          <circle cx="12" cy="12" r="9" stroke={T.sidebarMark} strokeWidth="2.4" />
          <circle cx="12" cy="12" r="3.5" fill={T.sidebarMark} />
        </svg>
        <span style={{ color: T.sidebarBrand, fontSize: 18, fontWeight: 600, letterSpacing: T.trackingTight }}>ReadProspects</span>
      </a>
      <div style={{ background: T.sidebarCard, border: "1px solid " + T.sidebarCardBorder, borderRadius: T.rCard, padding: "9px 11px", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 5, background: T.green, color: T.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{wsInitial}</div>
        <div style={{ lineHeight: 1.25, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 9, color: T.sidebarSection, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{isOrg ? label("organization") : label("personal")}</div>
          <div style={{ fontSize: 13, color: T.sidebarBrand, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws}</div>
        </div>
        <NotificationBell />
      </div>
      <nav className="rp-navscroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {section(label("main"))}
        {NAV_MAIN.filter((n) => isOrg || !n.orgOnly).map(item)}
        {section(label("configure"))}
        {NAV_CONFIG.filter((n) => isOrg || !n.orgOnly).map(item)}
      </nav>
      <div style={{ borderTop: "1px solid " + T.sidebarBorder, paddingTop: 12, marginTop: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 5, background: T.green, color: T.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0, overflow: "hidden" }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}</div>
          <div style={{ fontSize: 11, color: T.sidebarSection, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{email}</div>
          <LanguageSwitcher current={locale} compact />
          <ThemeToggle compact />
        </div>
        <a href="https://readprospects.com/concepts" target="_blank" rel="noopener noreferrer"
          style={{ display: "block", fontSize: 11.5, color: T.sidebarSection, textDecoration: "none", marginBottom: 10 }}>
          {label("whatWordsMean")}
        </a>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="https://readprospects.com" target="_blank" rel="noopener noreferrer" className="t-out" style={{ flex: 1, boxSizing: "border-box", textAlign: "center", whiteSpace: "nowrap", background: "transparent", border: "1px solid " + T.sidebarBorder, borderRadius: T.rBtn, padding: outPad, fontSize: outFont, fontFamily: T.font, color: T.sidebarText, textDecoration: "none" }}>{label("viewSite")}</a>
          <button onClick={signOut} className="t-out" style={{ flex: 1, textAlign: "center", whiteSpace: "nowrap", background: "transparent", border: "1px solid " + T.sidebarBorder, borderRadius: T.rBtn, padding: outPad, fontSize: outFont, fontFamily: T.font, color: T.sidebarText, cursor: "pointer" }}>{label("signOut")}</button>
        </div>
      </div>
    </aside>
  );
}