"use client";

import { useState, useEffect, useRef } from "react";
import { T } from "@/lib/theme";

type Notif = { id: string; type: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

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
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Notifications" style={{ position: "relative", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        {unread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#F04438", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div style={{ position: "absolute", top: 42, right: 0, width: 320, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 12px 40px rgba(15,23,41,0.16)", zIndex: 200, overflow: "hidden", fontFamily: T.font }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>Notifications</span>
            {unread > 0 && <button onClick={markAll} style={{ background: "none", border: "none", color: T.green, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, padding: "24px 14px", textAlign: "center", margin: 0 }}>No notifications yet.</p>
            ) : notifs.map((n) => (
              <button key={n.id} onClick={() => openNotif(n)} style={{ display: "block", width: "100%", textAlign: "left", background: n.read_at ? "#fff" : T.greenSoft, border: "none", borderBottom: `1px solid ${T.border}`, padding: "12px 14px", cursor: "pointer", fontFamily: T.font }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.heading }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p style={{ fontSize: 12, color: T.body, margin: 0, lineHeight: 1.4 }}>{n.body}</p>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
