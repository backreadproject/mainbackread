"use client";

import { useEffect, useRef, useState } from "react";

const INK = "#1A1D21", PAPER = "#F7F6F3", SURFACE = "#FFFFFF", READER = "#2F4A3F", MARK = "#C4442E", GRAPHITE = "#8A8778", RULE = "#E4E2DB";
const VOICE = "'Newsreader', Georgia, serif", SANS = "'Inter Tight', system-ui, sans-serif", MONO = "'IBM Plex Mono', monospace";

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
      const res = await fetch("/api/ask-live", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, question: q, currentPage: currentPage.current ?? 1, documentText: docText.current }),
      });
      const json = await res.json();
      setThread((t) => [...t, { role: "doc", text: json.answer ?? json.error ?? "No answer." }]);
    } catch {
      setThread((t) => [...t, { role: "doc", text: "Couldn't reach the document. Try again." }]);
    }
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
        setPageCount(pdf.numPages);
        setStatus("");
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
          wrapper.style.cssText = `background:#fff;margin-bottom:18px;border:1px solid ${RULE};overflow:hidden`;
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          wrappers.push(wrapper);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;

          const tc = await page.getTextContent();
          const pageText = tc.items.map((it) => ("str" in it ? it.str : "")).join(" ");
          textParts.push(`[Page ${n}]\n${pageText}`);
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

  const mono = { fontFamily: MONO, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: GRAPHITE };
  const maxDwell = Math.max(1, ...Object.values(dwellView));

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: SANS, color: INK }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300;1,6..72,400&family=Inter+Tight:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .br-ask{transition:opacity .15s}.br-ask:hover{opacity:.82}
        .br-in2{outline:none;transition:border-color .15s}.br-in2:focus{border-color:${INK}}`}</style>

      <header style={{ borderBottom: `1px solid ${RULE}`, background: PAPER, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: VOICE, fontSize: 18 }}>BackRead</span>
          <span style={{ ...mono, fontSize: 10 }}>Reading</span>
          <h1 style={{ fontFamily: VOICE, fontWeight: 400, fontSize: 19, letterSpacing: "-0.01em", margin: 0, marginLeft: "auto", color: INK }}>{title}</h1>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 28, display: "grid", gridTemplateColumns: "28px minmax(0,1.55fr) minmax(0,1fr)", gap: 20, alignItems: "start" }}>

        {/* The read-trace: a live margin rail that thickens with dwell */}
        <div style={{ position: "sticky", top: 88, height: "78vh", display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const d = dwellView[p] ?? 0;
            const w = 2 + (d / maxDwell) * 10;
            return (
              <div key={p} title={`Page ${p}: ${(d / 1000).toFixed(1)}s`}
                style={{ width: activePage === p ? w + 4 : w, height: `${100 / Math.max(pageCount, 1)}%`, minHeight: 6, background: d > 0 ? MARK : RULE, borderRadius: 2, opacity: d > 0 ? 0.85 : 0.5, transition: "width .3s, opacity .3s" }} />
            );
          })}
        </div>

        <main>
          {status && <p style={{ fontFamily: VOICE, fontStyle: "italic", fontSize: 16, color: GRAPHITE, textAlign: "center", padding: 48 }}>{status}</p>}
          <div ref={containerRef} />
          {pageCount > 0 && <p style={{ ...mono, textAlign: "center", padding: "16px 0" }}>{pageCount} page{pageCount > 1 ? "s" : ""}</p>}
        </main>

        <aside style={{ position: "sticky", top: 88, background: SURFACE, border: `1px solid ${RULE}`, display: "flex", flexDirection: "column", height: "78vh" }}>
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${RULE}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: MARK }} />
            <span style={mono}>Ask BackRead</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
            {thread.length === 0 && (
              <p style={{ fontFamily: VOICE, fontWeight: 300, fontSize: 17, lineHeight: 1.5, color: GRAPHITE, margin: 0 }}>
                Ask this document anything. It answers from what's inside it.
              </p>
            )}
            {thread.map((m, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ ...mono, fontSize: 10, marginBottom: 5 }}>{m.role === "user" ? "You" : "The document"}</div>
                <div style={{ fontFamily: m.role === "doc" ? VOICE : SANS, fontSize: m.role === "doc" ? 16 : 14, fontWeight: m.role === "doc" ? 300 : 400, lineHeight: 1.55, borderLeft: m.role === "doc" ? `2px solid ${MARK}` : "none", paddingLeft: m.role === "doc" ? 12 : 0 }}>{m.text}</div>
              </div>
            ))}
            {asking && <div style={{ ...mono, fontSize: 11 }}>reading…</div>}
            <div ref={threadEnd} />
          </div>
          <div style={{ borderTop: `1px solid ${RULE}`, padding: 12, display: "flex", gap: 8 }}>
            <input className="br-in2" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Ask about the document…"
              style={{ flex: 1, minWidth: 0, border: `1px solid ${RULE}`, borderRadius: 2, padding: "9px 11px", fontSize: 14, fontFamily: SANS, background: "#fff" }} />
            <button onClick={ask} className="br-ask" style={{ background: INK, color: PAPER, border: "none", borderRadius: 2, padding: "0 16px", fontSize: 13, fontWeight: 500, fontFamily: SANS, cursor: "pointer" }}>Ask</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
