"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Notif = { id: string; type: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };
const PANEL_WIDTH = 300;
export default function NotificationBell() {
  const locale = useLocale();
  const nt = getDict(locale).notifications;
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  async function load() {
    try {
      const res = await fetch("/api/notifications");
      const d = await res.json();
      setNotifs(d.notifications ?? []);
      setUnread(d.unread ?? 0);
    } catch {}
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && ref.current.contains(t)) return;
      // The panel is portalled to body, so it is not inside ref.current any more.
      if (panelRef.current && panelRef.current.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  // The sidebar clips overflow and sits in its own stacking context, so an absolutely
  // positioned dropdown gets cut off and painted under the main column. Positioning the
  // panel as fixed (measured off the bell) lets it escape both.
  function place() {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // The panel is wider than the 232px sidebar, so anchoring it to the bell leaves it
    // straddling the edge. On desktop, start it just past the sidebar so it reads as one
    // clean surface over the content. On mobile the sidebar is a drawer, so anchor as usual.
    const SIDEBAR = 232;
    const desktop = window.innerWidth > 1024;
    const preferred = desktop ? SIDEBAR + 8 : rect.left;
    const left = Math.max(12, Math.min(preferred, window.innerWidth - PANEL_WIDTH - 12));
    setPos({ top: rect.bottom + 8, left });
  }
  function toggle() {
    if (!open) place();
    setOpen((v) => !v);
  }
  useEffect(() => {
    if (!open) return;
    const reposition = () => place();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => { window.removeEventListener("resize", reposition); window.removeEventListener("scroll", reposition, true); };
  }, [open]);
  async function markAll() {
    await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) });
    setNotifs((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    setUnread(0);
  }
  async function openNotif(n: Notif) {
    if (!n.read_at) {
      await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: n.id }) });
      setUnread((u) => Math.max(0, u - 1));
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
    }
    if (n.link) window.location.href = n.link;
  }
  function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return nt.justNow;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  }
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button ref={btnRef} onClick={toggle} aria-label={nt.title} style={{ position: "relative", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        {unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--rp-danger)", color: "var(--rp-on-accent)", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && createPortal(
        <div ref={panelRef} style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, width: PANEL_WIDTH, maxWidth: "calc(100vw - 24px)", background: "var(--rp-card)", border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 12px 40px rgba(15,23,41,0.16)", zIndex: 1000, overflow: "hidden", fontFamily: T.font }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{nt.title}</span>
            {unread > 0 && <button onClick={markAll} style={{ background: "none", border: "none", color: T.green, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>{nt.markAllRead}</button>}
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, padding: "24px 14px", textAlign: "center", margin: 0 }}>{nt.empty}</p>
            ) : notifs.map((n) => (
              <button key={n.id} onClick={() => openNotif(n)} style={{ display: "block", width: "100%", textAlign: "left", background: n.read_at ? "var(--rp-card)" : T.greenSoft, border: "none", borderBottom: `1px solid ${T.border}`, padding: "12px 14px", cursor: "pointer", fontFamily: T.font }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.heading }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p style={{ fontSize: 12, color: T.body, margin: 0, lineHeight: 1.4 }}>{n.body}</p>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


