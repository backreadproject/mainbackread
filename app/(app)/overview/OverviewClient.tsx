"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, microLabel, statTile, statTileInk, statTileSub } from "@/lib/theme";
import { Eye, MessageSquare, FileText } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";
type Reader = { id: string; name: string; doc: string; opens: number; questions: number; lastAt: string; intent: number; replied?: boolean };
type Stats = { documents: number; recipients: number; reads: number; questions: number };
type Ev = { text: string; at: string; kind: string };
type Doc = { id: string; title: string; reads: number; spark: number[] };
type Sel = { id: string; name: string; doc: string; ini: string; verdict: { label: string; cls: string }; reads: number; questions: number; last: string; why: string; left: number; top: number };
const READY = 0.78;
const WARM = 0.4;
// Canvas paints with literal colour strings and cannot resolve CSS variables,
// so the palette is read out of the document once and re-read whenever the
// theme class on <html> changes. Without this the field keeps painting light
// colours on a dark card.
type Pal = { green: string; greenText: string; amber: string; faint: string; muted: string; body: string; heading: string; card: string; border: string; soft: string };
const FALLBACK: Pal = { green: "#1F6F4A", greenText: "#14603C", amber: "#B54708", faint: "#98A2B3", muted: "#667085", body: "#344054", heading: "#101828", card: "#FFFFFF", border: "#E4E7EC", soft: "#F9FAFB" };
function readPalette(): Pal {
  if (typeof window === "undefined") return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    green: v("--rp-green", FALLBACK.green),
    greenText: v("--rp-green-text", FALLBACK.greenText),
    amber: v("--rp-amber", FALLBACK.amber),
    faint: v("--rp-faint", FALLBACK.faint),
    muted: v("--rp-muted", FALLBACK.muted),
    body: v("--rp-body", FALLBACK.body),
    heading: v("--rp-heading", FALLBACK.heading),
    card: v("--rp-card", FALLBACK.card),
    border: v("--rp-border", FALLBACK.border),
    soft: v("--rp-soft", FALLBACK.soft),
  };
}
function rgba(hex: string, a: number) {
  const h = hex.replace("#", "").trim();
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return "rgba(0,0,0," + a + ")";
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}
export default function OverviewClient({ stats, recentEvents, readers, documents, hasData }: { stats: Stats; recentEvents: Ev[]; readers: Reader[]; documents: Doc[]; hasData: boolean }) {
  const locale = useLocale();
  const fr = locale === "fr";
  const o = getDict(locale).overviewPage;
  const L = {
    live: fr ? "EN DIRECT" : "LIVE",
    eyebrow: fr ? "En direct \u00b7 champ d\u2019intention" : "Live \u00b7 intent field",
    room: fr ? "Votre salle, en ce moment" : "Your room, right now",
    readersWord: fr ? "lecteurs" : "readers",
    ready: fr ? "Pr\u00eats \u00e0 avancer" : "Ready to move",
    seeAll: fr ? "Voir tout" : "See all",
    recent: fr ? "Lectures r\u00e9centes" : "Recent reads",
    allActivity: fr ? "Activit\u00e9" : "All activity",
    yourDocs: fr ? "Vos documents" : "Your documents",
    allDocs: fr ? "Tous" : "All documents",
    readsWord: fr ? "lectures" : "reads",
    newDoc: fr ? "Nouveau document" : "New document",
    seeProfile: fr ? "Voir le profil complet" : "See full profile",
    vReady: fr ? "Pr\u00eat \u00e0 avancer" : "Ready to move",
    vWarm: fr ? "En int\u00e9r\u00eat" : "Warming",
    vGlance: fr ? "Simple coup d\u2019\u0153il" : "Just glanced",
    bReads: fr ? "lectures" : "reads",
    bQ: "questions",
    bLast: fr ? "vu" : "last seen",
    lReady: fr ? "Pr\u00eat" : "Ready",
    lWarm: fr ? "En int\u00e9r\u00eat" : "Warming",
    lGlance: fr ? "Coup d\u2019\u0153il" : "Glanced",
      vReplied: fr ? "A r\u00e9pondu" : "Replied",
      lReplied: fr ? "A r\u00e9pondu" : "Replied",
      whyReplied: fr ? "Vous a \u00e9crit. Lisez ses mots." : "Wrote back to you. Read their words.",
    reading: fr ? "lit en ce moment" : "is reading now",
    askedQ: fr ? "a pos\u00e9 une question" : "asked a question",
    aReader: fr ? "Un lecteur" : "A reader",
    none: fr ? "Aucune activit\u00e9 pour l\u2019instant." : "No activity yet.",
    empty: fr ? "Partagez un document pour voir vos lecteurs arriver." : "Share a document to watch your readers arrive.",
    sDocuments: "Documents",
    sRecipients: fr ? "Destinataires" : "Recipients",
    sReads: fr ? "Lectures" : "Reads",
    sQuestions: "Questions",
  };
  function greeting() { const h = new Date().getHours(); if (h < 12) return o.goodMorning; if (h < 18) return o.goodAfternoon; return o.goodEvening; }
  function ago(iso: string) { if (!iso) return "\u2014"; const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return o.justNow; if (s < 3600) return Math.floor(s / 60) + "m"; if (s < 86400) return Math.floor(s / 3600) + "h"; return Math.floor(s / 86400) + "d"; }
  const today = new Date().toLocaleDateString(fr ? "fr-FR" : undefined, { weekday: "long", month: "short", day: "numeric" });
  const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  function verdict(intent: number, replied?: boolean) { if (replied) return { label: L.vReplied, cls: "replied" }; if (intent >= READY) return { label: L.vReady, cls: "ready" }; if (intent >= WARM) return { label: L.vWarm, cls: "warm" }; return { label: L.vGlance, cls: "glanced" }; }
  function whyOf(op: number, q: number, replied?: boolean) {
    if (replied) return L.whyReplied;
    if (q >= 1 && op >= 2) return fr ? "A relu le document et pos\u00e9 une question." : "Reread it and asked a question.";
    if (op >= 3) return fr ? "Est revenu trois fois." : "Came back three times.";
    if (op >= 2) return fr ? "L\u2019a lu deux fois." : "Read it twice.";
    if (op >= 1) return fr ? "L\u2019a ouvert une fois." : "Opened it once.";
    return fr ? "Pas encore ouvert." : "Not opened yet.";
  }
  const [readsN, setReadsN] = useState(stats.reads);
  const [questionsN, setQuestionsN] = useState(stats.questions);
  const [events, setEvents] = useState<Ev[]>(recentEvents);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<Sel | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const selIdxRef = useRef<number>(-1);
  const readyCountRef = useRef<HTMLSpanElement | null>(null);
  const palRef = useRef<Pal>(FALLBACK);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flashToast(txt: string) { setToast(txt); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 3200); }
  const readyList = readers.filter((r) => r.replied || r.intent >= READY).sort((a, b) => b.intent - a.intent).slice(0, 3);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !hasData) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    palRef.current = readPalette();
    const obs = new MutationObserver(() => { palRef.current = readPalette(); });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    // Canvas resolves font families itself and cannot read CSS variables, so the
    // real loaded family has to be named here. DM Sans is long gone.
    const CANVAS_SANS = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
    const CANVAS_MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() { const r = cv!.getBoundingClientRect(); if (!r.width) return; W = r.width; H = r.height; cv!.width = W * dpr; cv!.height = H * dpr; ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); cx = W / 2; cy = H / 2; R = Math.min(W, H) / 2 - 16; }
    window.addEventListener("resize", resize);
    type Node = Reader & { ang: number; spin: number; wob: number; wobA: number; r: number; tr: number; x: number; y: number; _h?: boolean };
    // Ready readers all sit near the centre, so seeding their angles evenly
    // instead of randomly stops three of them landing on top of each other.
    const nodes: Node[] = readers.map((rd, i) => ({ ...rd, ang: (i / Math.max(readers.length, 1)) * Math.PI * 2 + Math.random() * 0.4, spin: (Math.random() * 2 - 1) * 0.00022 * (1 + rd.intent), wob: Math.random() * Math.PI * 2, wobA: 6 + Math.random() * 10, r: 0, tr: 0, x: 0, y: 0 }));
    const targetR = (v: number) => R * (0.3 + (1 - Math.min(v, 1)) * 0.64);
    let ripples: { x: number; y: number; r: number; a: number }[] = [];
    const t0 = performance.now();
    let mx = -999, my = -999, raf = 0;
    cv.addEventListener("mousemove", (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; cv.style.cursor = nodes.some((n) => Math.hypot(mx - n.x, my - n.y) < 14) ? "pointer" : "default"; });
    cv.addEventListener("mouseleave", () => { mx = my = -999; });
    cv.addEventListener("click", (e) => {
      const r = cv.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      let hit = -1, best = 16;
      nodes.forEach((n, i) => { const d = Math.hypot(px - n.x, py - n.y); if (d < best) { best = d; hit = i; } });
      if (hit >= 0) {
        selIdxRef.current = hit;
        const n = nodes[hit];
        const wrap = (cv.parentElement as HTMLElement).getBoundingClientRect();
        const nx = r.left + n.x - wrap.left, ny = r.top + n.y - wrap.top;
        const pw = 266, ph = 196;
        let left = nx + 16; if (left + pw > wrap.width - 6) left = nx - 16 - pw;
        left = Math.max(6, Math.min(left, wrap.width - pw - 6));
        const top = Math.max(6, Math.min(ny - ph / 2, wrap.height - ph - 6));
        setSelected({ id: n.id, name: n.name, doc: n.doc, ini: initials(n.name), verdict: verdict(n.intent, n.replied), reads: n.opens, questions: n.questions, last: ago(n.lastAt), why: whyOf(n.opens, n.questions, n.replied), left, top });
      } else { selIdxRef.current = -1; setSelected(null); }
    });
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase.channel("rp-overview-signals").on("postgres_changes", { event: "INSERT", schema: "public", table: "signals" }, (payload) => {
        const row = payload.new as { recipient_id?: string; kind?: string } | undefined;
        if (!row) return;
        const node = nodes.find((n) => n.id === row.recipient_id);
        const isQ = row.kind === "question";
        if (node) { node.intent = Math.min(0.98, node.intent + (isQ ? 0.16 : 0.1)); ripples.push({ x: node.x, y: node.y, r: 6, a: 0.55 }); }
        const name = node?.name || L.aReader;
        const now = new Date().toISOString();
        if (isQ) { setQuestionsN((q) => q + 1); setEvents((ev) => [{ text: name + " " + L.askedQ, at: now, kind: "question" }, ...ev].slice(0, 6)); flashToast(name + " " + L.askedQ); }
        else { setReadsN((r) => r + 1); setEvents((ev) => [{ text: name + " " + L.reading, at: now, kind: "opened" }, ...ev].slice(0, 6)); flashToast(name + " " + L.reading); }
      }).subscribe();
    } catch { /* realtime not enabled, ambient only */ }
    type Box = { x1: number; y1: number; x2: number; y2: number };
    function frame(now: number) {
      const P = palRef.current;
      const t = (now - t0) / 1000;
      ctx!.clearRect(0, 0, W, H);
      ctx!.save();
      const ringAlpha = [0.55, 0.4, 0.28];
      [0.34, 0.62, 0.92].forEach((rr, ri) => {
        ctx!.beginPath();
        ctx!.arc(cx, cy, R * rr, 0, 7);
        ctx!.strokeStyle = rgba(P.green, ringAlpha[ri]);
        ctx!.setLineDash([6, 6]);
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
      });
      ctx!.setLineDash([]);
      ctx!.strokeStyle = rgba(P.green, 0.28); ctx!.lineWidth = 1;
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 + t * 0.03; ctx!.beginPath(); ctx!.moveTo(cx, cy); ctx!.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx!.stroke(); }
      ctx!.restore();
      ctx!.font = "600 10px " + CANVAS_MONO; ctx!.textAlign = "center";
      const bands: [string, number][] = [
        [fr ? "PR\u00caT" : "READY", 0.34],
        [fr ? "INT\u00c9R\u00caT" : "WARMING", 0.62],
        [fr ? "COUP D\u2019\u0152IL" : "GLANCED", 0.92],
      ];
      for (const [label, rr] of bands) {
        const ly = cy - R * rr + 13;
        const lw = ctx!.measureText(label).width;
        ctx!.fillStyle = P.card;
        ctx!.fillRect(cx - lw / 2 - 5, ly - 9, lw + 10, 13);
        ctx!.fillStyle = P.body;
        ctx!.fillText(label, cx, ly);
      }
      const readyN = nodes.filter((x) => x.intent >= READY).length;
      ctx!.beginPath(); ctx!.arc(cx, cy, 23, 0, 7); ctx!.fillStyle = P.card; ctx!.fill(); ctx!.lineWidth = 1; ctx!.strokeStyle = P.border; ctx!.stroke();
      ctx!.fillStyle = P.greenText; ctx!.font = "600 17px " + CANVAS_SANS; ctx!.fillText(String(readyN), cx, cy - 2);
      ctx!.fillStyle = P.muted; ctx!.font = "8px " + CANVAS_MONO; ctx!.fillText(fr ? "PR\u00caT" : "READY", cx, cy + 13);
      if (readyCountRef.current) readyCountRef.current.textContent = String(readyN);
      const boxes: Box[] = [{ x1: cx - 30, y1: cy - 30, x2: cx + 30, y2: cy + 30 }];
      const clash = (b: Box) => boxes.some((o2) => !(b.x2 < o2.x1 || b.x1 > o2.x2 || b.y2 < o2.y1 || b.y1 > o2.y2));
      nodes.forEach((n, i) => {
        const sel = i === selIdxRef.current;
        n.tr = targetR(n.intent); n.r += (n.tr - n.r) * (reduce || sel ? 0 : 0.045);
        if (!reduce && !sel) { n.ang += n.spin; n.wob += 0.01; }
        const wob = reduce ? 0 : Math.sin(n.wob) * (n.wobA / Math.max(n.r, 40)) * 0.5;
        const a = n.ang + wob; n.x = cx + Math.cos(a) * n.r; n.y = cy + Math.sin(a) * n.r;
        const ready = n.intent >= READY, warm = n.intent >= WARM && !ready;
        const replied = !!n.replied;
        const col = replied || ready ? P.green : warm ? P.amber : P.faint; const size = replied ? 8.5 : ready ? 7 : warm ? 5.5 : 4.5;
        if (replied) { ctx!.beginPath(); ctx!.arc(n.x, n.y, size + 5, 0, 7); ctx!.strokeStyle = rgba(P.green, 0.5); ctx!.lineWidth = 1.6; ctx!.stroke(); }
        if (ready) { const pr = reduce ? 0 : Math.sin(t * 2 + n.wob) * 0.5 + 0.5; ctx!.beginPath(); ctx!.arc(n.x, n.y, size + 4 + pr * 6, 0, 7); ctx!.strokeStyle = rgba(P.green, 0.3 * (1 - pr)); ctx!.lineWidth = 1.2; ctx!.stroke(); ctx!.beginPath(); ctx!.moveTo(cx, cy); ctx!.lineTo(n.x, n.y); ctx!.strokeStyle = rgba(P.green, 0.26); ctx!.setLineDash([2, 4]); ctx!.lineWidth = 1; ctx!.stroke(); ctx!.setLineDash([]); }
        ctx!.beginPath(); ctx!.arc(n.x, n.y, size, 0, 7); ctx!.fillStyle = col; ctx!.fill();
        if (sel) { ctx!.beginPath(); ctx!.arc(n.x, n.y, size + 7, 0, 7); ctx!.strokeStyle = P.green; ctx!.lineWidth = 2; ctx!.stroke(); }
        const d = Math.hypot(mx - n.x, my - n.y); n._h = d < 14;
        if (replied || ready || n._h) {
          const p = n.name.split(" "); const lab = p[0] + (p[1] ? " " + p[1][0] + "." : "");
          ctx!.font = "600 " + (n._h ? 11 : 10) + "px " + CANVAS_SANS; ctx!.textAlign = "center";
          const w = ctx!.measureText(lab).width;
          // Try above the node, then below. If both collide with a label that is
          // already down, drop this one rather than stack unreadable text.
          const above = n.y - size - 6, below = n.y + size + 14;
          let ty: number | null = null;
          for (const cand of n._h ? [above, below] : [above, below]) {
            const b: Box = { x1: n.x - w / 2 - 3, y1: cand - 11, x2: n.x + w / 2 + 3, y2: cand + 3 };
            if (!clash(b)) { boxes.push(b); ty = cand; break; }
          }
          if (ty !== null) { ctx!.fillStyle = n._h ? P.heading : P.body; ctx!.fillText(lab, n.x, ty); }
        }
      });
      ripples.forEach((rp) => { rp.r += 1.6; rp.a *= 0.955; ctx!.beginPath(); ctx!.arc(rp.x, rp.y, rp.r, 0, 7); ctx!.strokeStyle = rgba(P.green, rp.a); ctx!.lineWidth = 1.4; ctx!.stroke(); });
      ripples = ripples.filter((rp) => rp.a > 0.02);
      raf = requestAnimationFrame(frame);
    }
    resize(); nodes.forEach((n) => { n.r = R * 1.5; }); raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); window.removeEventListener("resize", resize); if (toastTimer.current) clearTimeout(toastTimer.current); if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readers, hasData]);  // close bubble on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) { if (!selected) return; const t = e.target as HTMLElement; if (popRef.current && popRef.current.contains(t)) return; if (t === canvasRef.current) return; selIdxRef.current = -1; setSelected(null); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selected]);
  const card = { background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.shadow } as const;
  const ch = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid " + T.border } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const chipDot = (cls: string) => (cls === "replied" ? T.green : cls === "ready" ? T.green : cls === "warm" ? T.amber : T.faint);
  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "26px 32px 60px" }}>
        <div className="ov-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 14 }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, color: T.greenText, fontFamily: mono, border: "1px solid " + T.greenBorder, background: T.greenSoft, padding: "3px 9px", borderRadius: T.rPill, marginBottom: 9 }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: T.green }} /> {L.live}
            </span>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{greeting()}</h1>
            <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>{o.subtitle}</p>
          </div>
          <div className="ov-head-r" style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: mono }}>{today}</div>
            <a href="/documents" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: T.green, color: T.onAccent, fontSize: 14, fontWeight: 500, padding: "9px 15px", borderRadius: T.rBtn, textDecoration: "none", boxShadow: T.shadow, whiteSpace: "nowrap" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg> {L.newDoc}
            </a>
          </div>
        </div>
        {!hasData ? (
          <div style={{ ...card, padding: 56, textAlign: "center" }}>
            <div style={{ fontSize: 15, color: T.body }}>{L.empty}</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }} className="ov-row">
              <section style={card}>
                <div style={{ ...ch, borderBottom: "none" }}>
                  <div><div style={{ ...microLabel, fontSize: 10, letterSpacing: "0.13em", fontFamily: mono }}>{L.eyebrow}</div><h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: "2px 0 0" }}>{L.room}</h2></div>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: mono }}><span ref={readyCountRef}>{readyList.length}</span> / {readers.length} {L.readersWord}</span>
                </div>
                <div style={{ position: "relative", padding: "0 8px 4px" }}>
                  <canvas ref={canvasRef} className="ov-field" style={{ display: "block", width: "100%", height: 470 }} />
                  {toast && (
                    <div style={{ position: "absolute", left: 18, bottom: 12, display: "flex", alignItems: "center", gap: 9, background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, padding: "9px 12px", fontSize: 12, color: T.heading, boxShadow: T.overlayShadow }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: T.green }} /> {toast}
                    </div>
                  )}
                  {selected && (
                    <div ref={popRef} style={{ position: "absolute", left: selected.left, top: selected.top, width: 266, background: T.card, border: "1px solid " + T.border, borderRadius: T.rCard, boxShadow: T.overlayShadow, padding: "14px 15px", zIndex: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 5, flex: "none", background: T.green, color: T.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 12 }}>{selected.ini}</span>
                        <div><div style={{ fontSize: 14, fontWeight: 600, color: T.heading }}>{selected.name}</div><div style={{ fontSize: 11, color: T.muted, fontFamily: mono, marginTop: 1 }}>{selected.doc}</div></div>
                          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.heading, whiteSpace: "nowrap" }}><i style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: chipDot(selected.verdict.cls) }} />{selected.verdict.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, margin: "12px 0 10px" }}>
                        {[[selected.reads, L.bReads], [selected.questions, L.bQ], [selected.last, L.bLast]].map(([v, l], k) => (
                          <div key={k} style={{ flex: 1, background: T.soft, border: "1px solid " + T.border, borderRadius: T.rPill, padding: "8px 6px", textAlign: "center" }}>
                            <b style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{v}</b>
                            <span style={{ fontSize: 10, color: T.muted }}>{l}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: T.body, lineHeight: 1.5 }}>{selected.why}</div>
                      <a href={"/recipients/" + selected.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, background: T.green, color: T.onAccent, fontSize: 12, fontWeight: 500, padding: "8px 12px", borderRadius: T.rBtn, textDecoration: "none" }}>{L.seeProfile} &rarr;</a>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 18, justifyContent: "center", padding: "4px 0 14px", fontSize: 11, color: T.muted }}>
                  <span><i style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, marginRight: 6, verticalAlign: 1, background: T.green }} />{L.lReady}</span>
                    <span><i style={{ display: "inline-block", width: 7, height: 7, borderRadius: 2, marginRight: 6, verticalAlign: 1, background: T.green, boxShadow: "0 0 0 2px " + T.greenSoft }} />{L.lReplied}</span>
                  <span><i style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, marginRight: 6, verticalAlign: 1, background: T.amber }} />{L.lWarm}</span>
                  <span><i style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, marginRight: 6, verticalAlign: 1, background: T.faint }} />{L.lGlance}</span>
                </div>
              </section>
              <section style={card}>
                <div style={ch}><h2 style={{ fontSize: 15, fontWeight: 600, color: T.heading, margin: 0 }}>{L.ready}</h2><a href="/recipients" style={{ fontSize: 13, color: T.greenText, fontWeight: 500, textDecoration: "none" }}>{L.seeAll} &rarr;</a></div>
                <div>
                  {readyList.length === 0 && <div style={{ padding: 22, fontSize: 13, color: T.muted, textAlign: "center" }}>{L.none}</div>}
                  {readyList.map((r, i) => (
                    <a key={r.id} href={"/recipients/" + r.id} className="ov-r" style={{ display: "flex", gap: 11, alignItems: "center", padding: "12px 18px", borderTop: i > 0 ? "1px solid " + T.borderSoft : "none", textDecoration: "none" }}>
                      <span style={{ width: 26, height: 26, borderRadius: 4, flex: "none", background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11 }}>{initials(r.name)}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                        <span style={{ display: "block", fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{r.doc}</span>
                      </span>
                        <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.heading, whiteSpace: "nowrap" }}><i style={{ width: 6, height: 6, borderRadius: 2, background: T.green }} />{r.replied ? L.vReplied : L.vReady}</span>
                      <span className="ov-reads" style={{ flex: "none", fontSize: 13, color: T.muted, width: 62, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.opens} {L.readsWord}</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
            {/* Stat tiles. The tone is a rule down the left edge, not a wash, and
                the label is a real muted colour rather than faded ink. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="ov-tiles">
              {([[readsN, L.sReads, "green"], [questionsN, L.sQuestions, "amber"], [stats.recipients, L.sRecipients, "indigo"], [stats.documents, L.sDocuments, "neutral"]] as [number, string, "green" | "amber" | "indigo" | "neutral"][]).map(([v, l, tone], i) => (
                <div key={i} style={statTile(tone)}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: statTileInk(tone), letterSpacing: "-0.02em", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <div style={{ fontSize: 13, color: statTileSub(tone), marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }} className="ov-row">
              <section style={card}>
                <div style={ch}><h2 style={{ fontSize: 14, fontWeight: 600, color: T.heading, margin: 0 }}>{L.recent}</h2><a href="/activity" style={{ fontSize: 13, color: T.greenText, fontWeight: 500, textDecoration: "none" }}>{L.allActivity}</a></div>
                <div>
                  {events.length === 0 && <div style={{ padding: 22, fontSize: 13, color: T.muted, textAlign: "center" }}>{L.none}</div>}
                  {events.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "12px 18px", alignItems: "flex-start", borderTop: i > 0 ? "1px solid " + T.borderSoft : "none" }}>
                      <span style={{ width: 26, height: 26, borderRadius: 4, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: e.kind === "question" ? T.indigoSoft : T.greenSoft, color: e.kind === "question" ? T.indigoText : T.greenText }}>
                        {e.kind === "question" ? <MessageSquare size={14} strokeWidth={1.9} /> : <Eye size={14} strokeWidth={1.9} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, color: T.heading, lineHeight: 1.45, overflowWrap: "anywhere" }}>{e.text}</div></div>
                      <span style={{ fontSize: 11, color: T.muted, fontFamily: mono, flexShrink: 0 }}>{ago(e.at)}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section style={card}>
                <div style={ch}><h2 style={{ fontSize: 14, fontWeight: 600, color: T.heading, margin: 0 }}>{L.yourDocs}</h2><a href="/documents" style={{ fontSize: 13, color: T.greenText, fontWeight: 500, textDecoration: "none" }}>{L.allDocs}</a></div>
                <div>
                  {documents.map((d, i) => (
                    <a key={d.id} href={"/documents/" + d.id} className="ov-r" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", textDecoration: "none", borderTop: i > 0 ? "1px solid " + T.borderSoft : "none" }}>
                      <span style={{ width: 26, height: 26, borderRadius: 4, flex: "none", background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={14} strokeWidth={1.9} /></span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: T.heading, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                      <span className="ov-spark" style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 20 }}>{d.spark.map((h, k) => <i key={k} style={{ width: 3, height: h + "%", borderRadius: 1, background: T.green }} />)}</span>
                      <span className="ov-reads" style={{ fontSize: 12, color: T.muted, fontFamily: mono, width: 62, textAlign: "right" }}>{d.reads} {L.readsWord}</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
      <style>{`
        @media (max-width: 900px){ .ov-row{ grid-template-columns: minmax(0, 1fr) !important; } .ov-tiles{ grid-template-columns: 1fr 1fr !important; } }
        .ov-r{ transition: background .12s }
        .ov-r:hover{ background: var(--rp-hover) }
        @media (max-width: 600px){
          .ov-head{ flex-direction: column !important; align-items: stretch !important; }
          .ov-head-r{ text-align: left !important; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
          .ov-head-r a{ margin-top: 0 !important; }
          .ov-spark{ display: none !important; }
          .ov-reads{ display: none !important; }
          .ov-field{ height: 320px !important; }
        }
      `}</style>
    </div>
  );
}