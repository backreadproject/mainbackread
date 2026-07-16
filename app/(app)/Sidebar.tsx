"use client";

import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INK = "#1A1D21", PAPER = "#F7F6F3", SURFACE = "#FFFFFF", MARK = "#C4442E", GRAPHITE = "#8A8778", RULE = "#E4E2DB";
const AEON = "'Aeonik', Arial, sans-serif";

const NAV = [
  { href: "/documents", label: "Documents", icon: "M4 4h10l4 4v12H4z M14 4v4h4" },
  { href: "/recipients", label: "Recipients", icon: "M8 11a3 3 0 100-6 3 3 0 000 6z M2 20a6 6 0 0112 0 M16 11a3 3 0 100-6 M22 20a6 6 0 00-4-5.6" },
  { href: "/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19 12l2 1-1 3-2-0.5a7 7 0 01-2 1L17 20h-3l-1-1.5a7 7 0 01-2-1L9 18l-2-3 1.5-1.5a7 7 0 010-2L5 9l2-3 2 0.5a7 7 0 012-1L14 4h3l-0 1.5a7 7 0 012 1" },
  { href: "/account", label: "Account", icon: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0" },
];

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const mono = { fontFamily: AEON, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: GRAPHITE };

  return (
    <aside style={{ width: 232, borderRight: `1px solid ${RULE}`, background: PAPER, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
      <style>{`.br-nav{transition:background .12s,color .12s}.br-nav:hover{background:#EFEDE6}`}</style>

      <div style={{ padding: "22px 22px 18px" }}>
        <div style={{ fontFamily: AEON, fontSize: 21, fontWeight: 500, letterSpacing: "-0.01em", color: INK }}>BackRead</div>
        <div style={{ ...mono, fontSize: 10, marginTop: 2 }}>Instrument</div>
      </div>

      <nav style={{ flex: 1, padding: "6px 12px" }}>
        {NAV.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <a key={n.href} href={n.href} className="br-nav"
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 3, textDecoration: "none",
                color: active ? INK : "#54534E", background: active ? SURFACE : "transparent",
                border: active ? `1px solid ${RULE}` : "1px solid transparent", fontSize: 14, fontFamily: AEON, fontWeight: active ? 500 : 400, marginBottom: 2 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? MARK : GRAPHITE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              {n.label}
            </a>
          );
        })}
      </nav>

      <div style={{ borderTop: `1px solid ${RULE}`, padding: 16 }}>
        <div style={{ fontSize: 12, color: GRAPHITE, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
        <button onClick={signOut} className="br-nav" style={{ width: "100%", textAlign: "left", background: "none", border: `1px solid ${RULE}`, borderRadius: 3, padding: "8px 12px", fontSize: 13, fontFamily: AEON, color: INK, cursor: "pointer" }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
