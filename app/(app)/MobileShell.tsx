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
        .drawer-close { display: none; }

        .app-content { position: relative; }
        .app-content > *:not(.app-aurora) { position: relative; z-index: 1; }
        .app-aurora { position: fixed; top: 0; left: 232px; right: 0; bottom: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .app-aurora span { position: absolute; border-radius: 50%; filter: blur(90px); }
        .app-aurora .a { width: 620px; height: 520px; left: 22%; top: -240px; background: radial-gradient(closest-side, rgba(38,113,79,0.07), transparent); animation: rpAuroraA 30s ease-in-out infinite; }
        .app-aurora .b { width: 520px; height: 520px; right: -180px; top: 36%; background: radial-gradient(closest-side, rgba(122,76,19,0.045), transparent); animation: rpAuroraB 34s ease-in-out infinite; }
        @keyframes rpAuroraA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-28px,30px)} }
        @keyframes rpAuroraB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(24px,-24px)} }
        @media (prefers-reduced-motion: reduce){ .app-aurora span{ animation:none; } }

        @media (max-width: 1024px) {
          .app-topbar {
            display: flex; align-items: center; gap: 12px;
            height: 54px; flex-shrink: 0; padding: 0 16px;
            background: #16201A; position: relative; z-index: 50;
          }
          .app-body { position: relative; }
          .app-sidebar-wrap {
            position: fixed; top: 0; left: 0; height: 100vh; height: 100dvh; z-index: 60;
            transform: translateX(-100%); transition: transform .25s ease;
          }
          .app-sidebar-wrap > div { height: 100%; }
          .app-sidebar-wrap aside { height: 100dvh !important; max-height: 100dvh !important; }
          .app-shell.drawer-open .app-sidebar-wrap { transform: translateX(0); }
          .app-scrim {
            display: block; position: fixed; inset: 0; z-index: 55;
            background: rgba(30,26,22,0.45); opacity: 0; pointer-events: none;
            transition: opacity .25s ease;
          }
          .app-shell.drawer-open .app-scrim { opacity: 1; pointer-events: auto; }
          .drawer-close {
            display: flex; align-items: center; justify-content: center;
            position: fixed; top: 12px; left: 244px; z-index: 62;
            width: 34px; height: 34px; border-radius: 8px;
            background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
            color: #fff; cursor: pointer;
            transform: translateX(-100%); opacity: 0; transition: transform .25s ease, opacity .25s ease;
          }
          .app-shell.drawer-open .drawer-close { transform: translateX(0); opacity: 1; }
          .app-aurora { left: 0; top: 54px; }
        }
      `}</style>

      <div className="app-topbar">
        <button onClick={() => setOpen(true)} aria-label="Open menu" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <span style={{ color: "#fff", fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#4FBF8E" strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill="#4FBF8E" /></svg>
          ReadProspects
        </span>
      </div>

      <div className="app-body">
        <div className="app-scrim" onClick={() => setOpen(false)} />
        <div className="app-sidebar-wrap">
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div onClick={() => setOpen(false)} style={{ height: "100%" }}>{sidebar}</div>
        </div>
        <div className="app-content"><div className="app-aurora" aria-hidden="true"><span className="a" /><span className="b" /></div>{children}</div>
      </div>
    </div>
  );
}

