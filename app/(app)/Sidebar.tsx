"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INK = "#0B1220", BLUE = "#2D6BFF", BLUE_SOFT = "#EAF0FF", SLATE = "#64748B", LINE = "#E7EBF2", CARD = "#FFFFFF";
const AEON = "'Moderat', 'Inter', sans-serif";

const NAV = [
  { href: "/documents", label: "Documents", d: "M5 3h8l4 4v14H5z M13 3v4h4" },
  { href: "/activity", label: "Activity", d: "M3 12h4l3 8 4-16 3 8h4" },
  { href: "/recipients", label: "Recipients", d: "M8 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M22 20a6 6 0 00-4-5.6" },
  { href: "/settings", label: "Settings", d: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.2a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H3a2 2 0 110-4h.2A1.6 1.6 0 004.3 6l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.2a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.4 1.8z" },
  { href: "/account", label: "Account", d: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0" },
];

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <aside style={{ width: 232, background: CARD, borderRight: `1px solid ${LINE}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", fontFamily: AEON }}>
      <style>{`.fx-nav{transition:background .12s}.fx-nav:hover{background:#F4F6FA}.fx-out{transition:background .12s}.fx-out:hover{background:#F4F6FA}`}</style>
      <div style={{ padding: "22px 20px 18px", fontSize: 21, fontWeight: 500, letterSpacing: "-0.015em", color: INK }}>BackRead</div>
      <nav style={{ flex: 1, padding: "4px 12px" }}>
        {NAV.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <a key={n.href} href={n.href} className="fx-nav"
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10, textDecoration: "none", color: active ? BLUE : SLATE, background: active ? BLUE_SOFT : "transparent", fontSize: 14, fontWeight: 400, marginBottom: 3 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={n.d} /></svg>
              {n.label}
            </a>
          );
        })}
      </nav>
      <div style={{ borderTop: `1px solid ${LINE}`, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "0 4px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: BLUE_SOFT, color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 400, flexShrink: 0 }}>{initial}</div>
          <div style={{ fontSize: 12, color: SLATE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
        </div>
        <button onClick={signOut} className="fx-out" style={{ width: "100%", textAlign: "left", background: "none", border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: AEON, color: INK, cursor: "pointer" }}>Sign out</button>
      </div>
    </aside>
  );
}
