"use client";
import { useState, useEffect } from "react";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
// Wraps the sidebar. On desktop (>1024px) the sidebar is static.
// On mobile/tablet (<=1024px) it becomes a slide-in drawer with a hamburger.
//
// The aurora is gone. Two blurred radial gradients sat fixed behind every
// screen; at 90px blur they put a soft wash under every card edge and were the
// single largest reason the UI read as hazy rather than sharp.
export default function MobileShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const M = getDict(useLocale()).chrome;
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
        .app-shell { display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden; background: ${T.canvas}; }
        .app-topbar { display: none; }
        .app-body { display: flex; flex: 1; min-height: 0; }
        .app-sidebar-wrap { flex-shrink: 0; }
        .app-content { flex: 1; min-width: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; background: ${T.canvas}; }
        .app-scrim { display: none; }
        .drawer-close { display: none; }
        @media (max-width: 1024px) {
          .app-topbar {
            display: flex; align-items: center; gap: 12px;
            height: 54px; flex-shrink: 0; padding: 0 16px;
            background: ${T.sidebarBg}; border-bottom: 1px solid ${T.sidebarBorder};
            position: relative; z-index: 50;
          }
          .app-body { position: relative; }
          .app-sidebar-wrap {
            position: fixed; top: 0; left: 0; height: 100vh; height: 100dvh; z-index: 60;
            max-width: 88vw;
            transform: translateX(-100%); transition: transform .25s ease;
          }
          .app-sidebar-wrap > div { height: 100%; }
          .app-sidebar-wrap aside { height: 100dvh !important; max-height: 100dvh !important; }
          .app-shell.drawer-open .app-sidebar-wrap { transform: translateX(0); }
          .app-scrim {
            display: block; position: fixed; inset: 0; z-index: 55;
            background: ${T.scrim}; opacity: 0; pointer-events: none;
            transition: opacity .25s ease;
          }
          .app-shell.drawer-open .app-scrim { opacity: 1; pointer-events: auto; }
          .drawer-close {
            display: flex; align-items: center; justify-content: center;
            position: fixed; top: 12px; left: min(244px, 88vw); z-index: 62;
            width: 34px; height: 34px; border-radius: ${T.rBtn}px;
            background: ${T.card}; border: 1px solid ${T.border};
            color: ${T.body}; cursor: pointer;
            transform: translateX(-100%); opacity: 0; transition: transform .25s ease, opacity .25s ease;
          }
          .app-shell.drawer-open .drawer-close { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 600px) {
          .app-content main { padding-left: 16px !important; padding-right: 16px !important; }
          .app-content h1 { font-size: 21px !important; }
          .app-content .page-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
        }
      `}</style>
      <div className="app-topbar">
        <button onClick={() => setOpen(true)} aria-label={M.openMenu} style={{ background: "transparent", border: "1px solid " + T.sidebarBorder, borderRadius: T.rBtn, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sidebarText, flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <span style={{ color: T.sidebarBrand, fontSize: 16, fontWeight: 600, letterSpacing: T.trackingTight, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={T.sidebarMark} strokeWidth="2.2" /><circle cx="12" cy="12" r="3.5" fill={T.sidebarMark} /></svg>
          ReadProspects
        </span>
      </div>
      <div className="app-body">
        <div className="app-scrim" onClick={() => setOpen(false)} />
        <div className="app-sidebar-wrap">
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label={M.closeMenu}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div onClick={() => setOpen(false)} style={{ height: "100%" }}>{sidebar}</div>
        </div>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}