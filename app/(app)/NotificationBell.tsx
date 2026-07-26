"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { T } from "@/lib/theme";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
import { fetchJson, postJson } from "@/lib/fetch-json";
const NOTE = {
  en: {
    reader_opened: (p: Record<string, string>) => p.again
      ? [p.reader + " came back to " + p.doc, "They opened it again."]
      : [p.reader + " opened " + p.doc, "They have started reading."],
    reader_question: (p: Record<string, string>) => [p.reader + " asked about " + p.doc, p.question ?? ""],
    reader_replied: (p: Record<string, string>) => [p.reader + " replied about " + p.doc, p.preview ?? ""],
    added_to_org: (p: Record<string, string>) => ["You were added to " + p.org, "You now have access as " + p.role + "."],
    doc_shared: (p: Record<string, string>) => [p.sharer + " shared a " + p.resource + " with you", "You now have " + p.permission + " access."],
  },
  fr: {
    reader_opened: (p: Record<string, string>) => p.again
      ? [p.reader + " est revenu sur " + p.doc, "Ils l\u2019ont rouvert."]
      : [p.reader + " a ouvert " + p.doc, "La lecture a commenc\u00e9."],
    reader_question: (p: Record<string, string>) => [p.reader + " a pos\u00e9 une question sur " + p.doc, p.question ?? ""],
    reader_replied: (p: Record<string, string>) => [p.reader + " a r\u00e9pondu au sujet de " + p.doc, p.preview ?? ""],
    added_to_org: (p: Record<string, string>) => ["Vous avez \u00e9t\u00e9 ajout\u00e9 \u00e0 " + p.org, "Vous avez d\u00e9sormais l\u2019acc\u00e8s en tant que " + p.role + "."],
    doc_shared: (p: Record<string, string>) => [p.sharer + " a partag\u00e9 un " + p.resource + " avec vous", "Vous avez d\u00e9sormais l\u2019acc\u00e8s " + p.permission + "."],
  },
} as const;
/** Falls back to the stored English text when a row predates params. */
function render(n: { type: string; title: string; body: string | null; params: Record<string, string> | null }, locale: "en" | "fr"): [string, string] {
  if (!n.params) return [n.title, n.body ?? ""];
  const fn = (NOTE[locale] as Record<string, (p: Record<string, string>) => string[]>)[n.type];
  if (!fn) return [n.title, n.body ?? ""];
  const [title, body] = fn(n.params);
  return [title, body];
}
type Notif = { id: string; type: string; title: string; body: string | null; link: string | null; params: Record<string, string> | null; read_at: string | null; created_at: string };
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
  // Polls every 30s, so a failure is silent on purpose: an error banner that
  // reappears twice a minute is worse than a bell that quietly stays stale.
  async function load() {
    try {
      const d = await fetchJson<{ notifications?: Notif[]; unread?: number }>("/api/notifications", {}, 20000);
      setNotifs(d.notifications ?? []);
      setUnread(d.unread ?? 0);
    } catch {}
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
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
    setNotifs((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    setUnread(0);
    try { await postJson("/api/notifications", { all: true }, 20000); } catch { load(); }
  }
  async function openNotif(n: Notif) {
    if (!n.read_at) {
      setUnread((u) => Math.max(0, u - 1));
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
      try { await postJson("/api/notifications", { id: n.id }, 20000); } catch {}
    }
    if (n.link) window.location.href = n.link;
  }
  function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return nt.justNow;
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    return Math.floor(s / 86400) + "d";
  }
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* This button used to be styled with rgba white values from the old dark
          sidebar. On a light sidebar that is white on white: invisible. */}
      <button ref={btnRef} onClick={toggle} aria-label={nt.title} title={nt.title}
        style={{ position: "relative", background: "transparent", border: "1px solid " + T.sidebarBorder, borderRadius: T.rBtn, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sidebarText, flex: "none" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        {unread > 0 && <span style={{ position: "absolute", top: -5, right: -5, background: T.danger, color: T.onAccent, fontSize: 10, fontWeight: 600, minWidth: 15, height: 15, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && createPortal(
        <div ref={panelRef} style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, width: PANEL_WIDTH, maxWidth: "calc(100vw - 24px)", background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, zIndex: 1000, overflow: "hidden", fontFamily: T.font }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: T.soft, borderBottom: "1px solid " + T.border }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.body }}>{nt.title}</span>
            {unread > 0 && <button onClick={markAll} style={{ background: "none", border: "none", color: T.greenText, fontSize: 12.5, cursor: "pointer", fontFamily: T.font, padding: 0, borderBottom: "1px solid " + T.greenBorder }}>{nt.markAllRead}</button>}
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifs.length === 0 ? (
              <p style={{ fontSize: 13, color: T.muted, padding: "24px 14px", textAlign: "center", margin: 0 }}>{nt.empty}</p>
            ) : notifs.map((n, i) => (
              <button key={n.id} onClick={() => openNotif(n)} style={{ display: "block", width: "100%", textAlign: "left", background: T.card, border: "none", borderBottom: i < notifs.length - 1 ? "1px solid " + T.borderSoft : "none", padding: "11px 14px", cursor: "pointer", fontFamily: T.font }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2, alignItems: "baseline" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: n.read_at ? 400 : 600, color: T.heading, minWidth: 0 }}>
                    <i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: n.read_at ? "transparent" : T.green }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{render(n, locale)[0]}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: T.faint, whiteSpace: "nowrap", flex: "none" }}>{timeAgo(n.created_at)}</span>
                </div>
                {render(n, locale)[1] && <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 0 13px", lineHeight: 1.45 }}>{render(n, locale)[1]}</p>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}