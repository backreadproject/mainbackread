"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, microLabel, statTile, statTileInk } from "@/lib/theme";
import { Eye, MessageSquare, FileText } from "lucide-react";
import { useLocale } from "@/lib/useLocale";
import { getDict } from "@/lib/i18n";

type Reader = { id: string; name: string; doc: string; opens: number; questions: number; lastAt: string; intent: number };
type Stats = { documents: number; recipients: number; reads: number; questions: number };
type Ev = { text: string; at: string; kind: string };
type Doc = { id: string; title: string; reads: number; spark: number[] };
type Sel = { id: string; name: string; doc: string; ini: string; verdict: { label: string; cls: string }; reads: number; questions: number; last: string; why: string; left: number; top: number };

const READY = 0.78;
const WARM = 0.4;

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
    follow: fr ? "Relancer" : "Follow up",
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
  function ago(iso: string) { if (!iso) return "\u2014"; const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return o.justNow; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`; }
  const today = new Date().toLocaleDateString(fr ? "fr-FR" : undefined, { weekday: "long", month: "short", day: "numeric" });
  const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  function verdict(intent: number) { if (intent >= READY) return { label: L.vReady, cls: "ready" }; if (intent >= WARM) return { label: L.vWarm, cls: "warm" }; return { label: L.vGlance, cls: "glanced" }; }
  function whyOf(op: number, q: number) {
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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flashToast(txt: string) { setToast(txt); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 3200); }

  const readyList = readers.filter((r) => r.intent >= READY).sort((a, b) => b.intent - a.intent).slice(0, 3);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !hasData) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() { const r = cv!.getBoundingClientRect(); if (!r.width) return; W = r.width; H = r.height; cv!.width = W * dpr; cv!.height = H * dpr; ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); cx = W / 2; cy = H / 2; R = Math.min(W, H) / 2 - 16; }
    window.addEventListener("resize", resize);

    type Node = Reader & { ang: number; spin: number; wob: number; wobA: number; r: number; tr: number; x: number; y: number; _h?: boolean };
    const nodes: Node[] = readers.map((rd) => ({ ...rd, ang: Math.random() * Math.PI * 2, spin: (Math.random() * 2 - 1) * 0.00022 * (1 + rd.intent), wob: Math.random() * Math.PI * 2, wobA: 6 + Math.random() * 10, r: 0, tr: 0, x: 0, y: 0 }));
    const targetR = (v: number) => R * (0.16 + (1 - Math.min(v, 1)) * 0.78);
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
        setSelected({ id: n.id, name: n.name, doc: n.doc, ini: initials(n.name), verdict: verdict(n.intent), reads: n.opens, questions: n.questions, last: ago(n.lastAt), why: whyOf(n.opens, n.questions), left, top });
      } else { selIdxRef.current = -1; setSelected(null); }
    });

    // optional live: real reads/questions ripple in (needs realtime enabled on `signals`)
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
        if (isQ) { setQuestionsN((q) => q + 1); setEvents((ev) => [{ text: `${name} ${L.askedQ}`, at: now, kind: "question" }, ...ev].slice(0, 6)); flashToast(`${name} ${L.askedQ}`); }
        else { setReadsN((r) => r + 1); setEvents((ev) => [{ text: `${name} ${L.reading}`, at: now, kind: "opened" }, ...ev].slice(0, 6)); flashToast(`${name} ${L.reading}`); }
      }).subscribe();
    } catch { /* realtime not enabled \u2014 ambient only */ }

    function frame(now: number) {
      const t = (now - t0) / 1000;
      ctx!.clearRect(0, 0, W, H);
      const wash = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55); wash.addColorStop(0, "rgba(51,230,162,.08)"); wash.addColorStop(1, "rgba(51,230,162,0)"); ctx!.fillStyle = wash; ctx!.beginPath(); ctx!.arc(cx, cy, R * 0.55, 0, 7); ctx!.fill();
      ctx!.save();
      for (const rr of [0.34, 0.62, 0.92]) { ctx!.beginPath(); ctx!.arc(cx, cy, R * rr, 0, 7); ctx!.strokeStyle = "rgba(9,92,60,0.34)"; ctx!.setLineDash([2, 6]); ctx!.lineWidth = 1; ctx!.stroke(); }
      ctx!.setLineDash([]); ctx!.strokeStyle = "rgba(9,92,60,0.16)";
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 + t * 0.03; ctx!.beginPath(); ctx!.moveTo(cx, cy); ctx!.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx!.stroke(); }
      ctx!.restore();
      ctx!.fillStyle = "#3d5a4c"; ctx!.font = "600 9px 'DM Mono', monospace"; ctx!.textAlign = "center";
      ctx!.fillText(fr ? "PR\u00caT" : "READY", cx, cy - R * 0.34 + 13); ctx!.fillText(fr ? "INT\u00c9R\u00caT" : "WARMING", cx, cy - R * 0.62 + 13); ctx!.fillText(fr ? "COUP D\u2019\u0152IL" : "GLANCED", cx, cy - R * 0.92 + 13);
      const pulse = reduce ? 1 : 1 + Math.sin(t * 2.1) * 0.06;
      const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, R * 0.24 * pulse); g.addColorStop(0, "rgba(51,230,162,0.55)"); g.addColorStop(0.45, "rgba(31,169,113,0.22)"); g.addColorStop(1, "rgba(31,169,113,0)"); ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(cx, cy, R * 0.24 * pulse, 0, 7); ctx!.fill();
      const readyN = nodes.filter((x) => x.intent >= READY).length;
      ctx!.beginPath(); ctx!.arc(cx, cy, 23, 0, 7); ctx!.fillStyle = "#fff"; ctx!.fill(); ctx!.lineWidth = 1.4; ctx!.strokeStyle = "rgba(11,122,75,.4)"; ctx!.stroke();
      ctx!.fillStyle = "#0B7A4B"; ctx!.font = "700 17px 'DM Sans'"; ctx!.fillText(String(readyN), cx, cy - 2);
      ctx!.fillStyle = "#3f8767"; ctx!.font = "8px 'DM Mono'"; ctx!.fillText(fr ? "PR\u00caT" : "READY", cx, cy + 13);
      if (readyCountRef.current) readyCountRef.current.textContent = String(readyN);
      nodes.forEach((n, i) => {
        const sel = i === selIdxRef.current;
        n.tr = targetR(n.intent); n.r += (n.tr - n.r) * (reduce || sel ? 0 : 0.045);
        if (!reduce && !sel) { n.ang += n.spin; n.wob += 0.01; }
        const wob = reduce ? 0 : Math.sin(n.wob) * (n.wobA / Math.max(n.r, 40)) * 0.5;
        const a = n.ang + wob; n.x = cx + Math.cos(a) * n.r; n.y = cy + Math.sin(a) * n.r;
        const ready = n.intent >= READY, warm = n.intent >= WARM && !ready;
        const col = ready ? "#0B7A4B" : warm ? "#1FA971" : "#9DB3A8"; const size = ready ? 6.5 : warm ? 5 : 3;
        if (ready || warm) { const gg = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, ready ? 20 : 11); gg.addColorStop(0, ready ? "rgba(31,169,113,.4)" : "rgba(31,169,113,.22)"); gg.addColorStop(1, "rgba(31,169,113,0)"); ctx!.fillStyle = gg; ctx!.beginPath(); ctx!.arc(n.x, n.y, ready ? 20 : 11, 0, 7); ctx!.fill(); }
        if (ready) { const pr = reduce ? 0 : Math.sin(t * 2 + n.wob) * 0.5 + 0.5; ctx!.beginPath(); ctx!.arc(n.x, n.y, size + 4 + pr * 6, 0, 7); ctx!.strokeStyle = `rgba(11,122,75,${0.3 * (1 - pr)})`; ctx!.lineWidth = 1.2; ctx!.stroke(); ctx!.beginPath(); ctx!.moveTo(cx, cy); ctx!.lineTo(n.x, n.y); ctx!.strokeStyle = "rgba(11,122,75,.16)"; ctx!.setLineDash([1, 4]); ctx!.lineWidth = 1; ctx!.stroke(); ctx!.setLineDash([]); }
        ctx!.beginPath(); ctx!.arc(n.x, n.y, size, 0, 7); ctx!.fillStyle = col; ctx!.fill();
        if (sel) { ctx!.beginPath(); ctx!.arc(n.x, n.y, size + 7, 0, 7); ctx!.strokeStyle = "rgba(11,122,75,.85)"; ctx!.lineWidth = 2; ctx!.stroke(); }
        const d = Math.hypot(mx - n.x, my - n.y); n._h = d < 14;
        if (ready || n._h) { const p = n.name.split(" "); const lab = p[0] + (p[1] ? " " + p[1][0] + "." : ""); ctx!.fillStyle = n._h ? "#0E1A16" : "#0a3b26"; ctx!.font = `600 ${n._h ? 11 : 10}px 'DM Sans'`; ctx!.textAlign = "center"; ctx!.fillText(lab, n.x, n.y - size - 6); }
      });
      ripples.forEach((rp) => { rp.r += 1.6; rp.a *= 0.955; ctx!.beginPath(); ctx!.arc(rp.x, rp.y, rp.r, 0, 7); ctx!.strokeStyle = `rgba(11,122,75,${rp.a})`; ctx!.lineWidth = 1.4; ctx!.stroke(); });
      ripples = ripples.filter((rp) => rp.a > 0.02);
      raf = requestAnimationFrame(frame);
    }
    resize(); nodes.forEach((n) => { n.r = R * 1.5; }); raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); if (toastTimer.current) clearTimeout(toastTimer.current); if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readers, hasData]);

  // close bubble on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) { if (!selected) return; const t = e.target as HTMLElement; if (popRef.current && popRef.current.contains(t)) return; if (t === canvasRef.current) return; selIdxRef.current = -1; setSelected(null); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selected]);

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rCard, boxShadow: T.shadow } as const;
  const ch = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: `1px solid ${T.border}` } as const;
  const mono = "'DM Mono', ui-monospace, monospace";
  const chipBg = (cls: string) => (cls === "ready" ? { background: T.greenSoft, color: T.greenText } : cls === "warm" ? { background: T.amberSoft, color: T.amberText } : { background: T.soft, color: T.body });

  return (
    <div style={{ fontFamily: T.font, letterSpacing: T.tracking, color: T.body, minHeight: "100vh" }}>
      <main style={{ maxWidth: 1040, padding: "26px 32px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, color: T.green, fontFamily: mono, border: "1px solid rgba(11,122,75,.2)", background: "rgba(51,230,162,.12)", padding: "4px 10px", borderRadius: 20, marginBottom: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.brandGreen, boxShadow: "0 0 8px rgba(31,169,113,.7)" }} /> {L.live}
            </span>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.heading, letterSpacing: T.trackingTight, margin: "0 0 3px" }}>{greeting()}</h1>
            <p style={{ fontSize: 14, color: T.body, margin: 0 }}>{o.subtitle}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: mono }}>{today}</div>
            <a href="/documents" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7, background: T.green, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 16px", borderRadius: T.rBtn, textDecoration: "none", boxShadow: "0 6px 18px rgba(11,122,75,.25)" }}>
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
              {/* Intent field */}
              <section style={card}>
                <div style={{ ...ch, borderBottom: "none" }}>
                  <div><div style={{ ...microLabel, fontSize: 10, letterSpacing: "0.13em", fontFamily: mono }}>{L.eyebrow}</div><h2 style={{ fontSize: 15, fontWeight: 700, color: T.heading, margin: "2px 0 0" }}>{L.room}</h2></div>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: mono }}><span ref={readyCountRef}>{readyList.length}</span> / {readers.length} {L.readersWord}</span>
                </div>
                <div style={{ position: "relative", padding: "0 8px 4px" }}>
                  <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: 470 }} />
                  {toast && (
                    <div style={{ position: "absolute", left: 18, bottom: 12, display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,.94)", border: `1px solid ${T.border}`, borderRadius: 11, padding: "9px 12px", fontSize: 12, color: T.heading, boxShadow: "0 10px 30px rgba(11,60,40,.12)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.brandGreen, boxShadow: "0 0 8px rgba(31,169,113,.6)" }} /> {toast}
                    </div>
                  )}
                  {selected && (
                    <div ref={popRef} style={{ position: "absolute", left: selected.left, top: selected.top, width: 266, background: "rgba(255,255,255,.97)", border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: "0 16px 44px rgba(11,60,40,.2)", padding: "14px 15px", zIndex: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, flex: "none", background: "linear-gradient(135deg,#33E6A2,#0B7A4B)", color: "#04120c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{selected.ini}</span>
                        <div><div style={{ fontSize: 14, fontWeight: 700, color: T.heading }}>{selected.name}</div><div style={{ fontSize: 11, color: T.muted, fontFamily: mono, marginTop: 1 }}>{selected.doc}</div></div>
                        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", ...chipBg(selected.verdict.cls) }}>{selected.verdict.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, margin: "12px 0 10px" }}>
                        {[[selected.reads, L.bReads], [selected.questions, L.bQ], [selected.last, L.bLast]].map(([v, l], k) => (
                          <div key={k} style={{ flex: 1, background: "rgba(11,80,52,.05)", borderRadius: 9, padding: "8px 6px", textAlign: "center" }}>
                            <b style={{ display: "block", fontSize: 14, fontWeight: 700, color: T.heading, fontVariantNumeric: "tabular-nums" }}>{v}</b>
                            <span style={{ fontSize: 10, color: T.muted }}>{l}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: T.body, lineHeight: 1.5 }}>{selected.why}</div>
                      <a href={`/recipients/${selected.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, background: T.green, color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 9, textDecoration: "none" }}>{L.seeProfile} &rarr;</a>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 18, justifyContent: "center", padding: "4px 0 14px", fontSize: 11, color: T.body }}>
                  <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6, verticalAlign: 1, background: "#0B7A4B" }} />{L.lReady}</span>
                  <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6, verticalAlign: 1, background: "#1FA971" }} />{L.lWarm}</span>
                  <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6, verticalAlign: 1, background: "#9DB3A8" }} />{L.lGlance}</span>
                </div>
              </section>

              {/* Ready to move */}
              <section style={card}>
                <div style={ch}><h2 style={{ fontSize: 15, fontWeight: 700, color: T.heading, margin: 0 }}>{L.ready}</h2><a href="/recipients" style={{ fontSize: 13, color: T.green, fontWeight: 600, textDecoration: "none" }}>{L.seeAll} &rarr;</a></div>
                <div>
                  {readyList.length === 0 && <div style={{ padding: 22, fontSize: 13, color: T.muted, textAlign: "center" }}>{L.none}</div>}
                  {readyList.map((r, i) => (
                    <a key={r.id} href={`/recipients/${r.id}`} className="ov-r" style={{ display: "flex", gap: 11, alignItems: "center", padding: "12px 18px", borderTop: i > 0 ? `1px solid ${T.borderSoft}` : "none", textDecoration: "none" }}>
                      <span style={{ width: 26, height: 26, borderRadius: 7, flex: "none", background: T.greenSoft, color: T.greenText, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11 }}>{initials(r.name)}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.heading, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                        <span style={{ display: "block", fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{r.doc}</span>
                      </span>
                      <span style={{ flex: "none", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: T.rPill, background: T.greenSoft, color: T.greenText }}>{L.vReady}</span>
                      <span style={{ flex: "none", fontSize: 13, color: T.muted, width: 62, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.opens} {L.readsWord}</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>

            {/* stat tiles. Colour carries meaning: green healthy, amber attention,
                indigo spread, neutral inert. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }} className="ov-tiles">
              {([[readsN, L.sReads, "green"], [questionsN, L.sQuestions, "amber"], [stats.recipients, L.sRecipients, "indigo"], [stats.documents, L.sDocuments, "neutral"]] as [number, string, "green" | "amber" | "indigo" | "neutral"][]).map(([v, l, tone], i) => (
                <div key={i} style={statTile(tone)}>
                  <div style={{ fontSize: 27, fontWeight: 600, color: statTileInk(tone), letterSpacing: "-0.04em", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                  <div style={{ fontSize: 13, color: tone === "neutral" ? T.muted : statTileInk(tone), marginTop: 4, fontWeight: 500, opacity: tone === "neutral" ? 1 : 0.85 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* recent reads + documents */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }} className="ov-row">
              <section style={card}>
                <div style={ch}><h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: 0 }}>{L.recent}</h2><a href="/activity" style={{ fontSize: 13, color: T.green, fontWeight: 600, textDecoration: "none" }}>{L.allActivity}</a></div>
                <div style={{ padding: "6px 8px" }}>
                  {events.length === 0 && <div style={{ padding: 22, fontSize: 13, color: T.muted, textAlign: "center" }}>{L.none}</div>}
                  {events.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "12px", alignItems: "flex-start", borderBottom: i < events.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ width: 30, height: 30, borderRadius: 9, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: e.kind === "question" ? "#E6EEFB" : T.greenSoft, color: e.kind === "question" ? "#2563EB" : T.green }}>
                        {e.kind === "question" ? <MessageSquare size={15} strokeWidth={1.9} /> : <Eye size={15} strokeWidth={1.9} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, color: T.heading, lineHeight: 1.45 }}>{e.text}</div></div>
                      <span style={{ fontSize: 11, color: T.muted, fontFamily: mono }}>{ago(e.at)}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section style={card}>
                <div style={ch}><h2 style={{ fontSize: 14, fontWeight: 700, color: T.heading, margin: 0 }}>{L.yourDocs}</h2><a href="/documents" style={{ fontSize: 13, color: T.green, fontWeight: 600, textDecoration: "none" }}>{L.allDocs}</a></div>
                <div style={{ padding: "6px 8px" }}>
                  {documents.map((d, i) => (
                    <a key={d.id} href={`/documents/${d.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", textDecoration: "none", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, flex: "none", background: "rgba(11,122,75,.08)", color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={15} strokeWidth={1.9} /></span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.heading, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                      <span style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 22 }}>{d.spark.map((h, k) => <i key={k} style={{ width: 4, height: `${h}%`, borderRadius: 2, background: "linear-gradient(180deg,#1FA971,rgba(51,230,162,.4))" }} />)}</span>
                      <span style={{ fontSize: 12, color: T.muted, fontFamily: mono, width: 62, textAlign: "right" }}>{d.reads} {L.readsWord}</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
      <style>{`@media (max-width: 900px){ .ov-row{ grid-template-columns: 1fr !important; } .ov-tiles{ grid-template-columns: 1fr 1fr !important; } } .ov-r{ transition: background .12s } .ov-r:hover{ background: #FAF8F4 }`}</style>
    </div>
  );
}





