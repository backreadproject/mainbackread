"use client";

import { useEffect, useRef, useState } from "react";

const INK = "#0A0E17", CANVAS = "#FBFBFA", CARD = "#FFFFFF", BLUE = "#1D4ED8", BLUE_SOFT = "#EAF0FF", GREEN = "#10B981", SLATE = "#475569", LINE = "#E7EBF2";
const AEON = "var(--font-geist-sans), system-ui, sans-serif";
const SHADOW = "0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

type Msg = { role: "user" | "doc"; text: string };

export default function PdfReader({ title, fileUrl, token }: { title: string; fileUrl: string; token: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Opening document…");
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const renderedRef = useRef(false);
  const docText = useRef<string>("");

  const currentPage = useRef<number | null>(null);
  const enteredAt = useRef<number>(0);
  const dwellMs = useRef<Record<number, number>>({});
  const [dwellView, setDwellView] = useState<Record<number, number>>({});

  const [thread, setThread] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);

  function send(kind: string, page: number | null, value: unknown) {
    const body = JSON.stringify({ token, kind, page, value });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/signal", new Blob([body], { type: "application/json" }));
    else fetch("/api/signal", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  }
  function leavePage() {
    const p = currentPage.current;
    if (p !== null && enteredAt.current) {
      const delta = Date.now() - enteredAt.current;
      dwellMs.current[p] = (dwellMs.current[p] ?? 0) + delta;
      setDwellView({ ...dwellMs.current });
      send("page_dwell", p, { ms: dwellMs.current[p] });
    }
  }
  async function ask() {
    const q = draft.trim();
    if (!q || asking) return;
    setDraft(""); setAsking(true);
    setThread((t) => [...t, { role: "user", text: q }]);
    try {
      const res = await fetch("/api/ask-live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, question: q, currentPage: currentPage.current ?? 1, documentText: docText.current }) });
      const json = await res.json();
      setThread((t) => [...t, { role: "doc", text: json.answer ?? json.error ?? "No answer." }]);
    } catch { setThread((t) => [...t, { role: "doc", text: "Couldn't reach the document. Try again." }]); }
    setAsking(false);
  }

  useEffect(() => { threadEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [thread, asking]);

  useEffect(() => {
    if (!fileUrl || renderedRef.current) return;
    renderedRef.current = true;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const pdf = await pdfjs.getDocument({ url: fileUrl }).promise;
        setPageCount(pdf.numPages); setStatus("");
        send("opened", null, { pages: pdf.numPages });
        const container = containerRef.current;
        if (!container) return;
        const wrappers: HTMLDivElement[] = [];
        const textParts: string[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.3 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          canvas.style.width = "100%"; canvas.style.height = "auto"; canvas.style.display = "block";
          const wrapper = document.createElement("div");
          wrapper.dataset.page = String(n);
          wrapper.style.cssText = `background:#fff;margin-bottom:18px;border-radius:12px;overflow:hidden;box-shadow:${SHADOW}`;
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          wrappers.push(wrapper);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
          const tc = await page.getTextContent();
          textParts.push(`[Page ${n}]\n` + tc.items.map((it) => ("str" in it ? it.str : "")).join(" "));
        }
        docText.current = textParts.join("\n\n").slice(0, 20000);
        const observer = new IntersectionObserver((entries) => {
          const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;
          const p = Number((visible.target as HTMLElement).dataset.page);
          if (p === currentPage.current) return;
          leavePage(); currentPage.current = p; enteredAt.current = Date.now(); setActivePage(p);
        }, { threshold: [0.25, 0.5, 0.75] });
        wrappers.forEach((w) => observer.observe(w));
      } catch (err) {
        setStatus("Couldn't open this document. " + (err instanceof Error ? err.message : String(err)));
      }
    })();
    const onHide = () => leavePage();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") leavePage(); });
    return () => window.removeEventListener("pagehide", onHide);
  }, [fileUrl, token]);

  const maxDwell = Math.max(1, ...Object.values(dwellView));

  return (
    <div style={{ minHeight: "100vh", background: CANVAS, fontFamily: AEON, color: INK }}>
      <style>{`.fx-ask{transition:box-shadow .15s}.fx-ask:hover{box-shadow:0 6px 18px rgba(45,107,255,0.28)}.fx-in:focus{border-color:${BLUE}}`}</style>

      <header style={{ background: CARD, borderBottom: `1px solid ${LINE}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.01em" }}>BackRead</span>
          <h1 style={{ fontSize: 16, fontWeight: 400, margin: 0, marginLeft: "auto", color: SLATE }}>{title}</h1>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 28, display: "grid", gridTemplateColumns: "24px minmax(0,1.55fr) minmax(0,1fr)", gap: 20, alignItems: "start" }}>

        <div style={{ position: "sticky", top: 90, height: "78vh", display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const d = dwellView[p] ?? 0;
            const w = 3 + (d / maxDwell) * 9;
            return <div key={p} title={`Page ${p}: ${(d / 1000).toFixed(1)}s`}
              style={{ width: activePage === p ? w + 4 : w, height: `${100 / Math.max(pageCount, 1)}%`, minHeight: 6, background: d > 0 ? (activePage === p ? BLUE : GREEN) : LINE, borderRadius: 20, transition: "width .3s, background .3s" }} />;
          })}
        </div>

        <main>
          {status && <p style={{ fontSize: 15, color: SLATE, textAlign: "center", padding: 48 }}>{status}</p>}
          <div ref={containerRef} />
          {pageCount > 0 && <p style={{ fontSize: 13, color: SLATE, textAlign: "center", padding: "16px 0" }}>{pageCount} page{pageCount > 1 ? "s" : ""}</p>}
        </main>

        <aside style={{ position: "sticky", top: 90, background: CARD, borderRadius: 14, boxShadow: SHADOW, display: "flex", flexDirection: "column", height: "78vh", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 9, background: BLUE }} />
            <span style={{ fontSize: 14, fontWeight: 400 }}>Ask BackRead</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
            {thread.length === 0 && <p style={{ fontSize: 15, lineHeight: 1.5, color: SLATE, margin: 0 }}>Ask this document anything. It answers from what's inside it.</p>}
            {thread.map((m, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 400, color: m.role === "user" ? SLATE : BLUE, marginBottom: 5 }}>{m.role === "user" ? "You" : "The document"}</div>
                <div style={{ fontSize: 14, lineHeight: 1.55, background: m.role === "user" ? CANVAS : BLUE_SOFT, borderRadius: 10, padding: "10px 12px", color: m.role === "doc" ? "#1E3A8A" : INK }}>{m.text}</div>
              </div>
            ))}
            {asking && <div style={{ fontSize: 13, color: SLATE }}>reading…</div>}
            <div ref={threadEnd} />
          </div>
          <div style={{ borderTop: `1px solid ${LINE}`, padding: 12, display: "flex", gap: 8 }}>
            <input className="fx-in" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about the document…"
              style={{ flex: 1, minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: AEON, background: "#fff", outline: "none" }} />
            <button onClick={ask} className="fx-ask" style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 10, padding: "0 18px", fontSize: 14, fontWeight: 400, fontFamily: AEON, cursor: "pointer" }}>Ask</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
