"use client";
import { useEffect, useRef, useState } from "react";
// The real intent field, not an impression of it.
//
// This is the animation loop from app/(app)/overview/OverviewClient.tsx with the
// same maths: targetR = R * (0.3 + (1 - intent) * 0.64) so higher intent sits
// closer to the centre, ang += spin for the orbit, a sine wobble on top, and the
// radius eased at 0.045 so a node glides to its ring rather than snapping. The
// selected node freezes while its card is open, exactly as it does in the app.
//
// Canvas rather than SVG because that is what the product uses, and a marketing
// page that shows something easier than the real thing is showing the wrong
// thing.
export type FieldNode = {
  intent: number;
  band: "ready" | "warm" | "glance";
  short?: string;
  full?: string;
  doc?: string;
  reads?: string;
  dwell?: string;
  q?: string;
  why?: string;
};
type Live = FieldNode & { ang: number; spin: number; wob: number; wobA: number; r: number; tr: number; x: number; y: number };
const P = { green: "#1F6F4A", amber: "#B54708", faint: "#98A2B3", muted: "#667085", body: "#344054", heading: "#101828", card: "#FFFFFF", border: "#E4E7EC", greenText: "#14603C" };
const FONT = "'Inter', system-ui, -apple-system, sans-serif";
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}
export default function IntentField({ nodes, height = 340 }: { nodes: FieldNode[]; height?: number }) {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const selRef = useRef<number | null>(null);
  const [pop, setPop] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => {
    const el = cv.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, cx = 0, cy = 0, R = 0, raf = 0;
    function resize() {
      const r = el!.getBoundingClientRect();
      if (!r.width) return;
      W = r.width; H = r.height;
      el!.width = W * dpr; el!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2; R = Math.min(W, H) / 2 - 14;
    }
    window.addEventListener("resize", resize);
    // Angles seeded evenly rather than randomly, so ready nodes near the centre
    // do not land on top of each other.
    const live: Live[] = nodes.map((n, i) => ({
      ...n,
      ang: (i / Math.max(nodes.length, 1)) * Math.PI * 2 + (i % 3) * 0.31,
      spin: (i % 2 ? 1 : -1) * 0.00019 * (1 + n.intent),
      wob: (i * 1.7) % (Math.PI * 2),
      wobA: 6 + (i % 5) * 2.4,
      r: 0, tr: 0, x: 0, y: 0,
    }));
    const targetR = (v: number) => R * (0.3 + (1 - Math.min(v, 1)) * 0.64);
    function onClick(e: MouseEvent) {
      const r = el!.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let hit: number | null = null;
      live.forEach((n, i) => { if (n.full && Math.hypot(mx - n.x, my - n.y) < 16) hit = i; });
      selRef.current = selRef.current === hit ? null : hit;
      setSel(selRef.current);
      if (selRef.current !== null) {
        const n = live[selRef.current];
        const w = 190, h = 132;
        let left = n.x > W / 2 ? n.x - w - 18 : n.x + 18;
        left = Math.max(6, Math.min(left, W - w - 6));
        setPop({ left, top: Math.max(6, Math.min(n.y - h / 2, H - h - 6)) });
      } else setPop(null);
    }
    el.addEventListener("click", onClick);
    function move(e: MouseEvent) {
      const r = el!.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      el!.style.cursor = live.some((n) => n.full && Math.hypot(mx - n.x, my - n.y) < 16) ? "pointer" : "default";
    }
    el.addEventListener("mousemove", move);
    const t0 = performance.now();
    function frame(now: number) {
      const t = (now - t0) / 1000;
      ctx!.clearRect(0, 0, W, H);
      const ringAlpha = [0.55, 0.4, 0.28];
      [0.34, 0.62, 0.92].forEach((rr, ri) => {
        ctx!.beginPath(); ctx!.arc(cx, cy, R * rr, 0, 7);
        ctx!.strokeStyle = rgba(P.green, ringAlpha[ri]);
        ctx!.setLineDash([6, 6]); ctx!.lineWidth = 1.4; ctx!.stroke();
      });
      ctx!.setLineDash([]);
      ctx!.strokeStyle = rgba(P.green, 0.16); ctx!.lineWidth = 1;
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + t * 0.03;
        ctx!.beginPath(); ctx!.moveTo(cx, cy); ctx!.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx!.stroke();
      }
      ctx!.font = "600 9.5px " + FONT; ctx!.textAlign = "center";
      ([["READY", 0.34], ["WARMING", 0.62], ["GLANCED", 0.92]] as [string, number][]).forEach(([label, rr]) => {
        const ly = cy - R * rr + 12;
        const lw = ctx!.measureText(label).width;
        ctx!.fillStyle = P.card; ctx!.fillRect(cx - lw / 2 - 5, ly - 9, lw + 10, 12);
        ctx!.fillStyle = P.body; ctx!.fillText(label, cx, ly);
      });
      const readyN = live.filter((n) => n.intent >= 0.78).length;
      ctx!.beginPath(); ctx!.arc(cx, cy, 22, 0, 7);
      ctx!.fillStyle = P.card; ctx!.fill(); ctx!.lineWidth = 1; ctx!.strokeStyle = P.border; ctx!.stroke();
      ctx!.fillStyle = P.greenText; ctx!.font = "600 16px " + FONT; ctx!.fillText(String(readyN), cx, cy - 1);
      ctx!.fillStyle = P.muted; ctx!.font = "8px " + FONT; ctx!.fillText("READY", cx, cy + 12);
      live.forEach((n, i) => {
        const isSel = i === selRef.current;
        n.tr = targetR(n.intent);
        n.r += (n.tr - n.r) * (reduce || isSel ? 0 : 0.045);
        if (!reduce && !isSel) { n.ang += n.spin; n.wob += 0.01; }
        const wob = reduce ? 0 : Math.sin(n.wob) * (n.wobA / Math.max(n.r, 40)) * 0.5;
        const a = n.ang + wob;
        n.x = cx + Math.cos(a) * n.r; n.y = cy + Math.sin(a) * n.r;
        const ready = n.band === "ready", warm = n.band === "warm";
        const col = ready ? P.green : warm ? P.amber : P.faint;
        const size = ready ? 7 : warm ? 5.5 : 4.5;
        if (ready) {
          const pr = reduce ? 0 : Math.sin(t * 2 + n.wob) * 0.5 + 0.5;
          ctx!.beginPath(); ctx!.arc(n.x, n.y, size + 4 + pr * 6, 0, 7);
          ctx!.strokeStyle = rgba(P.green, 0.3 * (1 - pr)); ctx!.lineWidth = 1.2; ctx!.stroke();
          ctx!.beginPath(); ctx!.moveTo(cx, cy); ctx!.lineTo(n.x, n.y);
          ctx!.strokeStyle = rgba(P.green, 0.24); ctx!.setLineDash([2, 4]); ctx!.lineWidth = 1; ctx!.stroke(); ctx!.setLineDash([]);
        }
        ctx!.beginPath(); ctx!.arc(n.x, n.y, size, 0, 7); ctx!.fillStyle = col; ctx!.fill();
        if (isSel) { ctx!.beginPath(); ctx!.arc(n.x, n.y, size + 7, 0, 7); ctx!.strokeStyle = P.green; ctx!.lineWidth = 2; ctx!.stroke(); }
        if (n.short) {
          ctx!.font = "600 10px " + FONT; ctx!.textAlign = "center";
          ctx!.fillStyle = P.heading; ctx!.fillText(n.short, n.x, n.y - size - 6);
        }
      });
      raf = requestAnimationFrame(frame);
    }
    resize();
    live.forEach((n) => { n.r = R * 1.5; });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      el.removeEventListener("click", onClick);
      el.removeEventListener("mousemove", move);
    };
  }, [nodes]);
  const n = sel === null ? null : nodes[sel];
  return (
    <div style={{ position: "relative" }}>
      <canvas ref={cv} style={{ display: "block", width: "100%", height }} />
      {n && pop && (
        <div className="s-pop" style={{ left: pop.left, top: pop.top }}>
          <div className="s-popn">{n.full}</div>
          <div className="s-popd">{n.doc}</div>
          <div className="s-popk">
            <span>reads<b>{n.reads}</b></span>
            <span>dwell<b>{n.dwell}</b></span>
            <span>questions<b>{n.q}</b></span>
          </div>
          <div className="s-popw">{n.why}</div>
        </div>
      )}
    </div>
  );
}