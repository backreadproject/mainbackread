"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "doc"; text: string };

export default function PdfReader({ title, fileUrl, token }: { title: string; fileUrl: string; token: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading document...");
  const [pageCount, setPageCount] = useState(0);
  const renderedRef = useRef(false);

  const currentPage = useRef<number | null>(null);
  const enteredAt = useRef<number>(0);
  const dwellMs = useRef<Record<number, number>>({});

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
        body: JSON.stringify({ token, question: q, currentPage: currentPage.current ?? 1 }),
      });
      const json = await res.json();
      setThread((t) => [...t, { role: "doc", text: json.answer ?? json.error ?? "No answer." }]);
    } catch {
      setThread((t) => [...t, { role: "doc", text: "Could not reach the document." }]);
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

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.3 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width; canvas.height = viewport.height;
          canvas.style.width = "100%"; canvas.style.height = "auto"; canvas.style.display = "block";
          const wrapper = document.createElement("div");
          wrapper.dataset.page = String(n);
          wrapper.style.cssText = "background:#fff;margin-bottom:16px;border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)";
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);
          wrappers.push(wrapper);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
        }

        const observer = new IntersectionObserver((entries) => {
          const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;
          const p = Number((visible.target as HTMLElement).dataset.page);
          if (p === currentPage.current) return;
          leavePage(); currentPage.current = p; enteredAt.current = Date.now();
        }, { threshold: [0.25, 0.5, 0.75] });
        wrappers.forEach((w) => observer.observe(w));
      } catch (err) {
        setStatus("Could not render this document: " + (err instanceof Error ? err.message : String(err)));
      }
    })();

    const onHide = () => leavePage();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") leavePage(); });
    return () => window.removeEventListener("pagehide", onHide);
  }, [fileUrl, token]);

  return (
    <div style={{ minHeight: "100vh", background: "#E9EAEC", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #D3D6DA", padding: "14px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <span style={{ fontSize: 12, color: "#6E7480", textTransform: "uppercase", letterSpacing: "0.08em" }}>BackRead</span>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: "2px 0 0" }}>{title}</h1>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24, display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: 20, alignItems: "start" }}>
        <main>
          {status && <p style={{ color: "#6E7480", fontSize: 14, textAlign: "center", padding: 40 }}>{status}</p>}
          <div ref={containerRef} />
          {pageCount > 0 && <p style={{ textAlign: "center", fontSize: 12, color: "#6E7480", padding: "16px 0" }}>{pageCount} page{pageCount > 1 ? "s" : ""}</p>}
        </main>

        <aside style={{ position: "sticky", top: 88, background: "#fff", border: "1px solid #D3D6DA", borderRadius: 8, display: "flex", flexDirection: "column", height: "70vh" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #D3D6DA", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: "#DCF24B", border: "1px solid #15171C" }} />
            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ask BackRead</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {thread.length === 0 && <p style={{ fontSize: 14, color: "#6E7480", lineHeight: 1.5 }}>Ask this document anything. It answers from what is inside it.</p>}
            {thread.map((m, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#6E7480", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.role === "user" ? "You" : "The document"}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, borderLeft: m.role === "doc" ? "2px solid #DCF24B" : "none", paddingLeft: m.role === "doc" ? 10 : 0 }}>{m.text}</div>
              </div>
            ))}
            {asking && <div style={{ fontSize: 12, color: "#6E7480" }}>reading...</div>}
            <div ref={threadEnd} />
          </div>
          <div style={{ borderTop: "1px solid #D3D6DA", padding: 12, display: "flex", gap: 8 }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Is the annual commit negotiable?"
              style={{ flex: 1, minWidth: 0, border: "1px solid #D3D6DA", borderRadius: 4, padding: "9px 11px", fontSize: 14 }} />
            <button onClick={ask} style={{ background: "#DCF24B", border: "1px solid #15171C", borderRadius: 4, padding: "0 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Ask</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
