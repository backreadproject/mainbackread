"use client";

import { useState, useEffect } from "react";
import { T } from "@/lib/theme";

// Wraps the sidebar. On desktop (>1024px) the sidebar is static.
// On mobile/tablet (<=1024px) it becomes a slide-in drawer with a hamburger.
export default function MobileShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Close on browser back.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  return (
    <div className={`app-shell${open ? " drawer-open" : ""}`}>
      <style>{`
        .app-shell { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: ${T.canvas}; }
        .app-topbar { display: none; }
        .app-body { display: flex; flex: 1; min-height: 0; }
        .app-sidebar-wrap { flex-shrink: 0; }
        .app-content { flex: 1; min-width: 0; overflow-y: auto; }
        .app-scrim { display: none; }

        @media (max-width: 1024px) {
          .app-topbar {
            display: flex; align-items: center; gap: 12px;
            height: 54px; flex-shrink: 0; padding: 0 16px;
            background: #0F1B2D; position: relative; z-index: 50;
          }
          .app-body { position: relative; }
          .app-sidebar-wrap {
            position: fixed; top: 0; left: 0; height: 100vh; z-index: 60;
            transform: translateX(-100%); transition: transform .25s ease;
          }
          .app-shell.drawer-open .app-sidebar-wrap { transform: translateX(0); }
          .app-scrim {
            display: block; position: fixed; inset: 0; z-index: 55;
            background: rgba(15,23,41,0.5); opacity: 0; pointer-events: none;
            transition: opacity .25s ease;
          }
          .app-shell.drawer-open .app-scrim { opacity: 1; pointer-events: auto; }
        }
      `}</style>

      <div className="app-topbar">
        <button onClick={() => setOpen(true)} aria-label="Open menu" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <span style={{ color: "#fff", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1FA971" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="#1FA971" /></svg>
          BackRead
        </span>
      </div>

      <div className="app-body">
        <div className="app-scrim" onClick={() => setOpen(false)} />
        <div className="app-sidebar-wrap" onClick={() => setOpen(false)}>
          {sidebar}
        </div>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
